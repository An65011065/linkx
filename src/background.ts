import DataService from "./shared/services/dataService";
import type { UrlVisit } from "./shared/types/browsing.types";

console.log("🟢 Background script loaded!", new Date().toISOString());

interface ActiveTabInfo {
    tabId: number;
    windowId: number;
    startTime: number;
}

class BackgroundTracker {
    private dataService: DataService;
    private currentActiveTab: ActiveTabInfo | null = null;
    private currentUrlVisits: Map<number, UrlVisit>;
    private sourceUrlMap: Map<
        number,
        { url: string; nodeId: string; tabId: number }
    >;
    private isUserIdle: boolean = false;

    constructor() {
        this.dataService = DataService.getInstance();
        this.currentUrlVisits = new Map();
        this.sourceUrlMap = new Map();
        this.setupListeners();
        console.log("🚀 BackgroundTracker initialized");
    }

    private setupListeners() {
        console.log("🔧 Setting up Chrome API listeners...");

        // Track when links are opened in new tabs (hyperlink navigation)
        chrome.webNavigation.onCreatedNavigationTarget.addListener(
            async (details) => {
                const sourceTabs = await chrome.tabs.query({
                    active: true,
                    currentWindow: true,
                });
                const sourceTab = sourceTabs[0];
                if (sourceTab?.url && sourceTab?.id) {
                    const sourceVisit = this.currentUrlVisits.get(sourceTab.id);
                    if (sourceVisit) {
                        this.sourceUrlMap.set(details.tabId, {
                            url: sourceTab.url,
                            nodeId: sourceVisit.id,
                            tabId: sourceTab.id,
                        });
                    }
                }
            },
        );

        // Handle URL updates
        chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
            if (!changeInfo.url || !tab.windowId) return;

            // Check if this is a hyperlink navigation
            const sourceInfo = this.sourceUrlMap.get(tabId);
            const creationMode = sourceInfo ? "hyperlink" : "chain";

            // Get previous visit in the same tab for chain navigation
            const previousVisit = this.currentUrlVisits.get(tabId);
            const chainSourceInfo = previousVisit
                ? {
                      nodeId: previousVisit.id,
                      url: previousVisit.url,
                      tabId: previousVisit.tabId,
                  }
                : undefined;

            // Create new URL visit
            const newVisit = this.dataService.createUrlVisit(
                changeInfo.url,
                tabId,
                tab.windowId,
                creationMode,
                sourceInfo || chainSourceInfo,
                changeInfo.title || tab.title,
            );

            // End previous visit in this tab if it exists
            if (previousVisit) {
                previousVisit.endTime = Date.now();
                previousVisit.duration =
                    previousVisit.endTime - previousVisit.startTime;
                await this.dataService.addUrlVisit(previousVisit);
            }

            this.currentUrlVisits.set(tabId, newVisit);
            await this.dataService.addUrlVisit(newVisit);

            // Clear source info after using it
            if (sourceInfo) {
                this.sourceUrlMap.delete(tabId);
            }
        });

        // Message passing for dashboard communication
        chrome.runtime.onMessage.addListener(
            (request, sender, sendResponse) => {
                // Handle async message processing
                this.handleMessage(request, sender, sendResponse);
                return true; // Keep the message channel open for async responses
            },
        );

        // Tab lifecycle tracking
        chrome.tabs.onCreated.addListener((tab) => {
            this.handleTabCreated(tab);
        });

        chrome.tabs.onRemoved.addListener((tabId) => {
            this.handleTabRemoved(tabId);
        });

        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            this.handleTabUpdated(tabId, changeInfo, tab);
        });

        // Active time tracking
        chrome.tabs.onActivated.addListener(async (activeInfo) => {
            const now = Date.now();

            // Update previous active tab
            if (this.currentActiveTab) {
                const previousVisit = this.currentUrlVisits.get(
                    this.currentActiveTab.tabId,
                );
                if (previousVisit) {
                    previousVisit.isActive = false;
                    await this.dataService.addUrlVisit(previousVisit);
                }
            }

            // Update new active tab
            const currentVisit = this.currentUrlVisits.get(activeInfo.tabId);
            if (currentVisit) {
                currentVisit.isActive = true;
                await this.dataService.addUrlVisit(currentVisit);
            }

            this.currentActiveTab = {
                tabId: activeInfo.tabId,
                windowId: activeInfo.windowId,
                startTime: now,
            };
        });

        chrome.windows.onFocusChanged.addListener(async (windowId) => {
            if (windowId === chrome.windows.WINDOW_ID_NONE) {
                if (this.currentActiveTab) {
                    const visit = this.currentUrlVisits.get(
                        this.currentActiveTab.tabId,
                    );
                    if (visit) {
                        visit.isActive = false;
                        await this.dataService.addUrlVisit(visit);
                    }
                }
                this.currentActiveTab = null;
            }
        });

        // Idle state tracking
        chrome.idle.onStateChanged.addListener(async (state) => {
            this.isUserIdle = state !== "active";
            if (this.isUserIdle && this.currentActiveTab) {
                const visit = this.currentUrlVisits.get(
                    this.currentActiveTab.tabId,
                );
                if (visit) {
                    visit.isActive = false;
                    await this.dataService.addUrlVisit(visit);
                }
            }
        });

        // Navigation tracking
        chrome.webNavigation.onBeforeNavigate.addListener(
            this.handleBeforeNavigate.bind(this),
        );

        console.log("✅ All Chrome API listeners set up successfully");

        // Log current state
        this.logCurrentState();
    }

    private handleMessage(
        request: { type: string; [key: string]: unknown },
        sender: chrome.runtime.MessageSender,
        sendResponse: (response: {
            success: boolean;
            data?: unknown;
            error?: string;
        }) => void,
    ) {
        console.log(
            "📨 Received message:",
            request.type,
            "from:",
            sender.tab?.url,
        );

        // Handle async operations properly
        (async () => {
            try {
                switch (request.type) {
                    default:
                        console.log("❓ Unknown message type:", request.type);
                        sendResponse({
                            success: false,
                            error: "Unknown message type",
                        });
                        break;
                }
            } catch (error) {
                console.error("❌ Error handling message:", error);
                const errorMessage =
                    error instanceof Error ? error.message : "Unknown error";
                sendResponse({ success: false, error: errorMessage });
            }
        })();
    }

    private async logCurrentState() {
        try {
            const tabs = await chrome.tabs.query({});
            const activeTabs = await chrome.tabs.query({ active: true });
            console.log(
                `📊 Current state: ${tabs.length} total tabs, ${activeTabs.length} active tabs`,
            );
            console.log(
                "🗂️ Active tabs:",
                activeTabs.map((t) => ({
                    id: t.id,
                    url: t.url,
                    title: t.title,
                })),
            );
        } catch (error) {
            console.error("❌ Error logging current state:", error);
        }
    }

    private async handleTabCreated(tab: chrome.tabs.Tab) {
        if (!tab.id || !tab.windowId) return;

        console.log("🆕 Tab created:", {
            id: tab.id,
            url: tab.url,
            windowId: tab.windowId,
        });

        // Tab session will be created when first URL visit is recorded
    }

    private async handleTabRemoved(tabId: number) {
        console.log("🗑️ Tab removed:", tabId);

        // End current active time if this was the active tab
        if (this.currentActiveTab?.tabId === tabId) {
            console.log("⏹️ Ending active time for removed tab");
            await this.endCurrentActiveTime();
            this.currentActiveTab = null;
        }

        // End any pending URL visit for this tab
        const urlVisit = this.currentUrlVisits.get(tabId);
        if (urlVisit && !urlVisit.endTime) {
            console.log(
                "💾 Saving final URL visit for removed tab:",
                urlVisit.url,
            );
            urlVisit.endTime = Date.now();
            urlVisit.duration = urlVisit.endTime - urlVisit.startTime;
            await this.dataService.addUrlVisit(urlVisit);
        }
        this.currentUrlVisits.delete(tabId);

        // Close the tab session
        await this.dataService.closeTab(tabId);
    }

    private async handleTabUpdated(
        tabId: number,
        changeInfo: chrome.tabs.TabChangeInfo,
        tab: chrome.tabs.Tab,
    ) {
        // Only process URL changes
        if (!changeInfo.url && !changeInfo.title) return;

        console.log("🔄 Tab updated:", {
            tabId,
            url: changeInfo.url,
            title: changeInfo.title,
            status: changeInfo.status,
        });

        if (changeInfo.url && tab.windowId) {
            // End previous URL visit for this tab
            const previousVisit = this.currentUrlVisits.get(tabId);
            if (previousVisit && !previousVisit.endTime) {
                console.log("⏹️ Ending previous URL visit:", previousVisit.url);
                previousVisit.endTime = Date.now();
                previousVisit.duration =
                    previousVisit.endTime - previousVisit.startTime;
                await this.dataService.addUrlVisit(previousVisit);
            }

            // Create new URL visit
            const navigationSource = {
                type: "link" as const, // Default, will be updated by webNavigation
                sourceUrl: previousVisit?.url,
            };

            const newVisit = this.dataService.createUrlVisit(
                changeInfo.url,
                tabId,
                tab.windowId,
                navigationSource,
                changeInfo.title || tab.title,
            );

            console.log("📝 Created new URL visit:", {
                id: newVisit.id,
                url: newVisit.url,
                domain: newVisit.domain,
                category: newVisit.category,
            });

            this.currentUrlVisits.set(tabId, newVisit);
            await this.dataService.addUrlVisit(newVisit);
        }

        // Update title if available
        if (changeInfo.title) {
            const currentVisit = this.currentUrlVisits.get(tabId);
            if (currentVisit) {
                console.log("📄 Updating title for visit:", changeInfo.title);
                currentVisit.title = changeInfo.title;
                await this.dataService.addUrlVisit(currentVisit);
            }
        }
    }

    private async handleBeforeNavigate(
        details: chrome.webNavigation.WebNavigationParentedCallbackDetails,
    ) {
        if (details.frameId !== 0) return; // Only track main frame navigations

        const previousVisit = this.currentUrlVisits.get(details.tabId);
        if (previousVisit) {
            previousVisit.endTime = Date.now();
            previousVisit.duration =
                previousVisit.endTime - previousVisit.startTime;
            await this.dataService.addUrlVisit(previousVisit);
        }
    }

    private async endCurrentActiveTime() {
        if (!this.currentActiveTab) return;

        const activeTime = Date.now() - this.currentActiveTab.startTime;
        console.log(
            "Ending active time for tab:",
            this.currentActiveTab.tabId,
            "Duration:",
            activeTime,
        );

        // Update the current URL visit's active time
        const currentVisit = this.currentUrlVisits.get(
            this.currentActiveTab.tabId,
        );
        if (currentVisit && !currentVisit.endTime) {
            currentVisit.duration += activeTime;
            currentVisit.isActive = true;
            await this.dataService.addUrlVisit(currentVisit);
        }

        // Update tab session active time
        await this.dataService.updateTabActiveTime(
            this.currentActiveTab.tabId,
            activeTime,
        );

        this.currentActiveTab = null;
    }
}

