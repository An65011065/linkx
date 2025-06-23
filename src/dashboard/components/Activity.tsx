import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import {
    useExtensionData,
    getActivitySummary,
} from "../../data/useExtensionData";

interface HourlyData {
    hour: number;
    date: Date;
    workTime: number;
    otherTime: number;
}

const Activity: React.FC = () => {
    const svgRef = useRef<SVGSVGElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const { activityData, loading, error } = useExtensionData();

    useEffect(() => {
        if (!svgRef.current || loading || error || activityData.length === 0)
            return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove(); // Clear previous render

        // Dimensions - reduced width as requested
        const margin = { top: 10, right: 20, bottom: 50, left: 50 };
        const width = 500 - margin.left - margin.right; // Reduced from 700
        const height = 250 - margin.top - margin.bottom;

        // Sort data by hour for proper timeline
        const sortedData = [...activityData].sort(
            (a, b) => a.date.getHours() - b.date.getHours(),
        );

        // Create scales with time formatting
        const xScale = d3
            .scaleTime()
            .domain(d3.extent(sortedData, (d) => d.date) as [Date, Date])
            .range([0, width]);

        const maxTime =
            d3.max(sortedData, (d) => Math.max(d.workTime, d.otherTime)) || 1;
        const yScale = d3.scaleLinear().domain([0, maxTime]).range([height, 0]);

        // Create main group
        const g = svg
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Create line generators
        const workLine = d3
            .line<HourlyData>()
            .x((d) => xScale(d.date))
            .y((d) => yScale(d.workTime))
            .curve(d3.curveMonotoneX);

        const otherLine = d3
            .line<HourlyData>()
            .x((d) => xScale(d.date))
            .y((d) => yScale(d.otherTime))
            .curve(d3.curveMonotoneX);

        // Create time formatter for x-axis
        const timeFormat = (date: Date) => {
            const hour = date.getHours();
            if (hour === 0) return "12 AM";
            if (hour < 12) return `${hour} AM`;
            if (hour === 12) return "12 PM";
            return `${hour - 12} PM`;
        };

        // Add axes with time labels
        const xAxis = d3
            .axisBottom(xScale)
            .tickFormat((domainValue: d3.NumberValue) =>
                timeFormat(domainValue as Date),
            )
            .ticks(6);

        const yAxis = d3
            .axisLeft(yScale)
            .tickFormat((d: d3.NumberValue) => `${Number(d)}h`)
            .ticks(4);

        g.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(xAxis)
            .selectAll("text")
            .style("font-family", "Gaegu-Regular, Arial, sans-serif")
            .style("font-size", "14px") // Increased from 12px
            .style("fill", "#666");

        g.append("g")
            .call(yAxis)
            .selectAll("text")
            .style("font-family", "Gaegu-Regular, Arial, sans-serif")
            .style("font-size", "14px") // Increased from 12px
            .style("fill", "#666");

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

        // Add axis labels with larger fonts
        g.append("text")
            .attr("transform", `translate(${width / 2}, ${height + 40})`)
            .style("text-anchor", "middle")
            .style("font-family", "Gaegu-Bold, Arial, sans-serif")
            .style("font-size", "16px") // Increased from 14px
            .style("fill", "#666")
            .text("Time");

        g.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - margin.left + 15)
            .attr("x", 0 - height / 2)
            .style("text-anchor", "middle")
            .style("font-family", "Gaegu-Bold, Arial, sans-serif")
            .style("font-size", "16px") // Increased from 14px
            .style("fill", "#666")
            .text("Time (h)");

        // Style the axes lines
        g.selectAll(".domain")
            .style("stroke", "#ddd")
            .style("stroke-width", "1px");

        g.selectAll(".tick line")
            .style("stroke", "#ddd")
            .style("stroke-width", "1px");

        // Add lines
        g.append("path")
            .datum(sortedData)
            .attr("fill", "none")
            .attr("stroke", "#ff9500")
            .attr("stroke-width", 2)
            .attr("d", workLine);

        g.append("path")
            .datum(sortedData)
            .attr("fill", "none")
            .attr("stroke", "#64748b")
            .attr("stroke-width", 2)
            .attr("d", otherLine);

        // Add hover areas
        const workHoverAreas = g
            .selectAll(".work-hover")
            .data(sortedData)
            .enter()
            .append("circle")
            .attr("class", "work-hover")
            .attr("cx", (d) => xScale(d.date))
            .attr("cy", (d) => yScale(d.workTime))
            .attr("r", 8)
            .attr("fill", "transparent")
            .style("cursor", "pointer");

        const otherHoverAreas = g
            .selectAll(".other-hover")
            .data(sortedData)
            .enter()
            .append("circle")
            .attr("class", "other-hover")
            .attr("cx", (d) => xScale(d.date))
            .attr("cy", (d) => yScale(d.otherTime))
            .attr("r", 8)
            .attr("fill", "transparent")
            .style("cursor", "pointer");

        // Tooltip functionality
        const tooltip = d3.select(tooltipRef.current);

        const showTooltip = (
            event: MouseEvent,
            d: HourlyData,
            type: "work" | "other",
        ) => {
            const time = type === "work" ? d.workTime : d.otherTime;
            const formattedTime = timeFormat(d.date);

            tooltip
                .style("opacity", 1)
                .style("left", event.clientX + 10 + "px")
                .style("top", event.clientY - 10 + "px").html(`
                    <div style="font-family: 'Gaegu-Bold, Arial, sans-serif'; font-weight: bold; color: ${
                        type === "work" ? "#ff9500" : "#64748b"
                    }; font-size: 16px;">
                        ${type === "work" ? "Work" : "Other"}
                    </div>
                    <div style="font-family: 'Gaegu-Regular, Arial, sans-serif'; font-size: 16px;">${time.toFixed(
                        2,
                    )} hours</div>
                    <div style="font-family: 'Gaegu-Regular, Arial, sans-serif'; font-size: 16px;">${formattedTime}</div>
                `);
        };

        const hideTooltip = () => {
            tooltip.style("opacity", 0);
        };

        workHoverAreas
            .on("mouseover", (event: MouseEvent, d: HourlyData) =>
                showTooltip(event, d, "work"),
            )
            .on("mouseout", hideTooltip);

        otherHoverAreas
            .on("mouseover", (event: MouseEvent, d: HourlyData) =>
                showTooltip(event, d, "other"),
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
                    fontFamily: "Gaegu-Regular, Arial, sans-serif",
                    color: "#666",
                    fontSize: "16px",
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
                    fontFamily: "Gaegu-Regular, Arial, sans-serif",
                    color: "#d63031",
                    fontSize: "16px",
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
                    font-family: 'Gaegu-Regular';
                    src: url('${chrome.runtime.getURL(
                        "src/assets/fonts/Gaegu-Regular.ttf",
                    )}') format('truetype');
                    font-weight: 400;
                    font-style: normal;
                }
                @font-face {
                    font-family: 'Gaegu-Bold';
                    src: url('${chrome.runtime.getURL(
                        "src/assets/fonts/Gaegu-Bold.ttf",
                    )}') format('truetype');
                    font-weight: 700;
                    font-style: normal;
                }
            `}</style>
            <div
                style={{
                    marginTop: "40px",
                    width: "100%",
                    maxWidth: "500px",
                }}
            >
                {/* Header */}
                <div style={{ marginBottom: "20px" }}>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            width: "100%",
                        }}
                    >
                        <h2
                            style={{
                                fontFamily: "Gaegu-Bold, Arial, sans-serif",
                                fontSize: "24px",
                                fontWeight: "700",
                                color: "#000",
                                margin: "0",
                            }}
                        >
                            Activity
                        </h2>

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
                                            "Gaegu-Regular, Arial, sans-serif",
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
                                        backgroundColor: "#64748b",
                                        borderRadius: "2px",
                                    }}
                                ></div>
                                <span
                                    style={{
                                        fontFamily:
                                            "Gaegu-Regular, Arial, sans-serif",
                                        fontSize: "14px",
                                        color: "#666",
                                    }}
                                >
                                    Other
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
                                            "Gaegu-Regular, Arial, sans-serif",
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
                        width={500}
                        height={300}
                        style={{
                            display: "block",
                            fontFamily: "Gaegu-Regular, Arial, sans-serif",
                        }}
                    />
                    <div
                        ref={tooltipRef}
                        style={{
                            position: "fixed",
                            backgroundColor: "white",
                            padding: "12px 16px", // Increased padding
                            borderRadius: "6px",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                            pointerEvents: "none",
                            opacity: 0,
                            transition: "opacity 0.2s",
                            zIndex: 1000,
                            fontFamily: "Gaegu-Regular, Arial, sans-serif",
                        }}
                    />
                </div>
            </div>
        </>
    );
};

export default Activity;
