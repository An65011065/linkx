import React, { useState, useCallback, useEffect } from "react";
import type { GraphVisualizationProps } from "./GraphCanvas/types/component.types";
import { useNetworkData } from "../hooks/useNetworkData";
import { useTimelineLayout } from "./GraphCanvas/hooks/useTimelineLayout";
import { useDimensions } from "./GraphCanvas/hooks/useDimensions";
import { usePathTracing } from "./GraphCanvas/hooks/usePathTracing";
import { useExternalSearch } from "./GraphCanvas/hooks/useSearch";
import { useEvolutionPlayer } from "./GraphCanvas/hooks/useEvolutionPlayer";
import GraphCanvas from "./GraphCanvas/Canvas/GraphCanvas";
import { useTooltip } from "./GraphCanvas/hooks/useTooltip";
import SearchPanel from "./GraphCanvas/Controls/SearchPanel";
import ActionButtons from "./GraphCanvas/Controls/ActionButtons";
import InfoDisplay from "./GraphCanvas/Controls/InfoDisplay";
import EvolutionPlayer from "./GraphCanvas/Controls/EvolutionPlayer";
import LoadingState from "./GraphCanvas/UI/LoadingState";
import EmptyState from "./GraphCanvas/UI/EmptyState";
import ErrorState from "./GraphCanvas/UI/ErrorState";
import {
    formatTime,
    groupTimestampsIntoHourBrackets,
} from "./GraphCanvas/utils/timeFormatting";

/**
 * Main GraphVisualization component - orchestrates the entire visualization
 * Refactored to use hooks and modular components for better maintainability
 */
