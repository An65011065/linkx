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
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-5 w-full h-full relative flex flex-col">
                <h3 className="text-lg font-medium text-black mb-2">
                    Quick Actions
                </h3>
                <div className="flex flex-col gap-2 flex-1">
                    <ConsolidateTabs />
                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                // TODO: Implement Ask LynxX functionality
                                console.log("Ask LynxX clicked");
                            }}
                            className="bg-purple-100 hover:bg-purple-200 border border-purple-200 rounded-lg px-3 py-2 text-purple-700 cursor-pointer transition-all duration-200 text-sm font-medium flex items-center gap-2 flex-1"
                            title="Ask LynxX for help"
                        >
                            Ask LyncX
                        </button>
                        <button
                            onClick={() => {
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
