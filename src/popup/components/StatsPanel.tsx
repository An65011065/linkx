// StatsPanel.tsx - Stats display (visits, time, domains)
import React from "react";
import { useStatsData } from "../../shared/services/useExtensionData";

const StatsPanel: React.FC = () => {
    const { stats, totalActiveTime, loading, error } = useStatsData();

    if (loading) {
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
                {totalActiveTime.toFixed(1)}h
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
