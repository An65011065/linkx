import React, { useEffect } from "react";
import * as d3 from "d3";
import type { NetworkRendererProps } from "../types/component.types";
import type { SimulationNode, SimulationLink } from "../types/layout.types";
import {
    getIconUrl,
    getFallbackIcon,
    isNewTabUrl,
} from "../utils/urlFormatting";

/**
 * NetworkRenderer component that handles pure visual rendering of nodes and links
 * Uses shared layout data for positioning - no layout calculations here
 */
const NetworkRenderer: React.FC<NetworkRendererProps> = ({
    svgGroup,
    nodes,
    links,
    isDarkMode,
    isStandalone,
    selectedNode,
    pathNodes,
    pathLinks,
    searchResults,
    pathOrder,
    isEvolutionMode,
    visibleNodes,
    visibleLinks,
    onNodeClick,
    onNodeDoubleClick,
    onNodeHover,
    onNodeLeave,
    onNodeDrag,
}) => {
    // Utility functions
    const isHyperlinkNavigation = (link: SimulationLink) =>
        link.transitions.some((t) => t.sourceType === "hyperlink");

    const generateLinkPath = (
        source: SimulationNode,
        target: SimulationNode,
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

    // Get opacity for links based on current mode
    const getLinkOpacity = (link: SimulationLink): number => {
        const linkId = `${link.source.id}->${link.target.id}`;
        const sourceId = link.source.id;
        const targetId = link.target.id;

        if (isEvolutionMode) return visibleLinks.has(linkId) ? 1 : 0;
        else if (selectedNode) return pathLinks.has(linkId) ? 1 : 0.15;
        else if (searchResults.size > 0)
            return searchResults.has(sourceId) || searchResults.has(targetId)
                ? 1
                : 0.15;
        return 1;
    };

    // Get opacity for nodes based on current mode
    const getNodeOpacity = (node: SimulationNode): number => {
        if (isEvolutionMode) return visibleNodes.has(node.id) ? 1 : 0;
        else if (selectedNode) return pathNodes.has(node.id) ? 1 : 0.15;
        else if (searchResults.size > 0)
            return searchResults.has(node.id) ? 1 : 0.15;
        return 1;
    };

    // Main rendering effect
    useEffect(() => {
        console.log("🎨 NetworkRenderer starting...", {
            svgGroup: !!svgGroup,
            nodes: nodes?.length || 0,
            links: links?.length || 0,
        });

        if (!svgGroup || !nodes || !links) {
            console.log("❌ NetworkRenderer missing required props");
            return;
        }

        console.log(
            "✅ NetworkRenderer rendering",
            nodes.length,
            "nodes and",
            links.length,
            "links",
        );

        // Clear existing network elements
        svgGroup.selectAll(".links").remove();
        svgGroup.selectAll(".nodes").remove();

        // Link styling colors
        const linkStrokeColor = isDarkMode
            ? {
                  hyperlink: "rgba(255, 164, 165, 0.8)",
                  normal: "rgba(156, 163, 175, 0.8)",
              }
            : {
                  hyperlink: "rgba(255, 164, 165, 0.8)",
                  normal: "rgba(255, 183, 77, 0.8)",
              };

        // Render links
        const linkGroup = svgGroup.append("g").attr("class", "links");
        console.log("📍 Created link group");

        const linkSelection = linkGroup
            .selectAll("path")
            .data(links)
            .join("path")
            .attr("fill", "none")
            .attr("stroke", (d) =>
                isHyperlinkNavigation(d)
                    ? linkStrokeColor.hyperlink
                    : linkStrokeColor.normal,
            )
            .attr("stroke-dasharray", (d) =>
                isHyperlinkNavigation(d) ? "5,5" : "none",
            )
            .attr("stroke-width", 2)
            .attr("marker-end", "url(#arrow)")
            .attr("d", (d) => generateLinkPath(d.source, d.target))
            .style("opacity", getLinkOpacity)
            .style("transition", "opacity 0.3s ease");

        console.log("📍 Created", links.length, "links");

        // Render nodes
        const nodeGroup = svgGroup.append("g").attr("class", "nodes");
        console.log("📍 Created node group");

        const nodeSelection = nodeGroup
            .selectAll<SVGGElement, SimulationNode>("g")
            .data(nodes)
            .join("g")
            .attr("class", "node-group")
            .style("cursor", isStandalone ? "default" : "pointer")
            .style("opacity", getNodeOpacity)
            .style("transition", "opacity 0.3s ease")
            .attr("transform", (d) => {
                const x = d.x || 0;
                const y = d.y || 0;
                console.log(`Node ${d.id} positioned at (${x}, ${y})`);
                return `translate(${x},${y})`;
            });

        console.log("📍 Created", nodes.length, "node groups");

        // Node drag behavior (disabled in standalone mode to prevent conflicts with path tracing)
        if (!isStandalone) {
            nodeSelection.call(
                d3
                    .drag<SVGGElement, SimulationNode>()
                    .on("start", (event) => {
                        // Prevent event from bubbling to zoom behavior
                        event.sourceEvent.stopPropagation();
                    })
                    .on("drag", (event) => {
                        const d = event.subject;
                        d.x = event.x;
                        d.y = event.y;

                        // Update node position
                        d3.select(event.sourceEvent.target.parentNode).attr(
                            "transform",
                            `translate(${d.x},${d.y})`,
                        );

                        // Update connected links
                        linkSelection.attr("d", (linkData) => {
                            if (
                                linkData.source.id === d.id ||
                                linkData.target.id === d.id
                            ) {
                                return generateLinkPath(
                                    linkData.source,
                                    linkData.target,
                                );
                            }
                            return d3
                                .select(event.sourceEvent.target)
                                .attr("d");
                        });

                        // Notify parent of drag
                        onNodeDrag?.(d.id, d.x, d.y);
                    })
                    .on("end", (event) => {
                        event.sourceEvent.stopPropagation();
                    }),
            );
            console.log("📍 Drag behavior enabled for interactive mode");
        } else {
            console.log("📍 Drag behavior disabled for standalone mode");
        }

        // Node visual elements

        // Invisible interaction area - this should be the clickable zone
        nodeSelection
            .append("rect")
            .attr("class", "node-interaction-area")
            .attr("x", -20)
            .attr("y", -20)
            .attr("width", 40)
            .attr("height", 40)
            .attr("fill", "transparent")
            .style("cursor", "pointer") // Always show pointer cursor for clickable nodes
            .style("pointer-events", "all"); // Ensure this receives pointer events

        console.log("📍 Created interaction areas for", nodes.length, "nodes");

        // Node click events (works in both standalone and interactive modes)
        console.log(
            "📍 Setting up click events, standalone mode:",
            isStandalone,
        );

        nodeSelection
            .style("cursor", "pointer") // Always show pointer cursor
            .on("click", (event: MouseEvent, d: SimulationNode) => {
                console.log(
                    "🖱️ Node clicked:",
                    d.id,
                    d.url,
                    "standalone:",
                    isStandalone,
                );
                event.stopPropagation();
                event.preventDefault();

                if (selectedNode === d.id) {
                    // Already selected - open URL on second click
                    console.log("🖱️ Opening URL for selected node:", d.url);
                    if (!isNewTabUrl(d.url)) {
                        window.open(d.url, "_blank");
                    }
                } else {
                    // New selection - trigger path tracing (works in both modes)
                    console.log("🖱️ Tracing path to node:", d.id);
                    onNodeClick?.(d.id);
                }
            })
            .on("dblclick", (event: MouseEvent, d: SimulationNode) => {
                console.log("🖱️ Node double-clicked:", d.id, d.url);
                event.stopPropagation();
                event.preventDefault();
                if (!isNewTabUrl(d.url)) {
                    window.open(d.url, "_blank");
                }
                onNodeDoubleClick?.(d.id);
            })
            .on("mouseenter", (event: MouseEvent, d: SimulationNode) => {
                // Ensure cursor changes on hover
                d3.select(event.currentTarget).style("cursor", "pointer");
            })
            .on("mouseleave", (event: MouseEvent, d: SimulationNode) => {
                // Keep pointer cursor
                d3.select(event.currentTarget).style("cursor", "pointer");
            });

        // Node hover events (both modes) - for tooltips
        nodeSelection
            .on("mouseover", (event: MouseEvent, d: SimulationNode) => {
                console.log("🖱️ Node hover:", d.id);
                onNodeHover?.(event, d);
            })
            .on("mouseout", () => {
                onNodeLeave?.();
            })
            .on("mousemove", (event: MouseEvent, d: SimulationNode) => {
                onNodeHover?.(event, d);
            });

        // Node icon/favicon with proper fallback handling
        const selectedGlow = isDarkMode
            ? "rgba(59, 130, 246, 0.8)"
            : "rgba(255, 183, 77, 0.8)";
        const activeGlow = isDarkMode
            ? "rgba(239, 68, 68, 0.6)"
            : "rgba(255, 164, 165, 0.6)";

        const nodeIcons = nodeSelection.append("g").attr("class", "node-icon");

        // Primary favicon attempt
        nodeIcons
            .append("image")
            .attr("class", "primary-icon")
            .attr("xlink:href", (d) => getIconUrl(d.url))
            .attr("x", -16)
            .attr("y", -16)
            .attr("width", 32)
            .attr("height", 32)
            .style("filter", (d) => {
                if (selectedNode === d.id)
                    return `drop-shadow(0px 0px 8px ${selectedGlow})`;
                else if (d.totalTime > 0)
                    return `drop-shadow(0px 0px 3px ${activeGlow})`;
                return "drop-shadow(0px 2px 4px rgba(0,0,0,0.2))";
            })
            .style("pointer-events", "none")
            .style("transition", "filter 0.2s ease")
            .style("opacity", 1);

        // Fallback SVG icon (always present but hidden initially)
        nodeIcons
            .append("g")
            .attr("class", "fallback-icon")
            .style("opacity", 0)
            .style("pointer-events", "none")
            .html((d) => {
                const fallbackSvg = getFallbackIcon(d.url);
                // Extract the SVG content from the data URL
                const match = fallbackSvg.match(/data:image\/svg\+xml,(.+)/);
                if (match) {
                    const svgContent = decodeURIComponent(match[1]);
                    // Position and scale the fallback icon
                    return svgContent.replace(
                        "<svg",
                        '<svg x="-16" y="-16" width="32" height="32"',
                    );
                }
                return "";
            });

        // Image load error handling using a separate image test
        nodeSelection.each(function (d) {
            const primaryIcon = getIconUrl(d.url);
            if (primaryIcon) {
                const testImg = new Image();
                testImg.onload = () => {
                    // Image loaded successfully, keep primary visible
                };
                testImg.onerror = () => {
                    // Image failed, show fallback
                    const iconGroup = d3.select(this).select(".node-icon");
                    iconGroup.select(".primary-icon").style("opacity", 0);
                    iconGroup.select(".fallback-icon").style("opacity", 1);
                };
                testImg.src = primaryIcon;
            } else {
                // No primary icon available, show fallback immediately
                const iconGroup = d3.select(this).select(".node-icon");
                iconGroup.select(".primary-icon").style("opacity", 0);
                iconGroup.select(".fallback-icon").style("opacity", 1);
            }
        });

        console.log("📍 Created node icons with fallback system");

        // Selection ring
        const selectionRingColor = isDarkMode
            ? "rgba(59, 130, 246, 0.9)"
            : "rgba(255, 183, 77, 0.9)";

        nodeSelection
            .append("circle")
            .attr("r", 20)
            .attr("fill", "none")
            .attr("stroke", selectionRingColor)
            .attr("stroke-width", 3)
            .style("opacity", (d) => (selectedNode === d.id ? 1 : 0))
            .style("transition", "opacity 0.3s ease")
            .style("pointer-events", "none");

        // Path sequence numbers - positioned to the side to avoid overlap
        const sequenceNumberColor = isDarkMode
            ? "rgba(59, 130, 246, 0.9)"
            : "rgba(255, 183, 77, 0.9)";

        nodeSelection
            .append("text")
            .attr("dx", 25) // Move to the right side of the node
            .attr("dy", -5) // Slightly above center
            .attr("text-anchor", "start") // Align text to start from the position
            .attr("class", "sequence-number")
            .style(
                "font-family",
                "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
            )
            .style("font-size", "12px")
            .style("font-weight", "700")
            .style("fill", sequenceNumberColor)
            .style("pointer-events", "none")
            .style("opacity", (d) => (pathOrder.has(d.id) ? 1 : 0))
            .style("transition", "opacity 0.3s ease")
            .text((d) => pathOrder.get(d.id) || "");

        console.log("📍 Created sequence numbers positioned to the side");

        console.log("✅ NetworkRenderer rendering complete");

        // Update function for state changes
        const updateVisuals = () => {
            // Update link opacities
            linkSelection.style("opacity", getLinkOpacity);

            // Update node opacities
            nodeSelection.style("opacity", getNodeOpacity);

            // Update selection rings
            nodeSelection
                .select("circle")
                .style("opacity", (d) => (selectedNode === d.id ? 1 : 0));

            // Update sequence numbers
            nodeSelection
                .select("text.sequence-number")
                .style("opacity", (d) => (pathOrder.has(d.id) ? 1 : 0))
                .text((d) => pathOrder.get(d.id) || "");

            // Update node filters
            nodeSelection
                .select(".node-icon")
                .select(".primary-icon")
                .style("filter", (d) => {
                    if (selectedNode === d.id)
                        return `drop-shadow(0px 0px 8px ${selectedGlow})`;
                    else if (d.totalTime > 0)
                        return `drop-shadow(0px 0px 3px ${activeGlow})`;
                    return "drop-shadow(0px 2px 4px rgba(0,0,0,0.2))";
                });
        };

        // Call initial update
        updateVisuals();

        // Cleanup function
        return () => {
            console.log("🧹 NetworkRenderer cleanup");
            linkGroup.remove();
            nodeGroup.remove();
        };
    }, [
        svgGroup,
        nodes,
        links,
        isDarkMode,
        isStandalone,
        selectedNode,
        pathNodes,
        pathLinks,
        searchResults,
        pathOrder,
        isEvolutionMode,
        visibleNodes,
        visibleLinks,
    ]);

    // This component renders directly to the provided SVG group
    return null;
};

export default NetworkRenderer;
