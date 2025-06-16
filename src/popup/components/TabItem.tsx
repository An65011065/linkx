// src/popup/components/TabItem.tsx
import React from "react";
import type { Tab } from "./RecentSessions";

interface TabItemProps {
    tab: Tab;
    isExpanded: boolean;
    onToggle: () => void;
    formatTime: (minutes: number) => string;
}

// Simple chevron icons without importing a library
const ChevronDown = ({ size = 12 }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
    >
        <polyline points="6,9 12,15 18,9" />
    </svg>
);

const ChevronRight = ({ size = 12 }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
    >
        <polyline points="9,18 15,12 9,6" />
    </svg>
);

const getTypeColor = (type: string): string => {
    switch (type) {
        case "work":
            return "#4285f4";
        case "social":
            return "#ff6b47";
        case "other":
            return "#6c757d";
        default:
            return "#6c757d";
    }
};

const TabItem: React.FC<TabItemProps> = ({
    tab,
    isExpanded,
    onToggle,
    formatTime,
}) => {
    return (
        <div style={{ marginBottom: "3px" }}>
            {/* Tab Header - Always Visible */}
            <div
                onClick={onToggle}
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 10px",
                    borderRadius: "5px",
                    backgroundColor: "#fafbfc",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    border: isExpanded
                        ? "1px solid #e0e7ff"
                        : "1px solid transparent",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", flex: 1 }}>
                    {/* Expand/Collapse Icon */}
                    <div
                        style={{
                            marginRight: "8px",
                            opacity: 0.6,
                            color: "#636e72",
                        }}
                    >
                        {isExpanded ? (
                            <ChevronDown size={12} />
                        ) : (
                            <ChevronRight size={12} />
                        )}
                    </div>

                    {/* Tab Info */}
                    <div style={{ flex: 1 }}>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                marginBottom: "2px",
                            }}
                        >
                            <span
                                style={{
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    color: "#2d3436",
                                }}
                            >
                                Tab {tab.tabNumber}
                            </span>
                            {tab.isActive && (
                                <span
                                    style={{
                                        fontSize: "8px",
                                        backgroundColor: "#28a745",
                                        color: "white",
                                        padding: "1px 4px",
                                        borderRadius: "2px",
                                        fontWeight: 600,
                                    }}
                                >
                                    LIVE
                                </span>
                            )}
                        </div>
                        <div
                            style={{
                                fontSize: "10px",
                                color: "#636e72",
                            }}
                        >
                            {formatTime(tab.totalTime)} • {tab.urls.length} site
                            {tab.urls.length > 1 ? "s" : ""} • {tab.timeAgo} ago
                        </div>
                    </div>
                </div>
            </div>

            {/* Tab Details - Expandable */}
            {isExpanded && (
                <div
                    style={{
                        marginTop: "4px",
                        marginLeft: "12px",
                        paddingLeft: "12px",
                        borderLeft: "1px solid #e9ecef",
                    }}
                >
                    {tab.urls.map((url, index) => (
                        <div
                            key={index}
                            style={{
                                padding: "4px 8px",
                                marginBottom: "2px",
                                borderRadius: "3px",
                                backgroundColor: "#f8f9fa",
                                borderLeft: `3px solid ${getTypeColor(
                                    tab.type || "other",
                                )}`,
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}
                        >
                            <div style={{ flex: 1 }}>
                                <div
                                    style={{
                                        fontSize: "11px",
                                        fontWeight: 600,
                                        color: "#2d3436",
                                    }}
                                >
                                    {url.domain}
                                </div>
                                <div
                                    style={{
                                        fontSize: "9px",
                                        color: "#636e72",
                                        fontFamily: "monospace",
                                        opacity: 0.8,
                                    }}
                                >
                                    {url.path}
                                </div>
                            </div>
                            <span
                                style={{
                                    fontSize: "10px",
                                    color: "#636e72",
                                    fontWeight: 500,
                                }}
                            >
                                {url.duration}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TabItem;
