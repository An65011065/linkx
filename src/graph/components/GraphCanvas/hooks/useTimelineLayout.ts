import { useMemo } from "react";
import type { NetworkNode, NetworkLink } from "../../../types/network.types";
import type { LayoutResult, LayoutConfig } from "../types/layout.types";
import {
    calculateTimelineLayout,
    updateNodePosition,
} from "../utils/layoutCalculations";
import { DEFAULT_LAYOUT_CONFIG } from "../utils/constants";

interface UseTimelineLayoutProps {
    nodes: NetworkNode[];
    links: NetworkLink[];
    dimensions: { width: number; height: number };
    orientation?: "vertical" | "horizontal";
    maxNodesPerRow?: number;
    sessionGapThreshold?: number;
    margins?: {
        top: number;
        right: number;
        bottom: number;
        left: number;
    };
}

interface UseTimelineLayoutReturn {
    layoutResult: LayoutResult;
    updateNodePosition: (nodeId: string, x: number, y: number) => LayoutResult;
    getNodePosition: (nodeId: string) => { x: number; y: number } | null;
    isLayoutReady: boolean;
    stats: {
        totalNodes: number;
        totalLinks: number;
        sessionCount: number;
        timeSpan: number;
        hasTimestamps: boolean;
    };
}

/**
 * Core shared layout hook that coordinates positioning between all components
 * This ensures perfect alignment between NetworkRenderer and TimelineAxis
 */
export const useTimelineLayout = ({
    nodes,
    links,
    dimensions,
    orientation = "vertical",
    maxNodesPerRow = 6,
    sessionGapThreshold,
    margins,
}: UseTimelineLayoutProps): UseTimelineLayoutReturn => {
    // Create layout configuration
    const layoutConfig: LayoutConfig = useMemo(
        () => ({
            ...DEFAULT_LAYOUT_CONFIG,
            orientation,
            maxNodesPerRow,
            ...(sessionGapThreshold && { sessionGapThreshold }),
            ...(margins && {
                margins: { ...DEFAULT_LAYOUT_CONFIG.margins, ...margins },
            }),
        }),
        [orientation, maxNodesPerRow, sessionGapThreshold, margins],
    );

    // Main layout calculation - this is the single source of truth
    const layoutResult = useMemo((): LayoutResult => {
        console.log("🔧 Layout Starting:", {
            inputNodes: nodes?.length || 0,
            inputLinks: links?.length || 0,
            dimensions,
            orientation,
            maxNodesPerRow,
        });

        // Validate inputs
        if (!nodes || nodes.length === 0) {
            console.log("⚠️ No nodes provided to layout");
            return {
                nodePositions: new Map(),
                timelineConfig: {
                    minTime: 0,
                    maxTime: 0,
                    timeRange: 0,
                    timeToX: () => 0,
                    timeToY: () => 0,
                },
                sessions: [],
                bounds: {
                    width: dimensions.width,
                    height: dimensions.height,
                    margins: layoutConfig.margins,
                    availableWidth:
                        dimensions.width -
                        layoutConfig.margins.left -
                        layoutConfig.margins.right,
                    availableHeight:
                        dimensions.height -
                        layoutConfig.margins.top -
                        layoutConfig.margins.bottom,
                },
                simulationNodes: [],
                simulationLinks: [],
                config: layoutConfig,
            };
        }

        if (dimensions.width <= 0 || dimensions.height <= 0) {
            console.log("⚠️ Invalid dimensions:", dimensions);
            // Return empty layout for invalid dimensions
            return {
                nodePositions: new Map(),
                timelineConfig: {
                    minTime: 0,
                    maxTime: 0,
                    timeRange: 0,
                    timeToX: () => 0,
                    timeToY: () => 0,
                },
                sessions: [],
                bounds: {
                    width: 0,
                    height: 0,
                    margins: layoutConfig.margins,
                    availableWidth: 0,
                    availableHeight: 0,
                },
                simulationNodes: [],
                simulationLinks: [],
                config: layoutConfig,
            };
        }

        console.log("✅ Layout inputs valid, calculating...");

        // Calculate the complete layout
        let result: LayoutResult;
        try {
            result = calculateTimelineLayout(
                nodes,
                links,
                dimensions,
                layoutConfig,
            );
            console.log("✅ Layout calculation completed:", {
                nodePositionsSize: result.nodePositions.size,
                simulationNodesLength: result.simulationNodes.length,
                simulationLinksLength: result.simulationLinks.length,
                sessionsCount: result.sessions.length,
                timelineConfigValid: !!result.timelineConfig.timeToX,
                sampleNodePosition: Array.from(
                    result.nodePositions.entries(),
                )[0],
            });
        } catch (error) {
            console.error("❌ Layout calculation failed:", error);
            // Return a fallback layout
            result = createFallbackLayout(
                nodes,
                links,
                dimensions,
                layoutConfig,
            );
        }

        // TEMPORARY DEBUG FALLBACK - if layout calculation failed silently
        if (result.nodePositions.size === 0 && nodes.length > 0) {
            console.warn(
                "⚠️ Layout calculation returned empty positions - using fallback",
            );
            result = createFallbackLayout(
                nodes,
                links,
                dimensions,
                layoutConfig,
            );
        }

        return result;
    }, [nodes, links, dimensions, layoutConfig]);

    // Utility function to update a single node position
    const updateSingleNodePosition = useMemo(() => {
        return (nodeId: string, x: number, y: number): LayoutResult => {
            return updateNodePosition(nodeId, { x, y }, layoutResult);
        };
    }, [layoutResult]);

    // Utility function to get position of a specific node
    const getNodePosition = useMemo(() => {
        return (nodeId: string): { x: number; y: number } | null => {
            return layoutResult.nodePositions.get(nodeId) || null;
        };
    }, [layoutResult.nodePositions]);

    // Check if layout is ready for rendering
    const isLayoutReady = useMemo(() => {
        const ready =
            layoutResult.nodePositions.size > 0 &&
            layoutResult.simulationNodes.length > 0 &&
            dimensions.width > 0 &&
            dimensions.height > 0;

        console.log("🔍 Layout Ready Check:", {
            nodePositionsSize: layoutResult.nodePositions.size,
            simulationNodesLength: layoutResult.simulationNodes.length,
            dimensionsValid: dimensions.width > 0 && dimensions.height > 0,
            isReady: ready,
        });

        return ready;
    }, [layoutResult, dimensions]);

    // Calculate useful statistics
    const stats = useMemo(() => {
        const timestamps = nodes
            .map((node) => node.visitTimestamp || 0)
            .filter((t) => t > 0);

        const hasTimestamps = timestamps.length > 0;
        const timeSpan = hasTimestamps
            ? Math.max(...timestamps) - Math.min(...timestamps)
            : 0;

        return {
            totalNodes: nodes.length,
            totalLinks: links.length,
            sessionCount: layoutResult.sessions.length,
            timeSpan,
            hasTimestamps,
        };
    }, [nodes, links, layoutResult.sessions]);

    return {
        layoutResult,
        updateNodePosition: updateSingleNodePosition,
        getNodePosition,
        isLayoutReady,
        stats,
    };
};

