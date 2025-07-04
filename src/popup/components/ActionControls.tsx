import React, { useState } from "react";
import { Play, Pause } from "lucide-react";

const ActionControls: React.FC = () => {
    const [isPaused, setIsPaused] = useState(false);

    const handleToggleTracking = () => {
        setIsPaused(!isPaused);
        // TODO: Implement actual pause/resume logic
        console.log(isPaused ? "Resuming tracking" : "Pausing tracking");
    };

    const handleViewGraph = () => {
        // TODO: Implement dashboard navigation
        if (typeof chrome !== "undefined" && chrome.tabs) {
            chrome.tabs.create({
                url: chrome.runtime.getURL("src/main/main.html"),
            });
        } else {
            // For development
            window.open("dashboard.html", "_blank");
        }
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
                    flex: 1,
                    padding: "10px",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "11px",
                    fontWeight: 600,
                    backgroundColor: isPaused ? "#28a745" : "#ffc107",
                    color: isPaused ? "white" : "#212529",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                }}
            >
                {isPaused ? <Play size={12} /> : <Pause size={12} />}
                {isPaused ? "Resume" : "Pause"}
            </button>

            <button
                onClick={handleViewGraph}
                style={{
                    flex: 2,
                    padding: "10px",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "11px",
                    fontWeight: 600,
                    backgroundColor: "#4285f4",
                    color: "white",
                    cursor: "pointer",
                }}
            >
                View links
            </button>
        </div>
    );
};

export default ActionControls;
