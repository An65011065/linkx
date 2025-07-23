import type { NetworkNode, NetworkLink } from "../../../types/network.types";
import type {
    Position,
    SessionData,
    TimelineConfig,
    LayoutBounds,
    LayoutConfig,
    LayoutResult,
    SimulationNode,
    SimulationLink,
} from "../types/layout.types";
import { LAYOUT_CONSTANTS, TIME_CONSTANTS } from "./constants";

/**
 * Calculate layout bounds based on dimensions and margins
 */
export const calculateLayoutBounds = (
    width: number,
    height: number,
    config: LayoutConfig,
): LayoutBounds => {
    const margins = config.margins;

    return {
        width,
        height,
        margins,
        availableWidth: width - margins.left - margins.right,
        availableHeight: height - margins.top - margins.bottom,
    };
};

/**
 * Group nodes into browsing sessions based on time gaps
 * Extracted from your original session grouping logic
 */
export const groupNodesIntoSessions = (
    nodes: NetworkNode[],
    sessionGapThreshold: number = LAYOUT_CONSTANTS.SESSION_GAP_THRESHOLD,
): SessionData[] => {
    const sessions: SessionData[] = [];

    // Filter and sort nodes by timestamp
    const sortedNodes = nodes
        .filter((node) => node.visitTimestamp && node.visitTimestamp > 0)
        .sort((a, b) => (a.visitTimestamp || 0) - (b.visitTimestamp || 0));

    if (sortedNodes.length === 0) return sessions;

    let currentSession: NetworkNode[] = [];
    let lastTimestamp = 0;
    let sessionId = 0;

    sortedNodes.forEach((node) => {
        const timestamp = node.visitTimestamp || 0;

        if (
            currentSession.length === 0 ||
            timestamp - lastTimestamp <= sessionGapThreshold
        ) {
            // Continue current session
            currentSession.push(node);
        } else {
            // Start new session
            if (currentSession.length > 0) {
                const startTime = currentSession[0].visitTimestamp || 0;
                const endTime =
                    currentSession[currentSession.length - 1].visitTimestamp ||
                    0;

                sessions.push({
                    id: `session-${sessionId++}`,
                    nodes: [...currentSession],
                    startTime,
                    endTime,
                    duration: endTime - startTime,
                    nodeCount: currentSession.length,
                });
            }
            currentSession = [node];
        }
        lastTimestamp = timestamp;
    });

    // Don't forget the last session
    if (currentSession.length > 0) {
        const startTime = currentSession[0].visitTimestamp || 0;
        const endTime =
            currentSession[currentSession.length - 1].visitTimestamp || 0;

        sessions.push({
            id: `session-${sessionId}`,
            nodes: [...currentSession],
            startTime,
            endTime,
            duration: endTime - startTime,
            nodeCount: currentSession.length,
        });
    }

    return sessions;
};

/**
 * Create timeline configuration for coordinate mapping
 * Based on your original timelineConfig logic
 */
export const createTimelineConfig = (
    nodes: NetworkNode[],
    bounds: LayoutBounds,
    orientation: "vertical" | "horizontal",
): TimelineConfig => {
    const timestamps = nodes
        .map((node) => node.visitTimestamp || 0)
        .filter((t) => t > 0);

    if (timestamps.length === 0) {
        // Fallback when no timestamps
        const centerX = bounds.margins.left + bounds.availableWidth / 2;
        const centerY = bounds.margins.top + bounds.availableHeight / 2;

        return {
            minTime: 0,
            maxTime: 0,
            timeRange: 0,
            timeToX: () => centerX,
            timeToY: () => centerY,
        };
    }

    const minTime = Math.min(...timestamps);
    const maxTime = Math.max(...timestamps);
    const timeRange = maxTime - minTime;

    // Time to position mapping functions
    const timeToX = (timestamp: number): number => {
        if (timeRange === 0) {
            return bounds.margins.left + bounds.availableWidth / 2;
        }
        const progress = (timestamp - minTime) / timeRange;
        return bounds.margins.left + progress * bounds.availableWidth;
    };

    const timeToY = (timestamp: number): number => {
        if (timeRange === 0) {
            return bounds.margins.top + bounds.availableHeight / 2;
        }
        const progress = (timestamp - minTime) / timeRange;
        return bounds.margins.top + progress * bounds.availableHeight;
    };

    // Inverse mapping functions
    const xToTime = (x: number): number => {
        if (timeRange === 0) return minTime;
        const progress = (x - bounds.margins.left) / bounds.availableWidth;
        return minTime + progress * timeRange;
    };

    const yToTime = (y: number): number => {
        if (timeRange === 0) return minTime;
        const progress = (y - bounds.margins.top) / bounds.availableHeight;
        return minTime + progress * timeRange;
    };

    return {
        minTime,
        maxTime,
        timeRange,
        timeToX,
        timeToY,
        xToTime,
        yToTime,
    };
};

