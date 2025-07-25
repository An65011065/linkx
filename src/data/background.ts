import DataService from "./dataService";
import { websiteBlocker } from "./websiteBlocker";

// Navigation source information for linking pages
export interface SourceInfo {
    nodeId: string; // Unique ID of the source page visit
    url: string; // URL of the source page
    tabId: number; // Tab ID where the source page was viewed
}

// Individual webpage visit with timing and navigation data
export interface UrlVisit {
    id: string; // Unique identifier (tabId_timestamp)
    url: string; // Full URL
    domain: string; // Extracted domain
    title?: string; // Page title
    startTime: number; // Visit start timestamp
    endTime?: number; // Visit end timestamp
    duration: number; // Total time from start to end (including background)
    activeTime: number; // Accumulated active time (only when focused)
    lastActiveTime?: number; // Last time the visit was active
    tabId: number; // Chrome tab ID
    windowId: number; // Chrome window ID
    isActive: boolean; // Whether the visit is currently active
    category: "work" | "social" | "other"; // Site category
    sourceInfo?: SourceInfo; // Navigation source information
    creationMode: "chain" | "hyperlink"; // How this page visit was created
    wordCount?: number;
}

// State tracking for each browser tab
interface TabState {
    currentVisit?: UrlVisit;
    previousUrl?: string;
    isActive: boolean;
}

// Information about tabs created from link clicks
interface LinkCreationInfo {
    sourceTabId: number;
    sourceUrl: string;
    sourceVisitId?: string;
}

interface SearchMatch {
    tabId: number;
    title: string;
    url: string;
    domain: string;
    favicon: string;
    matchCount: number;
    context: string;
}

interface TabSearchResult {
    matchCount: number;
    context: string;
}

interface DailyLimit {
    domain: string;
    limit: number; // in minutes
    used: number; // in minutes
    enabled: boolean;
    lastReset: string; // ISO date string
}

interface DailyUsage {
    domain: string;
    date: string; // YYYY-MM-DD format
    timeSpent: number; // in minutes
}

// ===============================
// ANALYTICS NOTIFICATION (moved to top)
// ===============================
async function notifyAnalyticsUpdate(tabId?: number): Promise<void> {
    try {
        const tabs = tabId ? [{ id: tabId }] : await chrome.tabs.query({});
        tabs.forEach(async (tab) => {
            if (tab.id) {
                try {
                    await chrome.tabs.sendMessage(tab.id, {
                        type: "ANALYTICS_DATA_UPDATED",
                    });
                } catch (error) {
                    // Ignore errors for tabs without content script
                }
            }
        });
    } catch (error) {
        console.log("Could not notify analytics update:", error);
    }
}

// Make extractDomain a standalone function
function extractDomain(url: string): string {
    try {
        return new URL(url).hostname.replace(/^www\./, "");
    } catch {
        return url.split("/")[2] || url;
    }
}

class DailyLimitManager {
    private static readonly LIMITS_KEY = "daily_limits";
    private static readonly USAGE_KEY = "daily_usage";

    // Get today's date in YYYY-MM-DD format
    private static getTodayKey(): string {
        return new Date().toISOString().split("T")[0];
    }

    // Get all daily limits
    static async getAllLimits(): Promise<Record<string, DailyLimit>> {
        const result = await chrome.storage.sync.get([this.LIMITS_KEY]);
        return result[this.LIMITS_KEY] || {};
    }

    // Get limit for specific domain
    static async getLimit(domain: string): Promise<DailyLimit | null> {
        const limits = await this.getAllLimits();
        const limit = limits[domain];

        if (!limit) return null;

        // Check if we need to reset usage for new day
        const today = this.getTodayKey();
        if (limit.lastReset !== today) {
            limit.used = 0;
            limit.lastReset = today;
            await this.saveLimit(limit);
        }

        return limit;
    }

    // Save or update limit
    static async saveLimit(limit: DailyLimit): Promise<void> {
        const limits = await this.getAllLimits();
        limits[limit.domain] = limit;
        await chrome.storage.sync.set({ [this.LIMITS_KEY]: limits });
    }

    // Remove limit
    static async removeLimit(domain: string): Promise<void> {
        const limits = await this.getAllLimits();
        delete limits[domain];
        await chrome.storage.sync.set({ [this.LIMITS_KEY]: limits });
    }

    // Update usage for a domain
    static async updateUsage(
        domain: string,
        additionalMinutes: number,
    ): Promise<void> {
        const limit = await this.getLimit(domain);
        if (!limit || !limit.enabled) return;

        limit.used += additionalMinutes;
        await this.saveLimit(limit);

        // Check if limit exceeded
        if (limit.used >= limit.limit) {
            this.notifyLimitExceeded(domain, limit);
        }
    }

    // Get current usage for domain
    static async getCurrentUsage(domain: string): Promise<number> {
        const limit = await this.getLimit(domain);
        return limit?.used || 0;
    }

    // Notify when limit is exceeded
    private static notifyLimitExceeded(
        domain: string,
        limit: DailyLimit,
    ): void {
        const overtime = limit.used - limit.limit;
        const overtimeFormatted = this.formatTime(overtime);

        chrome.notifications.create({
            type: "basic",
            iconUrl: "/src/assets/icons/icon128.png",
            title: "Daily Limit Exceeded",
            message: `You've exceeded your ${this.formatTime(
                limit.limit,
            )} limit on ${domain} by ${overtimeFormatted}`,
            priority: 2,
        });
    }

    // Format minutes to readable time
    private static formatTime(minutes: number): string {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0) {
            return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
        }
        return `${mins}m`;
    }
}

class BackgroundTracker {
    private static instance: BackgroundTracker;
    private dataService: DataService;
    private tabStates: Map<number, TabState>;
    private linkCreatedTabs: Map<number, LinkCreationInfo>;
    private focusedWindowId?: number;
    private focusedTabId?: number;
    private isUserActive: boolean;
    private userIdleThreshold: number;
    private syncInterval?: ReturnType<typeof setTimeout>;
    private cleanupInterval?: ReturnType<typeof setTimeout>;
    private isDestroyed: boolean;
    private requestCounts: Map<string, number>; // 🆕 ADD THIS LINE

    private constructor() {
        this.dataService = DataService.getInstance();
        this.tabStates = new Map();
        this.linkCreatedTabs = new Map();
        this.requestCounts = new Map(); // 🆕 ADD THIS LINE
        this.isUserActive = true;
        this.userIdleThreshold = 60; // seconds
        this.isDestroyed = false;
        this.initializeListeners();
        this.startPeriodicSync();
        this.cleanupInterval = setInterval(() => {
            this.cleanupExpiredBlocks();
        }, 60000); // 60 seconds
    }

    // Get singleton instance of the background tracker
    static getInstance(): BackgroundTracker {
        if (
            !BackgroundTracker.instance ||
            BackgroundTracker.instance.isDestroyed
        ) {
            BackgroundTracker.instance = new BackgroundTracker();
        }
        return BackgroundTracker.instance;
    }

    // Set up all Chrome extension event listeners
    private initializeListeners(): void {
        // Tab events
        chrome.tabs.onActivated.addListener(this.handleTabActivated.bind(this));
        chrome.tabs.onUpdated.addListener(this.handleTabUpdated.bind(this));
        chrome.tabs.onRemoved.addListener(this.handleTabRemoved.bind(this));

        // Window events
        chrome.windows.onFocusChanged.addListener(
            this.handleWindowFocusChanged.bind(this),
        );

        // Idle detection
        chrome.idle.setDetectionInterval(this.userIdleThreshold);
        chrome.idle.onStateChanged.addListener(
            this.handleIdleStateChanged.bind(this),
        );

        // Web Navigation events
        chrome.webNavigation.onCompleted.addListener(
            this.handleNavigation.bind(this),
        );
        chrome.webNavigation.onCreatedNavigationTarget.addListener(
            this.handleCreatedNavigationTarget.bind(this),
        );
        // Context menu for selected text
        this.setupContextMenu();

        console.log("🚀 BackgroundTracker initialized with all listeners");
    }

    // Start periodic data sync to prevent data loss
    private startPeriodicSync(): void {
        // Clear any existing interval first
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        this.syncInterval = setInterval(() => {
            if (!this.isDestroyed) {
                this.syncAllVisits();
            }
        }, 30000); // Sync every 30 seconds
    }

    // Get current URL for a specific tab
    private async getCurrentUrlForTab(
        tabId: number,
    ): Promise<string | undefined> {
        try {
            const tab = await chrome.tabs.get(tabId);
            return tab.url;
        } catch (error) {
            console.error(`Error getting URL for tab ${tabId}:`, error);
            return undefined;
        }
    }

    // Handle when a link is clicked to open in new tab
    private async handleCreatedNavigationTarget(
        details: chrome.webNavigation.WebNavigationSourceCallbackDetails,
    ): Promise<void> {
        const sourceState = this.tabStates.get(details.sourceTabId);
        const sourceUrl = await this.getCurrentUrlForTab(details.sourceTabId);

        if (sourceUrl && sourceState?.currentVisit) {
            this.linkCreatedTabs.set(details.tabId, {
                sourceTabId: details.sourceTabId,
                sourceUrl: sourceUrl,
                sourceVisitId: sourceState.currentVisit.id,
            });
        }
    }

