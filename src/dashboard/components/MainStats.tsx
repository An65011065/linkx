import React, { useEffect, useRef } from "react";
import { useExtensionData, getQuickStats } from "../../data/useExtensionData";
import type {
    RoughViz,
    RoughVizRectangleOptions,
} from "../../shared/types/common.types";
import type { BrowsingSession } from "../../shared/types/browsing.types";

declare global {
    interface Window {
        StandaloneRectangle?: new (options: RoughVizRectangleOptions) => void;
        roughViz?: RoughViz;
        Rectangle?: new (options: RoughVizRectangleOptions) => void;
    }
}

interface GradientCardProps {
    id: string;
    gradient: string;
    icon?: string;
    title: string;
    mainValue: React.ReactNode;
    subtitle: string;
    width?: number;
    height?: number;
}

const GradientCard: React.FC<GradientCardProps> = ({
    id,
    gradient,
    title,
    mainValue,
    subtitle,
    width = 300,
    height = 200,
}) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [rectangleCreated, setRectangleCreated] = React.useState(false);

    useEffect(() => {
        // Simple creation - no delays needed like in your working example
        const createRectangle = async () => {
            if (cardRef.current && !rectangleCreated) {
                let RectangleClass = null;

                // Try different Rectangle sources
                if (window.StandaloneRectangle) {
                    RectangleClass = window.StandaloneRectangle;
                } else if (window.Rectangle) {
                    RectangleClass = window.Rectangle;
                } else if (window.roughViz?.Rectangle) {
                    RectangleClass = window.roughViz.Rectangle;
                }

                // Try dynamic import if window properties don't work
                if (!RectangleClass) {
                    try {
                        const module = await import(
                            chrome.runtime.getURL("packages/roughviz.es.js")
                        );
                        RectangleClass =
                            module.default ||
                            module.Rectangle ||
                            module.StandaloneRectangle;
                    } catch (importError) {
                        console.error(
                            "Failed to import Rectangle:",
                            importError,
                        );
                        return;
                    }
                }

                if (RectangleClass) {
                    try {
                        // Follow your working pattern - let Rectangle handle its own spacing
                        new RectangleClass({
                            element: `#${id}`,
                            width: width,
                            height: height,
                            roughness: 6,
                            backgroundGradient: gradient,
                            stroke: "#2c3e50",
                            strokeWidth: 1,
                            fillWeight: 1,
                            margin: {
                                top: 20,
                                right: 20,
                                bottom: 20,
                                left: 20,
                            },
                        });

                        setRectangleCreated(true);
                    } catch (error) {
                        console.error(
                            `Error creating rectangle for ${id}:`,
                            error,
                        );
                    }
                }
            }
        };

        // Try once immediately (like your working example)
        createRectangle();
    }, [id, gradient, width, height, rectangleCreated]);

    // Container size: rectangle + margin padding (like your 540px for 500px rectangle)
    const containerWidth = width + 40; // 20px margin on each side
    const containerHeight = height + 40; // 20px margin on each side

    return (
        <div
            style={{
                position: "relative",
                width: `${containerWidth}px`,
                height: `${containerHeight}px`,
                background: "transparent", // Let rectangle show through
                borderRadius: "8px",
            }}
        >
            {/* Rectangle Container - like your #visualization div */}
            <div
                id={id}
                ref={cardRef}
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                }}
            />

            {/* Content Overlay */}
            <div
                style={{
                    position: "absolute",
                    top: "20px", // Account for rectangle's top margin
                    left: "20px", // Account for rectangle's left margin
                    right: "20px", // Account for rectangle's right margin
                    bottom: "20px", // Account for rectangle's bottom margin
                    padding: "24px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    color: "rgba(0, 0, 0, 0.8)",
                    pointerEvents: "none",
                }}
            >
                {/* Header */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                    }}
                >
                    <div
                        style={{
                            fontFamily: "Gaegu, Arial, sans-serif",
                            fontSize: "20px",
                            fontWeight: "400",
                            lineHeight: "1.3",
                            maxWidth: "70%",
                            letterSpacing: "-1px",
                        }}
                    >
                        {title}
                    </div>
                </div>

                {/* Main Value */}
                <div>
                    <div
                        style={{
                            fontFamily: "Gaegu, Arial, sans-serif",
                            fontSize: "48px",
                            fontWeight: "700",
                            lineHeight: "1",
                            marginBottom: "8px",
                            letterSpacing: "-2px",
                        }}
                    >
                        {mainValue}
                    </div>
                    <div
                        style={{
                            fontFamily: "Gaegu, Arial, sans-serif",
                            fontSize: "18px",
                            fontWeight: "400",
                            opacity: 0.8,
                            letterSpacing: "-1px",
                        }}
                    >
                        {subtitle}
                    </div>
                </div>
            </div>
        </div>
    );
};