// Initialize the background tracker
new BackgroundTracker();

// Keep service worker alive
chrome.runtime.onStartup.addListener(() => {
    console.log("Extension startup");
});

chrome.runtime.onInstalled.addListener(() => {
    console.log("Extension installed");
});

// Debug: Log storage contents
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("📨 Received message:", message.type, "from:", sender.url);

    if (message.type === "DEBUG_GET_STORAGE") {
        chrome.storage.local.get(null).then((result) => {
            console.log("Current storage contents:", result);
            const todaySession = Object.entries(result).find(([key]) =>
                key.startsWith("session_"),
            );
            if (todaySession) {
                const [key, session] = todaySession;
                console.log("Active session found:", {
                    key,
                    tabCount: session.tabSessions?.length || 0,
                    startTime: new Date(session.startTime).toLocaleString(),
                    endTime: new Date(session.endTime).toLocaleString(),
                    totalUrls:
                        session.tabSessions?.reduce(
                            (
                                sum: number,
                                tab: {
                                    urlVisits: Array<{ isActive: boolean }>;
                                },
                            ) =>
                                sum +
                                tab.urlVisits.filter((v) => v.isActive).length,
                            0,
                        ) || 0,
                });
            } else {
                console.log("No active session found");
            }
            sendResponse(result);
        });
        return true; // Will respond asynchronously
    }
});

export {};
