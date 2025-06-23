// URL visit with source tracking
export interface SourceInfo {
    url: string;
    nodeId: string;
    tabId: number;
}

export interface UrlVisit {
    id: string;
    url: string;
    domain: string;
    title?: string;
    startTime: number;
    endTime?: number;
    duration: number;
    isActive: boolean;
    activeTime: number;
    lastActiveTime?: number;
    tabId: number;
    windowId: number;
    creationMode: "chain" | "hyperlink";
    sourceInfo?: SourceInfo;
    category: "work" | "social" | "other";
}

// Tab session containing URL visits
export interface TabSession {
    tabId: number;
    windowId: number;
    openedAt: number;
    closedAt?: number;
    totalActiveTime: number;
    urlVisits: UrlVisit[];
    displayNumber?: number;
}

// Daily browsing session
export interface BrowsingSession {
    date: string;
    startTime: number;
    endTime: number;
    totalActiveTime: number;
    tabSessions: TabSession[];
    stats: {
        totalUrls: number;
        uniqueDomains: number;
        workTime: number;
        socialTime: number;
        otherTime: number;
        totalTime: number;
    };
}
