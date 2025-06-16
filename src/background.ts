import DataService from "./shared/services/dataService";
import type { ActiveTabInfo, UrlVisit } from "./shared/types/common.types";

console.log("🟢 Background script loaded!", new Date().toISOString());

class BackgroundTracker {
    private dataService: DataService;
    private currentActiveTab: ActiveTabInfo | null = null;
    private currentUrlVisits: Map<number, UrlVisit> = new Map();
    private isUserIdle: boolean = false;

    constructor() {
        this.dataService = DataService.getInstance();
        this.setupListeners();
        console.log("🚀 BackgroundTracker initialized");
    }

    private setupListeners() {
        console.log("🔧 Setting up Chrome API listeners...");

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
        chrome.tabs.onActivated.addListener((activeInfo) => {
            this.handleTabActivated(activeInfo);
        });

        chrome.windows.onFocusChanged.addListener((windowId) => {
            this.handleWindowFocusChanged(windowId);
        });

        // Idle state tracking
        chrome.idle.onStateChanged.addListener((state) => {
            this.handleIdleStateChanged(state);
        });

        // Navigation tracking
        chrome.webNavigation.onBeforeNavigate.addListener((details) => {
            this.handleBeforeNavigate(details);
        });

        chrome.webNavigation.onCompleted.addListener((details) => {
            this.handleNavigationCompleted(details);
        });

        // Set idle detection interval (30 seconds)
        chrome.idle.setDetectionInterval(30);

        console.log("✅ All Chrome API listeners set up successfully");

        // Log current state
        this.logCurrentState();
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

    private async handleTabActivated(activeInfo: chrome.tabs.TabActiveInfo) {
        console.log("Tab activated:", activeInfo.tabId, activeInfo.windowId);

        // End previous active time
        await this.endCurrentActiveTime();

        // Start tracking new active tab (only if not idle)
        if (!this.isUserIdle) {
            this.currentActiveTab = {
                tabId: activeInfo.tabId,
                startTime: Date.now(),
                windowId: activeInfo.windowId,
            };

            // Mark current URL visit as active
            const currentVisit = this.currentUrlVisits.get(activeInfo.tabId);
            if (currentVisit) {
                currentVisit.isActive = true;
                await this.dataService.addUrlVisit(currentVisit);
            }
        }
    }

    private async handleWindowFocusChanged(windowId: number) {
        console.log("Window focus changed:", windowId);

        if (windowId === chrome.windows.WINDOW_ID_NONE) {
            // Browser lost focus
            await this.endCurrentActiveTime();
        } else {
            // Browser gained focus - get active tab in focused window
            try {
                const tabs = await chrome.tabs.query({
                    active: true,
                    windowId,
                });
                if (tabs[0]) {
                    await this.handleTabActivated({
                        tabId: tabs[0].id!,
                        windowId: windowId,
                    });
                }
            } catch (error) {
                console.error("Error getting active tab:", error);
            }
        }
    }

    private async handleIdleStateChanged(state: chrome.idle.IdleState) {
        console.log("Idle state changed:", state);

        this.isUserIdle = state !== "active";

        if (this.isUserIdle) {
            await this.endCurrentActiveTime();
        } else {
            // User became active - resume tracking current tab
            try {
                const tabs = await chrome.tabs.query({
                    active: true,
                    currentWindow: true,
                });
                if (tabs[0] && tabs[0].id) {
                    await this.handleTabActivated({
                        tabId: tabs[0].id,
                        windowId: tabs[0].windowId!,
                    });
                }
            } catch (error) {
                console.error("Error resuming active tracking:", error);
            }
        }
    }

    private async handleBeforeNavigate(
        details: chrome.webNavigation.WebNavigationParentedCallbackDetails,
    ) {
        if (details.frameId !== 0) return; // Only track main frame navigations

        console.log("Before navigate:", details.tabId, details.url);
        // Navigation source will be determined in handleNavigationCompleted
    }

    private async handleNavigationCompleted(
        details: chrome.webNavigation.WebNavigationFramedCallbackDetails,
    ) {
        if (details.frameId !== 0) return; // Only track main frame navigations

        console.log("Navigation completed:", details.tabId, details.url);

        // Update navigation source for current URL visit (set to default since transitionType is not available)
        const currentVisit = this.currentUrlVisits.get(details.tabId);
        if (currentVisit && currentVisit.url === details.url) {
            // Keep default navigation source type since transition info not readily available
            await this.dataService.addUrlVisit(currentVisit);
        }
    }

    private getNavigationType(
        transitionType: string,
    ): UrlVisit["navigationSource"]["type"] {
        switch (transitionType) {
            case "typed":
                return "typed";
            case "auto_bookmark":
                return "auto_bookmark";
            case "reload":
                return "reload";
            case "generated":
                return "generated";
            case "link":
                return "link";
            default:
                return "link";
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

export {};
