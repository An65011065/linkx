// StatsPanel.tsx - Stats display (visits, time, domains)
import React from "react";
import { useExtensionData } from "../../data/useExtensionData";

// Safe domain extraction
const extractDomain = (url: string): string => {
    try {
        return new URL(url).hostname.replace(/^www\./, "");
    } catch {
        return url.split("/")[2]?.replace(/^www\./, "") || url;
    }
};

const StatsPanel: React.FC = () => {
    const { currentSession, isLoading, error } = useExtensionData();

    // Calculate stats from currentSession
    const calculateStats = () => {
        if (!currentSession)
            return {
                totalTime: 0,
                workTime: 0,
                socialTime: 0,
                otherTime: 0,
                uniqueDomains: 0,
                totalUrls: 0,
            };

        const allVisits = currentSession.tabSessions.flatMap(
            (tab) => tab.urlVisits,
        );
        const uniqueDomains = new Set(
            allVisits.map((visit) => extractDomain(visit.url)),
        ).size;
        const totalUrls = allVisits.length;

        const timesByCategory = allVisits.reduce(
            (acc, visit) => {
                if (!visit.isActive) return acc;
                const duration = (visit.duration || 0) / 3600; // Convert to hours
                const category = visit.category?.toLowerCase() || "other";

                if (category.includes("work")) acc.workTime += duration;
                else if (category.includes("social"))
                    acc.socialTime += duration;
                else acc.otherTime += duration;

                acc.totalTime += duration;
                return acc;
            },
            { totalTime: 0, workTime: 0, socialTime: 0, otherTime: 0 },
        );

        return { ...timesByCategory, uniqueDomains, totalUrls };
    };

    const stats = calculateStats();

    if (isLoading) {
        return (
            <div
                style={{
                    textAlign: "center",
                    marginBottom: "20px",
                    padding: "12px",
                    backgroundColor: "#f8f9fa",
                    borderRadius: "8px",
                }}
            >
                <div
                    style={{
                        fontSize: "11px",
                        fontWeight: 500,
                        color: "#636e72",
                        marginBottom: "6px",
                    }}
                >
                    Loading...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div
                style={{
                    textAlign: "center",
                    marginBottom: "20px",
                    padding: "12px",
                    backgroundColor: "#ffe8e8",
                    borderRadius: "8px",
                }}
            >
                <div
                    style={{
                        fontSize: "11px",
                        fontWeight: 500,
                        color: "#d63031",
                        marginBottom: "6px",
                    }}
                >
                    Error: {error}
                </div>
            </div>
        );
    }

    return (
        <div
            style={{
                textAlign: "center",
                marginBottom: "20px",
                padding: "12px",
                backgroundColor: "#f8f9fa",
                borderRadius: "8px",
            }}
        >
            <div
                style={{
                    fontSize: "11px",
                    fontWeight: 500,
                    color: "#636e72",
                    marginBottom: "6px",
                }}
            >
                Today's browsing:
            </div>
            <div
                style={{
                    fontSize: "24px",
                    fontWeight: 800,
                    color: "#2d3436",
                    marginBottom: "4px",
                }}
            >
                {stats.totalTime.toFixed(1)}h
            </div>
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: "12px",
                    fontSize: "10px",
                    fontWeight: 500,
                }}
            >
                <span style={{ color: "#4285f4" }}>
                    Work {stats.workTime.toFixed(1)}h
                </span>
                <span style={{ color: "#ff6b47" }}>
                    Social {stats.socialTime.toFixed(1)}h
                </span>
                {stats.otherTime > 0.1 && (
                    <span style={{ color: "#6c757d" }}>
                        Other {stats.otherTime.toFixed(1)}h
                    </span>
                )}
            </div>
            {stats.totalUrls > 0 && (
                <div
                    style={{
                        fontSize: "9px",
                        color: "#636e72",
                        marginTop: "6px",
                    }}
                >
                    {stats.totalUrls} sites • {stats.uniqueDomains} domains
                </div>
            )}
        </div>
    );
};

export default StatsPanel;
