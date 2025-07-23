import React from "react";
import { X, Search, Target, Clock } from "lucide-react";
import type { InfoDisplayProps } from "../types/component.types";

/**
 * InfoDisplay component for showing current state information
 * Shows selected node info, search results, or evolution progress
 */
const InfoDisplay: React.FC<InfoDisplayProps> = ({
    selectedNode,
    searchResults,
    pathNodes,
    pathLinks,
    searchTerm,
    isEvolutionMode,
    visibleNodes,
    visibleLinks,
    currentTimestamp,
    isDarkMode,
    onClearPath,
    className,
    style,
}) => {
    // Determine what to show based on current state
    const showPathTrace = selectedNode && pathNodes.size > 0;
    const showSearchResults = searchResults.size > 0 && searchTerm;
    const showEvolution = isEvolutionMode;

    // Don't render if nothing to show
    if (!showPathTrace && !showSearchResults && !showEvolution) {
        return null;
    }

    const panelClasses = `absolute bottom-5 left-5 z-[1001] max-w-xs ${
        isDarkMode
            ? "bg-slate-800/95 border-slate-700/50 text-slate-200"
            : "bg-white/95 border-amber-200/50 text-amber-700"
    } backdrop-blur-xl border rounded-xl px-5 py-4 shadow-lg transition-all duration-300`;

    return (
        <div className={`${className || ""}`} style={style}>
            {/* Path Trace Info */}
            {showPathTrace && (
                <div className={panelClasses}>
                    <div className="flex items-center justify-between mb-2">
                        <h3
                            className={`font-semibold text-sm flex items-center gap-2 ${
                                isDarkMode ? "text-slate-100" : "text-amber-900"
                            }`}
                        >
                            <Target size={14} />
                            Path Trace
                        </h3>
                        {onClearPath && (
                            <button
                                onClick={onClearPath}
                                className={`p-1 rounded-md transition-all duration-200 ${
                                    isDarkMode
                                        ? "hover:bg-slate-600/80 text-slate-400 hover:text-slate-200"
                                        : "hover:bg-amber-100/80 text-amber-500 hover:text-amber-700"
                                }`}
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                    <p
                        className={`text-xs mb-3 ${
                            isDarkMode ? "text-slate-400" : "text-amber-600"
                        }`}
                    >
                        Showing navigation path to selected node
                    </p>
                    <div
                        className={`text-xs font-medium ${
                            isDarkMode ? "text-slate-300" : "text-amber-700"
                        }`}
                    >
                        <div className="flex justify-between">
                            <span>Nodes in path:</span>
                            <span className="font-semibold">
                                {pathNodes.size}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Search Results Info */}
            {showSearchResults && !showPathTrace && (
                <div className={panelClasses}>
                    <div className="flex items-center gap-2 text-xs font-medium">
                        <Search
                            size={14}
                            className={
                                isDarkMode ? "text-blue-400" : "text-amber-600"
                            }
                        />
                        <span
                            className={
                                isDarkMode ? "text-slate-100" : "text-amber-900"
                            }
                        >
                            <span className="font-semibold">
                                {searchResults.size}
                            </span>{" "}
                            result
                            {searchResults.size !== 1 ? "s" : ""} found
                        </span>
                    </div>
                    {searchTerm && (
                        <div
                            className={`text-xs mt-1 ${
                                isDarkMode ? "text-slate-400" : "text-amber-600"
                            }`}
                        >
                            for "{searchTerm}"
                        </div>
                    )}
                </div>
            )}

            {/* Evolution Progress */}
            {showEvolution && (
                <div className={panelClasses}>
                    <div className="flex items-center gap-2 mb-3">
                        <Clock
                            size={14}
                            className={
                                isDarkMode
                                    ? "text-purple-400"
                                    : "text-purple-600"
                            }
                        />
                        <h3
                            className={`font-semibold text-sm ${
                                isDarkMode ? "text-slate-100" : "text-amber-900"
                            }`}
                        >
                            Evolution Progress
                        </h3>
                    </div>

                    <div
                        className={`text-xs space-y-2 ${
                            isDarkMode ? "text-slate-300" : "text-amber-700"
                        }`}
                    >
                        <div className="flex justify-between">
                            <span>Visible Nodes:</span>
                            <span className="font-semibold">
                                {visibleNodes.size}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span>Visible Links:</span>
                            <span className="font-semibold">
                                {visibleLinks.size}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span>Current Time:</span>
                            <span className="font-semibold">
                                {currentTimestamp
                                    ? new Date(
                                          currentTimestamp,
                                      ).toLocaleTimeString("en-US", {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                          hour12: true,
                                      })
                                    : "Start"}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InfoDisplay;
