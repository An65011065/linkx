// network.types.ts - Network-related type definitions

import * as d3 from "d3";
import type { YouTubeMetadata } from "../utils/youtubeMetadata";

export interface NetworkNode {
    id: string;
    url: string;
    domain: string;
    title: string;
    totalTime: number;
    activeTime: number;
    lastVisited: number;
    category?: string;
    categoryConfidence?: number;
    tabId?: number;
    originalUrls: Set<string>;
    youtubeMetadata: YouTubeMetadata | null;
    displayName?: string;
    tooltipTitle?: string;
    timestamp?: number; // When the node was created
}

export interface NetworkLink {
    source: string;
    target: string;
    weight: number;
    tabId?: number;
    frequency?: number;
    timestamp?: number; // When the link was created
    transitions: {
        timestamp: number;
        sourceType: "chain" | "hyperlink";
    }[];
}

export interface NetworkData {
    nodes: NetworkNode[];
    links: NetworkLink[];
}

export interface NetworkLinkWithIds extends NetworkLink {
    source: string;
    target: string;
    weight: number;
    tabId: number;
    frequency: number;
    transitions: {
        timestamp: number;
        sourceType: "chain" | "hyperlink";
    }[];
}

export interface SimNetworkNode extends NetworkNode {
    x?: number;
    y?: number;
    vx?: number;
    vy?: number;
    fx: number | null;
    fy: number | null;
}

export interface SimNetworkLink extends NetworkLink {
    source: SimNetworkNode;
    target: SimNetworkNode;
}
