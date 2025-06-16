// src/popup/components/RecentSessions.tsx
import React, { useState } from "react";
import TabItem from "./TabItem";

// Updated interface for tab-based structure
export interface TabUrl {
    domain: string;
    path: string;
    duration: string;
    fullUrl: string;
}

export interface Tab {
    id: number;
    tabNumber: number; // For display: "Tab 1", "Tab 2", etc.
    type: "work" | "social" | "other";
    totalTime: number; // in minutes
    timeAgo: string;
    isActive: boolean;
    urls: TabUrl[];
}

// TODO: Add parseUrl function back when integrating real data
// const parseUrl = (url: string): { domain: string; path: string } => { ... }

const RecentSessions: React.FC = () => {
    const [expandedTabs, setExpandedTabs] = useState<Set<number>>(new Set());
    const [sortBy, setSortBy] = useState<"time" | "duration">("time");

    // TODO: Replace with real data from useExtensionData hook
    const tabs: Tab[] = [
        {
            id: 1,
            tabNumber: 1,
            type: "work",
            totalTime: 38,
            timeAgo: "2m",
            isActive: true,
            urls: [
                {
                    domain: "docs.google.com",
                    path: "/project-spec",
                    duration: "23m",
                    fullUrl:
                        "https://docs.google.com/document/d/abc123/project-spec",
                },
                {
                    domain: "github.com",
                    path: "/repo/issues",
                    duration: "10m",
                    fullUrl: "https://github.com/user/repo/issues",
                },
                {
                    domain: "stackoverflow.com",
                    path: "/questions/12345",
                    duration: "5m",
                    fullUrl:
                        "https://stackoverflow.com/questions/12345/how-to-fix",
                },
            ],
        },
        {
            id: 2,
            tabNumber: 2,
            type: "social",
            totalTime: 47,
            timeAgo: "5m",
            isActive: false,
            urls: [
                {
                    domain: "youtube.com",
                    path: "/watch?v=dQw4w9W...",
                    duration: "47m",
                    fullUrl: "https://youtube.com/watch?v=dQw4w9WgXcQ",
                },
            ],
        },
        {
            id: 3,
            tabNumber: 3,
            type: "work",
            totalTime: 22,
            timeAgo: "15m",
            isActive: false,
            urls: [
                {
                    domain: "wikipedia.org",
                    path: "/Machine_Learning",
                    duration: "12m",
                    fullUrl: "https://en.wikipedia.org/wiki/Machine_Learning",
                },
                {
                    domain: "medium.com",
                    path: "/@author/ai-article",
                    duration: "10m",
                    fullUrl: "https://medium.com/@author/ai-article",
                },
            ],
        },
        {
            id: 4,
            tabNumber: 4,
            type: "other",
            totalTime: 15,
            timeAgo: "25m",
            isActive: false,
            urls: [
                {
                    domain: "amazon.com",
                    path: "/dp/B08N5WRWNW",
                    duration: "15m",
                    fullUrl: "https://amazon.com/dp/B08N5WRWNW",
                },
            ],
        },
    ]; // PLACEHOLDER DATA

    const toggleTab = (tabId: number) => {
        const newExpanded = new Set(expandedTabs);
        if (newExpanded.has(tabId)) {
            newExpanded.delete(tabId);
        } else {
            newExpanded.add(tabId);
        }
        setExpandedTabs(newExpanded);
    };

    const formatTime = (minutes: number): string => {
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    };

    return (
        <div style={{ marginBottom: "20px" }}>
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "12px",
                }}
            >
                <h3
                    style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "#2d3436",
                        margin: 0,
                    }}
                >
                    Recent Tabs
                </h3>
                <select
                    value={sortBy}
                    onChange={(e) =>
                        setSortBy(e.target.value as "time" | "duration")
                    }
                    style={{
                        fontSize: "11px",
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                        padding: "2px 6px",
                        backgroundColor: "white",
                        color: "#636e72",
                    }}
                >
                    <option value="time">Recent</option>
                    <option value="duration">Duration</option>
                </select>
            </div>

            <div style={{ maxHeight: "160px", overflowY: "auto" }}>
                {tabs.map((tab) => (
                    <TabItem
                        key={tab.id}
                        tab={tab}
                        isExpanded={expandedTabs.has(tab.id)}
                        onToggle={() => toggleTab(tab.id)}
                        formatTime={formatTime}
                    />
                ))}
            </div>
        </div>
    );
};

export default RecentSessions;