    // Extract clean domain from URL
    private extractDomain(url: string): string {
        return extractDomain(url);
    }

    // Categorize URL as work, social, or other based on domain
    private categorizeUrl(domain: string): "work" | "social" | "other" {
        const workDomains = [
            "github.com",
            "gitlab.com",
            "bitbucket.org",
            "docs.google.com",
            "drive.google.com",
            "calendar.google.com",
            "notion.so",
            "slack.com",
            "teams.microsoft.com",
            "outlook.office.com",
            "office.com",
            "zoom.us",
            "meet.google.com",
            "webex.com",
            "stackoverflow.com",
            "figma.com",
            "linear.app",
            "trello.com",
            "asana.com",
            "clickup.com",
            "monday.com",
            "airtable.com",
            "confluence.atlassian.com",
            "jira.atlassian.com",
            "loom.com",
            "coda.io",
            "miro.com",
            "dropbox.com",
            "docusign.net",
            "hellosign.com",
            "zendesk.com",
            "freshdesk.com",
            "intercom.com",
            "typeform.com",
            "surveymonkey.com",
            "tableau.com",
            "powerbi.microsoft.com",
            "datastudio.google.com",
            "replit.com",
            "codesandbox.io",
            "jsfiddle.net",
            "codepen.io",
            "vscode.dev",
            "remoteok.com",
            "weworkremotely.com",
            "angel.co",
            "greenhouse.io",
            "lever.co",
        ];

        const socialDomains = [
            // Social Media
            "facebook.com",
            "instagram.com",
            "twitter.com",
            "x.com",
            "tiktok.com",
            "snapchat.com",
            "threads.net",
            "be.real",
            "clubhouse.com",
            "quora.com",
            "tumblr.com",
            "pinterest.com",
            "linkedin.com",
            "mastodon.social",
            "truthsocial.com",
            "gab.com",
            "wechat.com",
            "line.me",
            "vk.com",
            "ok.ru",

            // Video & Streaming
            "youtube.com",
            "youtu.be",
            "netflix.com",
            "hulu.com",
            "primevideo.com",
            "disneyplus.com",
            "hbo.com",
            "hbonow.com",
            "hulu.jp",
            "dailymotion.com",
            "vimeo.com",
            "peacocktv.com",
            "paramountplus.com",
            "crunchyroll.com",
            "funimation.com",

            // Sports & Live Scores
            "espn.com",
            "cbssports.com",
            "foxsports.com",
            "bleacherreport.com",
            "nba.com",
            "nfl.com",
            "mlb.com",
            "nhl.com",
            "fifa.com",
            "uefa.com",
            "goal.com",
            "livescore.com",
            "sofascore.com",
            "flashscore.com",
            "skysports.com",
            "wwe.com",
            "ufc.com",
            "formula1.com",

            // Betting & Gambling
            "bet365.com",
            "fanduel.com",
            "draftkings.com",
            "betmgm.com",
            "williamhill.com",
            "caesars.com",
            "pokerstars.com",
            "888sport.com",
            "barstoolsports.com",
            "bovada.lv",

            // Music & Audio
            "spotify.com",
            "soundcloud.com",
            "deezer.com",
            "applemusic.com",
            "pandora.com",
            "audiomack.com",
            "tunein.com",
            "bandcamp.com",
            "tidal.com",

            // Live & Gaming Streams
            "twitch.tv",
            "kick.com",
            "mixer.com", // archived but included for legacy
            "trovo.live",

            // Shopping & E-commerce
            "amazon.com",
            "ebay.com",
            "etsy.com",
            "aliexpress.com",
            "walmart.com",
            "target.com",
            "shein.com",
            "temu.com",
            "bestbuy.com",
            "flipkart.com",
            "shopify.com",
            "mercari.com",
            "poshmark.com",
            "asos.com",

            // Community, Memes & Misc
            "reddit.com",
            "9gag.com",
            "imgur.com",
            "buzzfeed.com",
            "producthunt.com",
            "slashdot.org",
            "digg.com",
            "discord.com",
            "redditstatic.com",
        ];

        if (workDomains.some((d) => domain.includes(d))) return "work";
        if (socialDomains.some((d) => domain.includes(d))) return "social";
        return "other";
    }

    // Create new URL visit object with all required properties
    private createUrlVisit(
        url: string,
        tabId: number,
        windowId: number,
        title?: string,
        sourceInfo?: SourceInfo,
        creationMode: "chain" | "hyperlink" = "chain",
    ): UrlVisit {
        const domain = this.extractDomain(url);
        const timestamp = Date.now();

        return {
            id: `${tabId}_${timestamp}`,
            url,
            domain,
            title,
            startTime: timestamp,
            duration: 0,
            activeTime: 0,
            lastActiveTime: timestamp,
            tabId,
            windowId,
            isActive: this.isVisitActive(tabId, windowId),
            category: this.categorizeUrl(domain),
            sourceInfo,
            creationMode,
            wordCount: 0,
        };
    }

    // Check if a visit should be considered "active" based on user state
    private isVisitActive(tabId: number, windowId: number): boolean {
        return (
            this.isUserActive &&
            this.focusedWindowId === windowId &&
            this.focusedTabId === tabId
        );
    }

    // Update accumulated active time for a visit
    private updateActiveTime(visit: UrlVisit): void {
        if (!visit.lastActiveTime || !visit.isActive) return;

        const now = Date.now();
        visit.activeTime += now - visit.lastActiveTime;
        visit.lastActiveTime = now;
    }

    // Finalize a visit by setting end time and calculating total duration
    private finalizeVisit(visit: UrlVisit): void {
        this.updateActiveTime(visit);
        visit.endTime = Date.now();
        visit.duration = visit.endTime - visit.startTime;
        visit.isActive = false;
    }

    // Handle when user switches to a different tab
    private async handleTabActivated(
        activeInfo: chrome.tabs.TabActiveInfo,
    ): Promise<void> {
        console.log(
            "🔵 Tab activated:",
            activeInfo.tabId,
            "window:",
            activeInfo.windowId,
        );

        const { tabId } = activeInfo;
        this.focusedTabId = tabId;

        // Update active states for all tabs
        for (const [tid, state] of this.tabStates) {
            if (state.currentVisit) {
                const wasActive = state.currentVisit.isActive;
                state.currentVisit.isActive = this.isVisitActive(
                    tid,
                    state.currentVisit.windowId,
                );

                if (wasActive && !state.currentVisit.isActive) {
                    this.updateActiveTime(state.currentVisit);
                } else if (!wasActive && state.currentVisit.isActive) {
                    state.currentVisit.lastActiveTime = Date.now();
                }
            }
        }

        // Save current state
        const activeState = this.tabStates.get(tabId);
        if (activeState?.currentVisit) {
            await this.dataService.addUrlVisit(activeState.currentVisit);
        }

        // 🆕 NOTIFY ANALYTICS UPDATE ON TAB SWITCH
        await notifyAnalyticsUpdate(tabId);
    }

