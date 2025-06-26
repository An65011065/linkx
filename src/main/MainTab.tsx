import React, { useState, useEffect } from "react";
import Insights from "./Insights";
import DashboardTab from "../dashboard/components/DashboardTab";
import GraphVisualization from "../graph/components/GraphVisualization";

// Define tab types
type TabType = "insights" | "dashboard" | "network";

interface Tab {
    id: TabType;
    label: string;
}

const MainTab: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabType>("insights");
    const [isNetworkAnimating, setIsNetworkAnimating] = useState(false);
    const [networkLoaded, setNetworkLoaded] = useState(false);

    const tabs: Tab[] = [
        { id: "insights", label: "Insights" },
        { id: "dashboard", label: "Dashboard" },
        { id: "network", label: "Network" },
    ];

    // Handle network tab activation with animation
    const handleTabClick = (tabId: TabType) => {
        if (tabId === "network" && activeTab !== "network") {
            setIsNetworkAnimating(true);
            setActiveTab(tabId);

            // Start graph loading after a short delay
            setTimeout(() => {
                setNetworkLoaded(true);
            }, 300);
        } else {
            setActiveTab(tabId);
            setIsNetworkAnimating(false);
            setNetworkLoaded(false);
        }
    };

    // Reset animation state when leaving network tab
    useEffect(() => {
        if (activeTab !== "network") {
            setIsNetworkAnimating(false);
            setNetworkLoaded(false);
        }
    }, [activeTab]);

    // Get viewport dimensions based on tab and animation state
    const getViewportStyle = () => {
        const baseStyle = {
            backgroundColor: "#ffffff",
            border: "2px solid #ddd",
            borderRadius: "16px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            overflow: activeTab === "network" ? "hidden" : ("scroll" as const),
            transition: "all 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
            position: "relative" as const,
        };

        if (activeTab === "network") {
            if (isNetworkAnimating) {
                // Start small and animate to full viewport
                return {
                    ...baseStyle,
                    width: "95vw",
                    height: "100vh",
                    maxWidth: "none",
                    transform: "scale(1)",
                };
            } else {
                // Initial small size for network
                return {
                    ...baseStyle,
                    width: "400px",
                    height: "300px",
                    maxWidth: "400px",
                    transform: "scale(1)",
                };
            }
        } else {
            // Normal size for other tabs
            return {
                ...baseStyle,
                width: "80%",
                maxWidth: "1200px",
                height: "100vh",
                transform: "scale(1)",
            };
        }
    };

    // Content components for each tab
    const renderTabContent = () => {
        switch (activeTab) {
            case "insights":
                return <Insights />;
            case "dashboard":
                return <DashboardTab />;
            case "network":
                return (
                    <div
                        style={{
                            width: "100%",
                            height: "100%",
                            opacity: networkLoaded ? 1 : 0,
                            transition: "opacity 0.5s ease-in-out 0.3s",
                        }}
                    >
                        <GraphVisualization />
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <>
            <style>{`
                @font-face {
                    font-family: 'Nunito-Regular';
                    src: url('${chrome.runtime.getURL(
                        "src/assets/fonts/Nunito-Regular.ttf",
                    )}') format('truetype');
                    font-weight: 400;
                    font-style: normal;
                }
                @font-face {
                    font-family: 'Nunito-Bold';
                    src: url('${chrome.runtime.getURL(
                        "src/assets/fonts/Nunito-Bold.ttf",
                    )}') format('truetype');
                    font-weight: 700;
                    font-style: normal;
                }

                .network-loading-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(255, 255, 255, 0.9);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 100;
                    opacity: 1;
                    transition: opacity 0.3s ease-out;
                }

                .loading-spinner {
                    width: 40px;
                    height: 40px;
                    border: 3px solid #f3f3f3;
                    border-top: 3px solid #4285f4;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                .expand-animation {
                    animation: expandViewport 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
                }

                @keyframes expandViewport {
                    0% {
                        width: 400px;
                        height: 300px;
                        max-width: 400px;
                    }
                    100% {
                        width: 95vw;
                        height: 90vh;
                        max-width: none;
                    }
                }
            `}</style>

            <div
                style={{
                    width: "100vw",
                    height: "100vh",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    backgroundColor: "#f8f9fa",
                    fontFamily: "Nunito-Regular, Arial, sans-serif",
                }}
            >
                {/* Tab Navigation */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "60px",
                        paddingTop: "40px",
                        marginBottom: "40px",
                    }}
                >
                    {tabs.map((tab) => (
                        <div
                            key={tab.id}
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                cursor: "pointer",
                            }}
                        >
                            {/* Circle Indicator */}
                            <div
                                style={{
                                    width: "8px",
                                    height: "8px",
                                    borderRadius: "50%",
                                    backgroundColor:
                                        activeTab === tab.id
                                            ? "#d63031"
                                            : "transparent",
                                    marginBottom: "0px",
                                    transition: "background-color 0.2s ease",
                                }}
                            />

                            {/* Tab Button */}
                            <button
                                onClick={() => handleTabClick(tab.id)}
                                style={{
                                    background: "none",
                                    border: "none",
                                    padding: "8px 16px",
                                    fontFamily:
                                        "Nunito-Bold, Arial, sans-serif",
                                    fontSize: "18px",
                                    color:
                                        activeTab === tab.id
                                            ? "#2d3436"
                                            : "#636e72",
                                    cursor: "pointer",
                                    transition: "color 0.2s ease",
                                    outline: "none",
                                }}
                                onMouseEnter={(e) => {
                                    if (activeTab !== tab.id) {
                                        e.currentTarget.style.color = "#2d3436";
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (activeTab !== tab.id) {
                                        e.currentTarget.style.color = "#636e72";
                                    }
                                }}
                            >
                                {tab.label}
                            </button>
                        </div>
                    ))}
                </div>

                {/* View Window */}
                <div style={getViewportStyle()}>
                    {/* Loading overlay for network tab */}
                    {activeTab === "network" && !networkLoaded && (
                        <div className="network-loading-overlay">
                            <div style={{ textAlign: "center" }}>
                                <div className="loading-spinner"></div>
                                <div
                                    style={{
                                        marginTop: "16px",
                                        fontFamily:
                                            "Nunito-Regular, Arial, sans-serif",
                                        color: "#666",
                                        fontSize: "14px",
                                    }}
                                >
                                    Loading network visualization...
                                </div>
                            </div>
                        </div>
                    )}

                    {renderTabContent()}
                </div>
            </div>
        </>
    );
};

export default MainTab;