const MainStats: React.FC = () => {
    const { stats, totalActiveTime, loading, error } = useExtensionData();

    useEffect(() => {
        // Simple loading like your working example
        if (
            !window.StandaloneRectangle &&
            !window.roughViz &&
            !window.Rectangle
        ) {
            const script = document.createElement("script");
            script.src = chrome.runtime.getURL("packages/roughviz.es.js");
            script.type = "module";
            script.async = true;
            document.head.appendChild(script);
        }
    }, []);

    if (loading) {
        return (
            <div
                style={{
                    display: "flex",
                    gap: "40px",
                    marginTop: "40px",
                    paddingLeft: "0px",
                }}
            >
                {[1, 2].map((i) => (
                    <div
                        key={i}
                        style={{
                            width: "340px", // 300 + 40 (margin padding)
                            height: "240px", // 200 + 40 (margin padding)
                            backgroundColor: "#f5f5f5",
                            borderRadius: "8px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontFamily: "Gaegu, Arial, sans-serif",
                            fontSize: "18px",
                            color: "#666",
                        }}
                    >
                        Loading...
                    </div>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div
                style={{
                    fontFamily: "Gaegu, Arial, sans-serif",
                    color: "red",
                    fontSize: "18px",
                    marginTop: "40px",
                }}
            >
                Error loading stats: {error}
            </div>
        );
    }

    const flowPercentage =
        totalActiveTime > 0
            ? Math.round(
                  ((stats.workTime + stats.otherTime) / totalActiveTime) * 100,
              )
            : 0;

    return (
        <>
            <style>{`
                @font-face {
                    font-family: 'Gaegu';
                    src: url('${chrome.runtime.getURL(
                        "src/assets/fonts/Gaegu-Regular.ttf",
                    )}') format('truetype');
                    font-weight: 400;
                    font-style: normal;
                }
                @font-face {
                    font-family: 'Gaegu';
                    src: url('${chrome.runtime.getURL(
                        "src/assets/fonts/Gaegu-Bold.ttf",
                    )}') format('truetype');
                    font-weight: 700;
                    font-style: normal;
                }
            `}</style>

            <div
                style={{
                    display: "flex",
                    gap: "40px",
                    marginTop: "20px",
                    paddingLeft: "0px",
                }}
            >
                <GradientCard
                    id="time-spent-card"
                    gradient="roseGold"
                    title="Time spent"
                    mainValue={
                        <span style={{ fontWeight: "800" }}>
                            {totalActiveTime.toFixed(1)}h
                        </span>
                    }
                    subtitle={`${stats.totalUrls} links visited`}
                    width={300}
                    height={200}
                />

                <GradientCard
                    id="productive-work-card"
                    gradient="roseGold"
                    icon="✅"
                    title="Productive work"
                    mainValue={`${flowPercentage}%`}
                    subtitle={`vs ${100 - flowPercentage}% leisure time`}
                    width={300}
                    height={200}
                />
            </div>
        </>
    );
};

export default MainStats;
