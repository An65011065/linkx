import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import { useActivityData } from "../../shared/services/useExtensionData";

interface HourlyData {
    hour: number;
    date: Date;
    workTime: number;
    mediaTime: number;
}

const Activity: React.FC = () => {
    const svgRef = useRef<SVGSVGElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const { activityData, loading, error } = useActivityData();

    useEffect(() => {
        if (!svgRef.current || loading || error || activityData.length === 0)
            return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove(); // Clear previous render

        // Dimensions with more space for labels
        const margin = { top: 10, right: 20, bottom: 40, left: 40 };
        const width = 700 - margin.left - margin.right;
        const height = 250 - margin.top - margin.bottom;

        // Create scales
        const xScale = d3
            .scaleTime()
            .domain(d3.extent(activityData, (d) => d.date) as [Date, Date])
            .range([0, width]);

        const maxTime =
            d3.max(activityData, (d) => Math.max(d.workTime, d.mediaTime)) || 1;
        const yScale = d3.scaleLinear().domain([0, maxTime]).range([height, 0]);

        // Create main group
        const g = svg
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Create line generators only (no areas)
        const workLine = d3
            .line<HourlyData>()
            .x((d) => xScale(d.date))
            .y((d) => yScale(d.workTime))
            .curve(d3.curveMonotoneX);

        const mediaLine = d3
            .line<HourlyData>()
            .x((d) => xScale(d.date))
            .y((d) => yScale(d.mediaTime))
            .curve(d3.curveMonotoneX);

        // Add axes with proper labels
        const xAxis = d3
            .axisBottom(xScale)
            .tickFormat((domainValue: d3.NumberValue) => {
                const hour = (domainValue as Date).getHours();
                return hour.toString().padStart(2, "0");
            })
            .ticks(7);

        const yAxis = d3
            .axisLeft(yScale)
            .tickFormat((d: d3.NumberValue) => `${Number(d)}h`)
            .ticks(4);

        g.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(xAxis)
            .selectAll("text")
            .style("font-family", "Nunito-Regular, Arial, sans-serif")
            .style("font-size", "10px")
            .style("fill", "#999");

        g.append("g")
            .call(yAxis)
            .selectAll("text")
            .style("font-family", "Nunito-Regular, Arial, sans-serif")
            .style("font-size", "10px")
            .style("fill", "#999");

        // Add horizontal grid lines
        g.selectAll(".horizontal-grid")
            .data(yScale.ticks(4))
            .enter()
            .append("line")
            .attr("class", "horizontal-grid")
            .attr("x1", 0)
            .attr("x2", width)
            .attr("y1", (d) => yScale(d))
            .attr("y2", (d) => yScale(d))
            .style("stroke", "#f0f0f0")
            .style("stroke-width", "1px");

        // Add axis labels
        g.append("text")
            .attr("transform", `translate(${width / 2}, ${height + 35})`)
            .style("text-anchor", "middle")
            .style("font-family", "Nunito-Regular, Arial, sans-serif")
            .style("font-size", "12px")
            .style("fill", "#666")
            .text("Hours");

        g.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - margin.left + 10)
            .attr("x", 0 - height / 2)
            .style("text-anchor", "middle")
            .style("font-family", "Nunito-Regular, Arial, sans-serif")
            .style("font-size", "12px")
            .style("fill", "#666")
            .text("Time (h)");

        // Style the axes lines
        g.selectAll(".domain")
            .style("stroke", "#ddd")
            .style("stroke-width", "1px");

        g.selectAll(".tick line")
            .style("stroke", "#ddd")
            .style("stroke-width", "1px");

        // Add lines only (no areas)
        g.append("path")
            .datum(activityData)
            .attr("fill", "none")
            .attr("stroke", "#ff9500")
            .attr("stroke-width", 2)
            .attr("d", workLine);

        g.append("path")
            .datum(activityData)
            .attr("fill", "none")
            .attr("stroke", "#a855f7")
            .attr("stroke-width", 2)
            .attr("d", mediaLine);

        // Add invisible hover areas instead of visible dots
        const workHoverAreas = g
            .selectAll(".work-hover")
            .data(activityData)
            .enter()
            .append("circle")
            .attr("class", "work-hover")
            .attr("cx", (d) => xScale(d.date))
            .attr("cy", (d) => yScale(d.workTime))
            .attr("r", 8)
            .attr("fill", "transparent")
            .style("cursor", "pointer");

        const mediaHoverAreas = g
            .selectAll(".media-hover")
            .data(activityData)
            .enter()
            .append("circle")
            .attr("class", "media-hover")
            .attr("cx", (d) => xScale(d.date))
            .attr("cy", (d) => yScale(d.mediaTime))
            .attr("r", 8)
            .attr("fill", "transparent")
            .style("cursor", "pointer");

        // Tooltip functionality with proper positioning
        const tooltip = d3.select(tooltipRef.current);

        const showTooltip = (
            event: MouseEvent,
            d: HourlyData,
            type: "work" | "media",
        ) => {
            const time = type === "work" ? d.workTime : d.mediaTime;
            const formattedTime = d.date.toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
            });

            // Get the SVG container position for proper tooltip positioning
            const svgElement = svgRef.current;
            const svgRect = svgElement?.getBoundingClientRect();

            if (svgRect) {
                tooltip
                    .style("opacity", 1)
                    .style("left", event.clientX + 10 + "px")
                    .style("top", event.clientY - 10 + "px").html(`
                        <div style="font-weight: bold; color: ${
                            type === "work" ? "#ff9500" : "#a855f7"
                        }">
                            ${type === "work" ? "Work" : "Media"}
                        </div>
                        <div>${time.toFixed(2)} hours</div>
                        <div>${formattedTime}</div>
                    `);
            }
        };

        const hideTooltip = () => {
            tooltip.style("opacity", 0);
        };

        workHoverAreas
            .on("mouseover", (event: MouseEvent, d: HourlyData) =>
                showTooltip(event, d, "work"),
            )
            .on("mouseout", hideTooltip);

        mediaHoverAreas
            .on("mouseover", (event: MouseEvent, d: HourlyData) =>
                showTooltip(event, d, "media"),
            )
            .on("mouseout", hideTooltip);
    }, [activityData, loading, error]);

    const formatDate = (date: Date) => {
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
        });
    };

    if (loading) {
        return (
            <div
                style={{
                    padding: "20px 0",
                    fontFamily: "Nunito-Regular, Arial, sans-serif",
                    color: "#666",
                    fontSize: "14px",
                }}
            >
                Loading activity data...
            </div>
        );
    }

    if (error) {
        return (
            <div
                style={{
                    padding: "20px 0",
                    fontFamily: "Nunito-Regular, Arial, sans-serif",
                    color: "#d63031",
                    fontSize: "14px",
                }}
            >
                Error loading activity data: {error}
            </div>
        );
    }

    return (
        <>
            <style>{`
                @font-face {
                    font-family: 'Nunito-Regular';
                    src: url('${chrome.runtime.getURL(
                        "src/assets/fonts/Nunito-Regular.ttf",
                    )}') format('truetype');
                    font-weight: 400;
                    font-style: normal;
                }
                @font-face {
                    font-family: 'Nunito-Bold';
                    src: url('${chrome.runtime.getURL(
                        "src/assets/fonts/Nunito-Bold.ttf",
                    )}') format('truetype');
                    font-weight: 700;
                    font-style: normal;
                }
            `}</style>
            <div
                style={{
                    marginTop: "40px",
                    width: "100%",
                    maxWidth: "700px",
                }}
            >
                {/* Header */}
                <div
                    style={{
                        marginBottom: "20px",
                    }}
                >
                    {/* Activity title and legend/date on same line */}
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            width: "100%",
                        }}
                    >
                        {/* Activity title */}
                        <h2
                            style={{
                                fontFamily: "Nunito-Bold, Arial, sans-serif",
                                fontSize: "24px",
                                fontWeight: "700",
                                color: "#000",
                                margin: "0",
                            }}
                        >
                            Activity
                        </h2>

                        {/* Legend and Date on the right */}
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "20px",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                }}
                            >
                                <div
                                    style={{
                                        width: "16px",
                                        height: "16px",
                                        backgroundColor: "#ff9500",
                                        borderRadius: "2px",
                                    }}
                                ></div>
                                <span
                                    style={{
                                        fontFamily:
                                            "Nunito-Regular, Arial, sans-serif",
                                        fontSize: "14px",
                                        color: "#666",
                                    }}
                                >
                                    Work
                                </span>
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                }}
                            >
                                <div
                                    style={{
                                        width: "16px",
                                        height: "16px",
                                        backgroundColor: "#a855f7",
                                        borderRadius: "2px",
                                    }}
                                ></div>
                                <span
                                    style={{
                                        fontFamily:
                                            "Nunito-Regular, Arial, sans-serif",
                                        fontSize: "14px",
                                        color: "#666",
                                    }}
                                >
                                    Media
                                </span>
                            </div>
                            <div
                                style={{
                                    backgroundColor: "#f0f0f0",
                                    border: "1px solid #ddd",
                                    borderRadius: "20px",
                                    padding: "8px 16px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    cursor: "not-allowed",
                                }}
                            >
                                <span
                                    style={{
                                        fontFamily:
                                            "Nunito-Regular, Arial, sans-serif",
                                        fontSize: "14px",
                                        color: "#666",
                                    }}
                                >
                                    {formatDate(new Date())}
                                </span>
                                <svg
                                    width="12"
                                    height="12"
                                    viewBox="0 0 12 12"
                                    fill="none"
                                >
                                    <path
                                        d="M3 5V3.5C3 2.67157 3.67157 2 4.5 2H7.5C8.32843 2 9 2.67157 9 3.5V5M2 5H10C10.5523 5 11 5.44772 11 6V9C11 9.55228 10.5523 10 10 10H2C1.44772 10 1 9.55228 1 9V6C1 5.44772 1.44772 5 2 5Z"
                                        stroke="#999"
                                        strokeWidth="1"
                                        fill="none"
                                    />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Chart */}
                <div style={{ position: "relative" }}>
                    <svg
                        ref={svgRef}
                        width={700}
                        height={300}
                        style={{ display: "block" }}
                    />
                    <div
                        ref={tooltipRef}
                        style={{
                            position: "fixed",
                            backgroundColor: "rgba(0,0,0,0.8)",
                            color: "white",
                            padding: "8px 12px",
                            borderRadius: "4px",
                            fontSize: "12px",
                            fontFamily: "Nunito-Regular, Arial, sans-serif",
                            pointerEvents: "none",
                            opacity: 0,
                            transition: "opacity 0.2s",
                            zIndex: 1000,
                        }}
                    />
                </div>
            </div>
        </>
    );
};

export default Activity;
