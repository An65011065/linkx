import DataService from "./dataService";

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
    private syncInterval?: NodeJS.Timeout;
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
    private categorizeUrl(
        url: string,
        domain: string,
    ): "work" | "social" | "other" {
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
            category: this.categorizeUrl(url, domain),
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
        const { tabId, windowId } = activeInfo;
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

    // Handle when a tab's URL changes or loads
    private async handleTabUpdated(
        tabId: number,
        changeInfo: chrome.tabs.TabChangeInfo,
        tab: chrome.tabs.Tab,
    ): Promise<void> {
        if (!tab.url) return;

        const state = this.tabStates.get(tabId) || { isActive: false };

        if (changeInfo.status === "complete" && changeInfo.url) {
            let previousVisitInfo: { id: string; url: string } | undefined;

            // End previous visit if exists
            if (state.currentVisit) {
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
                // This tab was created from a link click (hyperlink navigation)
                sourceInfo = {
                    nodeId: linkInfo.sourceVisitId || "",
                    url: linkInfo.sourceUrl,
                    tabId: linkInfo.sourceTabId,
                };
                creationMode = "hyperlink";
                this.linkCreatedTabs.delete(tabId);
            } else if (previousVisitInfo) {
                // This is navigation within the same tab (chain navigation)
                sourceInfo = {
                    nodeId: previousVisitInfo.id,
                    url: previousVisitInfo.url,
                    tabId,
                };
            }

            // Create and save new visit
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
            await this.dataService.addUrlVisit(state.currentVisit);
        } else if (changeInfo.title && state.currentVisit) {
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
        details: chrome.webNavigation.WebNavigationFrameCallbackDetails,
    ): Promise<void> {
        // Only handle main frame navigation
        if (details.frameId !== 0) return;

        const { tabId, url } = details;
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
    }

    // Clean up resources when tracker is destroyed
    public destroy(): void {
        this.isDestroyed = true;
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = undefined;
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

        // Clear state
        this.tabStates.clear();
        this.linkCreatedTabs.clear();
        this.focusedWindowId = undefined;
        this.focusedTabId = undefined;
    }
}

// Initialize the background tracker
let backgroundTracker = BackgroundTracker.getInstance();

// Handle extension lifecycle events
chrome.runtime.onStartup.addListener(() => {
    console.log("🟢 Extension startup");
    // Ensure we have a fresh instance on startup
    if (backgroundTracker) {
        backgroundTracker.destroy();
    }
    backgroundTracker = BackgroundTracker.getInstance();
});

chrome.runtime.onInstalled.addListener(() => {
    console.log("🟢 Extension installed");
    // Ensure we have a fresh instance on install
    if (backgroundTracker) {
        backgroundTracker.destroy();
    }
    backgroundTracker = BackgroundTracker.getInstance();
});

// Clean up when the extension is about to be terminated
chrome.runtime.onSuspend.addListener(() => {
    console.log("🔴 Extension suspending");
    if (backgroundTracker) {
        backgroundTracker.destroy();
    }
});

export default backgroundTracker;