const GraphVisualization: React.FC<GraphVisualizationProps> = ({
    timeRange,
    maxNodesPerRow = 6,
    totalNodes,
    showControls = true,
    orientation = "vertical",
    isStandalone = false,
    searchTerm = "",
    onSearchResults,
    className,
    style,
}) => {
    // Theme state
    const [isDarkMode, setIsDarkMode] = useState(false);

    // View state
    const [viewOrientation, setViewOrientation] = useState<
        "vertical" | "horizontal"
    >(orientation);

    // Fetch network data
    const {
        nodes: allNodes,
        links: allLinks,
        loading,
        error,
    } = useNetworkData();

    // Get container dimensions
    const { dimensions, containerRef, isReady } = useDimensions();

    // Filter nodes by time range and total nodes limit
    const filteredNodes = React.useMemo(() => {
        if (!allNodes) return [];

        let nodes = [...allNodes];

        // Apply time range filter
        if (timeRange) {
            nodes = nodes.filter((node) => {
                const timestamp = node.visitTimestamp || 0;
                return (
                    timestamp >= timeRange.start && timestamp <= timeRange.end
                );
            });
        }

        // Apply total nodes limit (prioritize by timestamp - most recent first)
        if (totalNodes && nodes.length > totalNodes) {
            nodes = nodes
                .sort(
                    (a, b) => (b.visitTimestamp || 0) - (a.visitTimestamp || 0),
                )
                .slice(0, totalNodes);
        }

        return nodes;
    }, [allNodes, timeRange, totalNodes]);

    // Filter links to only include those between filtered nodes
    const filteredLinks = React.useMemo(() => {
        if (!allLinks || !filteredNodes) return [];

        const nodeIds = new Set(filteredNodes.map((node) => node.id));
        return allLinks.filter(
            (link) => nodeIds.has(link.source) && nodeIds.has(link.target),
        );
    }, [allLinks, filteredNodes]);

    // Get shared layout data - this coordinates everything
    const { layoutResult, isLayoutReady } = useTimelineLayout({
        nodes: filteredNodes,
        links: filteredLinks,
        dimensions,
        orientation: viewOrientation,
        maxNodesPerRow,
    });

    // Path tracing functionality
    const {
        selectedNode,
        pathNodes,
        pathLinks,
        pathOrder,
        tracePathToNode,
        clearPath,
        pathStats,
    } = usePathTracing(filteredLinks);

    // External search functionality (from NetworkLandingPage)
    const { searchResults, resultCount, hasResults } = useExternalSearch(
        filteredNodes,
        searchTerm,
        onSearchResults,
    );

    // Evolution mode functionality
    const {
        isEvolutionMode,
        isPlaying,
        currentTimestamp,
        evolutionSpeed,
        visibleNodes,
        visibleLinks,
        startEvolution,
        stopEvolution,
        play,
        pause,
        reset,
        setSpeed,
        progress,
        stats,
    } = useEvolutionPlayer(filteredLinks);

    // Tooltip functionality
    const { showTooltip, hideTooltip, moveTooltip } = useTooltip(isDarkMode);

    // Check if we have a time range but no filtered results
    const hasTimeRangeButNoData =
        timeRange &&
        allNodes &&
        allNodes.length > 0 &&
        filteredNodes.length === 0;

    // Get available hour brackets from all nodes
    const availableHourBrackets = React.useMemo(() => {
        if (!allNodes || allNodes.length === 0) return [];

        const timestamps = allNodes
            .map((node) => node.visitTimestamp || 0)
            .filter((timestamp) => timestamp > 0);

        return groupTimestampsIntoHourBrackets(timestamps);
    }, [allNodes]);

    console.log("📊 Graph Debug Pipeline:", {
        // Raw data
        allNodes: allNodes?.length || 0,
        allLinks: allLinks?.length || 0,

        // Filtered data
        filteredNodes: filteredNodes.length,
        filteredLinks: filteredLinks.length,

        // Layout state
        isReady,
        isLayoutReady, // This is key!

        // Dimensions
        dimensions,

        // Layout result
        simulationNodes: layoutResult?.simulationNodes?.length || 0,
        simulationLinks: layoutResult?.simulationLinks?.length || 0,

        // Layout details
        nodePositions: layoutResult?.nodePositions?.size || 0,
        timelineConfigValid: !!layoutResult?.timelineConfig?.timeToX,

        // Filters applied
        timeRange,
        totalNodes,
    });

    // Event handlers
    const handleNodeClick = useCallback(
        (nodeId: string) => {
            if (selectedNode === nodeId) {
                // Double click behavior - open URL
                const node = filteredNodes.find((n) => n.id === nodeId);
                if (node && !node.url.startsWith("chrome://newtab")) {
                    window.open(node.url, "_blank");
                }
            } else {
                tracePathToNode(nodeId);
            }
        },
        [selectedNode, filteredNodes, tracePathToNode],
    );

    const handleNodeDoubleClick = useCallback(
        (nodeId: string) => {
            const node = filteredNodes.find((n) => n.id === nodeId);
            if (node && !node.url.startsWith("chrome://newtab")) {
                window.open(node.url, "_blank");
            }
        },
        [filteredNodes],
    );

    const handleNodeHover = useCallback(
        (event: MouseEvent, node: any) => {
            showTooltip(event, node);
        },
        [showTooltip],
    );

    const handleNodeLeave = useCallback(() => {
        hideTooltip();
    }, [hideTooltip]);

    const handleCanvasClick = useCallback(() => {
        if (selectedNode) {
            clearPath();
        }
    }, [selectedNode, clearPath]);

    const handleToggleTheme = useCallback(() => {
        setIsDarkMode(!isDarkMode);
    }, [isDarkMode]);

    const handleToggleOrientation = useCallback(() => {
        setViewOrientation(
            viewOrientation === "vertical" ? "horizontal" : "vertical",
        );
    }, [viewOrientation]);

    const handleToggleEvolution = useCallback(() => {
        if (isEvolutionMode) {
            stopEvolution();
            clearPath();
        } else {
            startEvolution();
            clearPath();
        }
    }, [isEvolutionMode, stopEvolution, startEvolution, clearPath]);

    const handleExpand = useCallback(() => {
        // Toggle fullscreen
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }, [containerRef]);

    // Update view orientation when prop changes
    useEffect(() => {
        setViewOrientation(orientation);
    }, [orientation]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                if (selectedNode) {
                    clearPath();
                } else if (isEvolutionMode) {
                    stopEvolution();
                }
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [selectedNode, isEvolutionMode, clearPath, stopEvolution]);

    // Show loading state
    if (loading) {
        return (
            <div
                ref={containerRef}
                className={`w-full h-screen flex items-center justify-center transition-all duration-300 ${
                    isDarkMode
                        ? "bg-gradient-to-br from-gray-900 to-slate-800"
                        : "bg-gradient-to-br from-amber-50 to-orange-50"
                } ${className || ""}`}
                style={style}
            >
                <LoadingState isDarkMode={isDarkMode} />
            </div>
        );
    }

    // Show error state
    if (error) {
        return (
            <div
                ref={containerRef}
                className={`w-full h-screen flex items-center justify-center transition-all duration-300 ${
                    isDarkMode
                        ? "bg-gradient-to-br from-gray-900 to-slate-800"
                        : "bg-gradient-to-br from-amber-50 to-orange-50"
                } ${className || ""}`}
                style={style}
            >
                <ErrorState
                    error={error}
                    isDarkMode={isDarkMode}
                    onRetry={() => window.location.reload()}
                />
            </div>
        );
    }

    // Show empty state
    if (!filteredNodes || filteredNodes.length === 0) {
        return (
            <div
                ref={containerRef}
                className={`w-full h-screen flex items-center justify-center transition-all duration-300 ${
                    isDarkMode
                        ? "bg-gradient-to-br from-gray-900 to-slate-800"
                        : "bg-gradient-to-br from-amber-50 to-orange-50"
                } ${className || ""}`}
                style={style}
            >
                <EmptyState
                    hasTimeRangeButNoData={hasTimeRangeButNoData}
                    availableHourBrackets={availableHourBrackets}
                    isDarkMode={isDarkMode}
                    onTimeRangeSelect={(start, end) => {
                        // Handle time range selection if needed
                        console.log("Time range selected:", start, end);
                    }}
                />
            </div>
        );
    }

    // Don't render until we have valid dimensions and layout
    if (!isReady || !isLayoutReady) {
        return (
            <div
                ref={containerRef}
                className={`w-full h-screen transition-all duration-300 ${
                    isDarkMode
                        ? "bg-gradient-to-br from-gray-900 to-slate-800"
                        : "bg-gradient-to-br from-amber-50 to-orange-50"
                } ${className || ""}`}
                style={style}
            />
        );
    }

    return (
        <div
            ref={containerRef}
            className={`w-full h-screen relative overflow-hidden transition-all duration-300 ${
                isDarkMode
                    ? "bg-gradient-to-br from-gray-900 to-slate-800"
                    : "bg-gradient-to-br from-amber-50 to-orange-50"
            } ${className || ""}`}
            style={style}
        >
            {/* Main Graph Canvas */}
            <GraphCanvas
                nodes={filteredNodes}
                links={filteredLinks}
                dimensions={dimensions}
                isDarkMode={isDarkMode}
                isStandalone={isStandalone}
                viewOrientation={viewOrientation}
                maxNodesPerRow={maxNodesPerRow}
                selectedNode={selectedNode}
                pathNodes={pathNodes}
                pathLinks={pathLinks}
                searchResults={searchResults}
                pathOrder={pathOrder}
                isEvolutionMode={isEvolutionMode}
                visibleNodes={visibleNodes}
                visibleLinks={visibleLinks}
                onNodeClick={handleNodeClick}
                onNodeDoubleClick={handleNodeDoubleClick}
                onNodeHover={handleNodeHover}
                onNodeLeave={handleNodeLeave}
                onCanvasClick={handleCanvasClick}
            />

            {/* Control Components - only show if controls are enabled */}
            {showControls && (
                <>
                    {/* Search Results Panel */}
                    {!isStandalone && (
                        <SearchPanel
                            searchTerm={searchTerm}
                            searchResults={searchResults}
                            isDarkMode={isDarkMode}
                        />
                    )}

                    {/* Action Buttons */}
                    <ActionButtons
                        isDarkMode={isDarkMode}
                        viewOrientation={viewOrientation}
                        isEvolutionMode={isEvolutionMode}
                        onToggleTheme={handleToggleTheme}
                        onToggleEvolution={handleToggleEvolution}
                        onToggleOrientation={handleToggleOrientation}
                        onExpand={handleExpand}
                    />

                    {/* Evolution Player */}
                    <EvolutionPlayer
                        isEvolutionMode={isEvolutionMode}
                        isPlaying={isPlaying}
                        evolutionSpeed={evolutionSpeed}
                        currentTimestamp={currentTimestamp}
                        visibleNodes={visibleNodes}
                        visibleLinks={visibleLinks}
                        isDarkMode={isDarkMode}
                        onPlay={play}
                        onPause={pause}
                        onReset={reset}
                        onSpeedChange={setSpeed}
                        onExit={stopEvolution}
                    />

                    {/* Info Display */}
                    <InfoDisplay
                        selectedNode={selectedNode}
                        searchResults={searchResults}
                        pathNodes={pathNodes}
                        pathLinks={pathLinks}
                        searchTerm={searchTerm}
                        isEvolutionMode={isEvolutionMode}
                        visibleNodes={visibleNodes}
                        visibleLinks={visibleLinks}
                        currentTimestamp={currentTimestamp}
                        isDarkMode={isDarkMode}
                        onClearPath={clearPath}
                    />
                </>
            )}
        </div>
    );
};

export default GraphVisualization;
