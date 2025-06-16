interface UrlVisit {
    id: string; // unique identifier
    url: string;
    domain: string; // extracted for easy filtering
    title?: string; // page title when available
    startTime: number; // timestamp (ms since epoch)
    endTime?: number; // timestamp (null if still active)
    duration: number; // calculated in milliseconds
    tabId: number;
    windowId: number;
    isActive: boolean; // was this tab actually focused

    // Navigation context
    navigationSource: {
        type:
            | "typed"
            | "link"
            | "reload"
            | "back_forward"
            | "auto_bookmark"
            | "generated";
        sourceUrl?: string; // if came from a link
        sourceTabId?: number;
    };

    // Calculated fields
    category: "work" | "social" | "other";
    categoryConfidence?: number; // 0-1 how sure we are
}

interface TabSession {
    tabId: number;
    windowId: number;
    openedAt: number; // timestamp
    closedAt?: number; // timestamp (null if still open)
    totalActiveTime: number; // sum of all active durations
    urlVisits: UrlVisit[];

    // For your timeline display
    displayNumber?: number; // "Tab 1", "Tab 2" etc (assigned at display time)
}

interface BrowsingSession {
    date: string; // 'YYYY-MM-DD'
    startTime: number;
    endTime: number;
    totalActiveTime: number;
    tabSessions: TabSession[];

    // Aggregated stats
    stats: {
        totalUrls: number;
        uniqueDomains: number;
        workTime: number;
        socialTime: number;
        otherTime: number;
    };
}

// For real-time tracking state
interface ActiveTabInfo {
    tabId: number;
    startTime: number;
    windowId: number;
}

export type { UrlVisit, TabSession, BrowsingSession, ActiveTabInfo };
