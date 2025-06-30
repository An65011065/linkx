import React, { useState, useEffect } from "react";
import Insights from "./Insights";
import DashboardTab from "../dashboard/components/DashboardTab";
import GraphVisualization from "../graph/components/GraphVisualization";
import { downloadSessionData } from "../data/useExtensionData";
import "./styles/sunlit-window.css";

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
    const [showDownloadMenu, setShowDownloadMenu] = useState(false);
    const [isInputFocused, setIsInputFocused] = useState(false);

    const tabs: Tab[] = [
        { id: "insights", label: "Insights" },
        { id: "dashboard", label: "Dashboard" },
        { id: "network", label: "Network" },
    ];

    // Function to handle input focus state from Insights component
    const handleInputFocusChange = (focused: boolean) => {
        setIsInputFocused(focused);
    };

    useEffect(() => {
        // Set the leaves background image dynamically only when on insights tab
        if (activeTab === "insights") {
            const leavesElement = document.getElementById("leaves");
            if (leavesElement) {
                // Use the correct path for the extension
                leavesElement.style.backgroundImage = `url('${chrome.runtime.getURL(
                    "src/assets/leaves.png",
                )}')`;
            }
        }

        // Add animation-ready class after a short delay to trigger animation
        setTimeout(() => {
            document
                .querySelector(".animation-container")
                ?.classList.add("animation-ready");
        }, 100);
    }, [activeTab]);

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
            border: "1px solid rgba(255, 255, 255, 0.18)",
            borderRadius: "16px",
            overflowY:
                activeTab === "network"
                    ? ("hidden" as const)
                    : ("scroll" as const),
            overflowX: "hidden" as const,
            transition: "all 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
            position: "relative" as const,
            zIndex: 10,
            // Glass effect properties
            background: "rgba(255, 255, 255, 0.25)",
            boxShadow: "0 8px 32px rgba(31, 38, 135, 0.37)",
            backdropFilter: "blur(8px) saturate(100%)",
            WebkitBackdropFilter: "blur(8px) saturate(100%)",
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
                return <Insights onInputFocusChange={handleInputFocusChange} />;
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
                
                .main-tab-container {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    z-index: 1;
                }
                
                .animation-background {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    z-index: 1;
                    pointer-events: none;
                }
                
                .content-layer {
                    position: relative;
                    width: 100vw;
                    height: 100vh;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    backgroundColor: transparent;
                    fontFamily: "Nunito-Regular, Arial, sans-serif";
                    z-index: 5;
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
                .download-button {
                    background: #f8f9fa;
                    border: 2px solid #ddd;
                    border-radius: 8px;
                    padding: 8px 16px;
                    font-family: Nunito-Bold, Arial, sans-serif;
                    font-size: 14px;
                    color: #2d3436;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    position: relative;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .download-button:hover {
                    background: #f1f3f5;
                    border-color: #c5c9cc;
                }
                .download-menu {
                    position: absolute;
                    top: 100%;
                    right: 0;
                    margin-top: 8px;
                    background: white;
                    border: 2px solid #ddd;
                    border-radius: 8px;
                    padding: 8px 0;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                    z-index: 1000;
                }
                .download-option {
                    padding: 8px 16px;
                    font-family: Nunito-Regular, Arial, sans-serif;
                    font-size: 14px;
                    color: #2d3436;
                    cursor: pointer;
                    transition: background 0.2s ease;
                    white-space: nowrap;
                }
                .download-option:hover {
                    background: #f8f9fa;
                }
                .download-icon {
                    width: 16px;
                    height: 16px;
                    fill: currentColor;
                }
            `}</style>

            <div className="main-tab-container">
                {/* Animation Background Layer */}
                <div
                    className={`animation-background animation-container ${
                        isInputFocused ? "dawn" : ""
                    }`}
                >
                    <div id="dappled-light">
                        <div id="glow"></div>
                        <div id="glow-bounce"></div>
                        <div className="perspective">
                            {activeTab === "insights" && (
                                <div id="leaves">
                                    <svg
                                        style={{
                                            width: 0,
                                            height: 0,
                                            position: "absolute",
                                        }}
                                    >
                                        <defs>
                                            <filter
                                                id="wind"
                                                x="-20%"
                                                y="-20%"
                                                width="140%"
                                                height="140%"
                                            >
                                                <feTurbulence
                                                    type="fractalNoise"
                                                    numOctaves="2"
                                                    seed="1"
                                                >
                                                    <animate
                                                        attributeName="baseFrequency"
                                                        dur="16s"
                                                        keyTimes="0;0.33;0.66;1"
                                                        values="0.005 0.003;0.01 0.009;0.008 0.004;0.005 0.003"
                                                        repeatCount="indefinite"
                                                    />
                                                </feTurbulence>
                                                <feDisplacementMap in="SourceGraphic">
                                                    <animate
                                                        attributeName="scale"
                                                        dur="20s"
                                                        keyTimes="0;0.25;0.5;0.75;1"
                                                        values="45;55;75;55;45"
                                                        repeatCount="indefinite"
                                                    />
                                                </feDisplacementMap>
                                            </filter>
                                        </defs>
                                    </svg>
                                </div>
                            )}
                            <div id="blinds">
                                <div className="shutters">
                                    {Array(20)
                                        .fill(null)
                                        .map((_, i) => (
                                            <div
                                                key={i}
                                                className="shutter"
                                            ></div>
                                        ))}
                                </div>
                                <div className="vertical">
                                    <div className="bar"></div>
                                    <div className="bar"></div>
                                </div>
                            </div>
                        </div>
                        <div id="progressive-blur">
                            <div></div>
                            <div></div>
                            <div></div>
                            <div></div>
                        </div>
                    </div>
                </div>

                {/* Content Layer */}
                <div className="content-layer">
                    {/* Tab Navigation Container */}
                    <div
                        style={{
                            width: "80%",
                            maxWidth: "1200px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            paddingTop: "40px",
                            marginBottom: "40px",
                        }}
                    >
                        {/* Tabs */}
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "60px",
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
                                            transition:
                                                "background-color 0.2s ease",
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
                                                e.currentTarget.style.color =
                                                    "#2d3436";
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (activeTab !== tab.id) {
                                                e.currentTarget.style.color =
                                                    "#636e72";
                                            }
                                        }}
                                    >
                                        {tab.label}
                                    </button>
                                </div>
                            ))}
                        </div>
                        {/* Download Button */}
                        <div style={{ position: "relative" }}>
                            <button
                                className="download-button"
                                onClick={() =>
                                    setShowDownloadMenu(!showDownloadMenu)
                                }
                                onBlur={() =>
                                    setTimeout(
                                        () => setShowDownloadMenu(false),
                                        200,
                                    )
                                }
                            >
                                <svg
                                    className="download-icon"
                                    viewBox="0 0 24 24"
                                >
                                    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                                </svg>
                                Export Data
                            </button>
                            {showDownloadMenu && (
                                <div className="download-menu">
                                    <div
                                        className="download-option"
                                        onClick={() => {
                                            downloadSessionData("json");
                                            setShowDownloadMenu(false);
                                        }}
                                    >
                                        Download as JSON
                                    </div>
                                    <div
                                        className="download-option"
                                        onClick={() => {
                                            downloadSessionData("csv");
                                            setShowDownloadMenu(false);
                                        }}
                                    >
                                        Download as CSV
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Glass View Window */}
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
            </div>
        </>
    );
};

export default MainTab;
