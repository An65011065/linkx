// GraphVisualization.tsx - Main graph visualization component

import React, { useEffect, useRef, useCallback, useState } from "react";
import * as d3 from "d3";
import { useNetworkData } from "../hooks/useNetworkData";
import { useEvolutionState } from "../hooks/useEvolutionState";
import type { SimNetworkNode, SimNetworkLink } from "../types/network.types";
import { EvolutionPlayer } from "./EvolutionPlayer";
import SearchComponent from "./SearchComponent";
import { NetworkMetricsCalculator } from "../services/NetworkMetricsCalculator";
import { History, Trash2 } from "lucide-react";
import "../styles/graph.css";

// Function to generate straight line path with proper spacing
const generateLinkPath = (
    source: SimNetworkNode,
    target: SimNetworkNode,
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

const GraphVisualization: React.FC = () => {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const simulationRef = useRef<d3.Simulation<
        SimNetworkNode,
        SimNetworkLink
    > | null>(null);
    const tooltipRef = useRef<HTMLDivElement | null>(null);
    const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(
        null,
    );
    const networkData = useNetworkData();
    const { nodes, links, loading, error } = networkData;
    const [dimensions, setDimensions] = useState({
        width: window.innerWidth,
        height: window.innerHeight,
    });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
    const metricsCalculatorRef = useRef<NetworkMetricsCalculator | null>(null);
    const [isEvolutionMode, setIsEvolutionMode] = useState(false);
    const [selectedNode, setSelectedNode] = useState<string | null>(null);
    const [pathNodes, setPathNodes] = useState<Set<string>>(new Set());
    const [pathLinks, setPathLinks] = useState<Set<string>>(new Set());
    const evolution = useEvolutionState(nodes || [], links || [], selectedNode);
    const [searchResults, setSearchResults] = useState<Set<string>>(new Set());

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
            const domain = urlObj.hostname.replace(/^www\./, "");
            const path = urlObj.pathname !== "/" ? urlObj.pathname : "";
            const query = urlObj.search;

            // For new tab URLs, just return "New Tab"
            if (isNewTabUrl(url)) {
                return "New Tab";
            }

            // For URLs with paths/queries, show a condensed version
            if (path || query) {
                const pathParts = path.split("/").filter(Boolean);
                const lastPath = pathParts[pathParts.length - 1] || "";
                const shortQuery =
                    query.slice(0, 15) + (query.length > 15 ? "..." : "");
                return `${domain}${
                    lastPath ? "/" + lastPath : ""
                }${shortQuery}`;
            }

            return domain;
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

        // Set up zoom behavior with proper event filtering
        const zoom = d3
            .zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.1, 10])
            .filter((event) => {
                // Only allow zoom/pan if not clicking on a node
                const target = event.target as Element;
                return !target.closest(".node-group");
            })
            .on("zoom", (event) => {
                mainGroup.attr("transform", event.transform);
            });

        // Apply zoom behavior to SVG
        svg.call(zoom).on("dblclick.zoom", null); // Disable double-click zoom
        zoomRef.current = zoom;

        // Set initial zoom to be slightly zoomed out (0.7x)
        const initialTransform = d3.zoomIdentity
            .translate(centerX, centerY)
            .scale(0.7)
            .translate(-centerX, -centerY);
        svg.call(zoom.transform, initialTransform);

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
                        .distance(120) // Increased distance for better spacing
                        .strength(0.6),
                )
                .force(
                    "charge",
                    d3.forceManyBody().strength(-800).distanceMax(300), // Increased repulsion
                )
                .force("center", d3.forceCenter(centerX, centerY).strength(0.3))
                .force(
                    "collision",
                    d3.forceCollide<SimNetworkNode>().radius(32), // Increased collision radius
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
                        .distance(120)
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
            .style("opacity", (d) => {
                // Ensure consistent link ID format with useNetworkData
                const linkId = `${d.source.id}->${d.target.id}`;
                const sourceId = d.source.id;
                const targetId = d.target.id;

                if (isEvolutionMode) {
                    return evolution.visibleLinks.has(linkId) ? 1 : 0;
                } else if (selectedNode) {
                    return pathLinks.has(linkId) ? 1 : 0.15;
                } else if (searchResults.size > 0) {
                    return searchResults.has(sourceId) ||
                        searchResults.has(targetId)
                        ? 1
                        : 0.15;
                } else {
                    return 1;
                }
            })
            .style("transition", "opacity 0.3s ease"); // Smooth opacity transitions

        // Create node groups with simple click handling
        const node = mainGroup
            .append("g")
            .attr("class", "nodes")
            .selectAll<SVGGElement, SimNetworkNode>("g")
            .data(simNodes)
            .join("g")
            .attr("class", "node-group")
            .style("cursor", "pointer")
            .style("opacity", (d) => {
                if (isEvolutionMode) {
                    return evolution.visibleNodes.has(d.id) ? 1 : 0;
                } else if (selectedNode) {
                    return pathNodes.has(d.id) ? 1 : 0.15;
                } else if (searchResults.size > 0) {
                    return searchResults.has(d.id) ? 1 : 0.15;
                } else {
                    return 1;
                }
            })
            .style("transition", "opacity 0.3s ease");

        // Add drag behavior to nodes
        node.call(
            d3
                .drag<SVGGElement, SimNetworkNode>()
                .on("start", (event) => {
                    // Don't interfere with zoom/pan
                    event.sourceEvent.stopPropagation();

                    // Reset drag state
                    setIsDragging(false);
                    setDragStartPos({ x: event.x, y: event.y });

                    // Heat up simulation
                    if (!event.active && simulationRef.current) {
                        simulationRef.current.alphaTarget(0.3).restart();
                    }

                    // Fix node position
                    const d = event.subject;
                    d.fx = d.x;
                    d.fy = d.y;
                })
                .on("drag", (event) => {
                    // Calculate how far we've moved
                    const dragDistance = Math.sqrt(
                        Math.pow(event.x - dragStartPos.x, 2) +
                            Math.pow(event.y - dragStartPos.y, 2),
                    );

                    // Only consider it dragging if we've moved more than 5 pixels
                    if (dragDistance > 5) {
                        setIsDragging(true);
                        // Change cursor to indicate dragging
                        event.sourceEvent.target.style.cursor = "grabbing";

                        // Update node position
                        const d = event.subject;
                        d.fx = event.x;
                        d.fy = event.y;
                    }
                })
                .on("end", (event) => {
                    // Don't interfere with zoom/pan
                    event.sourceEvent.stopPropagation();

                    // Cool down simulation
                    if (!event.active && simulationRef.current) {
                        simulationRef.current.alphaTarget(0);
                    }

                    // Reset cursor
                    event.sourceEvent.target.style.cursor = "pointer";

                    const d = event.subject;

                    // If we actually dragged, prevent the click event
                    if (isDragging) {
                        // Keep the node fixed at its new position for a bit
                        setTimeout(() => {
                            d.fx = null;
                            d.fy = null;
                        }, 100);
                    } else {
                        // If we didn't drag, release immediately so click can work
                        d.fx = null;
                        d.fy = null;
                    }

                    // Reset drag state after a brief delay
                    setTimeout(() => {
                        setIsDragging(false);
                    }, 10);
                }),
        );

        // Add click and hover handlers to nodes
        node.on("click", (event: MouseEvent, d: SimNetworkNode) => {
            event.stopPropagation();
            event.preventDefault();

            // If clicking the same node that's already selected, open in new tab
            if (selectedNode === d.id) {
                // Don't open new tab URLs
                if (!isNewTabUrl(d.url)) {
                    window.open(d.url, "_blank");
                }
            } else {
                // First click - show the path
                tracePathToNode(d.id);
            }
        })
            .on("dblclick", (event: MouseEvent, d: SimNetworkNode) => {
                event.stopPropagation();
                event.preventDefault();

                // Don't open new tab URLs
                if (isNewTabUrl(d.url)) return;

                // Open URL in new tab
                window.open(d.url, "_blank");
            })
            .on("mouseover", (event: MouseEvent, d: SimNetworkNode) => {
                // Change cursor and add hover effect
                const nodeGroup = event.currentTarget as SVGGElement;
                nodeGroup.style.cursor = "pointer";

                // Add subtle scale effect
                d3.select(nodeGroup)
                    .transition()
                    .duration(150)
                    .attr(
                        "transform",
                        `translate(${d.x || 0},${d.y || 0}) scale(1.1)`,
                    );

                showTooltip(event, d);
            })
            .on("mouseout", (event: MouseEvent, d: SimNetworkNode) => {
                // Remove hover effect
                const nodeGroup = event.currentTarget as SVGGElement;
                d3.select(nodeGroup)
                    .transition()
                    .duration(150)
                    .attr(
                        "transform",
                        `translate(${d.x || 0},${d.y || 0}) scale(1)`,
                    );

                hideTooltip();
            })
            .on("mousemove", (event: MouseEvent) => {
                if (tooltipRef.current) {
                    const tooltip = tooltipRef.current;
                    tooltip.style.left = `${event.clientX + 10}px`;
                    tooltip.style.top = `${event.clientY - 10}px`;
                }
            });

        // Add a clickable background to each node group
        node.append("rect")
            .attr("x", -20)
            .attr("y", -20)
            .attr("width", 40)
            .attr("height", 40)
            .attr("fill", "transparent")
            .style("cursor", "pointer");
        node.append("image")
            .attr("xlink:href", (d) => getIconUrl(d.url))
            .attr("x", -16)
            .attr("y", -16)
            .attr("width", 32)
            .attr("height", 32)
            .style("filter", (d) => {
                if (selectedNode === d.id) {
                    return "drop-shadow(0px 0px 8px rgba(66, 133, 244, 0.8))";
                } else if (d.totalTime > 0) {
                    return "drop-shadow(0px 0px 3px rgba(255,68,68,0.4))";
                } else {
                    return "drop-shadow(0px 2px 4px rgba(0,0,0,0.3))";
                }
            })
            .style("pointer-events", "none") // Prevent icon from interfering with clicks
            .style("transition", "filter 0.2s ease"); // Smooth filter transitions

        // Add selection ring for selected node
        node.append("circle")
            .attr("r", 20)
            .attr("fill", "none")
            .attr("stroke", "#4285f4")
            .attr("stroke-width", 3)
            .style("opacity", (d) => (selectedNode === d.id ? 1 : 0))
            .style("transition", "opacity 0.3s ease")
            .style("pointer-events", "none");

        // Add labels to nodes with better interaction
        node.append("text")
            .attr("dy", 24)
            .attr("text-anchor", "middle")
            .style("font-family", "Nunito-Regular, Arial, sans-serif")
            .style("font-size", "11px")
            .style("pointer-events", "none") // Prevent text from interfering with clicks
            .style("user-select", "none") // Prevent text selection
            .text((d) => d.displayName || formatUrl(d.url));

        // Function to update visual elements
        function updateVisualElements() {
            // Update links
            link.attr("d", (d) => generateLinkPath(d.source, d.target));

            // Update nodes
            node.each(function (d) {
                const currentTransform = d3.select(this).attr("transform");
                const hasScale =
                    currentTransform && currentTransform.includes("scale");

                if (!hasScale) {
                    d3.select(this).attr(
                        "transform",
                        `translate(${d.x || 0},${d.y || 0})`,
                    );
                } else {
                    // Preserve scale but update position
                    const scaleMatch =
                        currentTransform.match(/scale\(([^)]+)\)/);
                    const scale = scaleMatch ? scaleMatch[1] : "1";
                    d3.select(this).attr(
                        "transform",
                        `translate(${d.x || 0},${d.y || 0}) scale(${scale})`,
                    );
                }
            });
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
        selectedNode,
        pathNodes,
        pathLinks,
        searchResults,
    ]);

    // Function to trace path to a specific node
    const tracePathToNode = useCallback(
        (targetNodeId: string) => {
            if (!nodes || !links) return;

            const pathNodesSet = new Set<string>();
            const pathLinksSet = new Set<string>();
            const visited = new Set<string>();

            // Recursive function to trace backwards from target node
            const tracePath = (nodeId: string, depth: number = 0) => {
                if (visited.has(nodeId) || depth > 10) return; // Prevent infinite loops and limit depth

                visited.add(nodeId);
                pathNodesSet.add(nodeId);

                // Find all links that point TO this node
                const incomingLinks = links.filter(
                    (link) =>
                        (typeof link.target === "string"
                            ? link.target
                            : link.target.id) === nodeId,
                );

                incomingLinks.forEach((link) => {
                    const sourceId =
                        typeof link.source === "string"
                            ? link.source
                            : link.source.id;
                    const targetId =
                        typeof link.target === "string"
                            ? link.target
                            : link.target.id;

                    pathLinksSet.add(`${sourceId}->${targetId}`);
                    pathNodesSet.add(sourceId);

                    // Recursively trace the path from the source node
                    tracePath(sourceId, depth + 1);
                });
            };

            // Start tracing from the target node
            tracePath(targetNodeId);

            setPathNodes(pathNodesSet);
            setPathLinks(pathLinksSet);
            setSelectedNode(targetNodeId);
        },
        [nodes, links],
    );

    // Function to clear path selection
    const clearPath = useCallback(() => {
        setSelectedNode(null);
        setPathNodes(new Set());
        setPathLinks(new Set());
    }, []);

    // Handle escape key to clear path selection
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                if (selectedNode) {
                    clearPath();
                } else if (isEvolutionMode) {
                    setIsEvolutionMode(false);
                    evolution.reset();
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isEvolutionMode, evolution, selectedNode, clearPath]);

    // Add handleSearch function
    const handleSearch = useCallback(
        (searchTerm: string) => {
            if (!nodes) return;

            if (!searchTerm.trim()) {
                setSearchResults(new Set());
                return;
            }

            const searchTermLower = searchTerm.toLowerCase();
            const matchingNodes = nodes.filter(
                (node) =>
                    node.url.toLowerCase().includes(searchTermLower) ||
                    (node.youtubeMetadata?.title || "")
                        .toLowerCase()
                        .includes(searchTermLower),
            );

            setSearchResults(new Set(matchingNodes.map((node) => node.id)));
        },
        [nodes],
    );

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
                height: "100vh",
                position: "relative",
                overflow: "hidden",
            }}
        >
            {!isEvolutionMode && (
                <SearchComponent nodes={nodes || []} onSearch={handleSearch} />
            )}

            {/* Evolution Player */}
            {isEvolutionMode && (
                <EvolutionPlayer
                    isPlaying={evolution.isPlaying}
                    speed={evolution.speed}
                    currentTimestamp={evolution.currentTimestamp}
                    nodes={nodes || []}
                    selectedNode={selectedNode}
                    onPlay={evolution.play}
                    onPause={evolution.pause}
                    onReset={evolution.reset}
                    onSpeedChange={evolution.setSpeed}
                    onClose={() => {
                        setIsEvolutionMode(false);
                        evolution.reset();
                        clearPath();
                    }}
                    onNodeSelect={(nodeId) => {
                        if (nodeId) {
                            tracePathToNode(nodeId);
                        } else {
                            clearPath();
                        }
                    }}
                />
            )}

            {/* Control Buttons */}
            <div
                style={{
                    position: "absolute",
                    top: "20px",
                    right: "20px",
                    display: "flex",
                    gap: "8px",
                    zIndex: 1000,
                }}
            >
                <button
                    onClick={() => {
                        setIsEvolutionMode(true);
                        evolution.reset();
                        clearPath();
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
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background =
                            "rgba(66, 133, 244, 0.2)";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background =
                            "rgba(66, 133, 244, 0.1)";
                    }}
                >
                    <History size={16} />
                </button>

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
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background =
                            "rgba(255, 68, 68, 0.2)";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background =
                            "rgba(255, 68, 68, 0.1)";
                    }}
                >
                    <Trash2 size={16} />
                </button>
            </div>

            <svg
                ref={svgRef}
                width="100%"
                height="100%"
                style={{
                    display: "block",
                    cursor: "grab",
                    position: "absolute",
                    top: 0,
                    left: 0,
                }}
                onClick={() => {
                    // Clear path when clicking on background
                    if (selectedNode) {
                        clearPath();
                    }
                }}
            />
        </div>
    );
};

export default GraphVisualization;