/**
 * Create a fallback layout when the main calculation fails
 */
function createFallbackLayout(
    nodes: NetworkNode[],
    links: NetworkLink[],
    dimensions: { width: number; height: number },
    config: LayoutConfig,
): LayoutResult {
    console.log("🔧 Creating fallback layout for", nodes.length, "nodes");

    const fallbackPositions = new Map();
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    const spacing = 100;
    const nodesPerRow = Math.min(config.maxNodesPerRow, 6);

    // Create simple grid layout
    nodes.forEach((node, index) => {
        const row = Math.floor(index / nodesPerRow);
        const col = index % nodesPerRow;

        const x = centerX - ((nodesPerRow - 1) * spacing) / 2 + col * spacing;
        const y =
            centerY -
            ((Math.ceil(nodes.length / nodesPerRow) - 1) * spacing) / 2 +
            row * spacing;

        fallbackPositions.set(node.id, { x, y });
    });

    // Create simulation nodes
    const simulationNodes = nodes.map((node, index) => {
        const pos = fallbackPositions.get(node.id) || {
            x: centerX,
            y: centerY,
        };
        return {
            ...node,
            x: pos.x,
            y: pos.y,
            vx: 0,
            vy: 0,
            fx: null,
            fy: null,
        };
    });

    // Create simulation links
    const nodeMap = new Map(simulationNodes.map((node) => [node.id, node]));
    const simulationLinks = links
        .filter((link) => nodeMap.has(link.source) && nodeMap.has(link.target))
        .map((link) => ({
            source: nodeMap.get(link.source)!,
            target: nodeMap.get(link.target)!,
            weight: link.weight,
            frequency: link.weight,
            transitions: link.transitions,
        }));

    // Create basic timeline config
    const timestamps = nodes
        .map((node) => node.visitTimestamp || 0)
        .filter((t) => t > 0);

    const minTime =
        timestamps.length > 0 ? Math.min(...timestamps) : Date.now() - 3600000;
    const maxTime =
        timestamps.length > 0 ? Math.max(...timestamps) : Date.now();
    const timeRange = maxTime - minTime;

    const timelineConfig = {
        minTime,
        maxTime,
        timeRange,
        timeToX: (timestamp: number) => {
            if (timeRange === 0) return centerX;
            const progress = (timestamp - minTime) / timeRange;
            return 100 + progress * (dimensions.width - 200);
        },
        timeToY: (timestamp: number) => {
            if (timeRange === 0) return centerY;
            const progress = (timestamp - minTime) / timeRange;
            return 100 + progress * (dimensions.height - 200);
        },
    };

    return {
        nodePositions: fallbackPositions,
        timelineConfig,
        sessions: [
            {
                id: "fallback-session",
                nodes,
                startTime: minTime,
                endTime: maxTime,
                duration: timeRange,
                nodeCount: nodes.length,
            },
        ],
        bounds: {
            width: dimensions.width,
            height: dimensions.height,
            margins: config.margins,
            availableWidth:
                dimensions.width - config.margins.left - config.margins.right,
            availableHeight:
                dimensions.height - config.margins.top - config.margins.bottom,
        },
        simulationNodes,
        simulationLinks,
        config,
    };
}

