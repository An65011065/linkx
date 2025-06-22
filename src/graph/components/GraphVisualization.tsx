// GraphVisualization.tsx - Main graph visualization component

import React, { useEffect, useRef, useCallback, useState } from "react";
import * as d3 from "d3";
import { useNetworkData } from "../hooks/useNetworkData";
import { useEvolutionState } from "../hooks/useEvolutionState";
import type {
    SimNetworkNode,
    SimNetworkLink,
} from "../types/network.types";
import { EvolutionPlayer } from "./EvolutionPlayer";
import ClusterVisualization from "./ClusterVisualization";
import SearchComponent from "./SearchComponent";
import { NetworkMetricsCalculator } from "../services/NetworkMetricsCalculator";
import "../styles/graph.css";


const colors = [
    "#4285f4", // Google Blue
    "#ff6b6b", // Coral Red
    "#4ecdc4", // Turquoise
    "#45b7d1", // Sky Blue
    "#96ceb4", // Mint Green
    "#feca57", // Golden Yellow
    "#ff9ff3", // Pink
    "#54a0ff", // Bright Blue
    "#5f27cd", // Purple
    "#00d2d3", // Cyan
];


const MIN_LINK_WIDTH = 1;
const MAX_LINK_WIDTH = 8;const ARROW_SIZE = 4;

// Calculate optimal force parameters based on graph size
const getForceParameters = (
    nodeCount: number,
    width: number,
    height: number,
) => {
    const area = width * height;
    const density = nodeCount / area;

    return {
        linkDistance: Math.max(80, Math.min(150, Math.sqrt(area / nodeCount))),
        chargeStrength: Math.max(
            -1000,
            Math.min(-500, -800 * Math.sqrt(density)),
        ),
        centerStrength: 0.5,
    };
};


// Function to generate straight line path with proper spacing
const generateLinkPath = (
    source: { x?: number; y?: number },
    target: { x?: number; y?: number },
): string => {
    if (!source.x || !source.y || !target.x || !target.y) return "";

    // Calculate the direction vector
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length === 0) return "";

    const nodeRadius = 16; // Half of our fixed icon size
    const spacing = 8; // Small spacing from nodes

    // Calculate start and end points with spacing
    const startPoint = {
        x: source.x + (dx * (nodeRadius + spacing)) / length,
        y: source.y + (dy * (nodeRadius + spacing)) / length,
    };
    const endPoint = {
        x: target.x - (dx * (nodeRadius + spacing)) / length,
        y: target.y - (dy * (nodeRadius + spacing)) / length,
    };

    return `M${startPoint.x},${startPoint.y} L${endPoint.x},${endPoint.y}`;
};

const DELETE_ICON = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
    <g fill="%23ff4444">
        <path d="m 2 2 l 12 12 m 0 -12 l -12 12" stroke="%23ff4444" stroke-width="2" stroke-linecap="round"/>
    </g>