    private async handleTabUpdated(
        tabId: number,
        changeInfo: chrome.tabs.TabChangeInfo,
        tab: chrome.tabs.Tab,
    ): Promise<void> {
        console.log(
            "🟢 Tab updated:",
            tabId,
            "changeInfo:",
            changeInfo,
            "url:",
            tab.url,
        );

        if (!tab.url) {
            console.log("❌ No URL in tab, skipping");
            return;
        }

        const state = this.tabStates.get(tabId) || { isActive: false };

        if (changeInfo.status === "complete" && tab.url) {
            console.log("✅ Page completed loading:", changeInfo.url);
            let previousVisitInfo: { id: string; url: string } | undefined;

            // End previous visit if exists
            if (state.currentVisit) {
                console.log(
                    "📋 Finalizing previous visit:",
                    state.currentVisit.url,
                );
                this.finalizeVisit(state.currentVisit);
                previousVisitInfo = {
                    id: state.currentVisit.id,
                    url: state.currentVisit.url,
                };
                await this.dataService.addUrlVisit(state.currentVisit);
            }

            // Determine navigation mode and source
            const linkInfo = this.linkCreatedTabs.get(tabId);
            let sourceInfo: SourceInfo | undefined;
            let creationMode: "chain" | "hyperlink" = "chain";

            if (linkInfo) {
                console.log(
                    "🔗 Hyperlink navigation detected from:",
                    linkInfo.sourceUrl,
                );
                sourceInfo = {
                    nodeId: linkInfo.sourceVisitId || "",
                    url: linkInfo.sourceUrl,
                    tabId: linkInfo.sourceTabId,
                };
                creationMode = "hyperlink";
                this.linkCreatedTabs.delete(tabId);
            } else if (previousVisitInfo) {
                console.log(
                    "⛓️ Chain navigation detected from:",
                    previousVisitInfo.url,
                );
                sourceInfo = {
                    nodeId: previousVisitInfo.id,
                    url: previousVisitInfo.url,
                    tabId,
                };
            }

            // Create and save new visit
            console.log("📝 Creating new visit for:", tab.url);
            state.currentVisit = this.createUrlVisit(
                tab.url,
                tabId,
                tab.windowId || 0,
                tab.title,
                sourceInfo,
                creationMode,
            );
            state.previousUrl = tab.url;
            this.tabStates.set(tabId, state);

            console.log("💾 Saving visit to storage");
            await this.dataService.addUrlVisit(state.currentVisit);

            // Extract word count for reading time calculation
            try {
                console.log(
                    "📊 Extracting word count for reading analytics...",
                );

                // Try direct script injection first
                const [result] = await chrome.scripting.executeScript({
                    target: { tabId },
                    func: () => {
                        // More accurate word count extraction
                        const textContent =
                            document.body.innerText ||
                            document.body.textContent ||
                            "";

                        // Remove extra whitespace and split by word boundaries
                        const words = textContent
                            .trim()
                            .replace(/\s+/g, " ") // Replace multiple spaces with single space
                            .split(/\s+/) // Split by spaces
                            .filter((word) => word.length > 0); // Remove empty strings

                        return {
                            wordCount: words.length,
                            characterCount: textContent.length,
                            textPreview: textContent.substring(0, 100) + "...",
                        };
                    },
                });

                if (result?.result?.wordCount) {
                    console.log(
                        `📝 Word count extracted: ${result.result.wordCount} words`,
                    );
                    console.log(
                        `📝 Character count: ${result.result.characterCount} chars`,
                    );
                    console.log(
                        `📝 Text preview: ${result.result.textPreview}`,
                    );

                    // Only set word count if it hasn't been set yet or if it's significantly different
                    if (
                        !state.currentVisit.wordCount ||
                        Math.abs(
                            state.currentVisit.wordCount -
                                result.result.wordCount,
                        ) > 10
                    ) {
                        state.currentVisit.wordCount = result.result.wordCount;
                        await this.dataService.addUrlVisit(state.currentVisit);
                        console.log("✅ Word count saved to visit");
                    } else {
                        console.log(
                            "📝 Word count already set, skipping update",
                        );
                    }
                } else {
                    console.log(
                        "📝 No word count available or extraction failed",
                    );

                    // Fallback: try content script message
                    try {
                        const response = await chrome.tabs.sendMessage(tabId, {
                            type: "GET_WORD_COUNT", // Use consistent message type
                        });

                        if (
                            response?.wordCount &&
                            (!state.currentVisit.wordCount ||
                                Math.abs(
                                    state.currentVisit.wordCount -
                                        response.wordCount,
                                ) > 10)
                        ) {
                            state.currentVisit.wordCount = response.wordCount;
                            await this.dataService.addUrlVisit(
                                state.currentVisit,
                            );
                            console.log(
                                "✅ Word count from content script:",
                                response.wordCount,
                            );
                        }
                    } catch (contentScriptError) {
                        console.log(
                            "📝 Content script also unavailable, using estimated count",
                        );
                        // Use a rough estimate based on character count
                        const estimatedWords = Math.round(
                            (result?.result?.characterCount || 0) / 5,
                        ); // Rough estimate
                        if (!state.currentVisit.wordCount) {
                            state.currentVisit.wordCount = estimatedWords;
                        }
                    }
                }
            } catch (error) {
                console.log("⚠️ Could not extract word count:", error);
                state.currentVisit.wordCount = 0;
            }

            console.log("✅ Visit saved successfully");

            // 🆕 NOTIFY ANALYTICS UPDATE
            await notifyAnalyticsUpdate(tabId);
        } else if (changeInfo.title && state.currentVisit) {
            console.log(
                "📄 Title updated for existing visit:",
                changeInfo.title,
            );
            state.currentVisit.title = changeInfo.title;
            await this.dataService.addUrlVisit(state.currentVisit);

            // 🆕 NOTIFY ANALYTICS UPDATE
            await notifyAnalyticsUpdate(tabId);
        }
    }

    // Handle when a tab is closed
    private async handleTabRemoved(tabId: number): Promise<void> {
        const state = this.tabStates.get(tabId);
        if (state?.currentVisit) {
            this.finalizeVisit(state.currentVisit);
            await this.dataService.addUrlVisit(state.currentVisit);
        }

        // Close tab session in data service
        await this.dataService.closeTab(tabId);

        // Clean up state
        this.tabStates.delete(tabId);
        this.linkCreatedTabs.delete(tabId);
    }

    // Handle when browser window focus changes
    private async handleWindowFocusChanged(windowId: number): Promise<void> {
        this.focusedWindowId = windowId;

        // Update active states for all tabs
        for (const [tabId, state] of this.tabStates) {
            if (state.currentVisit) {
                const wasActive = state.currentVisit.isActive;
                state.currentVisit.isActive = this.isVisitActive(
                    tabId,
                    state.currentVisit.windowId,
                );

                if (wasActive && !state.currentVisit.isActive) {
                    this.updateActiveTime(state.currentVisit);
                } else if (!wasActive && state.currentVisit.isActive) {
                    state.currentVisit.lastActiveTime = Date.now();
                }

                await this.dataService.addUrlVisit(state.currentVisit);
            }
        }
    }

    // Handle when user becomes idle or active
    private async handleIdleStateChanged(
        state: chrome.idle.IdleState,
    ): Promise<void> {
        this.isUserActive = state === "active";

        // Update all active visits based on new idle state
        for (const [tabId, tabState] of this.tabStates) {
            if (tabState.currentVisit) {
                const wasActive = tabState.currentVisit.isActive;
                tabState.currentVisit.isActive = this.isVisitActive(
                    tabId,
                    tabState.currentVisit.windowId,
                );

                if (wasActive && !tabState.currentVisit.isActive) {
                    this.updateActiveTime(tabState.currentVisit);
                    await this.dataService.addUrlVisit(tabState.currentVisit);
                } else if (!wasActive && tabState.currentVisit.isActive) {
                    tabState.currentVisit.lastActiveTime = Date.now();
                }
            }
        }
    }

    // Handle web navigation events (for tracking URL changes)
    private async handleNavigation(
        details: chrome.webNavigation.WebNavigationFramedCallbackDetails,
    ): Promise<void> {
        // Only handle main frame navigation
        if (details.frameId !== 0) return;

        const { tabId } = details;
        const state = this.tabStates.get(tabId);

        if (state?.currentVisit) {
            state.previousUrl = state.currentVisit.url;
        }
    }

    // Periodically sync all active visits to prevent data loss
    private async syncAllVisits(): Promise<void> {
        for (const [tabId, state] of this.tabStates) {
            if (state.currentVisit) {
                this.updateActiveTime(state.currentVisit);
                await this.dataService.addUrlVisit(state.currentVisit);
            }
        }

        // 🆕 NOTIFY ANALYTICS UPDATE AFTER SYNC
        await notifyAnalyticsUpdate();
    }

    private async cleanupExpiredBlocks(): Promise<void> {
        try {
            await websiteBlocker.cleanupExpiredBlocks();
        } catch (error) {
            console.error("Error cleaning up expired blocks:", error);
        }
    }

    // Set up context menu for selected text - ROBUST VERSION
    private setupContextMenu(): void {
        chrome.contextMenus.removeAll(() => {
            // Add to LyncX notes
            chrome.contextMenus.create({
                id: "addToLyncX",
                title: "Add to Notes",
                contexts: ["selection"],
            });

            // Smart Bookmark
            chrome.contextMenus.create({
                id: "smartBookmark",
                title: "Bookmark Page",
                contexts: ["page"],
            });

            // Add Summarize option
            chrome.contextMenus.create({
                id: "summarize-selection",
                title: "Summarize Selection",
                contexts: ["selection"],
            });
        });

        chrome.contextMenus.onClicked.addListener(async (info, tab) => {
            // Handle summarize selection
            if (info.menuItemId === "summarize-selection" && tab?.id) {
                // Store the selected text temporarily
                await chrome.storage.local.set({
                    pendingSummarizeText: info.selectionText,
                    pendingSummarizeType: "selection",
                });

                // Open the popup programmatically
                await chrome.action.openPopup();

                // Send message to notify the popup
                chrome.runtime.sendMessage({
                    action: "summarize-selection",
                    text: info.selectionText,
                });

                return;
            }

            // ROBUST: Direct backend save for LyncX notes

            // Smart Bookmark functionality remains unchanged
            if (
                info.menuItemId === "smartBookmark" &&
                tab?.id &&
                tab?.url &&
                tab?.title
            ) {
                try {
                    // Load existing bookmarks
                    const result = await chrome.storage.local.get([
                        "smartBookmarks",
                    ]);
                    let bookmarks = [];

                    if (result.smartBookmarks) {
                        bookmarks = JSON.parse(result.smartBookmarks);
                    }

                    // Check if already bookmarked
                    const existingBookmark = bookmarks.find(
                        (b: any) => b.url === tab.url && b.status === "active",
                    );

                    if (existingBookmark) {
                        // Already bookmarked - show notification
                        chrome.tabs
                            .sendMessage(tab.id, {
                                action: "showNotification",
                                message: "Already in Smart Bookmarks!",
                            })
                            .catch(() => {
                                // Ignore if content script isn't available
                            });
                        return;
                    }

                    // Add new bookmark
                    const now = Date.now();
                    const newBookmark = {
                        id: `bookmark_${now}`,
                        url: tab.url,
                        title: tab.title,
                        status: "active",
                        openCount: 0,
                        lastOpened: 0,
                        createdAt: now,
                        expiresAt: now + 3 * 24 * 60 * 60 * 1000, // 3 days from now
                    };

                    bookmarks.push(newBookmark);

                    // Save updated bookmarks
                    await chrome.storage.local.set({
                        smartBookmarks: JSON.stringify(bookmarks),
                    });

                    console.log(`📚 Added Smart Bookmark: ${tab.title}`);

                    // Send notification message to content script
                    chrome.tabs
                        .sendMessage(tab.id, {
                            action: "showNotification",
                            message: "Added to Smart Bookmarks!",
                        })
                        .catch(() => {
                            // Ignore if content script isn't available
                        });
                } catch (error) {
                    console.error("Error adding smart bookmark:", error);
                }
            }
        });
    }

