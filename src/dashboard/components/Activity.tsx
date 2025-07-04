import React, { useEffect, useRef } from "react";
import { useExtensionData } from "../../data/useExtensionData";
import * as d3 from "d3";

declare global {
    interface Window {
        Line?: any;
        roughViz?: any;
    }
}

interface HourlyData {
    hour: string;
    productive: number; // in minutes
    leisure: number; // in minutes
}

const Activity: React.FC = () => {
    const { currentSession, isLoading, error } = useExtensionData();
    const chartRef = useRef<SVGSVGElement>(null);

    // Process data into hourly buckets
    const processHourlyData = (): HourlyData[] => {
        if (!currentSession) return [];
        const now = Date.now();
        const hourlyBuckets: HourlyData[] = [];
        const timeLabels = generateTimeLabels();

        // Initialize buckets for last 24 hours
        for (let i = 0; i < 24; i++) {
            hourlyBuckets.push({
                hour: timeLabels[i],
                productive: 0,
                leisure: 0,
            });
        }

        // Process all visits from current session
        const allVisits = currentSession.tabSessions.flatMap(
            (tab) => tab.urlVisits,
        );

        allVisits.forEach((visit) => {
            const visitTime = visit.startTime;
            const hoursAgo = Math.floor((now - visitTime) / (1000 * 60 * 60));
            if (hoursAgo >= 0 && hoursAgo < 24) {
                const bucketIndex = 23 - hoursAgo;
                const activeTimeMinutes = (visit.activeTime || 0) / (1000 * 60);
                if (visit.category === "social") {
                    hourlyBuckets[bucketIndex].leisure += activeTimeMinutes;
                } else {
                    // work and other are considered productive
                    hourlyBuckets[bucketIndex].productive += activeTimeMinutes;
                }
            }
        });

        return hourlyBuckets;
    };

    // Generate time labels (AM/PM format)
    const generateTimeLabels = (): string[] => {
        const labels = [];
        const now = new Date();
        for (let i = 23; i >= 0; i--) {
            const time = new Date(now.getTime() - i * 60 * 60 * 1000);
            const hours = time.getHours();
            const ampm = hours >= 12 ? "PM" : "AM";
            const displayHours = hours % 12 || 12;
            labels.push(`${displayHours}${ampm}`);
        }
        return labels;
    };

    // Create D3 line chart with dark theme styling
    useEffect(() => {
        if (!chartRef.current || !currentSession) return;
        const hourlyData = processHourlyData();

        // Clear previous chart
        d3.select(chartRef.current).selectAll("*").remove();

        // Set up dimensions
        const margin = { top: 20, right: 30, bottom: 40, left: 50 };
        const width = 450 - margin.left - margin.right;
        const height = 250 - margin.top - margin.bottom;

        // Create SVG
        const svg = d3
            .select(chartRef.current)
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Set up scales
        const x = d3
            .scalePoint()
            .domain(hourlyData.map((d) => d.hour))
            .range([0, width]);

        const y = d3
            .scaleLinear()
            .domain([
                0,
                d3.max(hourlyData, (d) => Math.max(d.productive, d.leisure)) ||
                    0,
            ])
            .range([height, 0])
            .nice();

        // Create area gradients for a more premium look
        const defs = svg.append("defs");

        // Productive area gradient
        const productiveGradient = defs
            .append("linearGradient")
            .attr("id", "productiveGradient")
            .attr("gradientUnits", "userSpaceOnUse")
            .attr("x1", 0)
            .attr("y1", height)
            .attr("x2", 0)
            .attr("y2", 0);

        productiveGradient
            .append("stop")
            .attr("offset", "0%")
            .attr("stop-color", "#4285f4")
            .attr("stop-opacity", 0.1);

        productiveGradient
            .append("stop")
            .attr("offset", "100%")
            .attr("stop-color", "#4285f4")
            .attr("stop-opacity", 0.3);

        // Leisure area gradient
        const leisureGradient = defs
            .append("linearGradient")
            .attr("id", "leisureGradient")
            .attr("gradientUnits", "userSpaceOnUse")
            .attr("x1", 0)
            .attr("y1", height)
            .attr("x2", 0)
            .attr("y2", 0);

        leisureGradient
            .append("stop")
            .attr("offset", "0%")
            .attr("stop-color", "#ff6b47")
            .attr("stop-opacity", 0.1);

        leisureGradient
            .append("stop")
            .attr("offset", "100%")
            .attr("stop-color", "#ff6b47")
            .attr("stop-opacity", 0.3);

        // Create smooth curved lines and areas
        const productiveLine = d3
            .line<HourlyData>()
            .x((d) => x(d.hour)!)
            .y((d) => y(d.productive))
            .curve(d3.curveBasis);

        const leisureLine = d3
            .line<HourlyData>()
            .x((d) => x(d.hour)!)
            .y((d) => y(d.leisure))
            .curve(d3.curveBasis);

        const productiveArea = d3
            .area<HourlyData>()
            .x((d) => x(d.hour)!)
            .y0(height)
            .y1((d) => y(d.productive))
            .curve(d3.curveBasis);

        const leisureArea = d3
            .area<HourlyData>()
            .x((d) => x(d.hour)!)
            .y0(height)
            .y1((d) => y(d.leisure))
            .curve(d3.curveBasis);

        // Add areas with gradients
        svg.append("path")
            .datum(hourlyData)
            .attr("fill", "url(#productiveGradient)")
            .attr("d", productiveArea);

        svg.append("path")
            .datum(hourlyData)
            .attr("fill", "url(#leisureGradient)")
            .attr("d", leisureArea);

        // Add lines with glow effect
        svg.append("path")
            .datum(hourlyData)
            .attr("fill", "none")
            .attr("stroke", "#4285f4")
            .attr("stroke-width", 3)
            .attr("stroke-linecap", "round")
            .attr("stroke-linejoin", "round")
            .attr("filter", "drop-shadow(0 0 6px rgba(66, 133, 244, 0.4))")
            .attr("d", productiveLine);

        svg.append("path")
            .datum(hourlyData)
            .attr("fill", "none")
            .attr("stroke", "#ff6b47")
            .attr("stroke-width", 3)
            .attr("stroke-linecap", "round")
            .attr("stroke-linejoin", "round")
            .attr("filter", "drop-shadow(0 0 6px rgba(255, 107, 71, 0.4))")
            .attr("d", leisureLine);

        // Create tooltip with dark theme
        const tooltip = d3
            .select("body")
            .append("div")
            .attr("class", "activity-tooltip")
            .style("position", "absolute")
            .style("visibility", "hidden")
            .style("background-color", "rgba(0, 0, 0, 0.9)")
            .style("color", "white")
            .style("padding", "12px 16px")
            .style("border-radius", "12px")
            .style("box-shadow", "0 8px 32px rgba(0,0,0,0.3)")
            .style("backdrop-filter", "blur(10px)")
            .style("border", "1px solid rgba(255, 255, 255, 0.1)")
            .style("font-family", "system-ui, -apple-system, sans-serif")
            .style("font-size", "13px")
            .style("pointer-events", "none")
            .style("z-index", "1000");

        // Create invisible overlay for hover detection
        svg.append("rect")
            .attr("width", width)
            .attr("height", height)
            .attr("fill", "none")
            .attr("pointer-events", "all")
            .on("mousemove", function (event) {
                const mouseX = d3.pointer(event)[0];
                const xPos = mouseX / width;
                const index = Math.round(xPos * (hourlyData.length - 1));
                const d =
                    hourlyData[
                        Math.max(0, Math.min(hourlyData.length - 1, index))
                    ];

                if (d) {
                    tooltip
                        .style("visibility", "visible")
                        .html(
                            `
                            <div style="font-weight: 600; margin-bottom: 8px; color: #ffffff">${
                                d.hour
                            }</div>
                            <div style="display: flex; align-items: center; margin-bottom: 4px;">
                                <div style="width: 8px; height: 8px; background: #4285f4; border-radius: 50%; margin-right: 8px;"></div>
                                <span style="color: #e0e0e0">Productive: ${Math.round(
                                    d.productive,
                                )}m</span>
                            </div>
                            <div style="display: flex; align-items: center;">
                                <div style="width: 8px; height: 8px; background: #ff6b47; border-radius: 50%; margin-right: 8px;"></div>
                                <span style="color: #e0e0e0">Leisure: ${Math.round(
                                    d.leisure,
                                )}m</span>
                            </div>
                        `,
                        )
                        .style("left", event.pageX + 15 + "px")
                        .style("top", event.pageY - 10 + "px");

                    // Add vertical indicator line
                    svg.selectAll(".hover-line").remove();
                    svg.append("line")
                        .attr("class", "hover-line")
                        .attr("x1", x(d.hour)!)
                        .attr("x2", x(d.hour)!)
                        .attr("y1", 0)
                        .attr("y2", height)
                        .attr("stroke", "rgba(255, 255, 255, 0.3)")
                        .attr("stroke-width", 2)
                        .attr("stroke-dasharray", "4,4");
                }
            })
            .on("mouseleave", function () {
                tooltip.style("visibility", "hidden");
                svg.selectAll(".hover-line").remove();
            });

        // Style axes for dark theme
        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x).tickFormat((d, i) => (i % 4 === 0 ? d : "")))
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-45)")
            .style("font-size", "11px")
            .style("fill", "rgba(255, 255, 255, 0.7)")
            .style("font-family", "system-ui, -apple-system, sans-serif");

        svg.append("g")
            .call(
                d3
                    .axisLeft(y)
                    .ticks(5)
                    .tickFormat((d) => `${d}m`),
            )
            .selectAll("text")
            .style("font-size", "11px")
            .style("fill", "rgba(255, 255, 255, 0.7)")
            .style("font-family", "system-ui, -apple-system, sans-serif");

        // Style axis lines
        svg.selectAll(".domain")
            .style("stroke", "rgba(255, 255, 255, 0.2)")
            .style("stroke-width", "1px");

        svg.selectAll(".tick line")
            .style("stroke", "rgba(255, 255, 255, 0.1)")
            .style("stroke-width", "1px");

        // Add legend with better styling
        const legend = svg
            .append("g")
            .attr("transform", `translate(${width - 120}, 20)`);

        // Productive legend
        legend
            .append("circle")
            .attr("cx", 0)
            .attr("cy", 0)
            .attr("r", 4)
            .attr("fill", "#4285f4");

        legend
            .append("text")
            .attr("x", 12)
            .attr("y", 0)
            .attr("dy", "0.35em")
            .style("font-size", "12px")
            .style("fill", "rgba(255, 255, 255, 0.9)")
            .style("font-family", "system-ui, -apple-system, sans-serif")
            .text("Productive");

        // Leisure legend
        legend
            .append("circle")
            .attr("cx", 0)
            .attr("cy", 20)
            .attr("r", 4)
            .attr("fill", "#ff6b47");

        legend
            .append("text")
            .attr("x", 12)
            .attr("y", 20)
            .attr("dy", "0.35em")
            .style("font-size", "12px")
            .style("fill", "rgba(255, 255, 255, 0.9)")
            .style("font-family", "system-ui, -apple-system, sans-serif")
            .text("Leisure");

        // Cleanup function
        return () => {
            d3.select("body").selectAll(".activity-tooltip").remove();
        };
    }, [currentSession]);

    if (isLoading) {
        return (
            <div
                style={{
                    width: "450px",
                    height: "300px",
                    background: "rgba(255, 255, 255, 0.01)",
                    borderRadius: "16px",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "system-ui, -apple-system, sans-serif",
                    fontSize: "14px",
                    color: "rgba(255, 255, 255, 0.7)",
                    backdropFilter: "blur(10px)",
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
                    width: "450px",
                    height: "300px",
                    background: "rgba(255, 255, 255, 0.05)",
                    borderRadius: "16px",
                    border: "1px solid rgba(255, 107, 71, 0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "system-ui, -apple-system, sans-serif",
                    fontSize: "14px",
                    color: "#ff6b47",
                    backdropFilter: "blur(10px)",
                }}
            >
                Error loading activity data
            </div>
        );
    }

    if (!currentSession) {
        return (
            <div
                style={{
                    width: "450px",
                    height: "300px",
                    background: "rgba(255, 255, 255, 0.05)",
                    borderRadius: "16px",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "system-ui, -apple-system, sans-serif",
                    fontSize: "14px",
                    color: "rgba(255, 255, 255, 0.7)",
                    backdropFilter: "blur(10px)",
                }}
            >
                No activity data available
            </div>
        );
    }

    return (
        <div
            style={{
                background: "rgba(255, 255, 255, 0.05)",
                borderRadius: "16px",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                backdropFilter: "blur(10px)",
                padding: "16px",
            }}
        >
            <svg
                ref={chartRef}
                style={{
                    display: "block",
                }}
            />
        </div>
    );
};

export default Activity;