/**
 * Calculate vertical timeline layout with better spacing
 * Fixes overlapping in vertical mode
 */
export const calculateVerticalLayout = (
    sessions: SessionData[],
    config: LayoutConfig,
    bounds: LayoutBounds,
): Map<string, Position> => {
    const positions = new Map<string, Position>();
    const nodeSize = 40;
    const minSpacing = 20;
    const gridSize = nodeSize + minSpacing;

    sessions.forEach((session, sessionIndex) => {
        const sessionNodes = session.nodes;
        const nodesCount = sessionNodes.length;
        const baseY = bounds.margins.top + sessionIndex * config.sessionSpacing;

        if (nodesCount === 1) {
            // Single node - position at left with proper margin
            positions.set(sessionNodes[0].id, {
                x: bounds.margins.left + nodeSize,
                y: baseY,
            });
        } else {
            // Calculate how many can fit in one row
            const availableWidth = bounds.availableWidth - nodeSize;
            const nodesPerRow = Math.floor(availableWidth / gridSize);
            const actualNodesPerRow = Math.min(
                nodesPerRow,
                config.maxNodesPerRow,
                nodesCount,
            );

            sessionNodes.forEach((node, index) => {
                const row = Math.floor(index / actualNodesPerRow);
                const col = index % actualNodesPerRow;

                // Center the nodes in each row
                const totalRowWidth = (actualNodesPerRow - 1) * gridSize;
                const rowStartX =
                    bounds.margins.left +
                    nodeSize +
                    (availableWidth - totalRowWidth) / 2;

                positions.set(node.id, {
                    x: rowStartX + col * gridSize,
                    y: baseY + row * gridSize,
                });
            });
        }
    });

    return positions;
};

/**
 * Calculate horizontal timeline layout with dynamic width and scrolling
 * Uses minimum interval width but expands as needed - no cramming!
 */
