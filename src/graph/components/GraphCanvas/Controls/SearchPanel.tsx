import React from "react";
import type { SearchPanelProps } from "../types/component.types";

/**
 * SearchPanel component for standalone mode
 * Displays search results info - input is handled by parent (NetworkLandingPage)
 */
const SearchPanel: React.FC<SearchPanelProps> = ({
    searchTerm,
    searchResults,
    isDarkMode,
    className,
    style,
}) => {
    // Don't show anything if no search term
    if (!searchTerm || !searchTerm.trim()) {
        return null;
    }

    const resultCount = searchResults.size;
    const hasResults = resultCount > 0;

    return (
        <div
            className={className}
            style={{
                position: "absolute",
                bottom: "20px",
                left: "20px",
                zIndex: 1001,
                ...style,
            }}
        >
            <div
                style={{
                    padding: "12px 16px",
                    borderRadius: "12px",
                    backdropFilter: "blur(20px)",
                    border: isDarkMode
                        ? "1px solid rgba(75, 85, 99, 0.5)"
                        : "1px solid rgba(255, 183, 77, 0.3)",
                    background: isDarkMode
                        ? "rgba(31, 41, 55, 0.95)"
                        : "rgba(255, 251, 235, 0.95)",
                    boxShadow: isDarkMode
                        ? "0 10px 25px rgba(0, 0, 0, 0.3)"
                        : "0 10px 25px rgba(0, 0, 0, 0.1)",
                    transition: "all 0.3s ease",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "12px",
                        fontWeight: "500",
                        fontFamily:
                            "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
                        color: isDarkMode
                            ? "rgba(243, 244, 246, 0.9)"
                            : "rgba(120, 53, 15, 0.9)",
                    }}
                >
                    {/* Search icon */}
                    <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{
                            color: isDarkMode
                                ? "rgba(156, 163, 175, 0.8)"
                                : "rgba(184, 134, 11, 0.8)",
                        }}
                    >
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.35-4.35" />
                    </svg>

                    <span>
                        {hasResults ? (
                            <>
                                <strong>{resultCount}</strong> result
                                {resultCount !== 1 ? "s" : ""} found
                                <span
                                    style={{
                                        marginLeft: "4px",
                                        color: isDarkMode
                                            ? "rgba(156, 163, 175, 0.6)"
                                            : "rgba(184, 134, 11, 0.6)",
                                    }}
                                >
                                    for "{searchTerm}"
                                </span>
                            </>
                        ) : (
                            <>
                                No results found
                                <span
                                    style={{
                                        marginLeft: "4px",
                                        color: isDarkMode
                                            ? "rgba(156, 163, 175, 0.6)"
                                            : "rgba(184, 134, 11, 0.6)",
                                    }}
                                >
                                    for "{searchTerm}"
                                </span>
                            </>
                        )}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default SearchPanel;
