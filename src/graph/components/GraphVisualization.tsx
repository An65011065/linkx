import React, { useEffect, useRef, useCallback, useState } from "react";
import * as d3 from "d3";
import { useNetworkData } from "../hooks/useNetworkData";
import { useEvolutionState } from "../hooks/useEvolutionState";
import type {
    SimNetworkNode,
    SimNetworkLink,
    NetworkNode,
    NetworkLink,
} from "../types/network.types";
import { EvolutionPlayer } from "./EvolutionPlayer";
import SearchComponent from "./SearchComponent";
import { NetworkMetricsCalculator } from "../services/NetworkMetricsCalculator";
import { History, Expand } from "lucide-react";
import "../styles/graph.css";

const generateLinkPath = (
    source: SimNetworkNode,
    target: SimNetworkNode,
): string => {
    if (!source.x || !source.y || !target.x || !target.y) return "";
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    if (length === 0) return "";
    const nodeRadius = 16;
    const spacing = 8;
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

interface GraphVisualizationProps {
    isDarkMode?: boolean;
    isExpanded?: boolean;
    onExpandToggle?: (expanded: boolean) => void;
}

const GraphVisualization: React.FC<GraphVisualizationProps> = ({
    isDarkMode = true,
    isExpanded = false,
    onExpandToggle,
}) => {
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
    const metricsCalculatorRef = useRef<NetworkMetricsCalculator | null>(null);

    const networkData = useNetworkData();
    const { nodes, links, loading, error } = networkData;

    const [dimensions, setDimensions] = useState({
        width: window.innerWidth,
        height: window.innerHeight,
    });
    const [, setIsDragging] = useState(false);
    const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
    const [isEvolutionMode, setIsEvolutionMode] = useState(false);
    const [selectedNode, setSelectedNode] = useState<string | null>(null);
    const [pathNodes, setPathNodes] = useState<Set<string>>(new Set());
    const [pathLinks, setPathLinks] = useState<Set<string>>(new Set());
    const [searchResults, setSearchResults] = useState<Set<string>>(new Set());
    const [pathOrder, setPathOrder] = useState<Map<string, number>>(new Map());

    const evolution = useEvolutionState(nodes || [], links || [], selectedNode);

    const formatTime = (timestamp: number) => {
        const timeSpent = Date.now() - timestamp;
        const hours = Math.floor(timeSpent / (60000 * 60));
        const minutes = Math.floor((timeSpent % (60000 * 60)) / 60000);
        const seconds = Math.floor((timeSpent % 60000) / 1000);
        if (hours > 0) return `${hours}h ${minutes}m`;
        else if (minutes > 0) return `${minutes}m ${seconds}s`;
        return `${seconds}s`;
    };

    const formatMetric = (value: number): string =>
        (value * 100).toFixed(1) + "%";

    const isNewTabUrl = (url: string): boolean =>
        url.startsWith("chrome://newtab") || url.startsWith("about:newtab");

    const isHyperlinkNavigation = (link: SimNetworkLink) =>
        link.transitions.some((t) => t.sourceType === "hyperlink");

    const formatUrl = (url: string) => {
        try {
            if (isNewTabUrl(url)) return "New Tab";
            const urlObj = new URL(url);
            return urlObj.hostname.replace(/^www\./, "");
        } catch {
            return url;
        }
    };

    const getIconUrl = (url: string) => {
        try {
            const urlObj = new URL(url);
            return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`;
        } catch {
            return "";
        }
    };

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
            titleDisplay = `${
                d.youtubeMetadata.title
            }<br/><span style="color: ${isDarkMode ? "#fff" : "#333"}">by ${
                d.youtubeMetadata.author_name
            }</span>`;
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

        tooltip.style.background = isDarkMode
            ? "rgba(0, 0, 0, 0.9)"
            : "rgba(255, 255, 255, 0.9)";
        tooltip.style.color = isDarkMode ? "#fff" : "#333";
        tooltip.style.border = isDarkMode
            ? "1px solid rgba(255, 255, 255, 0.2)"
            : "1px solid rgba(0, 0, 0, 0.2)";

        let left = event.clientX + 10;
        let top = event.clientY + 10;
        const tooltipRect = tooltip.getBoundingClientRect();
        if (left + tooltipRect.width > window.innerWidth)
            left = event.clientX - tooltipRect.width - 10;
        if (top + tooltipRect.height > window.innerHeight)
            top = event.clientY - tooltipRect.height - 10;
        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
    };

    const hideTooltip = () => {
        if (tooltipRef.current) {
            tooltipRef.current.style.display = "none";
            tooltipRef.current.classList.remove("show");
        }
    };

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

    const updateDimensions = () => {
        if (containerRef.current) {
            const { width, height } =
                containerRef.current.getBoundingClientRect();
            setDimensions({ width, height });
            if (simulationRef.current) {
                simulationRef.current
                    .force(
                        "center",
                        d3.forceCenter(width / 2, height / 2).strength(0.1),
                    )
                    .alpha(0.3)
                    .restart();
            }
        }
    };

    useEffect(() => {
        updateDimensions();
        const resizeObserver = new ResizeObserver(updateDimensions);
        if (containerRef.current) resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    useEffect(() => {
        if (!svgRef.current || !nodes || !links) return;

        const svg = d3.select(svgRef.current);
        const { width, height } = dimensions;
        const centerX = width / 2;
        const centerY = height / 2;

        svg.selectAll("*").remove();
        const mainGroup = svg.append("g").attr("class", "main-group");

        const zoom = d3
            .zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.1, 10])
            .filter((event) => !event.target.closest(".node-group"))
            .on("zoom", (event) =>
                mainGroup.attr("transform", event.transform),
            );

        svg.call(zoom).on("dblclick.zoom", null);
        zoomRef.current = zoom;

        const initialTransform = d3.zoomIdentity.translate(100, 0).scale(0.7);
        svg.call(zoom.transform, initialTransform);

        const arrowColor = isDarkMode ? "#999" : "#666";
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
            .attr("fill", arrowColor);

        // Horizontal BFS layout
        const createTreeLayout = (
            nodes: NetworkNode[],
            links: NetworkLink[],
        ) => {
            const adjacency = new Map<string, string[]>();
            const outgoingCount = new Map<string, number>();
            const incomingCount = new Map<string, number>();

            nodes.forEach((node) => {
                adjacency.set(node.id, []);
                outgoingCount.set(node.id, 0);
                incomingCount.set(node.id, 0);
            });

            links.forEach((link) => {
                const sourceId =
                    typeof link.source === "string"
                        ? link.source
                        : (link.source as NetworkNode).id;
                const targetId =
                    typeof link.target === "string"
                        ? link.target
                        : (link.target as NetworkNode).id;
                adjacency.get(sourceId)?.push(targetId);
                outgoingCount.set(
                    sourceId,
                    (outgoingCount.get(sourceId) || 0) + 1,
                );
                incomingCount.set(
                    targetId,
                    (incomingCount.get(targetId) || 0) + 1,
                );
            });

            // Identify isolated nodes (no incoming or outgoing edges)
            const isolatedNodes = new Set<string>();
            nodes.forEach((node) => {
                const outgoing = outgoingCount.get(node.id) || 0;
                const incoming = incomingCount.get(node.id) || 0;
                if (outgoing === 0 && incoming === 0) {
                    isolatedNodes.add(node.id);
                }
            });

            const sortedByOutgoing = [...nodes].sort((a, b) => {
                const aIsNewTab = isNewTabUrl(a.url);
                const bIsNewTab = isNewTabUrl(b.url);
                if (aIsNewTab && !bIsNewTab) return -1;
                if (!aIsNewTab && bIsNewTab) return 1;
                return (
                    (outgoingCount.get(b.id) || 0) -
                    (outgoingCount.get(a.id) || 0)
                );
            });

            const root = sortedByOutgoing[0];
            const levels = new Map<string, number>();
            const visited = new Set<string>();
            const queue: [string, number][] = [[root.id, 0]];
            levels.set(root.id, 0);
            visited.add(root.id);

            while (queue.length > 0) {
                const [currentNodeId, currentLevel] = queue.shift()!;
                const children = adjacency.get(currentNodeId) || [];
                children.forEach((childId) => {
                    if (!visited.has(childId)) {
                        visited.add(childId);
                        levels.set(childId, currentLevel + 1);
                        queue.push([childId, currentLevel + 1]);
                    }
                });
            }

            // Handle remaining non-isolated nodes
            nodes.forEach((node) => {
                if (!visited.has(node.id) && !isolatedNodes.has(node.id)) {
                    const outgoing = outgoingCount.get(node.id) || 0;
                    if (outgoing >= 3) levels.set(node.id, 1);
                    else if (outgoing >= 1) levels.set(node.id, 2);
                    else levels.set(node.id, 3);
                }
            });

            const levelGroups = new Map<number, string[]>();
            levels.forEach((level, nodeId) => {
                if (!levelGroups.has(level)) {
                    levelGroups.set(level, []);
                }
                levelGroups.get(level)!.push(nodeId);
            });

            const positions = new Map<string, { x: number; y: number }>();
            const levelWidth = 120;
            const nodeSpacing = 80;
            const leftMargin = 50;

            // Position connected nodes in their levels
            levelGroups.forEach((nodeIds, level) => {
                const x = leftMargin + level * levelWidth;
                const nodesInLevel = nodeIds.length;
                if (nodesInLevel === 1) {
                    positions.set(nodeIds[0], { x, y: centerY });
                } else {
                    const totalHeight = (nodesInLevel - 1) * nodeSpacing;
                    const startY = centerY - totalHeight / 2;
                    nodeIds.forEach((nodeId, index) => {
                        const y = startY + index * nodeSpacing;
                        positions.set(nodeId, { x, y });
                    });
                }
            });

            // Position isolated nodes in a compact area at the bottom right
            if (isolatedNodes.size > 0) {
                const isolatedNodesArray = Array.from(isolatedNodes);
                const maxLevel = Math.max(...Array.from(levels.values())) || 0;
                const isolatedStartX = leftMargin + (maxLevel + 1) * levelWidth;
                const isolatedStartY = centerY + 100; // Below the main network
                const isolatedSpacing = 60; // Tighter spacing for isolated nodes
                const itemsPerRow = Math.ceil(
                    Math.sqrt(isolatedNodesArray.length),
                );

                isolatedNodesArray.forEach((nodeId, index) => {
                    const row = Math.floor(index / itemsPerRow);
                    const col = index % itemsPerRow;
                    const x = isolatedStartX + col * isolatedSpacing;
                    const y = isolatedStartY + row * isolatedSpacing;
                    positions.set(nodeId, { x, y });
                });
            }

            return positions;
        };

        const treePositions = createTreeLayout(nodes, links);

        const simNodes: SimNetworkNode[] = nodes.map((node) => {
            const existingNode = simulationRef.current
                ?.nodes()
                .find((n) => n.id === node.id);
            const treePos = treePositions.get(node.id);
            return {
                ...node,
                x: existingNode?.x ?? treePos?.x ?? centerX,
                y: existingNode?.y ?? treePos?.y ?? centerY,
                vx: 0,
                vy: 0,
                fx: null,
                fy: null,
            };
        });

        const simLinks = links
            .filter(
                (link) =>
                    simNodes.find((n) => n.id === link.source) &&
                    simNodes.find((n) => n.id === link.target),
            )
            .map(
                (link): SimNetworkLink => ({
                    source: simNodes.find((n) => n.id === link.source)!,
                    target: simNodes.find((n) => n.id === link.target)!,
                    weight: link.weight,
                    tabId: link.tabId || 0,
                    frequency: link.frequency || link.weight,
                    transitions: link.transitions,
                }),
            );

        if (!simulationRef.current) {
            simulationRef.current = d3
                .forceSimulation<SimNetworkNode, SimNetworkLink>(simNodes)
                .force(
                    "link",
                    d3
                        .forceLink<SimNetworkNode, SimNetworkLink>(simLinks)
                        .id((d) => d.id)
                        .distance(120)
                        .strength(0),
                )
                .force("charge", d3.forceManyBody().strength(0))
                .force("center", d3.forceCenter(centerX, centerY).strength(0))
                .force("collision", d3.forceCollide<SimNetworkNode>().radius(0))
                .alpha(0)
                .stop();
        } else {
            simulationRef.current
                .nodes(simNodes)
                .force(
                    "link",
                    d3
                        .forceLink<SimNetworkNode, SimNetworkLink>(simLinks)
                        .id((d) => d.id)
                        .distance(120)
                        .strength(0),
                )
                .alpha(0)
                .stop();
        }

        const link = mainGroup
            .append("g")
            .attr("class", "links")
            .selectAll("path")
            .data(simLinks)
            .join("path")
            .attr("fill", "none")
            .attr("stroke", (d) =>
                isHyperlinkNavigation(d) ? "#ffa4a5" : "#4285f4",
            )
            .attr("stroke-dasharray", (d) =>
                isHyperlinkNavigation(d) ? "5,5" : "none",
            )
            .attr("stroke-width", 2)
            .attr("marker-end", "url(#arrow)")
            .attr("d", (d) => generateLinkPath(d.source, d.target))
            .style("opacity", (d) => {
                const linkId = `${d.source.id}->${d.target.id}`;
                const sourceId = d.source.id;
                const targetId = d.target.id;
                if (isEvolutionMode)
                    return evolution.visibleLinks.has(linkId) ? 1 : 0;
                else if (selectedNode) return pathLinks.has(linkId) ? 1 : 0.15;
                else if (searchResults.size > 0)
                    return searchResults.has(sourceId) ||
                        searchResults.has(targetId)
                        ? 1
                        : 0.15;
                return 1;
            })
            .style("transition", "opacity 0.3s ease");

        const node = mainGroup
            .append("g")
            .attr("class", "nodes")
            .selectAll<SVGGElement, SimNetworkNode>("g")
            .data(simNodes)
            .join("g")
            .attr("class", "node-group")
            .style("cursor", "pointer")
            .style("opacity", (d) => {
                if (isEvolutionMode)
                    return evolution.visibleNodes.has(d.id) ? 1 : 0;
                else if (selectedNode) return pathNodes.has(d.id) ? 1 : 0.15;
                else if (searchResults.size > 0)
                    return searchResults.has(d.id) ? 1 : 0.15;
                return 1;
            })
            .style("transition", "opacity 0.3s ease");

        node.call(
            d3
                .drag<SVGGElement, SimNetworkNode>()
                .on("start", (event) => {
                    event.sourceEvent.stopPropagation();
                    setIsDragging(false);
                    setDragStartPos({ x: event.x, y: event.y });
                })
                .on("drag", (event) => {
                    const dragDistance = Math.sqrt(
                        Math.pow(event.x - dragStartPos.x, 2) +
                            Math.pow(event.y - dragStartPos.y, 2),
                    );
                    if (dragDistance > 5) {
                        setIsDragging(true);
                        event.sourceEvent.target.style.cursor = "grabbing";
                        const d = event.subject;
                        d.x = event.x;
                        d.y = event.y;
                        updateVisualElements();
                    }
                })
                .on("end", (event) => {
                    event.sourceEvent.stopPropagation();
                    event.sourceEvent.target.style.cursor = "pointer";
                    setTimeout(() => setIsDragging(false), 50);
                }),
        );

        node.on("click", (event: MouseEvent, d: SimNetworkNode) => {
            event.stopPropagation();
            event.preventDefault();
            if (selectedNode === d.id) {
                if (!isNewTabUrl(d.url)) window.open(d.url, "_blank");
            } else {
                tracePathToNode(d.id);
            }
        })
            .on("dblclick", (event: MouseEvent, d: SimNetworkNode) => {
                event.stopPropagation();
                event.preventDefault();
                if (!isNewTabUrl(d.url)) window.open(d.url, "_blank");
            })
            .on("mouseover", (event: MouseEvent, d: SimNetworkNode) => {
                const nodeGroup = event.currentTarget as SVGGElement;
                nodeGroup.style.cursor = "pointer";
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
                d3.select(event.currentTarget as SVGGElement)
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
                    tooltipRef.current.style.left = `${event.clientX + 10}px`;
                    tooltipRef.current.style.top = `${event.clientY - 10}px`;
                }
            });

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
                if (selectedNode === d.id)
                    return "drop-shadow(0px 0px 8px rgba(66, 133, 244, 0.8))";
                else if (d.totalTime > 0)
                    return "drop-shadow(0px 0px 3px rgba(255,68,68,0.4))";
                return "drop-shadow(0px 2px 4px rgba(0,0,0,0.3))";
            })
            .style("pointer-events", "none")
            .style("transition", "filter 0.2s ease");

        node.append("circle")
            .attr("r", 20)
            .attr("fill", "none")
            .attr("stroke", "#4285f4")
            .attr("stroke-width", 3)
            .style("opacity", (d) => (selectedNode === d.id ? 1 : 0))
            .style("transition", "opacity 0.3s ease")
            .style("pointer-events", "none");

        const textColor = isDarkMode ? "#ffffff" : "#333333";
        node.append("text")
            .attr("dy", 24)
            .attr("text-anchor", "middle")
            .style("font-family", "Nunito-Regular, Arial, sans-serif")
            .style("font-size", "11px")
            .style("fill", textColor)
            .style("pointer-events", "none")
            .style("user-select", "none")
            .text((d) => d.displayName || formatUrl(d.url));

        node.append("text")
            .attr("dy", -28)
            .attr("text-anchor", "middle")
            .attr("class", "sequence-number")
            .style("font-family", "Nunito-Bold, Arial, sans-serif")
            .style("font-size", "14px")
            .style("fill", "#4285f4")
            .style("pointer-events", "none")
            .style("opacity", (d) => (pathOrder.has(d.id) ? 1 : 0))
            .text((d) => pathOrder.get(d.id) || "");

        function updateVisualElements() {
            link.attr("d", (d) => generateLinkPath(d.source, d.target));
            node.attr("transform", (d) => `translate(${d.x || 0},${d.y || 0})`);
        }

        updateVisualElements();

        return () => {
            if (simulationRef.current) simulationRef.current.stop();
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
        pathOrder,
        isDarkMode,
    ]);

    const tracePathToNode = useCallback(
        (targetNodeId: string) => {
            if (!nodes || !links) return;

            const pathNodesSet = new Set<string>();
            const pathLinksSet = new Set<string>();
            const nodeOrder = new Map<string, number>();
            const path: string[] = [];

            let currentNodeId = targetNodeId;
            const visited = new Set<string>();

            while (currentNodeId && !visited.has(currentNodeId)) {
                visited.add(currentNodeId);
                path.unshift(currentNodeId);

                const incomingLinks = links.filter(
                    (link) =>
                        (typeof link.target === "string"
                            ? link.target
                            : (link.target as SimNetworkNode).id) ===
                        currentNodeId,
                );

                if (incomingLinks.length === 0) break;

                let earliestLink = incomingLinks[0];
                let earliestTime = Infinity;

                incomingLinks.forEach((link) => {
                    const earliestTransition = link.transitions.reduce(
                        (earliest, t) =>
                            t.timestamp < earliest ? t.timestamp : earliest,
                        Infinity,
                    );
                    if (earliestTransition < earliestTime) {
                        earliestTime = earliestTransition;
                        earliestLink = link;
                    }
                });

                currentNodeId =
                    typeof earliestLink.source === "string"
                        ? earliestLink.source
                        : (earliestLink.source as SimNetworkNode).id;

                if (!visited.has(currentNodeId)) {
                    pathLinksSet.add(
                        `${currentNodeId}->${
                            typeof earliestLink.target === "string"
                                ? earliestLink.target
                                : (earliestLink.target as SimNetworkNode).id
                        }`,
                    );
                }
            }

            path.forEach((nodeId, index) => {
                pathNodesSet.add(nodeId);
                nodeOrder.set(nodeId, index + 1);
            });

            setPathNodes(pathNodesSet);
            setPathLinks(pathLinksSet);
            setPathOrder(nodeOrder);
            setSelectedNode(targetNodeId);
        },
        [nodes, links],
    );

    const clearPath = useCallback(() => {
        setSelectedNode(null);
        setPathNodes(new Set());
        setPathLinks(new Set());
        setPathOrder(new Map());
    }, []);

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

    if (loading) return <div>Loading network data...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100vh",
                position: "relative",
                overflow: "hidden",
                background: isDarkMode ? "#000000" : "#ffffff",
                color: isDarkMode ? "#ffffff" : "#333333",
                transition: "background 0.3s ease, color 0.3s ease",
            }}
        >
            {!isEvolutionMode && ( // Add this condition
                <SearchComponent
                    nodes={nodes || []}
                    onSearch={handleSearch}
                    isDarkMode={isDarkMode}
                />
            )}

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
                    onNodeSelect={(nodeId) =>
                        nodeId ? tracePathToNode(nodeId) : clearPath()
                    }
                    isDarkMode={isDarkMode} // Add this line
                />
            )}

            {/* Expand Button - Only show when not expanded */}
            {!isExpanded && onExpandToggle && (
                <div
                    style={{
                        position: "absolute",
                        top: "0.75rem",
                        left: "0.75rem",
                        zIndex: 1001,
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.1rem",
                    }}
                >
                    <button
                        onClick={() => onExpandToggle(true)}
                        className={`p-2 rounded-lg transition-colors ${
                            isDarkMode ? "text-white" : "text-gray-700"
                        } hover:scale-110 transition-all duration-300`}
                        title="Expand to full screen"
                    >
                        <Expand size={20} />
                    </button>
                    {/* Evolution Button */}
                    <button
                        onClick={() => {
                            if (isEvolutionMode) {
                                setIsEvolutionMode(false);
                                evolution.reset();
                                clearPath();
                            } else {
                                setIsEvolutionMode(true);
                                evolution.reset();
                                clearPath();
                            }
                        }}
                        className={`p-2 rounded-lg transition-colors -mt-[0.3rem] hover:scale-110`}
                        style={{
                            color: isEvolutionMode
                                ? "#4285f4"
                                : isDarkMode
                                ? "white"
                                : "#374151",
                        }}
                        title="Show network evolution"
                    >
                        <History size={20} />
                    </button>
                </div>
            )}

            <div
                style={{
                    position: "absolute",
                    top: "20px",
                    right: "20px",
                    display: "flex",
                    gap: "8px",
                    zIndex: 1000,
                }}
            ></div>

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
                onClick={() => selectedNode && clearPath()}
            />
        </div>
    );
};

export default GraphVisualization;