/**
 * Hook variant for when you only need node positions (lighter weight)
 */
export const useNodePositions = (
    nodes: NetworkNode[],
    dimensions: { width: number; height: number },
    orientation: "vertical" | "horizontal" = "vertical",
) => {
    const { layoutResult, getNodePosition } = useTimelineLayout({
        nodes,
        links: [], // Empty links for position-only calculation
        dimensions,
        orientation,
    });

    return {
        positions: layoutResult.nodePositions,
        getPosition: getNodePosition,
        bounds: layoutResult.bounds,
    };
};

/**
 * Hook variant for when you only need timeline configuration
 */
export const useTimelineConfig = (
    nodes: NetworkNode[],
    dimensions: { width: number; height: number },
    orientation: "vertical" | "horizontal" = "vertical",
) => {
    const { layoutResult } = useTimelineLayout({
        nodes,
        links: [],
        dimensions,
        orientation,
    });

    return {
        timelineConfig: layoutResult.timelineConfig,
        sessions: layoutResult.sessions,
        bounds: layoutResult.bounds,
    };
};

/**
 * Hook for layout debugging and development
 */
export const useLayoutDebug = (
    nodes: NetworkNode[],
    links: NetworkLink[],
    dimensions: { width: number; height: number },
    orientation: "vertical" | "horizontal" = "vertical",
) => {
    const { layoutResult, stats, isLayoutReady } = useTimelineLayout({
        nodes,
        links,
        dimensions,
        orientation,
    });

    const debugInfo = useMemo(() => {
        const positionedNodes = Array.from(
            layoutResult.nodePositions.entries(),
        ).map(([id, pos]) => ({
            id,
            position: pos,
            node: nodes.find((n) => n.id === id),
        }));

        const unpositionedNodes = nodes.filter(
            (node) => !layoutResult.nodePositions.has(node.id),
        );

        return {
            positionedNodes,
            unpositionedNodes,
            sessionBreakdown: layoutResult.sessions.map((session) => ({
                id: session.id,
                nodeCount: session.nodeCount,
                duration: session.duration,
                timeSpan: `${new Date(
                    session.startTime,
                ).toLocaleTimeString()} - ${new Date(
                    session.endTime,
                ).toLocaleTimeString()}`,
            })),
            layoutBounds: layoutResult.bounds,
            timelineRange: {
                start: new Date(
                    layoutResult.timelineConfig.minTime,
                ).toLocaleString(),
                end: new Date(
                    layoutResult.timelineConfig.maxTime,
                ).toLocaleString(),
                span: layoutResult.timelineConfig.timeRange,
            },
            stats,
            isReady: isLayoutReady,
        };
    }, [layoutResult, nodes, stats, isLayoutReady]);

    return debugInfo;
};