export const calculateHorizontalLayout = (
    nodes: NetworkNode[],
    timelineConfig: TimelineConfig,
    config: LayoutConfig,
    bounds: LayoutBounds,
): Map<string, Position> => {
    const positions = new Map<string, Position>();

    // Dynamic layout constants
    const nodeSize = 40;
    const minIntervalWidth = 120; // Minimum width per time interval
    const nodesPerColumn = 6; // Max nodes in a vertical column
    const verticalSpacing = 70; // Spacing between rows
    const horizontalSpacing = 80; // Spacing between columns
    const timelineAxisHeight = 120;

    // Sort nodes by timestamp
    const sortedNodes = nodes
        .filter((node) => node.visitTimestamp && node.visitTimestamp > 0)
        .sort((a, b) => (a.visitTimestamp || 0) - (b.visitTimestamp || 0));

    if (sortedNodes.length === 0) return positions;

    // Calculate dynamic time intervals based on data density
    const totalTimeSpan = timelineConfig.timeRange;
    const nodeCount = sortedNodes.length;

    // Determine how many time intervals we need
    // Each interval should have a reasonable number of nodes
    const targetNodesPerInterval = 8;
    const intervalCount = Math.max(
        1,
        Math.ceil(nodeCount / targetNodesPerInterval),
    );
    const baseIntervalDuration = totalTimeSpan / intervalCount;

    // Group nodes into time intervals
    const intervals = new Map<number, NetworkNode[]>();

    sortedNodes.forEach((node) => {
        const nodeTimestamp = node.visitTimestamp || 0;
        const intervalIndex = Math.floor(
            (nodeTimestamp - timelineConfig.minTime) / baseIntervalDuration,
        );
        const clampedIndex = Math.max(
            0,
            Math.min(intervalCount - 1, intervalIndex),
        );

        if (!intervals.has(clampedIndex)) {
            intervals.set(clampedIndex, []);
        }
        intervals.get(clampedIndex)!.push(node);
    });

    // Calculate dynamic width for each interval based on node count
    let currentX = bounds.margins.left + 100; // Add extra offset to center content
    const intervalWidths = new Map<number, number>();
    const intervalPositions = new Map<
        number,
        { startX: number; endX: number; centerX: number }
    >();

    intervals.forEach((intervalNodes, intervalIndex) => {
        const nodesInInterval = intervalNodes.length;
        const columnsNeeded = Math.ceil(nodesInInterval / nodesPerColumn);

        // Calculate required width for this interval
        const requiredWidth = Math.max(
            minIntervalWidth,
            columnsNeeded * horizontalSpacing + horizontalSpacing, // Extra padding
        );

        intervalWidths.set(intervalIndex, requiredWidth);

        // Store interval position info
        const startX = currentX;
        const endX = currentX + requiredWidth;
        const centerX = (startX + endX) / 2;

        intervalPositions.set(intervalIndex, { startX, endX, centerX });

        currentX += requiredWidth;
    });

    // Position nodes interval by interval
    intervals.forEach((intervalNodes, intervalIndex) => {
        const intervalInfo = intervalPositions.get(intervalIndex);
        if (!intervalInfo) return;

        const { centerX } = intervalInfo;

        // Position nodes within this interval
        intervalNodes.forEach((node, nodeIndex) => {
            const column = Math.floor(nodeIndex / nodesPerColumn);
            const row = nodeIndex % nodesPerColumn;

            // Calculate position within the interval
            const nodeX =
                centerX +
                (column -
                    Math.floor(
                        (Math.ceil(intervalNodes.length / nodesPerColumn) - 1) /
                            2,
                    )) *
                    horizontalSpacing;
            const nodeY = timelineAxisHeight + (row + 1) * verticalSpacing;

            positions.set(node.id, { x: nodeX, y: nodeY });
        });
    });

    // Update the timelineConfig to reflect the new dynamic width
    const totalWidth = currentX + bounds.margins.right + 100; // Add matching offset

    // Calculate centering offset for the entire layout
    const contentWidth = totalWidth;
    const availableWidth = bounds.width;
    const centeringOffset = Math.max(0, (availableWidth - contentWidth) / 2);

    console.log("🎯 Layout centering calculation:", {
        contentWidth,
        availableWidth,
        centeringOffset,
        originalStartX: bounds.margins.left + 100,
        adjustedStartX: bounds.margins.left + 100 + centeringOffset,
    });

    // Adjust all interval positions by the centering offset
    intervalPositions.forEach((position, intervalIndex) => {
        position.startX += centeringOffset;
        position.endX += centeringOffset;
        position.centerX += centeringOffset;
    });

    // Adjust all node positions by the centering offset
    positions.forEach((position, nodeId) => {
        position.x += centeringOffset;
    });

    // Create a dynamic timeToX function that maps to interval centers (with centering applied)
    const dynamicTimeToX = (timestamp: number): number => {
        if (timelineConfig.timeRange === 0)
            return bounds.margins.left + 100 + centeringOffset;

        // Find which interval this timestamp belongs to
        const intervalIndex = Math.floor(
            (timestamp - timelineConfig.minTime) / baseIntervalDuration,
        );
        const clampedIndex = Math.max(
            0,
            Math.min(intervalCount - 1, intervalIndex),
        );

        // Return the center X of this interval (already adjusted for centering)
        const intervalInfo = intervalPositions.get(clampedIndex);
        return intervalInfo
            ? intervalInfo.centerX
            : bounds.margins.left + 100 + centeringOffset;
    };

    // Store the dynamic configuration for timeline axis to use
    (timelineConfig as any).dynamicWidth = totalWidth;
    (timelineConfig as any).dynamicTimeToX = dynamicTimeToX;
    (timelineConfig as any).intervals = intervals;
    (timelineConfig as any).intervalWidths = intervalWidths;
    (timelineConfig as any).intervalPositions = intervalPositions;
    (timelineConfig as any).baseIntervalDuration = baseIntervalDuration;

    return positions;
};

// Remove the helper functions that were for linear positioning
// (resolveOverlaps, groupNodesByProximity are no longer needed)

/**
 * Handle nodes without timestamps
 */
