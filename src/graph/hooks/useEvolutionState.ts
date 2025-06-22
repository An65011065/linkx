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

const FRAME_RATE = 60; // 60fps for smooth animation
const BASE_INTERVAL = 1000; // 1 second between events at 1x speed

export const useEvolutionState = (
    nodes: NetworkNode[],
    links: NetworkLink[],
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

    // Initialize timeline and maps if nodes or links change
    useEffect(() => {
        // Create maps for quick lookups
        nodeMapRef.current = new Map(nodes.map((node) => [node.id, node]));
        linkMapRef.current = new Map(
            links.map((link) => [`${link.source}-${link.target}`, link]),
        );

        // Group events by timestamp
        const eventGroups = new Map<number, EvolutionEvent[]>();

        // Add node events
        nodes.forEach((node) => {
            const timestamp = node.lastVisited || 0;
            if (!eventGroups.has(timestamp)) {
                eventGroups.set(timestamp, []);
            }
            eventGroups.get(timestamp)!.push({
                type: "node",
                id: node.id,
                timestamp,
            });
        });

        // Add link events with their corresponding nodes
        links.forEach((link) => {
            const timestamp = link.transitions?.[0]?.timestamp || 0;
            const sourceNode = nodeMapRef.current.get(link.source as string);
            const targetNode = nodeMapRef.current.get(link.target as string);

            if (sourceNode && targetNode) {
                const maxNodeTimestamp = Math.max(
                    sourceNode.lastVisited || 0,
                    targetNode.lastVisited || 0,
                );
                const linkTimestamp = Math.max(timestamp, maxNodeTimestamp);

                if (!eventGroups.has(linkTimestamp)) {
                    eventGroups.set(linkTimestamp, []);
                }
                eventGroups.get(linkTimestamp)!.push({
                    type: "link",
                    id: `${link.source}-${link.target}`,
                    timestamp: linkTimestamp,
                });
            }
        });

        // Convert to sorted timeline
        timelineRef.current = Array.from(eventGroups.entries())
            .sort(([a], [b]) => a - b)
            .flatMap(([_, events]) => events);

        // Reset state when nodes/links change
        setState((prev) => ({
            ...prev,
            currentTimestamp: timelineRef.current[0]?.timestamp || 0,
            visibleNodes: new Set(),
            visibleLinks: new Set(),
        }));
    }, [nodes, links]);

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

                    // Process all events at the same timestamp
                    const currentTimestamp = nextEvent.timestamp;
                    timeline
                        .slice(nextEventIndex)
                        .filter((event) => event.timestamp === currentTimestamp)
                        .forEach((event) => {
                            if (event.type === "node") {
                                newVisibleNodes.add(event.id);
                            } else {
                                const [source, target] = event.id.split("-");
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
                        currentTimestamp,
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
