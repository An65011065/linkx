import React from "react";

const formatTime = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
};

const SecondaryMetrics: React.FC = () => {
    // TODO: Replace with real data from useExtensionData hook
    const sessionTime = 182; // minutes - PLACEHOLDER
    const topSite = "youtube.com"; // PLACEHOLDER
    const totalUrls = 127; // PLACEHOLDER

    return (
        <div
            style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "10px 12px",
                backgroundColor: "#f8f9fa",
                borderRadius: "6px",
                marginBottom: "16px",
                fontSize: "11px",
                color: "#636e72",
            }}
        >
            <div>
                <span style={{ fontWeight: 600, color: "#2d3436" }}>
                    {formatTime(sessionTime)}
                </span>
                <div>Session Time</div>
            </div>
            <div style={{ textAlign: "center" }}>
                <span style={{ fontWeight: 600, color: "#2d3436" }}>
                    {topSite}
                </span>
                <div>Top Site</div>
            </div>
            <div style={{ textAlign: "right" }}>
                <span style={{ fontWeight: 600, color: "#4285f4" }}>
                    {totalUrls}
                </span>
                <div>Total URLs</div>
            </div>
        </div>
    );
};

export default SecondaryMetrics;