    // Get request count for a specific tab and domain
    public getRequestCount(tabId: number, domain: string): number {
        const key = `${tabId}_${domain}`;
        return this.requestCounts.get(key) || 0;
    }

    // Clean up resources when tracker is destroyed
    public destroy(): void {
        this.isDestroyed = true;

        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = undefined;
        }

        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = undefined;
        }

        // Clean up event listeners
        chrome.tabs.onActivated.removeListener(
            this.handleTabActivated.bind(this),
        );
        chrome.tabs.onUpdated.removeListener(this.handleTabUpdated.bind(this));
        chrome.tabs.onRemoved.removeListener(this.handleTabRemoved.bind(this));
        chrome.windows.onFocusChanged.removeListener(
            this.handleWindowFocusChanged.bind(this),
        );
        chrome.idle.onStateChanged.removeListener(
            this.handleIdleStateChanged.bind(this),
        );
        chrome.webNavigation.onCompleted.removeListener(
            this.handleNavigation.bind(this),
        );
        chrome.webNavigation.onCreatedNavigationTarget.removeListener(
            this.handleCreatedNavigationTarget.bind(this),
        );

        // Clean up context menu
        chrome.contextMenus.removeAll();

        // Clear state
        this.tabStates.clear();
        this.linkCreatedTabs.clear();
        this.requestCounts.clear();
        this.focusedWindowId = undefined;
        this.focusedTabId = undefined;
    }
}

// Global message handler for proceed to site functionality
async function handleProceedToSite(url: string): Promise<boolean> {
    try {
        console.log(`Handling proceed to site request for: ${url}`);

        // Use the websiteBlocker to allow temporary access
        const success = await websiteBlocker.allowTemporaryAccess(url);

        if (success) {
            console.log(`Temporary access granted for: ${url}`);
        } else {
            console.log(`Failed to grant temporary access for: ${url}`);
        }

        return success;
    } catch (error) {
        console.error("Error in handleProceedToSite:", error);
        return false;
    }
}

// ===============================
// TIMER FUNCTIONALITY (UNIFIED)
// ===============================

