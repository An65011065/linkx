import React from "react";
import ConsolidateTabs from "./ConsolidateTabs";

const Shortcuts: React.FC = () => {
    return (
        <>
            <style>{`
                @keyframes gradient {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                @keyframes pulse {
                    0% { opacity: 0.8; }
                    100% { opacity: 1; }
                }
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
            `}</style>
            <div
                style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    borderRadius: "16px",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    backdropFilter: "blur(10px)",
                    padding: "10px",
                    width: "100%",
                    height: "100%",
                    position: "relative",
                }}
            >
                <h3
                    style={{
                        fontSize: "14px",
                        fontWeight: "400",
                        color: "rgba(255, 255, 255, 0.9)",
                        margin: "0 0 4px 0",
                        fontFamily: "system-ui, -apple-system, sans-serif",
                    }}
                >
                    Quick Actions
                </h3>
                <div
                    style={{
                        display: "flex",
                        gap: "8px",
                        flexDirection: "column",
                    }}
                >
                    <ConsolidateTabs />
                    <div style={{ display: "flex", gap: "8px" }}>
                        <button
                            onClick={() => {
                                // TODO: Implement Ask LynxX functionality
                                console.log("Ask LynxX clicked");
                            }}
                            style={{
                                background: "rgba(138, 43, 226, 0.2)",
                                border: "1px solid rgba(138, 43, 226, 0.3)",
                                borderRadius: "8px",
                                padding: "8px 12px",
                                color: "rgba(255, 255, 255, 0.9)",
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                                fontSize: "13px",
                                fontWeight: "500",
                                fontFamily:
                                    "system-ui, -apple-system, sans-serif",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                flex: 1,
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background =
                                    "rgba(138, 43, 226, 0.3)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background =
                                    "rgba(138, 43, 226, 0.2)";
                            }}
                            title="Ask LynxX for help"
                        >
                            Ask LyncX
                        </button>
                        <button
                            onClick={() => {
                                // TODO: Implement View Plan functionality
                                console.log("View Plan clicked");
                            }}
                            style={{
                                background:
                                    "linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #ffeaa7)",
                                backgroundSize: "400% 400%",
                                border: "none",
                                borderRadius: "8px",
                                padding: "8px 12px",
                                color: "#ffffff",
                                cursor: "pointer",
                                fontSize: "13px",
                                fontWeight: "600",
                                fontFamily:
                                    "system-ui, -apple-system, sans-serif",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                flex: 1,
                                position: "relative",
                                overflow: "hidden",
                                textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                                boxShadow:
                                    "0 4px 15px rgba(255, 107, 107, 0.4)",
                                animation:
                                    "gradient 3s ease infinite, pulse 2s ease-in-out infinite alternate",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = "scale(1.05)";
                                e.currentTarget.style.boxShadow =
                                    "0 6px 20px rgba(255, 107, 107, 0.6)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = "scale(1)";
                                e.currentTarget.style.boxShadow =
                                    "0 4px 15px rgba(255, 107, 107, 0.4)";
                            }}
                            title="View your personalized plan"
                        >
                            ✨ View Plans
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Shortcuts;
