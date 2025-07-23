import React, { useEffect } from "react";
import type { TimelineAxisProps } from "../types/component.types";
import type { SessionData } from "../types/layout.types";
import { generateTimelineMarkers } from "../utils/timeFormatting";
import { TIME_CONSTANTS } from "../utils/constants";

/**
 * TimelineAxis component that renders timeline indicators and session separators
 * Uses shared layout data to ensure perfect alignment with NetworkRenderer
 */
const TimelineAxis: React.FC<TimelineAxisProps> = ({
    svgGroup,
    timelineConfig,
    sessions,
    axisConfig,
    isDarkMode,
    isStandalone = false,
    viewOrientation,
    dimensions,
    showSessionSeparators = true,
}) => {
    useEffect(() => {
        console.log("🕐 TimelineAxis starting...", {
            svgGroup: !!svgGroup,
            timelineConfig: !!timelineConfig,
            dimensions,
            viewOrientation,
        });

        if (!svgGroup || !timelineConfig || !dimensions) {
            console.log("❌ TimelineAxis missing required props");
            return;
        }

        // Debug timeline configuration
        console.log("🕐 Timeline Debug:", {
            minTime: timelineConfig.minTime,
            maxTime: timelineConfig.maxTime,
            minTimeFormatted: new Date(
                timelineConfig.minTime,
            ).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
            }),
            maxTimeFormatted: new Date(
                timelineConfig.maxTime,
            ).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
            }),
            timeRange: timelineConfig.timeRange,
            timeRangeHours: timelineConfig.timeRange / (60 * 60 * 1000),
        });

        // Clear existing timeline elements
        svgGroup.selectAll(".timeline-indicators").remove();

        // Skip rendering if no valid time range
        if (timelineConfig.timeRange <= 0) {
            console.log("⚠️ No valid time range for timeline");
            return;
        }

        const timelineGroup = svgGroup
            .append("g")
            .attr("class", "timeline-indicators");

        // Theme-based colors
        const axisColor = isDarkMode
            ? "rgba(75, 85, 99, 0.4)"
            : "rgba(255, 183, 77, 0.4)";

        const labelColor = isDarkMode
            ? "rgba(156, 163, 175, 0.8)"
            : "rgba(184, 134, 11, 0.8)";

        const sessionColor = isDarkMode
            ? "rgba(99, 102, 241, 0.2)"
            : "rgba(147, 51, 234, 0.2)";

        if (viewOrientation === "vertical") {
            renderVerticalTimeline();
        } else {
            renderHorizontalTimeline();
        }

        function renderVerticalTimeline() {
            const axisX = 60;
            const axisStartY = 100;
            const axisEndY = dimensions.height - 100;

            console.log("📍 Rendering vertical timeline axis");

            // Draw main vertical timeline axis
            timelineGroup
                .append("line")
                .attr("x1", axisX)
                .attr("x2", axisX)
                .attr("y1", axisStartY)
                .attr("y2", axisEndY)
                .attr("stroke", axisColor)
                .attr("stroke-width", 2);

            // Generate time markers - use actual data range, not rounded intervals
            const markers = generateTimelineMarkers(
                timelineConfig.minTime,
                timelineConfig.maxTime,
                TIME_CONSTANTS.MAX_TIMELINE_MARKERS,
            );

            console.log(
                "🕐 Generated markers for vertical timeline:",
                markers.length,
            );
            markers.forEach((marker, index) => {
                console.log(`Marker ${index}:`, {
                    timestamp: marker.timestamp,
                    label: marker.label,
                    formatted: new Date(marker.timestamp).toLocaleTimeString(
                        "en-US",
                        {
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                        },
                    ),
                });
            });

            // Function to convert timestamp to y position for vertical axis
            const timeToY = (timestamp: number): number => {
                if (timelineConfig.timeRange === 0) {
                    return axisStartY + (axisEndY - axisStartY) / 2;
                }
                const progress =
                    (timestamp - timelineConfig.minTime) /
                    timelineConfig.timeRange;
                return axisStartY + progress * (axisEndY - axisStartY);
            };

            // Render time markers
            markers.forEach((marker) => {
                const y = timeToY(marker.timestamp);

                // Tick mark
                timelineGroup
                    .append("line")
                    .attr("x1", axisX - 5)
                    .attr("x2", axisX + 5)
                    .attr("y1", y)
                    .attr("y2", y)
                    .attr("stroke", axisColor)
                    .attr("stroke-width", 1);

                // Time label
                timelineGroup
                    .append("text")
                    .attr("x", axisX - 10)
                    .attr("y", y + 4)
                    .attr("text-anchor", "end")
                    .style(
                        "font-family",
                        "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
                    )
                    .style("font-size", "10px")
                    .style("font-weight", "500")
                    .style("fill", labelColor)
                    .text(marker.label);
            });

            // Add session separators (skip in standalone mode)
            if (showSessionSeparators && !isStandalone) {
                sessions.forEach((session: SessionData, index: number) => {
                    const sessionY = 100 + index * 120; // Match the session positioning from layout

                    // Session separator line (horizontal line for each session)
                    if (index > 0) {
                        timelineGroup
                            .append("line")
                            .attr("x1", 80)
                            .attr("x2", dimensions.width - 80)
                            .attr("y1", sessionY - 60)
                            .attr("y2", sessionY - 60)
                            .attr("stroke", sessionColor)
                            .attr("stroke-width", 1)
                            .attr("stroke-dasharray", "4,8")
                            .attr("opacity", 0.5);
                    }

                    // Session label
                    timelineGroup
                        .append("text")
                        .attr("x", 77)
                        .attr("y", sessionY - 30)
                        .attr("text-anchor", "start")
                        .style(
                            "font-family",
                            "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
                        )
                        .style("font-size", "9px")
                        .style("font-weight", "600")
                        .style("fill", labelColor)
                        .style("opacity", 0.7)
                        .text(`(${session.nodeCount} sites)`);
                });
            }

            // Timeline title (rotated for vertical axis)
            timelineGroup
                .append("text")
                .attr("x", 20)
                .attr("y", dimensions.height / 2)
                .attr("text-anchor", "middle")
                .attr("transform", `rotate(-90, 20, ${dimensions.height / 2})`)
                .style(
                    "font-family",
                    "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
                )
                .style("font-size", "14px")
                .style("font-weight", "600")
                .style("fill", labelColor)
                .text("Browsing Timeline");
        }

        function renderHorizontalTimeline() {
            // Extract dynamic layout data
            const dynamicTimeToX = (timelineConfig as any).dynamicTimeToX;
            const intervals = (timelineConfig as any).intervals;
            const intervalPositions = (timelineConfig as any).intervalPositions;
            const baseIntervalDuration = (timelineConfig as any)
                .baseIntervalDuration;

            // Calculate axis bounds
            let axisStartX = 100;
            let axisEndX = dimensions.width - 100;

            // If we have dynamic positioning, extend axis to cover all intervals
            if (dynamicTimeToX && intervalPositions) {
                const positions = Array.from(intervalPositions.values());
                if (positions.length > 0) {
                    axisStartX =
                        Math.min(...positions.map((p) => p.startX)) - 50;
                    axisEndX = Math.max(...positions.map((p) => p.endX)) + 50;
                }
                console.log("📍 Dynamic axis bounds:", {
                    axisStartX,
                    axisEndX,
                });
            }

            const axisY = 60;

            console.log(
                "📍 Rendering horizontal timeline axis from",
                axisStartX,
                "to",
                axisEndX,
            );

            // Draw main horizontal timeline axis - now spans full content width
            timelineGroup
                .append("line")
                .attr("x1", axisStartX)
                .attr("x2", axisEndX)
                .attr("y1", axisY)
                .attr("y2", axisY)
                .attr("stroke", axisColor)
                .attr("stroke-width", 2);

            let markers: Array<{
                timestamp: number;
                label: string;
                isHour: boolean;
                x: number;
            }> = [];

            if (
                dynamicTimeToX &&
                intervals &&
                intervalPositions &&
                baseIntervalDuration
            ) {
                // Use interval-based markers that align with node groupings
                console.log(
                    "🕐 Using interval-based markers for horizontal timeline",
                );

                intervals.forEach((intervalNodes, intervalIndex) => {
                    const intervalInfo = intervalPositions.get(intervalIndex);
                    if (!intervalInfo) return;

                    // Calculate the time range this interval represents
                    const intervalStartTime =
                        timelineConfig.minTime +
                        intervalIndex * baseIntervalDuration;
                    const intervalEndTime =
                        intervalStartTime + baseIntervalDuration;

                    // Use the middle timestamp of the interval for labeling
                    const intervalMidTime =
                        (intervalStartTime + intervalEndTime) / 2;

                    // Format the label to show the time range or representative time
                    const startDate = new Date(intervalStartTime);

                    let label: string;
                    if (
                        baseIntervalDuration >=
                        TIME_CONSTANTS.MARKER_INTERVALS.ONE_HOUR
                    ) {
                        // For hour+ intervals, show the hour
                        label = startDate.toLocaleTimeString("en-US", {
                            hour: "numeric",
                            hour12: true,
                        });
                    } else {
                        // For shorter intervals, show time with minutes
                        label = startDate.toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                        });
                    }

                    markers.push({
                        timestamp: intervalMidTime,
                        label,
                        isHour: startDate.getMinutes() === 0,
                        x: intervalInfo.centerX,
                    });

                    console.log(
                        `Interval ${intervalIndex}: ${label} at x:${intervalInfo.centerX}`,
                    );
                });
            } else {
                // Fall back to regular timeline markers
                console.log(
                    "🕐 Using regular timeline markers for horizontal timeline",
                );
                const timeMarkers = generateTimelineMarkers(
                    timelineConfig.minTime,
                    timelineConfig.maxTime,
                    TIME_CONSTANTS.MAX_TIMELINE_MARKERS,
                );

                // Use the timeToX function to position markers
                const getMarkerX = (timestamp: number): number => {
                    if (dynamicTimeToX) {
                        return dynamicTimeToX(timestamp);
                    }
                    return timelineConfig.timeToX(timestamp);
                };

                markers = timeMarkers.map((marker) => ({
                    ...marker,
                    x: getMarkerX(marker.timestamp),
                }));
            }

            // Filter markers to only show those within visible bounds and with adequate spacing
            const minMarkerSpacing = 80; // Minimum pixels between markers
            const visibleMarkers = markers
                .filter(
                    (marker) => marker.x >= axisStartX && marker.x <= axisEndX,
                )
                .sort((a, b) => a.x - b.x);

            // Remove overlapping markers
            const spacedMarkers: typeof visibleMarkers = [];
            let lastMarkerX = -Infinity;

            visibleMarkers.forEach((marker) => {
                if (marker.x - lastMarkerX >= minMarkerSpacing) {
                    spacedMarkers.push(marker);
                    lastMarkerX = marker.x;
                }
            });

            console.log(
                `🕐 Rendering ${spacedMarkers.length} spaced markers (filtered from ${visibleMarkers.length} visible markers)`,
            );

            // Render the spaced markers
            spacedMarkers.forEach((marker) => {
                // Tick mark
                timelineGroup
                    .append("line")
                    .attr("x1", marker.x)
                    .attr("x2", marker.x)
                    .attr("y1", axisY - 5)
                    .attr("y2", axisY + 5)
                    .attr("stroke", axisColor)
                    .attr("stroke-width", 1);

                // Time label
                timelineGroup
                    .append("text")
                    .attr("x", marker.x)
                    .attr("y", axisY - 10)
                    .attr("text-anchor", "middle")
                    .style(
                        "font-family",
                        "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
                    )
                    .style("font-size", "10px")
                    .style("font-weight", "500")
                    .style("fill", labelColor)
                    .text(marker.label);

                console.log(
                    `Rendered marker "${marker.label}" at x:${marker.x}`,
                );
            });

            // Add session separators positioned by time (skip in standalone mode)
            if (showSessionSeparators && !isStandalone) {
                sessions.forEach((session: SessionData, index: number) => {
                    // Use the same positioning function as markers
                    const getSessionX = (timestamp: number): number => {
                        if (dynamicTimeToX) {
                            return dynamicTimeToX(timestamp);
                        }
                        return timelineConfig.timeToX(timestamp);
                    };

                    const sessionX = getSessionX(session.startTime);
                    console.log(
                        `Positioning session ${index} at timestamp ${session.startTime} -> x: ${sessionX}`,
                    );

                    // Only render if within visible bounds
                    if (sessionX >= axisStartX && sessionX <= axisEndX) {
                        // Session separator line (vertical line at session time position)
                        timelineGroup
                            .append("line")
                            .attr("x1", sessionX)
                            .attr("x2", sessionX)
                            .attr("y1", 80)
                            .attr("y2", dimensions.height - 80)
                            .attr("stroke", sessionColor)
                            .attr("stroke-width", 1)
                            .attr("stroke-dasharray", "4,8")
                            .attr("opacity", 0.3);

                        // Session label positioned at time position
                        const sessionY = 100 + index * 80; // Distribute sessions vertically
                        timelineGroup
                            .append("text")
                            .attr("x", sessionX)
                            .attr("y", sessionY - 10)
                            .attr("text-anchor", "middle")
                            .style(
                                "font-family",
                                "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
                            )
                            .style("font-size", "9px")
                            .style("font-weight", "600")
                            .style("fill", labelColor)
                            .style("opacity", 0.7)
                            .text(`(${session.nodeCount} sites)`);
                    }
                });
            }

            // Timeline title (horizontal)
            timelineGroup
                .append("text")
                .attr("x", dimensions.width / 2)
                .attr("y", 20)
                .attr("text-anchor", "middle")
                .style(
                    "font-family",
                    "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
                )
                .style("font-size", "14px")
                .style("font-weight", "600")
                .style("fill", labelColor)
                .text("Browsing Timeline");
        }

        console.log("✅ TimelineAxis rendering complete");

        // Cleanup function
        return () => {
            console.log("🧹 TimelineAxis cleanup");
            timelineGroup.remove();
        };
    }, [
        svgGroup,
        timelineConfig,
        sessions,
        axisConfig,
        isDarkMode,
        isStandalone,
        viewOrientation,
        dimensions,
        showSessionSeparators,
    ]);

    // This component renders directly to the provided SVG group
    return null;
};

export default TimelineAxis;