export const positionNodesWithoutTimestamps = (
    nodes: NetworkNode[],
    sessions: SessionData[],
    config: LayoutConfig,
    bounds: LayoutBounds,
    positions: Map<string, Position>,
): void => {
    const noTimestampNodes = nodes.filter(
        (node) => !node.visitTimestamp || node.visitTimestamp === 0,
    );

    noTimestampNodes.forEach((node, index) => {
        if (config.orientation === "vertical") {
            positions.set(node.id, {
                x: bounds.margins.left,
                y:
                    bounds.margins.top +
                    sessions.length * config.sessionSpacing +
                    index * config.nodeSpacing,
            });
        } else {
            positions.set(node.id, {
                x:
                    bounds.margins.left +
                    sessions.length * config.sessionSpacing +
                    index * config.nodeSpacing,
                y: bounds.margins.top,
            });
        }
    });
};

/**
 * Create simulation nodes with positions
 */
export const createSimulationNodes = (
    nodes: NetworkNode[],
    positions: Map<string, Position>,
): SimulationNode[] => {
    return nodes.map((node) => {
        const pos = positions.get(node.id) || { x: 0, y: 0 };
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
};

/**
 * Create simulation links with proper source/target references
 */
export const createSimulationLinks = (
    links: NetworkLink[],
    simulationNodes: SimulationNode[],
): SimulationLink[] => {
    const nodeMap = new Map(simulationNodes.map((node) => [node.id, node]));

    return links
        .filter((link) => {
            const source = nodeMap.get(link.source);
            const target = nodeMap.get(link.target);
            return source && target;
        })
        .map((link) => ({
            source: nodeMap.get(link.source)!,
            target: nodeMap.get(link.target)!,
            weight: link.weight,
            frequency: link.weight,
            transitions: link.transitions,
        }));
};

/**
 * Main timeline layout calculation function
 * This is the core function that your useTimelineLayout hook will use
 */
export const calculateTimelineLayout = (
    nodes: NetworkNode[],
    links: NetworkLink[],
    dimensions: { width: number; height: number },
    config: LayoutConfig,
): LayoutResult => {
    // Calculate layout bounds
    const bounds = calculateLayoutBounds(
        dimensions.width,
        dimensions.height,
        config,
    );

    // Create timeline configuration
    const timelineConfig = createTimelineConfig(
        nodes,
        bounds,
        config.orientation,
    );

    // Group nodes into sessions
    const sessions = groupNodesIntoSessions(nodes, config.sessionGapThreshold);

    // Calculate positions based on orientation
    let nodePositions: Map<string, Position>;

    if (config.orientation === "vertical") {
        nodePositions = calculateVerticalLayout(sessions, config, bounds);
    } else {
        nodePositions = calculateHorizontalLayout(
            nodes,
            timelineConfig,
            config,
            bounds,
        );
    }

    // Handle nodes without timestamps
    positionNodesWithoutTimestamps(
        nodes,
        sessions,
        config,
        bounds,
        nodePositions,
    );

    // Create simulation nodes and links
    const simulationNodes = createSimulationNodes(nodes, nodePositions);
    const simulationLinks = createSimulationLinks(links, simulationNodes);

    return {
        nodePositions,
        timelineConfig,
        sessions,
        bounds,
        simulationNodes,
        simulationLinks,
        config,
    };
};

/**
 * Utility function to update node position in layout
 */
export const updateNodePosition = (
    nodeId: string,
    newPosition: Position,
    layoutResult: LayoutResult,
): LayoutResult => {
    // Update in positions map
    const updatedPositions = new Map(layoutResult.nodePositions);
    updatedPositions.set(nodeId, newPosition);

    // Update simulation node
    const updatedSimulationNodes = layoutResult.simulationNodes.map((node) => {
        if (node.id === nodeId) {
            return { ...node, x: newPosition.x, y: newPosition.y };
        }
        return node;
    });

    // Update simulation links (they reference the same objects, so they'll be updated automatically)
    const updatedSimulationLinks = createSimulationLinks(
        layoutResult.simulationLinks.map((link) => ({
            source: link.source.id,
            target: link.target.id,
            weight: link.weight,
            transitions: link.transitions,
        })) as NetworkLink[],
        updatedSimulationNodes,
    );

    return {
        ...layoutResult,
        nodePositions: updatedPositions,
        simulationNodes: updatedSimulationNodes,
        simulationLinks: updatedSimulationLinks,
    };
};
