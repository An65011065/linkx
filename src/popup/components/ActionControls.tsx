// ActionButtons.tsx - View Graph, Clear, Pause buttons
import React, { useState } from "react";
import { Play, Pause, BarChart3, Trash2 } from "lucide-react";

const ActionControls: React.FC = () => {
    const [isPaused, setIsPaused] = useState(false);

    const handleToggleTracking = () => {
        setIsPaused(!isPaused);
        // TODO: Implement actual pause/resume logic
        console.log(isPaused ? "Resuming tracking" : "Pausing tracking");
    };

    const handleViewGraph = () => {
        // TODO: Implement graph navigation
        chrome.tabs.create({
            url: chrome.runtime.getURL("src/graph/graph.html"),
        });
    };

    const handleClear = () => {
        if (
            confirm(
                "Are you sure you want to clear all browsing data? This cannot be undone.",
            )
        ) {
            // TODO: Implement clear data logic
            console.log("Clearing data");
        }
    };

    const buttonStyle = {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
        padding: "8px 16px",
        border: "none",
        borderRadius: "5px",
        fontSize: "12px",
        fontWeight: 600,
        cursor: "pointer",
        transition: "all 0.2s ease",
    };

    return (
        <div
            style={{
                display: "flex",
                gap: "8px",
                marginBottom: "16px",
            }}
        >
            <button
                onClick={handleToggleTracking}
                style={{
                    ...buttonStyle,
                    backgroundColor: isPaused ? "#28a745" : "#ffc107",
                    color: isPaused ? "white" : "#212529",
                    flex: 1,
                }}
            >
                {isPaused ? <Play size={14} /> : <Pause size={14} />}
                {isPaused ? "Resume" : "Pause"}
            </button>

            <button
                onClick={handleViewGraph}
                style={{
                    ...buttonStyle,
                    backgroundColor: "#4285f4",
                    color: "white",
                    flex: 2,
                }}
            >
                <BarChart3 size={14} />
                View Graph
            </button>

            <button
                onClick={handleClear}
                style={{
                    ...buttonStyle,
                    backgroundColor: "#dc3545",
                    color: "white",
                    flex: 1,
                }}
            >
                <Trash2 size={14} />
                Clear
            </button>
        </div>
    );
};

export default ActionControls;
