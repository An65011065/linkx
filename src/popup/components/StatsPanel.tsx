// StatsPanel.tsx - Stats display (visits, time, domains)
import React from "react";
import { useExtensionData } from "../../data/useExtensionData";

const StatsPanel: React.FC = () => {
    const { currentSession, isLoading, error } = useExtensionData();

    // Format time from milliseconds to hours with one decimal
    const formatTimeToHours = (milliseconds: number) => {
        return (milliseconds / (1000 * 60 * 60)).toFixed(1);
    };

    // Get stats from session
    const stats = currentSession?.stats || {
        totalTime: 0,
        workTime: 0,
        socialTime: 0,
        otherTime: 0,
        totalUrls: 0,
        uniqueDomains: 0,
    };

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
                Today's active browsing:
            </div>
            <div
                style={{
                    fontSize: "24px",
                    fontWeight: 800,
                    color: "#2d3436",
                    marginBottom: "4px",
                }}
            >
                {formatTimeToHours(stats.totalTime)}h
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
                    Work {formatTimeToHours(stats.workTime)}h
                </span>
                <span style={{ color: "#ff6b47" }}>
                    Social {formatTimeToHours(stats.socialTime)}h
                </span>
                {stats.otherTime > 100 && (
                    <span style={{ color: "#6c757d" }}>
                        Other {formatTimeToHours(stats.otherTime)}h
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
