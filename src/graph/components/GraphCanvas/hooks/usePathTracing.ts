import { useState, useCallback, useMemo } from "react";
import type { NetworkLink } from "../../shared/types/network.types";

interface UsePathTracingReturn {
    selectedNode: string | null;
    pathNodes: Set<string>;
    pathLinks: Set<string>;
    pathOrder: Map<string, number>;
    tracePathToNode: (targetNodeId: string) => void;
    clearPath: () => void;
    isNodeInPath: (nodeId: string) => boolean;
    isLinkInPath: (sourceId: string, targetId: string) => boolean;
    getNodeOrder: (nodeId: string) => number | null;
    pathStats: {
        nodeCount: number;
        linkCount: number;
        pathLength: number;
    };
}

/**
 * Hook for managing node path tracing functionality
 * Extracted from your original tracePathToNode logic
 */
export const usePathTracing = (links: NetworkLink[]): UsePathTracingReturn => {
    const [selectedNode, setSelectedNode] = useState<string | null>(null);
    const [pathNodes, setPathNodes] = useState<Set<string>>(new Set());
    const [pathLinks, setPathLinks] = useState<Set<string>>(new Set());
    const [pathOrder, setPathOrder] = useState<Map<string, number>>(new Map());

    // Create a map for faster link lookups
    const linkMap = useMemo(() => {
        const map = new Map<string, NetworkLink[]>();
        links.forEach((link) => {
            // Index by target for finding incoming links
            if (!map.has(link.target)) {
                map.set(link.target, []);
            }
            map.get(link.target)!.push(link);
        });
        return map;
    }, [links]);

    /**
     * Trace path to a target node by following incoming links
     * Based on your original tracePathToNode function
     */
    const tracePathToNode = useCallback(
        (targetNodeId: string) => {
            const newPathNodes = new Set<string>();
            const newPathLinks = new Set<string>();
            const newPathOrder = new Map<string, number>();
            const path: string[] = [];

            let currentNodeId = targetNodeId;
            const visited = new Set<string>();

            // Follow the path backwards through incoming links
            while (currentNodeId && !visited.has(currentNodeId)) {
                visited.add(currentNodeId);
                path.unshift(currentNodeId); // Add to beginning of path

                // Find incoming links to current node
                const incomingLinks = linkMap.get(currentNodeId) || [];

                if (incomingLinks.length === 0) {
                    // No more incoming links, we've reached the start
                    break;
                }

                // Find the earliest link (by transition timestamp)
                let earliestLink = incomingLinks[0];
                let earliestTime = Infinity;

                incomingLinks.forEach((link) => {
                    // Find the earliest transition timestamp for this link
                    const earliestTransition = link.transitions.reduce(
                        (earliest, transition) =>
                            transition.timestamp < earliest
                                ? transition.timestamp
                                : earliest,
                        Infinity,
                    );

                    if (earliestTransition < earliestTime) {
                        earliestTime = earliestTransition;
                        earliestLink = link;
                    }
                });

                // Move to the source of the earliest link
                const nextNodeId = earliestLink.source;

                // Add the link to our path (but only if we haven't visited the source yet)
                if (!visited.has(nextNodeId)) {
                    newPathLinks.add(`${nextNodeId}->${currentNodeId}`);
                }

                currentNodeId = nextNodeId;
            }

            // Build the path nodes and order
            path.forEach((nodeId, index) => {
                newPathNodes.add(nodeId);
                newPathOrder.set(nodeId, index + 1);
            });

            // Update state
            setPathNodes(newPathNodes);
            setPathLinks(newPathLinks);
            setPathOrder(newPathOrder);
            setSelectedNode(targetNodeId);
        },
        [linkMap],
    );

    /**
     * Clear the current path
     */
    const clearPath = useCallback(() => {
        setSelectedNode(null);
        setPathNodes(new Set());
        setPathLinks(new Set());
        setPathOrder(new Map());
    }, []);

    /**
     * Check if a node is in the current path
     */
    const isNodeInPath = useCallback(
        (nodeId: string): boolean => {
            return pathNodes.has(nodeId);
        },
        [pathNodes],
    );

    /**
     * Check if a link is in the current path
     */
    const isLinkInPath = useCallback(
        (sourceId: string, targetId: string): boolean => {
            return pathLinks.has(`${sourceId}->${targetId}`);
        },
        [pathLinks],
    );

    /**
     * Get the order number of a node in the path (1-based)
     */
    const getNodeOrder = useCallback(
        (nodeId: string): number | null => {
            return pathOrder.get(nodeId) || null;
        },
        [pathOrder],
    );

    // Calculate path statistics
    const pathStats = useMemo(
        () => ({
            nodeCount: pathNodes.size,
            linkCount: pathLinks.size,
            pathLength: pathOrder.size,
        }),
        [pathNodes.size, pathLinks.size, pathOrder.size],
    );

    return {
        selectedNode,
        pathNodes,
        pathLinks,
        pathOrder,
        tracePathToNode,
        clearPath,
        isNodeInPath,
        isLinkInPath,
        getNodeOrder,
        pathStats,
    };
};

/**
 * Hook variant for advanced path tracing with multiple paths
 */
export const useMultiPathTracing = (links: NetworkLink[]) => {
    const [paths, setPaths] = useState<
        Map<
            string,
            {
                nodes: Set<string>;
                links: Set<string>;
                order: Map<string, number>;
            }
        >
    >(new Map());

    const [activePath, setActivePath] = useState<string | null>(null);

    const addPath = useCallback(
        (pathId: string, targetNodeId: string) => {
            // Use the same tracing logic but store multiple paths
            // Implementation would be similar to tracePathToNode but storing in paths Map
        },
        [links],
    );

    const removePath = useCallback((pathId: string) => {
        setPaths((prev) => {
            const newPaths = new Map(prev);
            newPaths.delete(pathId);
            return newPaths;
        });
    }, []);

    const clearAllPaths = useCallback(() => {
        setPaths(new Map());
        setActivePath(null);
    }, []);

    // For now, return basic structure - can be expanded if needed
    return {
        paths,
        activePath,
        addPath,
        removePath,
        clearAllPaths,
        setActivePath,
    };
};

/**
 * Hook for path analysis and statistics
 */
export const usePathAnalysis = (
    pathNodes: Set<string>,
    pathLinks: Set<string>,
    links: NetworkLink[],
) => {
    const analysis = useMemo(() => {
        if (pathNodes.size === 0) {
            return {
                totalTime: 0,
                avgTimeBetweenNodes: 0,
                hyperlinkCount: 0,
                directNavigationCount: 0,
            };
        }

        let totalTime = 0;
        let hyperlinkCount = 0;
        let directNavigationCount = 0;

        // Analyze the links in the path
        links.forEach((link) => {
            const linkId = `${link.source}->${link.target}`;
            if (pathLinks.has(linkId)) {
                // Calculate time spent
                link.transitions.forEach((transition) => {
                    totalTime += transition.timestamp;

                    // Count navigation types
                    if (transition.sourceType === "hyperlink") {
                        hyperlinkCount++;
                    } else {
                        directNavigationCount++;
                    }
                });
            }
        });

        const avgTimeBetweenNodes =
            pathNodes.size > 1 ? totalTime / (pathNodes.size - 1) : 0;

        return {
            totalTime,
            avgTimeBetweenNodes,
            hyperlinkCount,
            directNavigationCount,
        };
    }, [pathNodes, pathLinks, links]);

    return analysis;
};