// Single peaceful timer completion modal - define before use
function showPeacefulTimerComplete(minutes: number, domain: string) {
    // Only show if not already showing
    if (document.getElementById("lyncx-peaceful-timer")) return;

    // Create overlay backdrop
    const backdrop = document.createElement("div");
    backdrop.id = "lyncx-peaceful-timer";
    backdrop.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.4);
        backdrop-filter: blur(8px);
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.4s ease-out;
    `;

    // Create the modal
    const modal = document.createElement("div");
    modal.style.cssText = `
        background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
        padding: 40px 50px;
        border-radius: 20px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
        text-align: center;
        max-width: 400px;
        min-width: 320px;
        animation: slideUp 0.4s ease-out;
        border: 1px solid rgba(255, 255, 255, 0.2);
    `;

    modal.innerHTML = `
        <div style="
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            color: #2d3748;
            line-height: 1.6;
        ">
            <div style="
                font-size: 28px;
                font-weight: 300;
                margin-bottom: 16px;
                letter-spacing: -0.5px;
            ">
                Your timer has ended
            </div>
            <div style="
                font-size: 16px;
                color: #4a5568;
                margin-bottom: 30px;
                font-weight: 400;
            ">
                ${minutes} minute${minutes === 1 ? "" : "s"} for ${domain}
            </div>
        </div>
    `;

    // Add CSS animations
    const style = document.createElement("style");
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes slideUp {
            from {
                transform: translateY(30px);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);

    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);

    // Click backdrop to close
    backdrop.addEventListener("click", (e) => {
        if (e.target === backdrop) {
            backdrop.remove();
        }
    });

    // Auto-remove after 15 seconds if user doesn't interact
    setTimeout(() => {
        if (backdrop.parentElement) {
            backdrop.style.animation = "fadeIn 0.3s ease-out reverse";
            setTimeout(() => backdrop.remove(), 300);
        }
    }, 15000);
}

// Create a new timer
async function handleCreateTimer(
    request: any,
    sendResponse: (response?: any) => void,
) {
    try {
        const { domain, minutes } = request;
        const alarmName = `timer_${domain}`;

        console.log(`Creating timer: ${alarmName} for ${minutes} minutes`);

        // Clear any existing alarm for this domain
        await chrome.alarms.clear(alarmName);

        // Create new chrome alarm
        await chrome.alarms.create(alarmName, {
            delayInMinutes: minutes,
        });

        // Store timer info for persistence
        const timerData = {
            domain: domain,
            minutes: minutes,
            startTime: Date.now(),
            endTime: Date.now() + minutes * 60 * 1000,
        };

        await chrome.storage.local.set({
            [alarmName]: timerData,
        });

        console.log("Timer created successfully:", timerData);
        sendResponse({ success: true });
    } catch (error) {
        console.error("Failed to create timer:", error);
        sendResponse({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
}

// Cancel an existing timer
async function handleCancelTimer(
    request: any,
    sendResponse: (response?: any) => void,
) {
    try {
        const { domain } = request;
        const alarmName = `timer_${domain}`;

        console.log(`Canceling timer: ${alarmName}`);

        // Clear chrome alarm
        const wasCleared = await chrome.alarms.clear(alarmName);

        // Remove from storage
        await chrome.storage.local.remove(alarmName);

        console.log(
            `Timer canceled successfully. Alarm was active: ${wasCleared}`,
        );
        sendResponse({ success: true });
    } catch (error) {
        console.error("Failed to cancel timer:", error);
        sendResponse({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
}

// Get all active timers
async function handleGetActiveTimers(sendResponse: (response?: any) => void) {
    try {
        const items = await chrome.storage.local.get(null);
        const activeTimers: { [key: string]: any } = {};
        const currentTime = Date.now();
        const expiredTimers: string[] = [];

        // Filter for timer items and check if they're still active
        Object.keys(items).forEach((key) => {
            if (key.startsWith("timer_")) {
                const timerData = items[key];
                if (timerData && timerData.endTime > currentTime) {
                    activeTimers[key] = timerData;
                } else {
                    // Mark expired timers for cleanup
                    expiredTimers.push(key);
                }
            }
        });

        // Clean up expired timers
        if (expiredTimers.length > 0) {
            await chrome.storage.local.remove(expiredTimers);
            // Also clear any associated alarms
            for (const expiredKey of expiredTimers) {
                await chrome.alarms.clear(expiredKey);
            }
        }

        sendResponse({ timers: activeTimers });
    } catch (error) {
        console.error("Failed to get active timers:", error);
        sendResponse({
            timers: {},
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
}

// ===============================
// SCREENSHOT HANDLER
// ===============================

interface ScreenshotResponse {
    success: boolean;
    error?: string;
}

async function handleCaptureScreenshot(
    sendResponse: (response: ScreenshotResponse) => void,
): Promise<void> {
    try {
        console.log("📸 Background: Starting screenshot capture...");

        // Get the current active tab
        const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true,
        });

        if (!tab?.id || !tab.windowId) {
            throw new Error("No active tab found");
        }

        // Check if we can access this URL
        if (
            tab.url &&
            (tab.url.startsWith("chrome://") ||
                tab.url.startsWith("chrome-extension://") ||
                tab.url.startsWith("about:") ||
                tab.url.startsWith("edge://") ||
                tab.url.startsWith("brave://") ||
                tab.url.startsWith("opera://"))
        ) {
            throw new Error(
                "Cannot capture screenshots of browser pages. Please try on a regular webpage.",
            );
        }

        // Get page dimensions first
        const [dimensionsResult] = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
                window.scrollTo(0, 0); // Scroll to top first
                return {
                    totalHeight: Math.max(
                        document.documentElement.scrollHeight,
                        document.body.scrollHeight,
                    ),
                    viewportHeight: window.innerHeight,
                    viewportWidth: window.innerWidth,
                };
            },
        });

        if (!dimensionsResult?.result) {
            throw new Error("Failed to get page dimensions");
        }

        const { totalHeight, viewportHeight, viewportWidth } =
            dimensionsResult.result;
        console.log("Page dimensions:", {
            totalHeight,
            viewportHeight,
            viewportWidth,
        });

        // Collect all screenshot data by scrolling and capturing
        const screenshots: Array<{
            dataUrl: string;
            step: number;
            viewportHeight: number;
            viewportWidth: number;
        }> = [];

        const totalSteps = Math.ceil(totalHeight / viewportHeight);
        console.log("Will take", totalSteps, "screenshots");

        for (let step = 0; step < totalSteps; step++) {
            console.log(`Taking screenshot ${step + 1}/${totalSteps}`);

            // Scroll to the correct position
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: (step: number, viewportHeight: number) => {
                    window.scrollTo(0, step * viewportHeight);
                    return new Promise((resolve) => setTimeout(resolve, 150));
                },
                args: [step, viewportHeight],
            });

            // Additional wait for any lazy-loaded content and animations
            await new Promise((resolve) => setTimeout(resolve, 150));

            // Capture the visible tab
            const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
                format: "png",
            });

            screenshots.push({
                dataUrl,
                step,
                viewportHeight,
                viewportWidth,
            });
        }

        console.log("All screenshots captured, processing canvas...");

        // Create filename
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const tabTitle = tab.title || "untitled";
        const camelCaseTitle = tabTitle
            .replace(/[^a-zA-Z0-9 ]/g, "")
            .split(" ")
            .map((word, index) => {
                if (index === 0) {
                    return word.toLowerCase();
                }
                return (
                    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                );
            })
            .join("");

        const domain = new URL(tab.url!).hostname.replace("www.", "");
        const filename = `${camelCaseTitle}-${domain}-${timestamp}.png`;

        // Inject script to create canvas, combine screenshots, and download
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: (
                screenshots: Array<{
                    dataUrl: string;
                    step: number;
                    viewportHeight: number;
                    viewportWidth: number;
                }>,
                totalHeight: number,
                filename: string,
            ) => {
                console.log("Creating canvas and combining screenshots...");

                // Create canvas in the page context where document exists
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");
                if (!ctx) {
                    throw new Error("Failed to get canvas context");
                }

                canvas.width = screenshots[0].viewportWidth;
                canvas.height = totalHeight;

                let loadedCount = 0;
                const totalScreenshots = screenshots.length;

                return new Promise<void>((resolve, reject) => {
                    screenshots.forEach((screenshot, index) => {
                        const img = new Image();
                        img.onload = () => {
                            // Draw the image at the correct vertical position
                            ctx.drawImage(
                                img,
                                0,
                                screenshot.step * screenshot.viewportHeight,
                                screenshot.viewportWidth,
                                screenshot.viewportHeight,
                            );

                            loadedCount++;
                            if (loadedCount === totalScreenshots) {
                                // All images loaded, now download
                                console.log(
                                    "All images loaded, creating download...",
                                );

                                try {
                                    const finalDataUrl =
                                        canvas.toDataURL("image/png");

                                    // Create and trigger download
                                    const link = document.createElement("a");
                                    link.download = filename;
                                    link.href = finalDataUrl;
                                    link.style.display = "none";

                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);

                                    console.log(
                                        "Download triggered for:",
                                        filename,
                                    );

                                    // Show success notification
                                    const notification =
                                        document.createElement("div");
                                    notification.style.cssText = `
                                        position: fixed;
                                        top: 20px;
                                        right: 20px;
                                        background: #4CAF50;
                                        color: white;
                                        padding: 12px 20px;
                                        border-radius: 8px;
                                        z-index: 999999;
                                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                                        font-size: 14px;
                                        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                                    `;
                                    notification.textContent =
                                        "Full page screenshot downloaded!";

                                    document.body.appendChild(notification);
                                    setTimeout(() => {
                                        if (notification.parentElement) {
                                            notification.remove();
                                        }
                                    }, 3000);

                                    resolve();
                                } catch (error) {
                                    reject(error);
                                }
                            }
                        };
                        img.onerror = () =>
                            reject(
                                new Error(`Failed to load screenshot ${index}`),
                            );
                        img.src = screenshot.dataUrl;
                    });
                });
            },
            args: [screenshots, totalHeight, filename],
        });

        // Reset scroll position
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => window.scrollTo(0, 0),
        });

        console.log("✅ Background: Screenshot captured successfully");
        sendResponse({ success: true });
    } catch (error) {
        console.error("❌ Background: Screenshot failed:", error);
        sendResponse({
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Screenshot capture failed",
        });
    }
}

// ===============================
// AUTH STATE HANDLER
// ===============================

interface AuthStateResponse {
    user: any; // AuthUser type from AuthService
    error?: string;
}

// Add this function anywhere in your file
function handleAuthLogin(sendResponse: (response: any) => void) {
    console.log("🔑 Processing authentication request...");

    chrome.identity.getAuthToken(
        {
            interactive: true,
            scopes: [
                "openid",
                "email",
                "profile",
                "https://www.googleapis.com/auth/calendar.readonly",
                "https://www.googleapis.com/auth/calendar.events",
            ],
        },
        async (token) => {
            if (chrome.runtime.lastError) {
                console.error("❌ Auth error:", chrome.runtime.lastError);
                sendResponse({
                    success: false,
                    error: chrome.runtime.lastError.message,
                });
                return;
            }

            if (!token) {
                console.error("❌ No token received");
                sendResponse({
                    success: false,
                    error: "No access token received",
                });
                return;
            }

            try {
                // Get user info from Google
                const userResponse = await fetch(
                    "https://www.googleapis.com/oauth2/v2/userinfo",
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    },
                );

                if (!userResponse.ok) {
                    throw new Error(
                        `Failed to get user info: ${userResponse.status}`,
                    );
                }

                const userData = await userResponse.json();
                console.log("👤 User data received:", userData.email);

                // Create standardized user object
                const user = {
                    uid: userData.id,
                    email: userData.email,
                    displayName: userData.name || null,
                    photoURL: userData.picture || null,
                    accessToken: token,
                    refreshToken: null,
                    plan: "free",
                    subscriptionEnd: null,
                    createdAt: Date.now(),
                };

                // Store the user data
                await chrome.storage.local.set({
                    auth_user: user,
                    auth_tokens: {
                        accessToken: token,
                        refreshToken: null,
                        source: "chrome",
                    },
                });

                console.log("✅ Authentication successful for:", user.email);

                sendResponse({
                    success: true,
                    user: user,
                });
            } catch (error) {
                console.error("❌ Error processing authentication:", error);
                sendResponse({
                    success: false,
                    error:
                        error instanceof Error
                            ? error.message
                            : "Authentication failed",
                });
            }
        },
    );
}
// ===============================
// NAVBAR ACTION HANDLERS
// ===============================

// Handle opening notepad from navbar
function handleOpenNotepad(
    request: any,
    sendResponse: (response: any) => void,
) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id!, {
                type: "SHOW_NOTEPAD",
                domain: request.domain || new URL(tabs[0].url || "").hostname,
            });
        }
    });
    sendResponse({ success: true });
}

// Handle opening reminders from navbar
function handleOpenReminders(sendResponse: (response: any) => void) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id!, {
                type: "SHOW_REMINDERS",
            });
        }
    });
    sendResponse({ success: true });
}

// Handle opening search from navbar
function handleOpenSearch(sendResponse: (response: any) => void) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id!, {
                type: "SHOW_SEARCH",
            });
        }
    });
    sendResponse({ success: true });
}

// Handle showing spotlight search from navbar
function handleShowSpotlightSearch(sendResponse: (response: any) => void) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id!, {
                type: "SHOW_SPOTLIGHT_SEARCH",
            });
        }
    });
    sendResponse({ success: true });
}

// Handle toggling bookmark from navbar
function handleToggleBookmark(
    request: any,
    sendResponse: (response: any) => void,
) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id!, {
                type: "TOGGLE_BOOKMARK",
                url: request.url || tabs[0].url,
            });
        }
    });
    sendResponse({ success: true });
}

// Handle opening timer from navbar
function handleOpenTimer(sendResponse: (response: any) => void) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id!, {
                type: "SHOW_TIMER",
            });
        }
    });
    sendResponse({ success: true });
}

// Handle summarizing page from navbar
function handleSummarizePage(sendResponse: (response: any) => void) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id!, {
                type: "SUMMARIZE_PAGE",
            });
        }
    });
    sendResponse({ success: true });
}

// ===============================
// CROSS-TAB SEARCH HANDLERS
// ===============================

// Function to search page content (injected into each tab)
function searchPageContent(searchTerm: string): TabSearchResult {
    const content = document.body.innerText.toLowerCase();
    const searchLower = searchTerm.toLowerCase();

    const matches = (content.match(new RegExp(searchLower, "g")) || []).length;

    if (matches === 0) {
        return { matchCount: 0, context: "" };
    }

    // Find context around first match
    const firstMatchIndex = content.indexOf(searchLower);
    const contextStart = Math.max(0, firstMatchIndex - 50);
    const contextEnd = Math.min(
        content.length,
        firstMatchIndex + searchLower.length + 50,
    );
    const rawContext = content.substring(contextStart, contextEnd);

    // Highlight the search term in context
    const highlightedContext = rawContext.replace(
        new RegExp(`(${searchLower})`, "gi"),
        "<mark>$1</mark>",
    );

    return {
        matchCount: matches,
        context: highlightedContext.trim(),
    };
}

// Handle cross-tab search in background script
async function handleCrossTabSearch(
    request: { searchTerm: string },
    sendResponse: (response: any) => void,
): Promise<void> {
    const { searchTerm } = request;

    if (!searchTerm || searchTerm.length < 3) {
        sendResponse({ success: true, matches: [] });
        return;
    }

    try {
        console.log(`🔍 Starting cross-tab search for: "${searchTerm}"`);

        // Get all tabs
        const tabs = await chrome.tabs.query({});
        const validTabs = tabs.filter(
            (tab) =>
                tab.url &&
                tab.id &&
                !tab.url.startsWith("chrome://") &&
                !tab.url.startsWith("chrome-extension://") &&
                !tab.url.startsWith("about:") &&
                tab.status === "complete",
        );

        console.log(`📋 Searching across ${validTabs.length} valid tabs`);

        const searchMatches: SearchMatch[] = [];

        // Search each tab
        for (const tab of validTabs) {
            if (!tab.id || !tab.url) continue;

            try {
                // First check if tab title/URL matches (faster)
                const titleMatch = tab.title
                    ?.toLowerCase()
                    .includes(searchTerm.toLowerCase());
                const urlMatch = tab.url
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase());

                if (titleMatch || urlMatch) {
                    const domain = new URL(tab.url).hostname.replace(
                        /^www\./,
                        "",
                    );
                    searchMatches.push({
                        tabId: tab.id,
                        title: tab.title || tab.url,
                        url: tab.url,
                        domain,
                        favicon:
                            tab.favIconUrl ||
                            `https://www.google.com/s2/favicons?domain=${domain}&sz=16`,
                        matchCount: titleMatch ? 1 : 0,
                        context: titleMatch
                            ? "Found in page title"
                            : "Found in URL",
                    });
                    continue;
                }

                // Then search page content
                const results = await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: searchPageContent,
                    args: [searchTerm],
                });

                if (results[0]?.result) {
                    const { matchCount, context } = results[0].result;

                    if (matchCount > 0) {
                        const domain = new URL(tab.url).hostname.replace(
                            /^www\./,
                            "",
                        );
                        searchMatches.push({
                            tabId: tab.id,
                            title: tab.title || tab.url,
                            url: tab.url,
                            domain,
                            favicon:
                                tab.favIconUrl ||
                                `https://www.google.com/s2/favicons?domain=${domain}&sz=16`,
                            matchCount,
                            context,
                        });
                    }
                }
            } catch (error) {
                // Skip tabs that can't be accessed (protected pages, etc.)
                console.log(`Skipping tab ${tab.id}: ${error}`);
            }
        }

        // Sort by match count (most matches first)
        searchMatches.sort((a, b) => b.matchCount - a.matchCount);

        console.log(`✅ Found ${searchMatches.length} tabs with matches`);
        sendResponse({ success: true, matches: searchMatches });
    } catch (error) {
        console.error("❌ Error in cross-tab search:", error);
    }
}