</svg>`;

const GraphVisualization: React.FC = () => {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const simulationRef = useRef<d3.Simulation<
        SimNetworkNode,
        SimNetworkLink
    > | null>(null);
    const tooltipRef = useRef<HTMLDivElement | null>(null);
    const networkData = useNetworkData();
    const { nodes, links, loading, error } = networkData;
    const [dimensions, setDimensions] = useState({
        width: window.innerWidth,
        height: window.innerHeight,
    });
    const metricsCalculatorRef = useRef<NetworkMetricsCalculator | null>(null);
    const [isEvolutionMode, setIsEvolutionMode] = useState(false);
    const evolution = useEvolutionState(nodes || [], links || []);

    // Function to format time
    const formatTime = (timestamp: number) => {
        const now = Date.now();
        const timeSpent = now - timestamp;

        const hours = Math.floor(timeSpent / (60000 * 60));
        const minutes = Math.floor((timeSpent % (60000 * 60)) / 60000);
        const seconds = Math.floor((timeSpent % 60000) / 1000);

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds}s`;
        }
        return `${seconds}s`;
    };

    // Function to format metrics
    const formatMetric = (value: number): string => {
        return (value * 100).toFixed(1) + "%";
    };

    // Function to check if URL is a new tab
    const isNewTabUrl = (url: string): boolean => {
        return (
            url.startsWith("chrome://newtab") || url.startsWith("about:newtab")
        );
    };

    // Function to check if a link is a hyperlink navigation
    const isHyperlinkNavigation = (link: SimNetworkLink) => {
        return link.transitions.some((t) => t.sourceType === "hyperlink");
    };

    // Function to get node label
    const formatUrl = (url: string) => {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname.replace(/^www\./, "");
        } catch {
            return url;
        }
    };

    // Function to get icon URL
    const getIconUrl = (url: string) => {
        try {
            const urlObj = new URL(url);
            return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`;
        } catch {
            return "";
        }
    };

    // Function to show tooltip
    const showTooltip = (event: MouseEvent, d: SimNetworkNode) => {
        if (!tooltipRef.current) return;

        const tooltip = tooltipRef.current;
        const timeSpent = d.lastVisited ? formatTime(d.lastVisited) : "0s";
        const metrics = metricsCalculatorRef.current?.getMetrics(d.id) || {
            pageRank: 0,
            betweenness: 0,
            degree: 0,
            closeness: 0,
        };

        let titleDisplay = "";
        if (d.youtubeMetadata) {
            titleDisplay = `${d.youtubeMetadata.title}<br/><span style="color: #fff">by ${d.youtubeMetadata.author_name}</span>`;
        } else {
            titleDisplay = isNewTabUrl(d.url) ? "New Tab" : d.url;
        }

        tooltip.innerHTML = `
            <div class="url">${titleDisplay}</div>
            <div class="time">Time spent: ${timeSpent}</div>
            <hr>
            <div class="metrics">
                <div>PageRank: ${formatMetric(metrics.pageRank)}</div>
                <div>Betweenness: ${formatMetric(metrics.betweenness)}</div>
                <div>Degree: ${metrics.degree}</div>
                <div>Closeness: ${formatMetric(metrics.closeness)}</div>
            </div>
        `;
        tooltip.style.display = "block";
        tooltip.classList.add("show");

        // Position tooltip
         const tooltipRect = tooltip.getBoundingClientRect();

        // Calculate position to ensure tooltip stays within viewport
        let left = event.clientX + 10;
        let top = event.clientY + 10;

        // Adjust if tooltip would go off screen
        if (left + tooltipRect.width > window.innerWidth) {
            left = event.clientX - tooltipRect.width - 10;
        }
        if (top + tooltipRect.height > window.innerHeight) {
            top = event.clientY - tooltipRect.height - 10;
        }

        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
    };

    // Function to hide tooltip
    const hideTooltip = () => {
        if (tooltipRef.current) {
            tooltipRef.current.style.display = "none";
            tooltipRef.current.classList.remove("show");
        }
    };

    // Create tooltip div if it doesn't exist
    useEffect(() => {
        if (!tooltipRef.current) {
            const tooltip = document.createElement("div");
            tooltip.className = "tooltip";
            tooltip.style.display = "none";
            document.body.appendChild(tooltip);
            tooltipRef.current = tooltip;
        }

        return () => {
            if (tooltipRef.current) {
                document.body.removeChild(tooltipRef.current);
                tooltipRef.current = null;
            }
        };
    }, []);

    // Handle resize with smooth transition
    const updateDimensions = () => {
        if (containerRef.current) {
            const { width, height } =
                containerRef.current.getBoundingClientRect();
            setDimensions({ width, height });

            // Smoothly transition to new center when window resizes
            if (simulationRef.current) {
                const centerX = width / 2;
                const centerY = height / 2;
                simulationRef.current
                    .force(
                        "center",
                        d3.forceCenter(centerX, centerY).strength(0.1),
                    )
                    .alpha(0.3)
                    .restart();
            }
        }
    };

    // Set up resize observer
    useEffect(() => {
        updateDimensions();
        const resizeObserver = new ResizeObserver(updateDimensions);
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }
        return () => resizeObserver.disconnect();
    }, []);

    // Initialize or update the visualization
    useEffect(() => {
        if (!svgRef.current || !nodes || !links) return;

        const svg = d3.select(svgRef.current);
        const { width, height } = dimensions;
        const centerX = width / 2;
        const centerY = height / 2;

        // Clear previous content
        svg.selectAll("*").remove();

        // Create main group for zoom/pan
        const mainGroup = svg.append("g").attr("class", "main-group");

        // Create arrow marker definitions
        svg.append("defs")
            .selectAll("marker")
            .data(["end"])
            .join("marker")
            .attr("id", "arrow")
            .attr("viewBox", "0 -3 6 6")
            .attr("refX", 5)
            .attr("refY", 0)
            .attr("markerWidth", 4)
            .attr("markerHeight", 4)
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M0,-3L6,0L0,3")
            .attr("fill", "#999");

        // Create nodes with proper typing and initial positions
        const simNodes: SimNetworkNode[] = nodes.map((node) => {
            const existingNode = simulationRef.current
                ?.nodes()
                .find((n) => n.id === node.id);
            return {
                ...node,
                // Preserve existing node positions if they exist
                x: existingNode?.x ?? Math.random() * width * 0.6 + width * 0.2,
                y:
                    existingNode?.y ??
                    Math.random() * height * 0.6 + height * 0.2,
                vx: existingNode?.vx ?? 0,
                vy: existingNode?.vy ?? 0,
                fx: existingNode?.fx ?? null,
                fy: existingNode?.fy ?? null,
            };
        });

        // Create links with proper typing
        const simLinks = links
            .map((link): SimNetworkLink | null => {
                const sourceNode = simNodes.find((n) => n.id === link.source);
                const targetNode = simNodes.find((n) => n.id === link.target);

                if (!sourceNode || !targetNode) return null;

                return {
                    source: sourceNode,
                    target: targetNode,
                    weight: link.weight,
                    tabId: link.tabId || 0,
                    frequency: link.frequency || link.weight,
                    transitions: link.transitions,
                };
            })
            .filter((link): link is SimNetworkLink => link !== null);

        // Create or update the force simulation
        if (!simulationRef.current) {
            // Create new simulation if it doesn't exist
            simulationRef.current = d3
                .forceSimulation<SimNetworkNode, SimNetworkLink>(simNodes)
                .force(
                    "link",
                    d3
                        .forceLink<SimNetworkNode, SimNetworkLink>(simLinks)
                        .id((d) => d.id)
                        .distance(100)
                        .strength(0.6),
                )
                .force(
                    "charge",
                    d3.forceManyBody().strength(-500).distanceMax(250),
                )
                .force("center", d3.forceCenter(centerX, centerY).strength(0.3))
                .force(
                    "collision",
                    d3.forceCollide<SimNetworkNode>().radius(24),
                );
        } else {
            // Update existing simulation
            simulationRef.current
                .nodes(simNodes)
                .force(
                    "link",
                    d3
                        .forceLink<SimNetworkNode, SimNetworkLink>(simLinks)
                        .id((d) => d.id)
                        .distance(100)
                        .strength(0.6),
                )
                .alpha(isEvolutionMode ? 0 : 0.3) // Don't heat up the simulation during evolution
                .restart();
        }

        // Create links
        const link = mainGroup
            .append("g")
            .attr("class", "links")
            .selectAll("path")
            .data(simLinks)
            .join("path")
            .attr("fill", "none")
            .attr("stroke", (d) => {
                if (isHyperlinkNavigation(d)) {
                    return "#ffa4a5";
                } else {
                    return "#8bb0f4";
                }
            })
            .attr("stroke-dasharray", (d) =>
                isHyperlinkNavigation(d) ? "5,5" : "none",
            )
            .attr("stroke-width", 2)
            .attr("marker-end", "url(#arrow)")
            .attr("d", (d) => generateLinkPath(d.source, d.target))
            .style("opacity", (d) =>
                isEvolutionMode
                    ? evolution.visibleLinks.has(
                          `${d.source.id}-${d.target.id}`,
                      )
                        ? 1
                        : 0
                    : 1,
            )
            .style("transition", "opacity 0.3s ease"); // Smooth opacity transitions

        // Create node groups
        const node = mainGroup
            .append("g")
            .attr("class", "nodes")
            .selectAll<SVGGElement, SimNetworkNode>("g")
            .data(simNodes)
            .join("g")
            .call(
                d3
                    .drag<SVGGElement, SimNetworkNode>()
                    .on("start", (event) => {
                        if (!event.active && simulationRef.current) {
                            simulationRef.current.alphaTarget(0.3).restart();
                        }
                        const d = event.subject;
                        d.fx = d.x;
                        d.fy = d.y;
                    })
                    .on("drag", (event) => {
                        const d = event.subject;
                        d.fx = event.x;
                        d.fy = event.y;
                    })
                    .on("end", (event) => {
                        if (!event.active && simulationRef.current) {
                            simulationRef.current.alphaTarget(0);
                        }
                        const d = event.subject;
                        d.fx = null;
                        d.fy = null;
                    }),
            )
            .style("opacity", (d) =>
                isEvolutionMode
                    ? evolution.visibleNodes.has(d.id)
                        ? 1
                        : 0
                    : 1,
            )
            .style("transition", "opacity 0.3s ease") // Smooth opacity transitions
            .on("mouseover", (event: MouseEvent, d: SimNetworkNode) =>
                showTooltip(event, d),
            )
            .on("mouseout", hideTooltip)
            .on("mousemove", (event: MouseEvent, d: SimNetworkNode) => {
                if (tooltipRef.current) {
                    const tooltip = tooltipRef.current;
                    tooltip.style.left = `${event.clientX + 10}px`;
                    tooltip.style.top = `${event.clientY - 10}px`;
                }
            });

        // Add icons to nodes
        node.append("image")
            .attr("xlink:href", (d) => getIconUrl(d.url))
            .attr("x", -16)
            .attr("y", -16)
            .attr("width", 32)
            .attr("height", 32)
            .style("filter", (d) =>
                d.totalTime > 0
                    ? "drop-shadow(0px 0px 3px rgba(255,68,68,0.4))"
                    : "drop-shadow(0px 2px 4px rgba(0,0,0,0.3))",
            );

        // Add labels to nodes
        node.append("text")
            .attr("dy", 24)
            .attr("text-anchor", "middle")
            .style("font-family", "Nunito-Regular, Arial, sans-serif")
            .style("font-size", "11px")
            .text((d) => d.displayName || formatUrl(d.url));

        // Function to update visual elements
        function updateVisualElements() {
            // Update links with new path generation
            link.attr("d", (d) => generateLinkPath(d.source, d.target));

            // Update nodes
            node.attr("transform", (d) => `translate(${d.x || 0},${d.y || 0})`);
        }

        // Set up simulation tick handler
        simulationRef.current.on("tick", updateVisualElements);

        // Cleanup
        return () => {
            if (simulationRef.current) {
                simulationRef.current.stop();
            }
        };
    }, [
        nodes,
        links,
        dimensions,
        isEvolutionMode,
        evolution.visibleNodes,
        evolution.visibleLinks,
    ]);

    // Handle escape key to exit evolution mode
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape" && isEvolutionMode) {
                setIsEvolutionMode(false);
                evolution.reset();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isEvolutionMode, evolution]);

    if (loading) {
        return <div>Loading network data...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
            }}
        >
            <SearchComponent nodes={nodes} onSearch={() => {}} />

            {/* Evolution Player */}
            {isEvolutionMode && (
                <EvolutionPlayer
                    isPlaying={evolution.isPlaying}
                    speed={evolution.speed}
                    currentTimestamp={evolution.currentTimestamp}
                    onPlay={evolution.play}
                    onPause={evolution.pause}
                    onReset={evolution.reset}
                    onSpeedChange={evolution.setSpeed}
                    onClose={() => {
                        setIsEvolutionMode(false);
                        evolution.reset();
                    }}
                />
            )}

            {/* Evolution Mode Toggle Button */}
            <div
                style={{
                    position: "absolute",
                    top: "20px",
                    right: "72px", // Position next to delete button
                    zIndex: 1000,
                }}
            >
                <button
                    onClick={() => {
                        setIsEvolutionMode(true);
                        evolution.reset();
                    }}
                    style={{
                        width: "36px",
                        height: "36px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "rgba(66, 133, 244, 0.1)",
                        color: "#4285f4",
                        border: "none",
                        borderRadius: "50%",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                    }}
                    title="Show network evolution"
                >
                    ⏱
                </button>
            </div>

            {/* Delete Button */}
            <div
                style={{
                    position: "absolute",
                    top: "20px",
                    right: "20px",
                    zIndex: 1000,
                }}
            >
                <button
                    onClick={() => {
                        if (
                            window.confirm(
                                "Are you sure you want to delete all browsing data? This action cannot be undone.",
                            )
                        ) {
                            chrome.storage.local.clear();
                            window.location.reload();
                        }
                    }}
                    style={{
                        width: "36px",
                        height: "36px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "rgba(255, 68, 68, 0.1)",
                        color: "#ff4444",
                        border: "none",
                        borderRadius: "50%",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                    }}
                    title="Delete all data"
                >
                    <img
                        src={DELETE_ICON}
                        alt="Delete all data"
                        style={{
                            width: "16px",
                            height: "16px",
                        }}
                    />
                </button>
            </div>

            <svg
                ref={svgRef}
                width={dimensions.width}
                height={dimensions.height}
                style={{
                    display: "block",
                }}
            />
        </div>
    );
};

export default GraphVisualization;
