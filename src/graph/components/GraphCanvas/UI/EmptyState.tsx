import React from "react";
import { Clock, Globe } from "lucide-react";
import type { EmptyStateProps } from "../types/component.types";

/**
 * EmptyState component for when there's no data to display
 */
const EmptyState: React.FC<EmptyStateProps> = ({
    hasTimeRangeButNoData,
    availableHourBrackets = [],
    onTimeRangeSelect,
    isDarkMode,
    className,
    style,
}) => {
    const getCardClasses = () => {
        return isDarkMode
            ? "bg-slate-800/95 border-slate-700/50 text-slate-200 hover:bg-slate-700/80"
            : "bg-white/95 border-amber-200/50 text-amber-700 hover:bg-amber-50/80";
    };

    const getTextClasses = (
        variant: "primary" | "secondary" | "muted" = "primary",
    ) => {
        if (isDarkMode) {
            switch (variant) {
                case "primary":
                    return "text-slate-100";
                case "secondary":
                    return "text-slate-300";
                case "muted":
                    return "text-slate-400";
            }
        } else {
            switch (variant) {
                case "primary":
                    return "text-amber-900";
                case "secondary":
                    return "text-amber-700";
                case "muted":
                    return "text-amber-600";
            }
        }
    };

    if (hasTimeRangeButNoData && availableHourBrackets.length > 0) {
        // Show available time brackets when time range has no data
        return (
            <div
                className={`text-center max-w-2xl mx-auto p-6 ${
                    className || ""
                }`}
                style={style}
            >
                <div className={`mb-4 ${getTextClasses("muted")}`}>
                    <Clock className="w-16 h-16 mx-auto" />
                </div>
                <h3
                    className={`text-lg font-semibold mb-2 ${getTextClasses(
                        "primary",
                    )}`}
                >
                    No Data for Selected Time Range
                </h3>
                <p className={`text-sm mb-6 ${getTextClasses("secondary")}`}>
                    No browsing data found for the specified time range. Here
                    are the available time periods with data:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                    {availableHourBrackets.slice(0, 9).map((bracket, index) => (
                        <div
                            key={index}
                            className={`p-3 rounded-lg border transition-all duration-200 hover:scale-105 cursor-pointer backdrop-blur-xl shadow-lg ${getCardClasses()}`}
                            onClick={() =>
                                onTimeRangeSelect?.(bracket.start, bracket.end)
                            }
                        >
                            <div
                                className={`font-medium text-sm ${getTextClasses(
                                    "primary",
                                )}`}
                            >
                                {bracket.label}
                            </div>
                            <div
                                className={`text-xs mt-1 ${getTextClasses(
                                    "muted",
                                )}`}
                            >
                                {bracket.count} site
                                {bracket.count !== 1 ? "s" : ""}
                            </div>
                        </div>
                    ))}
                </div>

                <p className={`text-xs ${getTextClasses("muted")}`}>
                    Click on a time period above to view data for that hour, or
                    adjust your time range filter.
                </p>
            </div>
        );
    }

    // Regular empty state when no data exists at all
    return (
        <div
            className={`text-center max-w-md mx-auto p-6 ${className || ""}`}
            style={style}
        >
            <div className={`mb-4 ${getTextClasses("muted")}`}>
                <Globe className="w-16 h-16 mx-auto" />
            </div>
            <h3
                className={`text-lg font-semibold mb-2 ${getTextClasses(
                    "primary",
                )}`}
            >
                No Browsing Data
            </h3>
            <p className={`text-sm mb-4 ${getTextClasses("secondary")}`}>
                Start browsing to see your network visualization. The graph will
                show your navigation patterns and connections between websites.
            </p>
            <button
                onClick={() => window.open("chrome://newtab", "_blank")}
                className={`px-4 py-2 rounded-lg transition-colors ${
                    isDarkMode
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-amber-600 text-white hover:bg-amber-700"
                }`}
            >
                Start Browsing
            </button>
        </div>
    );
};

export default EmptyState;