// Handle tab switching
async function handleSwitchToTab(
    tabId: number,
    sendResponse: (response: any) => void,
): Promise<void> {
    try {
        // Get tab info and switch to it
        const tab = await chrome.tabs.get(tabId);
        await chrome.tabs.update(tabId, { active: true });

        // Focus the window containing the tab
        if (tab.windowId) {
            await chrome.windows.update(tab.windowId, { focused: true });
        }

        console.log(`✅ Switched to tab: ${tab.title}`);
        sendResponse({ success: true });
    } catch (error) {
        console.error("❌ Error switching to tab:", error);
    }
}

// Legacy function for backward compatibility
async function handleGetAllTabs(sendResponse: (response: any) => void) {
    try {
        console.log("🔍 Getting all tabs...");
        const tabs = await chrome.tabs.query({});
        const validTabs = tabs.filter(
            (tab) =>
                tab.url &&
                !tab.url.startsWith("chrome://") &&
                !tab.url.startsWith("chrome-extension://") &&
                !tab.url.startsWith("moz-extension://") &&
                tab.status === "complete",
        );
        console.log(`✅ Found ${validTabs.length} valid tabs`);
        sendResponse({
            success: true,
            tabs: validTabs,
        });
    } catch (error) {
        console.error("❌ Error getting tabs:", error);
        sendResponse({
            success: false,
            tabs: [],
        });
    }
}

// Handle loading all notes for the sidebar

// Handle saving a note

// ============================
// DAILY LIMITS
// ============================

async function handleGetDailyLimit(
    request: any,
    sendResponse: (response: any) => void,
) {
    try {
        console.log("📊 Getting daily limit for domain:", request.domain);

        const limit = await DailyLimitManager.getLimit(request.domain);

        sendResponse({
            success: true,
            limit: limit,
        });
    } catch (error) {
        console.error("❌ Error getting daily limit:", error);
        sendResponse({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
}

async function handleSetDailyLimit(
    request: any,
    sendResponse: (response: any) => void,
) {
    try {
        console.log("💾 Setting daily limit for domain:", request.domain);

        const limit: DailyLimit = {
            domain: request.domain,
            limit: request.limit,
            used: 0,
            enabled: request.enabled,
            lastReset: new Date().toISOString().split("T")[0],
        };

        // If there's an existing limit, preserve the current usage
        const existingLimit = await DailyLimitManager.getLimit(request.domain);
        if (existingLimit) {
            limit.used = existingLimit.used;
            limit.lastReset = existingLimit.lastReset;
        }

        await DailyLimitManager.saveLimit(limit);

        // NEW: Show the status bar expanded when limit is set
        if (limit.enabled) {
            console.log("📊 Showing expanded status bar for new limit");

            // Find the tab with the matching domain
            const tabs = await chrome.tabs.query({});
            const matchingTab = tabs.find((tab) => {
                if (!tab.url) return false;
                try {
                    const tabDomain = new URL(tab.url).hostname.replace(
                        /^www\./,
                        "",
                    );
                    return tabDomain === request.domain;
                } catch {
                    return false;
                }
            });

            if (matchingTab && matchingTab.id) {
                // Send message to show expanded status bar
                chrome.tabs
                    .sendMessage(matchingTab.id, {
                        type: "SHOW_LIMIT_STATUS",
                        domain: request.domain,
                        showExpanded: true,
                    })
                    .catch((error) => {
                        console.log(
                            "Could not notify tab about new limit:",
                            error,
                        );
                    });
            }
        }

        sendResponse({
            success: true,
            limit: limit,
        });
    } catch (error) {
        console.error("❌ Error setting daily limit:", error);
        sendResponse({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
}

// Handle removing daily limit
async function handleRemoveDailyLimit(
    request: any,
    sendResponse: (response: any) => void,
) {
    try {
        console.log("🗑️ Removing daily limit for domain:", request.domain);

        await DailyLimitManager.removeLimit(request.domain);

        sendResponse({
            success: true,
        });
    } catch (error) {
        console.error("❌ Error removing daily limit:", error);
        sendResponse({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
}

// Handle updating usage
async function handleUpdateUsage(
    request: any,
    sendResponse: (response: any) => void,
) {
    try {
        console.log(
            "📈 Updating usage for domain:",
            request.domain,
            "minutes:",
            request.minutes,
        );

        await DailyLimitManager.updateUsage(request.domain, request.minutes);

        sendResponse({
            success: true,
        });
    } catch (error) {
        console.error("❌ Error updating usage:", error);
        sendResponse({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
}

// Handle showing limit modal
function handleShowLimitModal(sendResponse: (response: any) => void) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id!, {
                type: "SHOW_LIMIT_MODAL",
            });
        }
    });
    sendResponse({ success: true });
}

// ===============================
// SIDE PANEL
// ===============================

// ===============================
// LYNCX FLOW HANDLERS
// ===============================

// Handle showing Flow modal
function handleShowFlowModal(sendResponse: (response: any) => void) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id!, {
                type: "SHOW_FLOW_MODAL",
            });
        }
    });
    sendResponse({ success: true });
}

function handleShowSearchModal(sendResponse: (response: any) => void) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id!, {
                type: "SHOW_SEARCH_MODAL",
            });
        }
    });
    sendResponse({ success: true });
}

