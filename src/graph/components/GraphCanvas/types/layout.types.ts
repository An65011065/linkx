import type { NetworkNode } from "../../../types/network.types";

// Core position interface
export interface Position {
    x: number;
    y: number;
}

// Extended node with simulation properties
export interface SimulationNode extends NetworkNode {
    x?: number;
    y?: number;
    vx?: number;
    vy?: number;
    fx?: number | null;
    fy?: number | null;
}

// Extended link with simulation properties
export interface SimulationLink {
    source: SimulationNode;
    target: SimulationNode;
    weight: number;
    frequency: number;
    transitions: Array<{
        timestamp: number;
        sourceType: string;
    }>;
}

// Timeline configuration for coordinated positioning
export interface TimelineConfig {
    minTime: number;
    maxTime: number;
    timeRange: number;
    timeToX: (timestamp: number) => number;
    timeToY: (timestamp: number) => number;
    xToTime?: (x: number) => number;
    yToTime?: (y: number) => number;
}

// Session grouping data
export interface SessionData {
    id: string;
    nodes: NetworkNode[];
    startTime: number;
    endTime: number;
    duration: number;
    nodeCount: number;
    position?: Position;
}

// Layout bounds and margins
export interface LayoutBounds {
    width: number;
    height: number;
    margins: {
        top: number;
        right: number;
        bottom: number;
        left: number;
    };
    availableWidth: number;
    availableHeight: number;
}

// Layout configuration options
export interface LayoutConfig {
    orientation: "vertical" | "horizontal";
    maxNodesPerRow: number;
    sessionSpacing: number;
    nodeSpacing: number;
    sessionGapThreshold: number; // milliseconds
    margins: {
        top: number;
        right: number;
        bottom: number;
        left: number;
    };
}

// Complete layout result returned by useTimelineLayout
export interface LayoutResult {
    nodePositions: Map<string, Position>;
    timelineConfig: TimelineConfig;
    sessions: SessionData[];
    bounds: LayoutBounds;
    simulationNodes: SimulationNode[];
    simulationLinks: SimulationLink[];
    config: LayoutConfig;
}

// Timeline axis configuration
export interface TimelineAxisConfig {
    orientation: "vertical" | "horizontal";
    tickCount: number;
    tickInterval: number; // milliseconds
    startTime: number;
    endTime: number;
    axisPosition: Position;
    axisLength: number;
    labelFormat: "time" | "relative" | "full";
}

// Viewport and zoom state
export interface ViewportState {
    scale: number;
    translateX: number;
    translateY: number;
    bounds: LayoutBounds;
}

// Layout animation state
export interface LayoutTransition {
    duration: number;
    easing: string;
    delay: number;
    enabled: boolean;
}

// Node positioning strategies
export type PositioningStrategy =
    | "timeline-chronological"
    | "timeline-sessions"
    | "force-directed"
    | "grid"
    | "circular";

// Layout update triggers
export interface LayoutUpdateTriggers {
    dimensionsChanged: boolean;
    orientationChanged: boolean;
    dataChanged: boolean;
    configChanged: boolean;
    filterChanged: boolean;
}
