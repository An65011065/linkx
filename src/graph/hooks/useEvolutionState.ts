// useEvolutionState.ts - Hook for managing evolution state

import { useState, useRef, useCallback, useEffect } from "react";
import type { NetworkNode, NetworkLink } from "../types/network.types";

interface EvolutionEvent {
    type: "node" | "link";
    id: string;
    timestamp: number;
}

interface EvolutionState {
    isPlaying: boolean;
    speed: number;
    currentTimestamp: number;
    visibleNodes: Set<string>;
    visibleLinks: Set<string>;
}

const BASE_INTERVAL = 1000; // 1 second between events at 1x speed

export const useEvolutionState = (
    nodes: NetworkNode[],
    links: NetworkLink[],
    selectedNode: string | null = null,
) => {
    const [state, setState] = useState<EvolutionState>({
        isPlaying: false,
        speed: 1,
        currentTimestamp: 0,
        visibleNodes: new Set<string>(),
        visibleLinks: new Set<string>(),
    });

    const intervalRef = useRef<number | null>(null);
    const timelineRef = useRef<EvolutionEvent[]>([]);
    const nodeMapRef = useRef<Map<string, NetworkNode>>(new Map());
    const linkMapRef = useRef<Map<string, NetworkLink>>(new Map());
    const pathNodesRef = useRef<Set<string>>(new Set());
    const pathLinksRef = useRef<Set<string>>(new Set());

    // Function to trace path to selected node
    const calculatePath = useCallback(() => {
        if (!selectedNode) {
            pathNodesRef.current = new Set();
            pathLinksRef.current = new Set();
            return;
        }

        const pathNodes = new Set<string>();
        const pathLinks = new Set<string>();
        const visited = new Set<string>();

        // Create a map of links by target node for efficient lookup
        const linksByTarget = new Map<
            string,
            Array<{ source: string; timestamp: number }>
        >();

        // First, collect all links and their timestamps
        links.forEach((link) => {
            const source =
                typeof link.source === "string" ? link.source : link.source;
            const target =
                typeof link.target === "string" ? link.target : link.target;
            const timestamp = link.transitions?.[0]?.timestamp || 0;

            if (!linksByTarget.has(target)) {
                linksByTarget.set(target, []);
            }
            linksByTarget.get(target)!.push({ source, timestamp });
        });

        // Recursive function to trace backwards from target node
        const tracePath = (nodeId: string, depth: number = 0) => {
            if (visited.has(nodeId) || depth > 10) return; // Prevent infinite loops and limit depth

            visited.add(nodeId);
            pathNodes.add(nodeId);

            // Get all incoming links for this node
            const incomingLinks = linksByTarget.get(nodeId) || [];

            // Sort incoming links by timestamp
            incomingLinks.sort((a, b) => a.timestamp - b.timestamp);

            // Process each incoming link
            incomingLinks.forEach(({ source }) => {
                const linkId = `${source}->${nodeId}`;
                pathLinks.add(linkId);
                pathNodes.add(source);
                tracePath(source, depth + 1);
            });
        };

        tracePath(selectedNode);
        pathNodesRef.current = pathNodes;
        pathLinksRef.current = pathLinks;
    }, [selectedNode, links]);

    // Initialize timeline and maps if nodes or links change
    useEffect(() => {
        // Create maps for quick lookups
        nodeMapRef.current = new Map(nodes.map((node) => [node.id, node]));
        linkMapRef.current = new Map(
            links.map((link) => {
                const source =
                    typeof link.source === "string" ? link.source : link.source;
                const target =
                    typeof link.target === "string" ? link.target : link.target;
                return [`${source}->${target}`, link];
            }),
        );

        // Calculate path for selected node
        calculatePath();

        // Create timeline events
        const events: EvolutionEvent[] = [];

        // First, add all node events that are in the path
        nodes.forEach((node) => {
            if (!selectedNode || pathNodesRef.current.has(node.id)) {
                events.push({
                    type: "node",
                    id: node.id,
                    timestamp: node.lastVisited || 0,
                });
            }
        });

        // Then, add all link events that are in the path
        links.forEach((link) => {
            const source =
                typeof link.source === "string" ? link.source : link.source;
            const target =
                typeof link.target === "string" ? link.target : link.target;
            const linkId = `${source}->${target}`;

            if (!selectedNode || pathLinksRef.current.has(linkId)) {
                const timestamp = link.transitions?.[0]?.timestamp || 0;
                events.push({
                    type: "link",
                    id: linkId,
                    timestamp,
                });
            }
        });

        // Sort events by timestamp
        events.sort((a, b) => a.timestamp - b.timestamp);
        timelineRef.current = events;

        // Reset state with the earliest timestamp
        const earliestTimestamp = events[0]?.timestamp || 0;
        setState((prev) => ({
            ...prev,
            currentTimestamp: earliestTimestamp,
            visibleNodes: new Set(),
            visibleLinks: new Set(),
        }));
    }, [nodes, links, selectedNode, calculatePath]);

    const play = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }

        setState((prev) => ({ ...prev, isPlaying: true }));

        const timeline = timelineRef.current;
        let lastFrameTime = performance.now();
        let accumulatedTime = 0;

        const animate = () => {
            const currentTime = performance.now();
            const deltaTime = currentTime - lastFrameTime;
            lastFrameTime = currentTime;

            accumulatedTime += deltaTime * state.speed;

            if (accumulatedTime >= BASE_INTERVAL) {
                setState((prev) => {
                    const currentTime = prev.currentTimestamp;
                    const nextEventIndex = timeline.findIndex(
                        (event) => event.timestamp > currentTime,
                    );

                    if (nextEventIndex === -1) {
                        // No more events, stop playing
                        clearInterval(intervalRef.current!);
                        return { ...prev, isPlaying: false };
                    }

                    const nextEvent = timeline[nextEventIndex];
                    const newVisibleNodes = new Set(prev.visibleNodes);
                    const newVisibleLinks = new Set(prev.visibleLinks);

                    // Process all events up to and including the current timestamp
                    timeline
                        .filter(
                            (event) => event.timestamp <= nextEvent.timestamp,
                        )
                        .forEach((event) => {
                            if (event.type === "node") {
                                newVisibleNodes.add(event.id);
                            }
                        });

                    // After processing all nodes, process links
                    timeline
                        .filter(
                            (event) => event.timestamp <= nextEvent.timestamp,
                        )
                        .forEach((event) => {
                            if (event.type === "link") {
                                const [source, target] = event.id.split("->");
                                // Only show link if both nodes are visible
                                if (
                                    newVisibleNodes.has(source) &&
                                    newVisibleNodes.has(target)
                                ) {
                                    newVisibleLinks.add(event.id);
                                }
                            }
                        });

                    return {
                        ...prev,
                        currentTimestamp: nextEvent.timestamp,
                        visibleNodes: newVisibleNodes,
                        visibleLinks: newVisibleLinks,
                    };
                });

                accumulatedTime = 0;
            }

            intervalRef.current = requestAnimationFrame(animate);
        };

        intervalRef.current = requestAnimationFrame(animate);
    }, [state.speed]);

    const pause = useCallback(() => {
        setState((prev) => ({ ...prev, isPlaying: false }));
        if (intervalRef.current) {
            cancelAnimationFrame(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    const reset = useCallback(() => {
        pause();
        const timeline = timelineRef.current;
        setState({
            isPlaying: false,
            speed: 1,
            currentTimestamp: timeline[0]?.timestamp || 0,
            visibleNodes: new Set<string>(),
            visibleLinks: new Set<string>(),
        });
    }, [pause]);

    const setSpeed = useCallback((speed: number) => {
        setState((prev) => ({ ...prev, speed }));
    }, []);

    // Cleanup interval on unmount
    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                cancelAnimationFrame(intervalRef.current);
            }
        };
    }, []);

    return {
        isPlaying: state.isPlaying,
        speed: state.speed,
        currentTimestamp: state.currentTimestamp,
        visibleNodes: state.visibleNodes,
        visibleLinks: state.visibleLinks,
        play,
        pause,
        reset,
        setSpeed,
    };
};