// Handle search modal queries
async function handleSearchModalQuery(
    request: {
        query: string;
        url: string;
        title: string;
    },
    sendResponse: (response: any) => void,
) {
    try {
        console.log("🔍 Processing search modal query:", request.query);

        // Here you can integrate with your AI service (OpenAI, Claude API, etc.)
        // For now, I'll show a mock implementation

        // Mock AI response - replace with actual AI integration
        const mockResponse = await simulateAIResponse(
            request.query,
            request.url,
            request.title,
        );

        // Store the search result for display
        await chrome.storage.local.set({
            [`search_result_${Date.now()}`]: {
                query: request.query,
                response: mockResponse,
                url: request.url,
                title: request.title,
                timestamp: Date.now(),
            },
        });

        // Show notification with result
        chrome.notifications.create({
            type: "basic",
            iconUrl: "/src/assets/icons/icon128.png",
            title: "Search Result",
            message: mockResponse.substring(0, 100) + "...",
            priority: 1,
        });

        sendResponse({
            success: true,
            response: mockResponse,
        });
    } catch (error) {
        console.error("❌ Error processing search:", error);
        sendResponse({
            success: false,
            error: error instanceof Error ? error.message : "Search failed",
        });
    }
}

// Mock AI response function - replace with actual AI integration
async function simulateAIResponse(
    query: string,
    url: string,
    title: string,
): Promise<string> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Mock responses based on query type
    if (query.toLowerCase().includes("summarize")) {
        return `Based on the page "${title}", here's a summary: This page contains information about ${
            url.split("/").pop() || "the topic"
        }. The content appears to focus on providing detailed information and resources related to the subject matter.`;
    } else if (query.toLowerCase().includes("explain")) {
        return `Let me explain this for you: The page "${title}" provides comprehensive information. The key points include various aspects of the topic that are covered in detail throughout the content.`;
    } else {
        return `I understand you're asking about: "${query}". Based on the current page "${title}", I can help provide relevant information and insights related to your question.`;
    }
}

// ===============================
// FLOW MODAL HANDLERS
// ===============================

// Handle Google authentication for Flow

//checkpoint

// Handle checking authentication state

// Handle sign out

// Add this function
async function handleShowExploreModal(sendResponse: (response: any) => void) {
    try {
        const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true,
        });
        if (tab.id) {
            chrome.tabs.sendMessage(tab.id, { type: "SHOW_EXPLORE_MODAL" });
            sendResponse({ success: true });
        }
    } catch (error) {
        console.error("❌ Failed to show explore modal:", error);
        sendResponse({ success: false, error: error.message });
    }
}
// ===============================
// UNIFIED MESSAGE HANDLER
// ===============================

// Centralized message listener - handles ALL messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Background received message:", request);

    if (request.type === "AUTH_LOGIN") {
        handleAuthLogin(sendResponse);
        return true; // Keep message channel open for async response
    }

    if (request.type === "OPEN_SETTINGS_PAGE") {
        chrome.tabs.create({
            url: chrome.runtime.getURL("src/settings/settings.html"),
        });
        return;
    }

    if (request.type === "SHOW_EXPLORE_MODAL") {
        handleShowExploreModal(sendResponse);
        return true;
    }

    if (request.type === "SHOW_SEARCH_MODAL") {
        handleShowSearchModal(sendResponse);
        return true;
    }

    if (request.type === "SEARCH_MODAL_QUERY") {
        handleSearchModalQuery(request, sendResponse);
        return true;
    }

    // Cross-tab search messages
    if (request.type === "CROSS_TAB_SEARCH") {
        handleCrossTabSearch(request, sendResponse);
        return true;
    }

    if (request.type === "SWITCH_TO_TAB") {
        handleSwitchToTab(request.tabId, sendResponse);
        return true;
    }

    // Note loading/saving messages

    if (request.type === "SHOW_TIMER") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id!, {
                    type: "SHOW_TIMER",
                });
            }
        });
        sendResponse({ success: true });
        return true;
    }

    // Timer messages
    if (request.action === "createTimer") {
        handleCreateTimer(request, sendResponse);
        return true;
    }
    if (request.action === "cancelTimer") {
        handleCancelTimer(request, sendResponse);
        return true;
    }
    if (request.action === "getActiveTimers") {
        handleGetActiveTimers(sendResponse);
        return true;
    }

    // Website blocker messages
    if (request.action === "proceedToSite" && request.url) {
        handleProceedToSite(request.url)
            .then((success) => {
                console.log("Proceed to site result:", success);
                sendResponse({ success });
            })
            .catch((error) => {
                console.error("Error in proceedToSite:", error);
                sendResponse({ success: false, error: error.message });
            });
        return true;
    }

    // Navbar messages
    if (request.type === "OPEN_NOTEPAD") {
        handleOpenNotepad(request, sendResponse);
        return true;
    }
    if (request.type === "OPEN_REMINDERS") {
        handleOpenReminders(sendResponse);
        return true;
    }
    if (request.type === "OPEN_SEARCH") {
        handleOpenSearch(sendResponse);
        return true;
    }
    if (request.type === "SHOW_SPOTLIGHT_SEARCH") {
        handleShowSpotlightSearch(sendResponse);
        return true;
    }
    if (request.type === "TOGGLE_BOOKMARK") {
        handleToggleBookmark(request, sendResponse);
        return true;
    }
    if (request.type === "OPEN_TIMER") {
        handleOpenTimer(sendResponse);
        return true;
    }
    if (request.type === "SUMMARIZE_PAGE") {
        handleSummarizePage(sendResponse);
        return true;
    }

    // Screenshot capture message
    if (request.type === "CAPTURE_SCREENSHOT") {
        handleCaptureScreenshot(sendResponse);
        return true;
    }

    // Legacy tab search messages (for backward compatibility)
    if (request.type === "GET_ALL_TABS") {
        handleGetAllTabs(sendResponse);
        return true;
    }
    if (request.type === "SEARCH_TABS") {
        // Redirect old search to new cross-tab search
        handleCrossTabSearch({ searchTerm: request.searchTerm }, sendResponse);
        return true;
    }

    // Other messages
    if (request.action === "getSelectedText") {
        sendResponse({ success: true });
        return true;
    }

    if (request.type === "GET_DOMAIN_ANALYTICS") {
        handleGetDomainAnalytics(request, sendResponse);
        return true;
    }

    if (request.type === "SHOW_NOTEPAD") {
        handleOpenNotepad(request, sendResponse);
        return true;
    }

    if (request.type === "GET_DAILY_LIMIT") {
        handleGetDailyLimit(request, sendResponse);
        return true;
    }

    if (request.type === "SET_DAILY_LIMIT") {
        handleSetDailyLimit(request, sendResponse);
        return true;
    }

    if (request.type === "REMOVE_DAILY_LIMIT") {
        handleRemoveDailyLimit(request, sendResponse);
        return true;
    }

    if (request.type === "UPDATE_USAGE") {
        handleUpdateUsage(request, sendResponse);
        return true;
    }

    if (request.type === "SHOW_LIMIT_MODAL") {
        handleShowLimitModal(sendResponse);
        return true;
    }
    // Flow modal messages
    if (request.type === "SHOW_FLOW_MODAL") {
        handleShowFlowModal(sendResponse);
        return true;
    }

    if (request.type === "SHOW_CLIPBOARD_MANAGER") {
        if (sender.tab?.id) {
            chrome.tabs.sendMessage(sender.tab.id, {
                type: "SHOW_CLIPBOARD_MANAGER",
                // No domain - clipboard is global!
            });
            sendResponse({ success: true });
        } else {
            sendResponse({ success: false, error: "No tab available" });
        }
        return true;
    }
    if (request.type === "SHOW_ANALYTICS") {
        console.log(
            "📊 Background: Forwarding SHOW_ANALYTICS to content script",
        );
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0] && tabs[0].id) {
                chrome.tabs.sendMessage(
                    tabs[0].id,
                    { type: "SHOW_ANALYTICS" },
                    (response) => {
                        console.log(
                            "📊 Background: Content script response:",
                            response,
                        );
                        sendResponse(
                            response || {
                                success: false,
                                error: "No response from content script",
                            },
                        );
                    },
                );
            } else {
                sendResponse({ success: false, error: "No active tab found" });
            }
        });
        return true; // Keep the message port open for async response
    }

    // Return false for unhandled messages
    console.log("❓ Unknown message type:", request.type || request.action);
    return false;
});

// ===============================
// TIMER ALARM HANDLERS
// ===============================

// Handle timer completion
chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name.startsWith("timer_")) {
        const domain = alarm.name.replace("timer_", "");
        console.log(`Timer completed for domain: ${domain}`);

        try {
            // Get timer data
            const items = await chrome.storage.local.get(alarm.name);
            const timerData = items[alarm.name];

            if (timerData) {
                // Only show a simple, peaceful centered modal - no other notifications
                const tabs = await chrome.tabs.query({
                    active: true,
                    currentWindow: true,
                });

                if (tabs[0] && tabs[0].id) {
                    try {
                        await chrome.scripting.executeScript({
                            target: { tabId: tabs[0].id },
                            func: showPeacefulTimerComplete,
                            args: [timerData.minutes, domain],
                        });
                        console.log("✅ Peaceful timer completion modal shown");
                    } catch (injectionError) {
                        console.log(
                            "Could not inject completion modal:",
                            injectionError,
                        );
                    }
                }

                // Store completion info for later display
                await chrome.storage.local.set({
                    [`completed_timer_${domain}`]: {
                        completedAt: Date.now(),
                        minutes: timerData.minutes,
                        showAlert: true,
                    },
                });

                // Clean up the timer
                await chrome.storage.local.remove(alarm.name);

                console.log("Timer completion handled successfully");
            } else {
                console.log(
                    "Timer data not found for completed alarm:",
                    alarm.name,
                );
            }
        } catch (error) {
            console.error("Error handling timer completion:", error);
        }
    }

    // Handle periodic cleanup alarm
    if (alarm.name === "cleanupExpiredBlocks") {
        try {
            await websiteBlocker.cleanupExpiredBlocks();
        } catch (error) {
            console.error("Error cleaning up expired blocks:", error);
        }
    }
});

