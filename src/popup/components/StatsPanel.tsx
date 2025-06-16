// StatsPanel.tsx - Stats display (visits, time, domains)
import React from "react";

const StatsPanel: React.FC = () => {
    // TODO: Replace with real data from useExtensionData hook
    // For now, calculate from mock timeline data
    const totalActiveTime = 3.2; // hours
    const workTime = 1.9; // hours
    const socialTime = 0.9; // hours
    const otherTime = 0.4; // hours

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
                    Work {workTime.toFixed(1)}h
                </span>
                <span style={{ color: "#ff6b47" }}>
                    Social {socialTime.toFixed(1)}h
                </span>
                {otherTime > 0.1 && (
                    <span style={{ color: "#6c757d" }}>
                        Other {otherTime.toFixed(1)}h
                    </span>
                )}
            </div>
        </div>
    );
};

export default StatsPanel;
