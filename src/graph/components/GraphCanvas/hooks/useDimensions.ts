import { useState, useEffect, useRef, useCallback } from "react";
import { PERFORMANCE_CONSTANTS } from "../utils/constants";

interface UseDimensionsReturn {
    dimensions: { width: number; height: number };
    containerRef: React.RefObject<HTMLDivElement>;
    isReady: boolean;
}

/**
 * Hook for tracking container dimensions with resize observer
 * Extracted from your original updateDimensions logic
 */
export const useDimensions = (
    initialWidth?: number,
    initialHeight?: number,
): UseDimensionsReturn => {
    const containerRef = useRef<HTMLDivElement>(null);
    const resizeObserverRef = useRef<ResizeObserver | null>(null);
    const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Initialize with window dimensions or provided values
    const [dimensions, setDimensions] = useState({
        width:
            initialWidth ||
            (typeof window !== "undefined" ? window.innerWidth : 800),
        height:
            initialHeight ||
            (typeof window !== "undefined" ? window.innerHeight : 600),
    });

    const [isReady, setIsReady] = useState(false);

    // Debounced dimension update function
    const updateDimensions = useCallback(() => {
        if (containerRef.current) {
            const { width, height } =
                containerRef.current.getBoundingClientRect();

            // Only update if dimensions actually changed
            setDimensions((prev) => {
                if (
                    Math.abs(prev.width - width) < 1 &&
                    Math.abs(prev.height - height) < 1
                ) {
                    return prev; // No significant change
                }
                return { width, height };
            });

            if (!isReady && width > 0 && height > 0) {
                setIsReady(true);
            }
        }
    }, [isReady]);

    // Debounced update function to prevent excessive calls during resize
    const debouncedUpdate = useCallback(() => {
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }

        debounceTimeoutRef.current = setTimeout(() => {
            updateDimensions();
        }, PERFORMANCE_CONSTANTS.DEBOUNCE_RESIZE);
    }, [updateDimensions]);

    // Set up resize observer
    useEffect(() => {
        if (!containerRef.current) return;

        // Initial measurement
        updateDimensions();

        // Create resize observer
        resizeObserverRef.current = new ResizeObserver((entries) => {
            if (entries.length > 0) {
                debouncedUpdate();
            }
        });

        // Start observing
        resizeObserverRef.current.observe(containerRef.current);

        // Cleanup function
        return () => {
            if (resizeObserverRef.current) {
                resizeObserverRef.current.disconnect();
                resizeObserverRef.current = null;
            }

            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
                debounceTimeoutRef.current = null;
            }
        };
    }, [debouncedUpdate, updateDimensions]);

    // Also listen to window resize as fallback
    useEffect(() => {
        const handleWindowResize = () => {
            debouncedUpdate();
        };

        window.addEventListener("resize", handleWindowResize);

        return () => {
            window.removeEventListener("resize", handleWindowResize);
        };
    }, [debouncedUpdate]);

    return {
        dimensions,
        containerRef,
        isReady,
    };
};

/**
 * Hook variant for when you want to track window dimensions
 */
export const useWindowDimensions = () => {
    const [dimensions, setDimensions] = useState({
        width: typeof window !== "undefined" ? window.innerWidth : 800,
        height: typeof window !== "undefined" ? window.innerHeight : 600,
    });

    useEffect(() => {
        const handleResize = () => {
            setDimensions({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return dimensions;
};

/**
 * Hook for tracking specific element dimensions without ref
 */
export const useElementDimensions = (element: HTMLElement | null) => {
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const resizeObserverRef = useRef<ResizeObserver | null>(null);

    useEffect(() => {
        if (!element) return;

        const updateDimensions = () => {
            const { width, height } = element.getBoundingClientRect();
            setDimensions({ width, height });
        };

        // Initial measurement
        updateDimensions();

        // Set up resize observer
        resizeObserverRef.current = new ResizeObserver(() => {
            updateDimensions();
        });

        resizeObserverRef.current.observe(element);

        return () => {
            if (resizeObserverRef.current) {
                resizeObserverRef.current.disconnect();
            }
        };
    }, [element]);

    return dimensions;
};
