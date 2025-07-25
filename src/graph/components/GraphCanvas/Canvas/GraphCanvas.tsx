import React, { useRef, useEffect, useCallback, useState, useImperativeHandle, forwardRef } from "react";
import * as d3 from "d3";
import type { NetworkNode, NetworkLink } from "../../../types/network.types";
import type { GraphCanvasProps } from "../types/component.types";
import { useTimelineLayout } from "../hooks/useTimelineLayout";
import { useDimensions } from "../hooks/useDimensions";
import NetworkRenderer from "./NetworkRenderer";
import TimelineAxis from "./TimelineAxis";
import { ZOOM_CONSTANTS } from "../utils/constants";

export interface GraphCanvasRef {
    setZoom: (zoom: number) => void;
    reset: () => void;
    getCurrentZoom: () => number;
}

/**
 * Updated GraphCanvas component that orchestrates the rendering pipeline
 * Uses shared layout engine to coordinate NetworkRenderer and TimelineAxis
 */
const GraphCanvas = forwardRef<GraphCanvasRef, GraphCanvasProps>(({
    nodes,
    links,
    maxNodesPerRow,
    isDarkMode,
    isStandalone,
    viewOrientation,
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
    onCanvasClick,
    onZoomChange,
    onZoomReset,
    className,
    style,
}, ref) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(
        null,
    );

    // State to track when SVG groups are ready for child components
    const [svgGroup, setSvgGroup] = useState<d3.Selection<
        SVGGElement,
        unknown,
        null,
        undefined
    > | null>(null);
    const [svgReady, setSvgReady] = useState(false);

    // Zoom and pan state
    const [currentZoom, setCurrentZoom] = useState(isStandalone ? ZOOM_CONSTANTS.STANDALONE_SCALE : ZOOM_CONSTANTS.DEFAULT_SCALE);
    const [currentTransform, setCurrentTransform] = useState<d3.ZoomTransform | null>(null);

    // Get container dimensions
    const { dimensions, containerRef, isReady } = useDimensions();

    // Get shared layout data - this coordinates everything
    const { layoutResult, isLayoutReady } = useTimelineLayout({
        nodes,
        links,
        dimensions,
        orientation: viewOrientation,
        maxNodesPerRow,
    });

    // Handle node drag updates
    const handleNodeDrag = useCallback(
        (nodeId: string, x: number, y: number) => {
            // Update the node position in the simulation
            const node = layoutResult.simulationNodes.find(
                (n) => n.id === nodeId,
            );
            if (node) {
                node.x = x;
                node.y = y;
            }
        },
        [layoutResult.simulationNodes],
    );

    // Handle external zoom change
    const handleExternalZoomChange = useCallback((zoomLevel: number) => {
        if (!svgRef.current || !zoomRef.current) return;
        
        const svg = d3.select(svgRef.current);
        const currentTransform = d3.zoomTransform(svgRef.current);
        
        // Create new transform with same translation but new scale
        const newTransform = d3.zoomIdentity
            .translate(currentTransform.x, currentTransform.y)
            .scale(zoomLevel);
            
        svg.transition()
            .duration(200)
            .call(zoomRef.current.transform, newTransform);
            
        setCurrentZoom(zoomLevel);
        onZoomChange?.(zoomLevel);
    }, [onZoomChange]);

    // Handle zoom reset
    const handleZoomReset = useCallback(() => {
        if (!svgRef.current || !zoomRef.current) return;
        
        const svg = d3.select(svgRef.current);
        const initialScale = isStandalone ? ZOOM_CONSTANTS.STANDALONE_SCALE : ZOOM_CONSTANTS.DEFAULT_SCALE;
        
        let initialTransform;
        if (isStandalone) {
            const translateX = (dimensions.width * (1 - initialScale)) / 2;
            const translateY = (dimensions.height * (1 - initialScale)) / 2;
            initialTransform = d3.zoomIdentity
                .translate(translateX, translateY)
                .scale(initialScale);
        } else {
            initialTransform = d3.zoomIdentity
                .translate(0, 0)
                .scale(initialScale);
        }
        
        svg.transition()
            .duration(300)
            .call(zoomRef.current.transform, initialTransform);
            
        setCurrentZoom(initialScale);
        onZoomReset?.();
    }, [isStandalone, dimensions, onZoomReset]);

    // Expose zoom control functions via ref
    useImperativeHandle(ref, () => ({
        setZoom: handleExternalZoomChange,
        reset: handleZoomReset,
        getCurrentZoom: () => currentZoom
    }), [handleExternalZoomChange, handleZoomReset, currentZoom]);

    // Setup SVG and zoom behavior
    useEffect(() => {
        if (!svgRef.current || !isReady || !isLayoutReady) {
            setSvgReady(false);
            setSvgGroup(null);
            return;
        }

        console.log("🎨 Setting up SVG...");

        const svg = d3.select(svgRef.current);

        // Clear any existing content
        svg.selectAll("*").remove();

        // Check if we have dynamic width (horizontal mode)
        const hasDynamicWidth = (layoutResult.timelineConfig as any)
            .dynamicWidth;
        const dynamicWidth = hasDynamicWidth || dimensions.width;

        // Set SVG viewBox to accommodate dynamic width
        if (hasDynamicWidth && viewOrientation === "horizontal") {
            svg.attr("viewBox", `0 0 ${dynamicWidth} ${dimensions.height}`);
            svg.attr("width", "100%")
                .attr("height", dimensions.height)
                .style("overflow-x", "auto")
                .style("overflow-y", "hidden");
        } else {
            svg.attr("viewBox", `0 0 ${dimensions.width} ${dimensions.height}`);
        }

        // Create main group for all content
        const mainGroup = svg.append("g").attr("class", "main-group");

        // Setup zoom behavior (now enabled for both standalone and non-standalone mode)
        const zoom = d3
            .zoom<SVGSVGElement, unknown>()
            .scaleExtent([
                ZOOM_CONSTANTS.MIN_SCALE,
                ZOOM_CONSTANTS.MAX_SCALE,
            ])
            .filter((event) => {
                // Properly handle touch events to avoid passive listener warnings
                if (
                    event.type === "touchstart" ||
                    event.type === "touchmove"
                ) {
                    // Only prevent default if we're actually in a drag/zoom area
                    const target = event.target as Element;
                    const isNodeGroup = target.closest(".node-group");

                    if (isNodeGroup) {
                        // Let node drag handle this
                        return false;
                    }

                    // For canvas touches, we want to handle zoom/pan
                    // But mark as passive-friendly by not calling preventDefault unnecessarily
                    return true;
                }

                // For mouse events, exclude node groups
                return !event.target.closest(".node-group");
            })
            .on("zoom", (event) => {
                mainGroup.attr("transform", event.transform);
                setCurrentZoom(event.transform.k);
                setCurrentTransform(event.transform);
                onZoomChange?.(event.transform.k);
            });

        // For horizontal dynamic width, limit zoom behavior
        if (hasDynamicWidth && viewOrientation === "horizontal") {
            zoom.translateExtent([
                [0, 0],
                [dynamicWidth, dimensions.height],
            ]);
        }

        // Apply zoom behavior
        svg.call(zoom).on("dblclick.zoom", null);
        zoomRef.current = zoom;

        // Set initial transform
        let initialTransform;
        if (isStandalone) {
            // FIXED: In standalone mode, scale down and center the result
            const scale = ZOOM_CONSTANTS.STANDALONE_SCALE;

            // When we scale down, we need to center the scaled content
            // The formula is: translate = (viewport_size * (1 - scale)) / 2
            const translateX = (dimensions.width * (1 - scale)) / 2;
            const translateY = (dimensions.height * (1 - scale)) / 2;

            console.log("🎯 Standalone centering:", {
                scale,
                viewportWidth: dimensions.width,
                viewportHeight: dimensions.height,
                translateX,
                translateY,
                scaleFactor: 1 - scale,
                hasDynamicWidth,
                viewOrientation,
            });

            initialTransform = d3.zoomIdentity
                .translate(translateX, translateY)
                .scale(scale);
        } else {
            // Set initial transform - no centering here, let layout handle it
            initialTransform = d3.zoomIdentity
                .translate(0, 0) // No initial offset - layout will center itself
                .scale(ZOOM_CONSTANTS.DEFAULT_SCALE);
        }
        
        svg.call(zoom.transform, initialTransform);
        setCurrentZoom(initialTransform.k);
        setCurrentTransform(initialTransform);

        // Create arrow marker for links
        const arrowColor = isDarkMode
            ? "rgba(156, 163, 175, 0.7)"
            : "rgba(255, 183, 77, 0.7)";

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

        // Set the SVG group for child components
        console.log("✅ SVG group ready, setting state...");
        setSvgGroup(mainGroup);
        setSvgReady(true);

        return () => {
            // Cleanup
            if (zoomRef.current) {
                svg.on(".zoom", null);
                zoomRef.current = null;
            }
            setSvgReady(false);
            setSvgGroup(null);
        };
    }, [
        isReady,
        isLayoutReady,
        isStandalone,
        isDarkMode,
        viewOrientation,
        layoutResult,
        dimensions, // Added dimensions to dependencies for proper recalculation
    ]);

    // Handle canvas clicks for clearing selection
    const handleCanvasClick = useCallback(
        (event: React.MouseEvent) => {
            console.log("🖱️ Canvas clicked - clearing selection");
            if (!isStandalone && selectedNode) {
                onCanvasClick?.();
            }
        },
        [isStandalone, selectedNode, onCanvasClick],
    );

    // Don't render until we have valid dimensions and layout
    if (!isReady || !isLayoutReady) {
        return (
            <div
                ref={containerRef}
                className={className}
                style={{ width: "100%", height: "100%", ...style }}
            />
        );
    }

    return (
        <div
            ref={containerRef}
            className={className}
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                ...style,
            }}
        >
            <svg
                ref={svgRef}
                width="100%"
                height="100%"
                className="block absolute top-0 left-0 cursor-grab active:cursor-grabbing"
                onClick={handleCanvasClick}
            >
                {/* TimelineAxis and NetworkRenderer will render into the mainGroup */}
            </svg>

            {/* Render child components after SVG is ready */}
            {svgReady && svgGroup && (
                <>
                    <TimelineAxis
                        svgGroup={svgGroup}
                        timelineConfig={layoutResult.timelineConfig}
                        sessions={layoutResult.sessions}
                        axisConfig={{
                            orientation: viewOrientation,
                            tickCount: 8,
                            tickInterval: 3600000, // 1 hour
                            startTime: layoutResult.timelineConfig.minTime,
                            endTime: layoutResult.timelineConfig.maxTime,
                            axisPosition: { x: 0, y: 0 },
                            axisLength:
                                viewOrientation === "vertical"
                                    ? dimensions.height
                                    : dimensions.width,
                            labelFormat: "time",
                        }}
                        isDarkMode={isDarkMode}
                        isStandalone={isStandalone}
                        viewOrientation={viewOrientation}
                        dimensions={dimensions}
                        showSessionSeparators={!isStandalone}
                    />

                    <NetworkRenderer
                        svgGroup={svgGroup}
                        nodes={layoutResult.simulationNodes}
                        links={layoutResult.simulationLinks}
                        isDarkMode={isDarkMode}
                        isStandalone={isStandalone}
                        viewOrientation={viewOrientation}
                        dimensions={{ width: 0, height: 0 }} // Not needed since we use the shared layout
                        selectedNode={selectedNode}
                        pathNodes={pathNodes}
                        pathLinks={pathLinks}
                        searchResults={searchResults}
                        pathOrder={pathOrder}
                        isEvolutionMode={isEvolutionMode}
                        visibleNodes={visibleNodes}
                        visibleLinks={visibleLinks}
                        onNodeClick={onNodeClick}
                        onNodeDoubleClick={onNodeDoubleClick}
                        onNodeHover={onNodeHover}
                        onNodeLeave={onNodeLeave}
                        onNodeDrag={handleNodeDrag}
                    />
                </>
            )}
        </div>
    );
});

GraphCanvas.displayName = 'GraphCanvas';

export default GraphCanvas;
