import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import { useTimelineData } from "../../shared/services/useExtensionData";
import type { UrlVisit } from "../../shared/types/common.types";

const getTypeColor = (type: string, isActive = false) => {
    const colors = {
        work: isActive ? "#4285f4" : "#a8c7fa",
        social: isActive ? "#ff6b47" : "#ffb199",
        other: isActive ? "#6c757d" : "#adb5bd",
    };
    return colors[type as keyof typeof colors] || colors.other;
};

const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
};

const TimelineChart: React.FC = () => {
    const svgRef = useRef<SVGSVGElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const { timeline, loading, error } = useTimelineData();

    useEffect(() => {
        if (!svgRef.current || loading || error || timeline.length === 0)
            return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove(); // Clear previous render

        const margin = { top: 15, right: 10, bottom: 0, left: 30 };
        const width = 280 - margin.left - margin.right;
        const height = 120 - margin.top - margin.bottom;

        // Calculate time range from actual data
        const now = Date.now();
        const threeHoursAgo = now - 3 * 60 * 60 * 1000;

        // Get all URL visits from timeline
        const allVisits: Array<UrlVisit & { tabDisplayNumber: number }> = [];
        timeline.forEach((tabSession) => {
            tabSession.urlVisits.forEach((visit) => {
                allVisits.push({
                    ...visit,
                    tabDisplayNumber: tabSession.displayNumber || 1,
                });
            });
        });

        if (allVisits.length === 0) {
            // Show "No data" message
            const g = svg
                .append("g")
                .attr("transform", `translate(${margin.left},${margin.top})`);

            g.append("text")
                .attr("x", width / 2)
                .attr("y", height / 2)
                .attr("text-anchor", "middle")
                .style("font-size", "12px")
                .style("fill", "#636e72")
                .text("No browsing data yet");

            return;
        }

        // Scales
        const xScale = d3
            .scaleLinear()
            .domain([threeHoursAgo, now])
            .range([0, width]);

        const yScale = d3
            .scaleBand()
            .domain(timeline.map((tab) => (tab.displayNumber || 1).toString()))
            .range([0, height])
            .paddingInner(0.1);

        const g = svg
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Time axis at top
        const timeLabels = [];
        for (let i = 0; i <= 3; i++) {
            timeLabels.push(threeHoursAgo + i * 60 * 60 * 1000);
        }

        const xAxis = d3
            .axisTop(xScale)
            .tickValues(timeLabels)
            .tickFormat((d) => {
                const date = new Date(Number(d));
                const hour = date.getHours();
                const minute = date.getMinutes();
                return `${hour}:${minute.toString().padStart(2, "0")}`;
            });

        g.append("g")
            .attr("class", "x-axis")
            .call(xAxis)
            .selectAll("text")
            .style("font-size", "9px")
            .style("fill", "#636e72")
            .style("font-weight", "500");

        g.selectAll(".x-axis path, .x-axis line").style("stroke", "none");

        // Tab labels
        g.selectAll(".tab-label")
            .data(timeline)
            .enter()
            .append("text")
            .attr("class", "tab-label")
            .attr("x", -8)
            .attr(
                "y",
                (d) =>
                    yScale((d.displayNumber || 1).toString())! +
                    yScale.bandwidth() / 2,
            )
            .attr("dy", "0.35em")
            .attr("text-anchor", "end")
            .text((d) => `Tab ${d.displayNumber || 1}`)
            .style("font-size", "9px")
            .style("font-weight", "600")
            .style("fill", "#2d3436");

        // Create tooltip
        const tooltip = d3
            .select(tooltipRef.current)
            .style("opacity", 0)
            .style("position", "absolute")
            .style("background", "rgba(0,0,0,0.9)")
            .style("color", "white")
            .style("padding", "6px 10px")
            .style("border-radius", "6px")
            .style("font-size", "10px")
            .style("font-weight", "500")
            .style("pointer-events", "none")
            .style("z-index", "10");

        // Draw timeline fragments for each tab
        timeline.forEach((tab) => {
            const tabGroup = g.append("g").attr("class", `tab-${tab.tabId}`);
            const yPos =
                yScale((tab.displayNumber || 1).toString())! +
                (yScale.bandwidth() - 6) / 2;
            const barHeight = 6;

            tab.urlVisits
                .filter(
                    (visit) =>
                        visit.startTime >= threeHoursAgo && visit.duration > 0,
                )
                .forEach((visit) => {
                    const fragmentStart = xScale(visit.startTime);
                    const fragmentEnd = visit.endTime
                        ? xScale(Math.min(visit.endTime, now))
                        : xScale(now);
                    const fragmentWidth = Math.max(
                        fragmentEnd - fragmentStart,
                        3,
                    );

                    // URL visit fragment
                    tabGroup
                        .append("rect")
                        .attr("x", fragmentStart)
                        .attr("y", yPos)
                        .attr("width", fragmentWidth)
                        .attr("height", barHeight)
                        .attr("rx", 3)
                        .attr(
                            "fill",
                            getTypeColor(visit.category, visit.isActive),
                        )
                        .style("cursor", "pointer")
                        .style("opacity", 0.9)
                        .on("mouseenter", function (event) {
                            d3.select(this)
                                .style("opacity", 1)
                                .attr("height", barHeight + 2)
                                .attr("y", yPos - 1);

                            const svgRect =
                                svgRef.current!.getBoundingClientRect();
                            const x = event.clientX - svgRect.left;
                            const y = event.clientY - svgRect.top;

                            const durationMinutes = Math.round(
                                visit.duration / (1000 * 60),
                            );
                            const displayUrl = visit.domain || visit.url;

                            tooltip
                                .style("opacity", 1)
                                .html(
                                    `${displayUrl}<br/>${formatTime(
                                        visit.startTime,
                                    )} • ${durationMinutes}m`,
                                )
                                .style("left", x + 10 + "px")
                                .style("top", y - 10 + "px");
                        })
                        .on("mouseleave", function () {
                            d3.select(this)
                                .style("opacity", 0.9)
                                .attr("height", barHeight)
                                .attr("y", yPos);

                            tooltip.style("opacity", 0);
                        })
                        .on("mousemove", function (event) {
                            const svgRect =
                                svgRef.current!.getBoundingClientRect();
                            const x = event.clientX - svgRect.left;
                            const y = event.clientY - svgRect.top;

                            tooltip
                                .style("left", x + 10 + "px")
                                .style("top", y - 10 + "px");
                        });
                });
        });
    }, [timeline, loading, error]);

    // Calculate if we have "other" category for legend
    const hasOther = timeline.some((tab) =>
        tab.urlVisits.some((visit) => visit.category === "other"),
    );

    if (loading) {
        return (
            <div style={{ marginBottom: "16px" }}>
                <div
                    style={{
                        backgroundColor: "#fafbfc",
                        borderRadius: "12px",
                        padding: "16px",
                        marginBottom: "16px",
                        height: "120px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <div style={{ fontSize: "12px", color: "#636e72" }}>
                        Loading timeline...
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ marginBottom: "16px" }}>
                <div
                    style={{
                        backgroundColor: "#ffe8e8",
                        borderRadius: "12px",
                        padding: "16px",
                        marginBottom: "16px",
                        height: "120px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <div style={{ fontSize: "12px", color: "#d63031" }}>
                        Error loading timeline: {error}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ marginBottom: "16px" }}>
            {/* Timeline Chart Container */}
            <div
                style={{
                    backgroundColor: "#fafbfc",
                    borderRadius: "12px",
                    padding: "16px",
                    marginBottom: "16px",
                    height: "120px",
                    position: "relative",
                }}
            >
                <button
                    onClick={() => {
                        // Open graph in new tab
                        window.open("graph.html", "_blank");
                    }}
                    style={{
                        position: "absolute",
                        top: "12px",
                        right: "12px",
                        width: "20px",
                        height: "20px",
                        border: "none",
                        borderRadius: "4px",
                        backgroundColor: "#f0f4ff",
                        color: "#4285f4",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "10px",
                        transition: "all 0.2s ease",
                        zIndex: 10,
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#4285f4";
                        e.currentTarget.style.color = "white";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "#f0f4ff";
                        e.currentTarget.style.color = "#4285f4";
                    }}
                    title="Open full graph"
                >
                    ↗
                </button>
                <svg
                    ref={svgRef}
                    width="280"
                    height="120"
                    style={{ overflow: "visible" }}
                />
                <div ref={tooltipRef} />
            </div>

            {/* Legend */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: "16px",
                    fontSize: "9px",
                    color: "#636e72",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                    }}
                >
                    <div
                        style={{
                            width: "8px",
                            height: "8px",
                            backgroundColor: "#4285f4",
                            borderRadius: "2px",
                        }}
                    />
                    Work
                </div>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                    }}
                >
                    <div
                        style={{
                            width: "8px",
                            height: "8px",
                            backgroundColor: "#ff6b47",
                            borderRadius: "2px",
                        }}
                    />
                    Social
                </div>
                {hasOther && (
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                        }}
                    >
                        <div
                            style={{
                                width: "8px",
                                height: "8px",
                                backgroundColor: "#6c757d",
                                borderRadius: "2px",
                            }}
                        />
                        Other
                    </div>
                )}
            </div>
        </div>
    );
};

export default TimelineChart;