// Handle notification button clicks
chrome.notifications.onButtonClicked.addListener(
    async (notificationId, buttonIndex) => {
        if (notificationId.startsWith("timer_complete_")) {
            if (buttonIndex === 0) {
                // Dismiss button
                await chrome.notifications.clear(notificationId);
            } else if (buttonIndex === 1) {
                // Add Another Timer button
                await chrome.notifications.clear(notificationId);
                try {
                    await chrome.action.openPopup();
                } catch {
                    console.log("Could not open popup automatically");
                }
            }
        }
    },
);

// Handle notification clicks (dismiss)
chrome.notifications.onClicked.addListener(async (notificationId) => {
    await chrome.notifications.clear(notificationId);
});

// Check for completed timers when user visits a page
chrome.webNavigation.onCompleted.addListener(async (details) => {
    if (details.frameId === 0) {
        try {
            const url = new URL(details.url);
            const domain = url.hostname.replace(/^www\./, "");

            // Check if there's a completed timer for this domain
            const items = await chrome.storage.local.get(
                `completed_timer_${domain}`,
            );
            const completedTimer = items[`completed_timer_${domain}`];

            if (completedTimer && completedTimer.showAlert) {
                try {
                    await chrome.scripting.executeScript({
                        target: { tabId: details.tabId },
                        func: showPeacefulTimerComplete,
                        args: [completedTimer.minutes, domain],
                    });

                    // Mark as shown
                    await chrome.storage.local.set({
                        [`completed_timer_${domain}`]: {
                            ...completedTimer,
                            showAlert: false,
                        },
                    });

                    // Clean up after 1 hour
                    setTimeout(async () => {
                        await chrome.storage.local.remove(
                            `completed_timer_${domain}`,
                        );
                    }, 60 * 60 * 1000);
                } catch (injectionError) {
                    console.log(
                        "Could not inject completion overlay:",
                        injectionError,
                    );
                }
            }
        } catch (error) {
            console.log(
                "Error processing page navigation for timer alerts:",
                error,
            );
        }
    }
});

// ===============================
// EXTENSION LIFECYCLE
// ===============================

// Initialize the background tracker
let backgroundTracker = BackgroundTracker.getInstance();

// Handle extension lifecycle events
chrome.runtime.onStartup.addListener(async () => {
    console.log("🟢 Extension startup");

    // Ensure we have a fresh instance on startup
    if (backgroundTracker) {
        backgroundTracker.destroy();
    }
    backgroundTracker = BackgroundTracker.getInstance();

    // Timer cleanup on startup
    try {
        const allAlarms = await chrome.alarms.getAll();
        const timerAlarms = allAlarms.filter((alarm) =>
            alarm.name.startsWith("timer_"),
        );

        const storageItems = await chrome.storage.local.get(null);
        const storedTimers = Object.keys(storageItems).filter((key) =>
            key.startsWith("timer_"),
        );

        console.log(
            `Found ${timerAlarms.length} alarms and ${storedTimers.length} stored timers`,
        );

        // Clean up any orphaned data
        for (const alarm of timerAlarms) {
            if (!storageItems[alarm.name]) {
                await chrome.alarms.clear(alarm.name);
                console.log("Cleared orphaned alarm:", alarm.name);
            }
        }

        for (const timerKey of storedTimers) {
            const timerData = storageItems[timerKey];
            if (timerData.endTime <= Date.now()) {
                await chrome.storage.local.remove(timerKey);
                await chrome.alarms.clear(timerKey);
                console.log("Cleaned up expired timer:", timerKey);
            }
        }
    } catch (error) {
        console.error("Error during startup cleanup:", error);
    }
});

chrome.runtime.onInstalled.addListener(async (details) => {
    console.log("🟢 Extension installed/updated");

    // Ensure we have a fresh instance
    if (backgroundTracker) {
        backgroundTracker.destroy();
    }
    backgroundTracker = BackgroundTracker.getInstance();

    // NEW: Open login page on fresh install
    if (details?.reason === "install") {
        console.log("🔑 Opening login page for new user...");

        // Check if user is already authenticated
        const result = await chrome.storage.local.get(["auth_user"]);

        if (!result.auth_user) {
            // User not authenticated, show login page
            chrome.tabs.create({
                url: chrome.runtime.getURL("src/auth/login.html"),
            });
        } else {
            console.log(
                "✅ User already authenticated:",
                result.auth_user.email,
            );
        }
    }

    // Clean up any existing timers on install
    chrome.storage.local.get(null, (items) => {
        const timerKeys = Object.keys(items).filter((key) =>
            key.startsWith("timer_"),
        );
        if (timerKeys.length > 0) {
            chrome.storage.local.remove(timerKeys);
        }
    });

    try {
        // Clear any existing dynamic rules first
        const existingRules =
            await chrome.declarativeNetRequest.getDynamicRules();
        const ruleIdsToRemove = existingRules.map((rule) => rule.id);

        if (ruleIdsToRemove.length > 0) {
            await chrome.declarativeNetRequest.updateDynamicRules({
                removeRuleIds: ruleIdsToRemove,
            });
        }

        // Add test redirect rule for httpbin.org
        await chrome.declarativeNetRequest.updateDynamicRules({
            addRules: [
                {
                    id: 1,
                    priority: 1,
                    action: {
                        type: "redirect",
                        redirect: {
                            extensionPath: "/waterfall.html",
                        },
                    },
                    condition: {
                        urlFilter: "*://httpbin.org/*",
                        resourceTypes: ["main_frame"],
                    },
                },
            ],
        });

        console.log("✅ Dynamic redirect rule added successfully!");

        // Verify it was added
        const newRules = await chrome.declarativeNetRequest.getDynamicRules();
        console.log("📋 Active dynamic rules:", newRules);
    } catch (error) {
        console.error("❌ Failed to add dynamic rule:", error);
    }

    // Set up periodic cleanup alarm
    chrome.alarms.create("cleanupExpiredBlocks", { periodInMinutes: 5 });
});

// Set up auth state change listener for hover navbar

// ===============================
// ANALYTICS MODAL HANDLER
// ===============================
function handleOpenAnalytics(sendResponse: (response: any) => void) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id!, {
                type: "SHOW_ANALYTICS",
            });
        }
    });
    sendResponse({ success: true });
}

// Handle getting domain analytics data
async function handleGetDomainAnalytics(
    request: { domain: string },
    sendResponse: (response: any) => void,
): Promise<void> {
    try {
        console.log(`📊 Getting analytics for domain: ${request.domain}`);

        const dataService = DataService.getInstance();

        // Get current session data
        const currentSession = await dataService.getCurrentSession();
        const analytics = await dataService.getSessionAnalytics();

        // Calculate domain-specific stats
        const allVisits = currentSession.tabSessions.flatMap(
            (ts) => ts.urlVisits,
        );
        const domainVisits = allVisits.filter(
            (visit) => visit.domain === request.domain,
        );

        // Calculate domain stats
        const domainTimeSpent = domainVisits.reduce(
            (total, visit) => total + visit.activeTime,
            0,
        );
        const domainVisitCount = domainVisits.length;

        // Calculate percentage of total time
        const totalTimeToday = currentSession.stats.totalTime;
        const domainPercentage =
            totalTimeToday > 0
                ? Math.round((domainTimeSpent / totalTimeToday) * 100)
                : 0;

        // Determine category
        const domainCategory =
            domainVisits.length > 0 ? domainVisits[0].category : "other";

        // Calculate total screen time (sum of all categories)
        const totalScreenTime = currentSession.stats.totalTime;

        // Calculate LyncX usage count (approximate based on tab sessions and visits)
        const totalLyncxUse =
            currentSession.tabSessions.length +
            Math.floor(allVisits.length / 3);

        const domainStats = {
            timeSpent: domainTimeSpent,
            percentage: domainPercentage,
            category: domainCategory,
            visits: domainVisitCount,
        };

        console.log(
            `✅ Analytics calculated for ${request.domain}:`,
            domainStats,
        );

        sendResponse({
            success: true,
            domainStats,
            totalScreenTime,
            totalLyncxUse,
        });
    } catch (error) {
        console.error("❌ Error getting domain analytics:", error);
        sendResponse({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
}

// ===============================
// Notepad
// ===============================

// Clean up when the extension is about to be terminated
chrome.runtime.onSuspend.addListener(() => {
    console.log("🔴 Extension suspending");
    if (backgroundTracker) {
        backgroundTracker.destroy();
    }
});

export default backgroundTracker;
