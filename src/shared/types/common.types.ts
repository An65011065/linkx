// URL visit with source tracking
export interface UrlVisit {
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
    creationMode: "chain" | "hyperlink";
    sourceInfo?: {
        nodeId: string;
        url: string;
        tabId: number;
    };
    category: "work" | "social" | "other";
    categoryConfidence?: number; // 0-1 how sure we are
}

// Tab session containing URL visits
export interface TabSession {
    tabId: number;
    windowId: number;
    openedAt: number; // timestamp
    closedAt?: number; // timestamp (null if still open)
    totalActiveTime: number; // sum of all active durations
    urlVisits: UrlVisit[];

    // For your timeline display
    displayNumber?: number; // "Tab 1", "Tab 2" etc (assigned at display time)
}

// Daily browsing session
export interface BrowsingSession {
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
export interface ActiveTabInfo {
    tabId: number;
    startTime: number;
    windowId: number;
}

export interface RoughVizLineOptions {
    element: string;
    data: string;
    y1: string;
    y2: string;
    width: number;
    height: number;
    margin: { top: number; right: number; bottom: number; left: number };
    roughness: number;
    strokeWidth: number;
    circleRadius: number;
    circleRoughness: number;
    colors: string[];
    interactive: boolean;
    legend: boolean;
    xLabel: string;
    yLabel: string;
    font: string;
    axisFontSize: string;
    labelFontSize: string;
    tooltipFontSize: string;
}

export interface RoughVizRectangleOptions {
    element: string;
    data: string;
    labels: string;
    values: string;
    width: number;
    height: number;
    roughness: number;
    strokeWidth: number;
    fillWeight: number;
    fillStyle: string;
    stroke: string;
    interactive: boolean;
    title?: string;
    margin?: { top: number; right: number; bottom: number; left: number };
    axisFontSize?: string;
    labelFontSize?: string;
}

export interface RoughViz {
    Line?: new (options: RoughVizLineOptions) => void;
    Rectangle?: new (options: RoughVizRectangleOptions) => void;
}

declare global {
    interface Window {
        roughViz?: RoughViz;
        Line?: new (options: RoughVizLineOptions) => void;
        Rectangle?: new (options: RoughVizRectangleOptions) => void;
        StandaloneRectangle?: new (options: RoughVizRectangleOptions) => void;
    }
}
