import React, { useState, useRef, useEffect } from "react";
import SmartBookmarks from "./Bookmark";
import GhostTab from "./GhostTab";

interface ScrollableContainerProps {
    isDarkMode: boolean;
}

const ScrollableContainer: React.FC<ScrollableContainerProps> = ({
    isDarkMode,
}) => {
    const [showBookmarks, setShowBookmarks] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);
    const lastScrollTime = useRef<number>(0);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();

            const now = Date.now();
            // Throttle scroll events to prevent rapid switching
            if (now - lastScrollTime.current < 150) return;
            lastScrollTime.current = now;

            // Get the absolute values of deltaX and deltaY to compare magnitudes
            const absX = Math.abs(e.deltaX);
            const absY = Math.abs(e.deltaY);

            // Determine if the scroll is primarily horizontal or vertical
            // Use the direction with the larger magnitude
            if (absX > absY) {
                // Horizontal scrolling
                if (e.deltaX > 0) {
                    // Scrolling right - show GhostTab
                    setShowBookmarks(false);
                } else {
                    // Scrolling left - show SmartBookmarks
                    setShowBookmarks(true);
                }
            } else {
                // Vertical scrolling
                if (e.deltaY > 0) {
                    // Scrolling down - show GhostTab
                    setShowBookmarks(false);
                } else {
                    // Scrolling up - show SmartBookmarks
                    setShowBookmarks(true);
                }
            }
        };

        container.addEventListener("wheel", handleWheel, { passive: false });

        return () => {
            container.removeEventListener("wheel", handleWheel);
        };
    }, []);

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "hidden",
            }}
        >
            {/* SmartBookmarks */}
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    transform: showBookmarks
                        ? "translateY(0)"
                        : "translateY(-100%)",
                    transition: "transform 0.3s ease-out",
                    zIndex: showBookmarks ? 2 : 1,
                }}
            >
                <SmartBookmarks isDarkMode={isDarkMode} />
            </div>

            {/* GhostTab */}
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    transform: showBookmarks
                        ? "translateY(100%)"
                        : "translateY(0)",
                    transition: "transform 0.3s ease-out",
                    zIndex: showBookmarks ? 1 : 2,
                }}
            >
                <GhostTab isDarkMode={isDarkMode} />
            </div>

            {/* Scroll indicator */}
            <div
                style={{
                    position: "absolute",
                    bottom: "8px",
                    right: "8px",
                    display: "flex",
                    gap: "4px",
                    zIndex: 3,
                }}
            >
                <div
                    style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        backgroundColor: showBookmarks
                            ? isDarkMode
                                ? "rgba(255,255,255,0.6)"
                                : "rgba(0,0,0,0.6)"
                            : isDarkMode
                            ? "rgba(255,255,255,0.2)"
                            : "rgba(0,0,0,0.2)",
                        transition: "background-color 0.3s ease",
                    }}
                />
                <div
                    style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        backgroundColor: !showBookmarks
                            ? isDarkMode
                                ? "rgba(255,255,255,0.6)"
                                : "rgba(0,0,0,0.6)"
                            : isDarkMode
                            ? "rgba(255,255,255,0.2)"
                            : "rgba(0,0,0,0.2)",
                        transition: "background-color 0.3s ease",
                    }}
                />
            </div>
        </div>
    );
};

export default ScrollableContainer;
