import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

// Mock data - will be replaced with real extension data
const getCurrentTime = () => {
    const now = new Date();
    return now.getHours() + now.getMinutes() / 60;
};

const currentTime = getCurrentTime();
const startTime = currentTime - 3; // 3 hours ago

const browsingTimeline = [
    {
        tabNumber: 1,
        type: "work",
        urlVisits: [
            { url: "docs.google.com", start: startTime + 0.2, duration: 0.3 },
            { url: "drive.google.com", start: startTime + 0.6, duration: 0.4 },
            { url: "docs.google.com", start: startTime + 1.2, duration: 0.8 },
            { url: "sheets.google.com", start: startTime + 2.1, duration: 0.5 },
            { url: "docs.google.com", start: startTime + 2.7, duration: 0.3 },
        ],
    },
    {
        tabNumber: 2,
        type: "social",
        urlVisits: [
            { url: "youtube.com", start: startTime + 1.3, duration: 0.6 },
            {
                url: "youtube.com/watch?v=abc",
                start: startTime + 2.0,
                duration: 0.9,
            },
            {
                url: "youtube.com/watch?v=def",
                start: startTime + 2.9,
                duration: 0.1,
            },
        ],
    },
    {
        tabNumber: 3,
        type: "work",
        urlVisits: [
            { url: "github.com", start: startTime + 0.8, duration: 0.4 },
            {
                url: "github.com/user/repo",
                start: startTime + 1.3,
                duration: 0.7,
            },
            { url: "github.com/issues", start: startTime + 2.2, duration: 0.3 },
            {
                url: "github.com/pull/123",
                start: startTime + 2.6,
                duration: 0.4,
            },
        ],
    },
    {
        tabNumber: 4,
        type: "other",
        urlVisits: [
            { url: "wikipedia.org", start: startTime + 1.5, duration: 0.3 },
            {
                url: "en.wikipedia.org/wiki/topic",
                start: startTime + 1.9,
                duration: 0.6,
            },
            {
                url: "en.wikipedia.org/wiki/other",
                start: startTime + 2.6,
                duration: 0.4,
            },
        ],
    },
];

const getTypeColor = (type: string, isActive = false) => {
    const colors = {
        work: isActive ? "#4285f4" : "#a8c7fa",
        social: isActive ? "#ff6b47" : "#ffb199",
        other: isActive ? "#6c757d" : "#adb5bd",
    };
    return colors[type as keyof typeof colors] || colors.other;
};

const formatTime = (decimalTime: number) => {
    const hours = Math.floor(decimalTime);
    const minutes = Math.round((decimalTime - hours) * 60);
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
};

const TimelineChart: React.FC = () => {
    const svgRef = useRef<SVGSVGElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    // Removed hoveredSession state as tooltip is handled by D3

    useEffect(() => {
        if (!svgRef.current) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove(); // Clear previous render

        const margin = { top: 15, right: 10, bottom: 0, left: 30 };
        const width = 280 - margin.left - margin.right;
        const height = 120 - margin.top - margin.bottom;

        // Scales with dynamic time range
        const xScale = d3
            .scaleLinear()
            .domain([startTime, currentTime])
            .range([0, width]);

        const yScale = d3
            .scaleBand()
            .domain(browsingTimeline.map((d) => d.tabNumber.toString()))
            .range([0, height])
            .paddingInner(0.1); // Reduced spacing between tabs

        const g = svg
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Dynamic time axis at top
        const timeLabels = [];
        for (let i = 0; i <= 3; i++) {
            timeLabels.push(startTime + i);
        }

        const xAxis = d3
            .axisTop(xScale)
            .tickValues(timeLabels)
            .tickFormat((d) => {
                const hour = Math.floor(Number(d));
                const minute = Math.round((Number(d) - hour) * 60);
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
            .data(browsingTimeline)
            .enter()
            .append("text")
            .attr("class", "tab-label")
            .attr("x", -8)
            .attr(
                "y",
                (d) => yScale(d.tabNumber.toString())! + yScale.bandwidth() / 2,
            )
            .attr("dy", "0.35em")
            .attr("text-anchor", "end")
            .text((d) => `Tab ${d.tabNumber}`)
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
        browsingTimeline.forEach((tab) => {
            const tabGroup = g
                .append("g")
                .attr("class", `tab-${tab.tabNumber}`);
            const yPos =
                yScale(tab.tabNumber.toString())! +
                (yScale.bandwidth() - 6) / 2; // Center the thin bar
            const barHeight = 6; // Thin bars

            tab.urlVisits.forEach((visit) => {
                const fragmentStart = xScale(visit.start);
                const fragmentWidth = Math.max(
                    xScale(visit.start + visit.duration) - fragmentStart,
                    3,
                ); // Minimum 3px width

                // URL visit fragment
                tabGroup
                    .append("rect")
                    .attr("x", fragmentStart)
                    .attr("y", yPos)
                    .attr("width", fragmentWidth)
                    .attr("height", barHeight)
                    .attr("rx", 3)
                    .attr("fill", getTypeColor(tab.type, true))
                    .style("cursor", "pointer")
                    .style("opacity", 0.9)
                    .on("mouseenter", function (event) {
                        // Highlight this fragment
                        d3.select(this)
                            .style("opacity", 1)
                            .attr("height", barHeight + 2)
                            .attr("y", yPos - 1);

                        const svgRect = svgRef.current!.getBoundingClientRect();
                        const x = event.clientX - svgRect.left;
                        const y = event.clientY - svgRect.top;

                        tooltip
                            .style("opacity", 1)
                            .html(
                                `${visit.url}<br/>${formatTime(
                                    visit.start,
                                )} • ${Math.round(visit.duration * 60)}m`,
                            )
                            .style("left", x + 10 + "px")
                            .style("top", y - 10 + "px");
                    })
                    .on("mouseleave", function () {
                        // Reset fragment appearance
                        d3.select(this)
                            .style("opacity", 0.9)
                            .attr("height", barHeight)
                            .attr("y", yPos);

                        tooltip.style("opacity", 0);
                    })
                    .on("mousemove", function (event) {
                        const svgRect = svgRef.current!.getBoundingClientRect();
                        const x = event.clientX - svgRect.left;
                        const y = event.clientY - svgRect.top;

                        tooltip
                            .style("left", x + 10 + "px")
                            .style("top", y - 10 + "px");
                    });
            });
        });
    }, [browsingTimeline, startTime, currentTime]);

    // Calculate if we have "other" category for legend
    const hasOther = browsingTimeline.some((tab) => tab.type === "other");

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
