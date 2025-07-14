import DataService from "./dataService";
import { websiteBlocker } from "./websiteBlocker";
import AuthService from "../services/authService";

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

    private constructor() {
        this.dataService = DataService.getInstance();
        this.tabStates = new Map();
        this.linkCreatedTabs = new Map();
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
        try {
            return new URL(url).hostname.replace(/^www\./, "");
        } catch {
            return url.split("/")[2] || url;
        }
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
            "youtube.com",
            "youtu.be",
            "netflix.com",
            "hulu.com",
            "primevideo.com",
            "disneyplus.com",
            "hbo.com",
            "facebook.com",
            "instagram.com",
            "twitter.com",
            "x.com",
            "tiktok.com",
            "reddit.com",
            "twitch.tv",
            "spotify.com",
            "pinterest.com",
            "snapchat.com",
            "threads.net",
            "be.real",
            "clubhouse.com",
            "quora.com",
            "tumblr.com",
            "soundcloud.com",
            "kick.com",
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
                // This tab was created from a link click (hyperlink navigation)
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
                // This is navigation within the same tab (chain navigation)
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
            console.log("✅ Visit saved successfully");
        } else if (changeInfo.title && state.currentVisit) {
            console.log(
                "📄 Title updated for existing visit:",
                changeInfo.title,
            );
            // Update title for existing visit
            state.currentVisit.title = changeInfo.title;
            await this.dataService.addUrlVisit(state.currentVisit);
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
        for (const [_, state] of this.tabStates) {
            if (state.currentVisit) {
                this.updateActiveTime(state.currentVisit);
                await this.dataService.addUrlVisit(state.currentVisit);
            }
        }
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
            if (
                info.menuItemId === "addToLyncX" &&
                info.selectionText &&
                tab?.id &&
                tab?.url
            ) {
                try {
                    const domain = this.extractDomain(tab.url);
                    const timestamp = new Date().toLocaleString();
                    const selectedContent = `--- ${timestamp} ---\nFrom: ${tab.url}\n\n${info.selectionText}`;

                    console.log(
                        `📝 Saving selected text directly to backend for ${domain}`,
                    );

                    // Get AuthService instance
                    const authService = AuthService.getInstance();

                    // First, try to load existing note
                    let existingContent = "";
                    try {
                        const response = await authService.makeApiCall(
                            "GET",
                            `/notes/${encodeURIComponent(domain)}`,
                        );
                        if (response.ok) {
                            const noteData = await response.json();
                            existingContent = noteData.content || "";
                        }
                    } catch (err) {
                        console.log("No existing note found, creating new one");
                    }

                    // Append new content to existing note
                    const separator = existingContent.trim() ? "\n\n" : "";
                    const updatedContent =
                        existingContent + separator + selectedContent;

                    // Save to backend
                    const saveResponse = await authService.makeApiCall(
                        "POST",
                        "/notes",
                        {
                            domain,
                            content: updatedContent,
                        },
                    );

                    if (saveResponse.ok) {
                        console.log(
                            `✅ Selected text saved to backend for ${domain}`,
                        );

                        // Show success notification on the page
                        chrome.tabs
                            .sendMessage(tab.id, {
                                action: "showNotification",
                                message: "Added to Notes!",
                                type: "success",
                            })
                            .catch(() => {
                                // Fallback: Chrome notification if content script unavailable
                                chrome.notifications.create({
                                    type: "basic",
                                    iconUrl: "/src/assets/icons/icon128.png",
                                    title: "LyncX",
                                    message: `Added selected text to ${domain} notes`,
                                    priority: 1,
                                });
                            });
                    } else {
                        throw new Error("Failed to save to backend");
                    }
                } catch (error) {
                    console.error("❌ Error saving selected text:", error);

                    // Show error notification
                    chrome.tabs
                        .sendMessage(tab.id, {
                            action: "showNotification",
                            message: "Failed to save note",
                            type: "error",
                        })
                        .catch(() => {
                            chrome.notifications.create({
                                type: "basic",
                                iconUrl: "/src/assets/icons/icon128.png",
                                title: "LyncX Error",
                                message: "Failed to save selected text",
                                priority: 1,
                            });
                        });
                }
            }

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
// UNIFIED MESSAGE HANDLER
// ===============================

// Centralized message listener - handles ALL messages
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    console.log("Background received message:", request);

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

    // Other messages
    if (request.action === "getSelectedText") {
        sendResponse({ success: true });
        return true;
    }

    // Return false for unhandled messages
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
                } catch (error) {
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
                        func: showTimerCompleteOverlay,
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

chrome.runtime.onInstalled.addListener(async () => {
    console.log("🟢 Extension installed/updated");

    // Ensure we have a fresh instance
    if (backgroundTracker) {
        backgroundTracker.destroy();
    }
    backgroundTracker = BackgroundTracker.getInstance();

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

// Clean up when the extension is about to be terminated
chrome.runtime.onSuspend.addListener(() => {
    console.log("🔴 Extension suspending");
    if (backgroundTracker) {
        backgroundTracker.destroy();
    }
});

export default backgroundTracker;
