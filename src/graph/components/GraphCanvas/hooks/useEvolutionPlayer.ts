import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import type { NetworkLink } from "../../../types/network.types";
import { EVOLUTION_CONSTANTS } from "../utils/constants";

interface UseEvolutionPlayerReturn {
    // State
    isEvolutionMode: boolean;
    isPlaying: boolean;
    currentTimestamp: number;
    evolutionSpeed: number;
    visibleNodes: Set<string>;
    visibleLinks: Set<string>;

    // Controls
    startEvolution: () => void;
    stopEvolution: () => void;
    toggleEvolution: () => void;
    play: () => void;
    pause: () => void;
    reset: () => void;
    setSpeed: (speed: number) => void;

    // Progress info
    progress: {
        current: number;
        total: number;
        percentage: number;
    };

    // Stats
    stats: {
        totalSteps: number;
        currentStep: number;
        timeRemaining: number; // in milliseconds
        elapsedTime: number;
    };
}

/**
 * Hook for managing evolution mode animation
 * Extracted from your original evolution mode logic
 */
export const useEvolutionPlayer = (
    links: NetworkLink[],
): UseEvolutionPlayerReturn => {
    const [isEvolutionMode, setIsEvolutionMode] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTimestamp, setCurrentTimestamp] = useState(0);
    const [evolutionSpeed, setEvolutionSpeed] = useState(
        EVOLUTION_CONSTANTS.DEFAULT_SPEED,
    );
    const [visibleNodes, setVisibleNodes] = useState<Set<string>>(new Set());
    const [visibleLinks, setVisibleLinks] = useState<Set<string>>(new Set());
    const [currentStep, setCurrentStep] = useState(0);

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(0);

    // Get all unique timestamps from links, sorted chronologically
    const allTimestamps = useMemo(() => {
        const timestamps = links
            .flatMap((link) => link.transitions.map((t) => t.timestamp))
            .filter((timestamp) => timestamp > 0)
            .sort((a, b) => a - b);

        // Remove duplicates
        return Array.from(new Set(timestamps));
    }, [links]);

    // Start evolution mode
    const startEvolution = useCallback(() => {
        setIsEvolutionMode(true);
        setCurrentTimestamp(0);
        setCurrentStep(0);
        setVisibleNodes(new Set());
        setVisibleLinks(new Set());
        startTimeRef.current = Date.now();
    }, []);

    // Stop evolution mode and reset
    const stopEvolution = useCallback(() => {
        setIsEvolutionMode(false);
        setIsPlaying(false);
        setCurrentTimestamp(0);
        setCurrentStep(0);
        setVisibleNodes(new Set());
        setVisibleLinks(new Set());

        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    // Toggle evolution mode
    const toggleEvolution = useCallback(() => {
        if (isEvolutionMode) {
            stopEvolution();
        } else {
            startEvolution();
        }
    }, [isEvolutionMode, startEvolution, stopEvolution]);

    // Play evolution animation
    const play = useCallback(() => {
        if (!isEvolutionMode || allTimestamps.length === 0) return;

        setIsPlaying(true);

        const stepInterval = EVOLUTION_CONSTANTS.STEP_INTERVAL / evolutionSpeed;

        intervalRef.current = setInterval(() => {
            setCurrentStep((prevStep) => {
                const nextStep = prevStep + 1;

                if (nextStep >= allTimestamps.length) {
                    // Animation complete
                    setIsPlaying(false);
                    if (intervalRef.current) {
                        clearInterval(intervalRef.current);
                        intervalRef.current = null;
                    }
                    return prevStep;
                }

                const timestamp = allTimestamps[nextStep];
                setCurrentTimestamp(timestamp);

                // Update visible nodes and links based on timestamp
                const newVisibleNodes = new Set<string>();
                const newVisibleLinks = new Set<string>();

                links.forEach((link) => {
                    link.transitions.forEach((transition) => {
                        if (transition.timestamp <= timestamp) {
                            newVisibleNodes.add(link.source);
                            newVisibleNodes.add(link.target);
                            newVisibleLinks.add(
                                `${link.source}->${link.target}`,
                            );
                        }
                    });
                });

                setVisibleNodes(newVisibleNodes);
                setVisibleLinks(newVisibleLinks);

                return nextStep;
            });
        }, stepInterval);
    }, [isEvolutionMode, allTimestamps, evolutionSpeed, links]);

    // Pause evolution animation
    const pause = useCallback(() => {
        setIsPlaying(false);

        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    // Reset evolution to beginning
    const reset = useCallback(() => {
        pause();
        setCurrentTimestamp(0);
        setCurrentStep(0);
        setVisibleNodes(new Set());
        setVisibleLinks(new Set());
        startTimeRef.current = Date.now();
    }, [pause]);

    // Set evolution speed
    const setSpeed = useCallback(
        (speed: number) => {
            const validSpeed = EVOLUTION_CONSTANTS.SPEEDS.includes(speed as any)
                ? speed
                : EVOLUTION_CONSTANTS.DEFAULT_SPEED;

            setEvolutionSpeed(validSpeed);

            // If currently playing, restart with new speed
            if (isPlaying) {
                pause();
                // Use setTimeout to restart with new speed
                setTimeout(() => play(), 50);
            }
        },
        [isPlaying, pause, play],
    );

    // Progress calculation
    const progress = useMemo(() => {
        const total = allTimestamps.length;
        const current = currentStep;
        const percentage = total > 0 ? (current / total) * 100 : 0;

        return { current, total, percentage };
    }, [allTimestamps.length, currentStep]);

    // Statistics calculation
    const stats = useMemo(() => {
        const totalSteps = allTimestamps.length;
        const elapsedTime = Date.now() - startTimeRef.current;

        let timeRemaining = 0;
        if (isPlaying && totalSteps > 0 && currentStep < totalSteps) {
            const stepsRemaining = totalSteps - currentStep;
            const timePerStep =
                EVOLUTION_CONSTANTS.STEP_INTERVAL / evolutionSpeed;
            timeRemaining = stepsRemaining * timePerStep;
        }

        return {
            totalSteps,
            currentStep,
            timeRemaining,
            elapsedTime,
        };
    }, [allTimestamps.length, currentStep, isPlaying, evolutionSpeed]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    // Auto-pause when evolution mode is disabled
    useEffect(() => {
        if (!isEvolutionMode && isPlaying) {
            pause();
        }
    }, [isEvolutionMode, isPlaying, pause]);

    return {
        // State
        isEvolutionMode,
        isPlaying,
        currentTimestamp,
        evolutionSpeed,
        visibleNodes,
        visibleLinks,

        // Controls
        startEvolution,
        stopEvolution,
        toggleEvolution,
        play,
        pause,
        reset,
        setSpeed,

        // Progress
        progress,

        // Stats
        stats,
    };
};

/**
 * Hook variant for controlled evolution (external timestamp control)
 */
export const useControlledEvolution = (
    links: NetworkLink[],
    externalTimestamp: number,
) => {
    const [visibleNodes, setVisibleNodes] = useState<Set<string>>(new Set());
    const [visibleLinks, setVisibleLinks] = useState<Set<string>>(new Set());

    // Update visibility based on external timestamp
    useEffect(() => {
        const newVisibleNodes = new Set<string>();
        const newVisibleLinks = new Set<string>();

        links.forEach((link) => {
            link.transitions.forEach((transition) => {
                if (transition.timestamp <= externalTimestamp) {
                    newVisibleNodes.add(link.source);
                    newVisibleNodes.add(link.target);
                    newVisibleLinks.add(`${link.source}->${link.target}`);
                }
            });
        });

        setVisibleNodes(newVisibleNodes);
        setVisibleLinks(newVisibleLinks);
    }, [links, externalTimestamp]);

    return {
        visibleNodes,
        visibleLinks,
    };
};

/**
 * Hook for evolution timeline scrubbing
 */
export const useEvolutionScrubber = (allTimestamps: number[]) => {
    const [scrubberPosition, setScrubberPosition] = useState(0); // 0-100

    const setPositionByPercentage = useCallback((percentage: number) => {
        const clampedPercentage = Math.max(0, Math.min(100, percentage));
        setScrubberPosition(clampedPercentage);
    }, []);

    const setPositionByTimestamp = useCallback(
        (timestamp: number) => {
            if (allTimestamps.length === 0) return;

            const minTime = allTimestamps[0];
            const maxTime = allTimestamps[allTimestamps.length - 1];

            if (maxTime === minTime) {
                setScrubberPosition(0);
                return;
            }

            const percentage =
                ((timestamp - minTime) / (maxTime - minTime)) * 100;
            setPositionByPercentage(percentage);
        },
        [allTimestamps, setPositionByPercentage],
    );

    const getCurrentTimestamp = useCallback((): number => {
        if (allTimestamps.length === 0) return 0;

        const index = Math.floor(
            (scrubberPosition / 100) * (allTimestamps.length - 1),
        );
        return allTimestamps[index] || 0;
    }, [allTimestamps, scrubberPosition]);

    return {
        scrubberPosition,
        setPositionByPercentage,
        setPositionByTimestamp,
        getCurrentTimestamp,
    };
};
