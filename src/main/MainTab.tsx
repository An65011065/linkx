import React, { useState, useEffect } from "react";
import Insights from "./Insights";
import DashboardTab from "../dashboard/components/DashboardTab";
import GraphVisualization from "../graph/components/GraphVisualization";
import { downloadSessionData } from "../data/useExtensionData";
import { Download, Sun, Moon } from "lucide-react";
import AuthService from "../services/authService";
import type { AuthUser } from "../services/authService";
import "./styles/sunlit-window.css";

// Global variable for free trial state
export let freeTrial = false;

// Define tab types
type TabType = "insights" | "dashboard" | "network";

interface Tab {
    id: TabType;
    label: string;
}

const MainTab: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabType>("dashboard");
    const [networkLoaded, setNetworkLoaded] = useState(false);
    const [showDownloadMenu, setShowDownloadMenu] = useState(false);
    const [isInputFocused, setIsInputFocused] = useState(false);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const [isDarkMode, setIsDarkMode] = useState(true);

    // Add auth state and trial toggle
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isFreeTrial, setIsFreeTrial] = useState(false);

    // Update global variable when state changes
    useEffect(() => {
        freeTrial = isFreeTrial;
    }, [isFreeTrial]);

    // Load user and set initial trial state
    useEffect(() => {
        const authService = AuthService.getInstance();

        const loadUser = async () => {
            await authService.waitForAuthReady();
            const currentUser = authService.getCurrentUser();
            setUser(currentUser);

            // Set trial toggle based on plan
            if (currentUser?.plan) {
                const planType = currentUser.plan.type;
                // Turn toggle ON only for free plan, OFF for trial/pro/plus
                setIsFreeTrial(planType === "free");
            }
        };

        loadUser();

        // Listen for auth changes
        const unsubscribe = authService.onAuthStateChanged((authUser) => {
            setUser(authUser);
            if (authUser?.plan) {
                const planType = authUser.plan.type;
                setIsFreeTrial(planType === "free");
            }
        });

        return () => unsubscribe();
    }, []);

    const tabs: Tab[] = [
        { id: "insights", label: "Insights" },
        { id: "dashboard", label: "Dashboard" },
        { id: "network", label: "Network" },
    ];

    // Function to handle input focus state from Insights component
    const handleInputFocusChange = (focused: boolean) => {
        setIsInputFocused(focused);
    };

    // Handle trial toggle - only allow toggle for free plan
    const handleTrialToggle = (checked: boolean) => {
        if (user?.plan?.type === "free") {
            setIsFreeTrial(checked);
        }
        // For other plans, don't allow toggle (they're locked to OFF)
    };

    // Get plan display text
    const getPlanDisplayText = () => {
        if (!user?.plan) return "Loading...";

        const planType = user.plan.type;
        const status = user.plan.status;

        // Capitalize first letter and add status if needed
        const displayName =
            planType.charAt(0).toUpperCase() + planType.slice(1);

        if (status === "expired") {
            return `${displayName} (Expired)`;
        } else if (status === "canceled") {
            return `${displayName} (Canceled)`;
        }

        return displayName;
    };

    // Get plan color
    const getPlanColor = () => {
        if (!user?.plan) return "#636e72";

        switch (user.plan.type) {
            case "free":
                return "#636e72";
            case "trial":
                return "#00b894";
            case "pro":
                return "#0984e3";
            case "plus":
                return "#6c5ce7";
            default:
                return "#636e72";
        }
    };

    // Handle window resize for responsive behavior
    useEffect(() => {
        const handleResize = () => {
            setWindowWidth(window.innerWidth);
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

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
            setActiveTab(tabId);
            // Start graph loading immediately for network tab
            setNetworkLoaded(true);
        } else {
            setActiveTab(tabId);
            setNetworkLoaded(false);
        }
    };

    // Reset animation state when leaving network tab
    useEffect(() => {
        if (activeTab !== "network") {
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
                    : ("hidden" as const),
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
            // Always use full size for network tab to prevent constraint issues
            return {
                ...baseStyle,
                width: "100vw",
                height: "95vh",
                maxWidth: "none",
                transform: "scale(1)",
            };
        } else {
            // Fixed size for other tabs - maintain 1200px until screen width ≤ 1200px
            const fixedWidth = 1200;
            const shouldScale = windowWidth <= fixedWidth;

            return {
                ...baseStyle,
                width: shouldScale ? "100vw" : `${fixedWidth}px`,
                height: "100vh",
                maxWidth: shouldScale ? "none" : `${fixedWidth}px`,
                transform: shouldScale
                    ? `scale(${windowWidth / fixedWidth})`
                    : "scale(1)",
                transformOrigin: "top center",
            };
        }
    };

    // Content components for each tab
    const renderTabContent = () => {
        switch (activeTab) {
            case "insights":
                return <Insights onInputFocusChange={handleInputFocusChange} />;
            case "dashboard":
                return <DashboardTab isDarkMode={isDarkMode} />;
            case "network":
                return (
                    <div
                        className="w-full h-full opacity-0 transition-opacity duration-500 ease-in-out"
                        style={{ opacity: networkLoaded ? 1 : 0 }}
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
                    fontFamily: "system-ui, -apple-system, sans-serif";
                    fontWeight: 600;
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
                .trial-control {
                    position: fixed;
                    top: 20px;
                    left: 20px;
                    z-index: 1000;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    background: rgba(255, 255, 255, 0.9);
                    padding: 8px 12px;
                    border-radius: 8px;
                    backdrop-filter: blur(8px);
                }
                .switch {
                    position: relative;
                    display: inline-block;
                    width: 40px;
                    height: 20px;
                }
                .switch input {
                    opacity: 0;
                    width: 0;
                    height: 0;
                }
                .slider {
                    position: absolute;
                    cursor: pointer;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: #ccc;
                    transition: .4s;
                    border-radius: 34px;
                }
                .slider:before {
                    position: absolute;
                    content: "";
                    height: 16px;
                    width: 16px;
                    left: 2px;
                    bottom: 2px;
                    background-color: white;
                    transition: .4s;
                    border-radius: 50%;
                }
                input:checked + .slider {
                    background-color: #2196F3;
                }
                input:checked + .slider:before {
                    transform: translateX(20px);
                }
                .slider.disabled {
                    cursor: not-allowed;
                    opacity: 0.6;
                }
            `}</style>
            <div className="main-tab-container">
                {/* Trial Control with Plan Display */}
                <div className="trial-control">
                    <label className="switch">
                        <input
                            type="checkbox"
                            checked={isFreeTrial}
                            onChange={(e) =>
                                handleTrialToggle(e.target.checked)
                            }
                            disabled={user?.plan?.type !== "free"}
                        />
                        <span
                            className={`slider ${
                                user?.plan?.type !== "free" ? "disabled" : ""
                            }`}
                        ></span>
                    </label>
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "2px",
                        }}
                    >
                        <span
                            style={{
                                color: "#2d3436",
                                fontFamily:
                                    "system-ui, -apple-system, sans-serif",
                                fontSize: "1rem",
                                fontWeight: "600",
                            }}
                        >
                            Free Trial
                        </span>
                        <span
                            style={{
                                color: getPlanColor(),
                                fontFamily:
                                    "system-ui, -apple-system, sans-serif",
                                fontSize: "12px",
                                fontWeight: "700",
                            }}
                        >
                            {getPlanDisplayText()}
                        </span>
                    </div>
                </div>

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
                                    <svg className="w-0 h-0 absolute">
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
                        className="flex justify-center items-center pt-10 mb-10 relative"
                        style={{
                            width: (() => {
                                const fixedWidth = 1200;
                                const shouldScale = windowWidth <= fixedWidth;
                                return shouldScale
                                    ? "100vw"
                                    : `${fixedWidth}px`;
                            })(),
                            maxWidth: (() => {
                                const fixedWidth = 1200;
                                const shouldScale = windowWidth <= fixedWidth;
                                return shouldScale ? "none" : `${fixedWidth}px`;
                            })(),
                        }}
                    >
                        {/* Tabs */}
                        <div className="flex items-center gap-[60px]">
                            {tabs.map((tab) => (
                                <div
                                    key={tab.id}
                                    className="flex flex-col items-center cursor-pointer"
                                >
                                    {/* Circle Indicator */}
                                    <div
                                        className="w-2 h-2 rounded-full mb-0 transition-colors duration-200"
                                        style={{
                                            backgroundColor:
                                                activeTab === tab.id
                                                    ? "#d63031"
                                                    : "transparent",
                                        }}
                                    />
                                    {/* Tab Button */}
                                    <button
                                        onClick={() => handleTabClick(tab.id)}
                                        className="bg-transparent border-none px-4 py-2 text-lg cursor-pointer transition-colors duration-200 outline-none"
                                        style={{
                                            fontFamily:
                                                "system-ui, -apple-system, sans-serif",
                                            fontWeight: "600",
                                            color:
                                                activeTab === tab.id
                                                    ? "#2d3436"
                                                    : "#636e72",
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
                    </div>

                    {/* Glass View Window */}
                    <div style={getViewportStyle()}>
                        {/* Loading overlay for network tab */}
                        {activeTab === "network" && !networkLoaded && (
                            <div className="network-loading-overlay">
                                <div className="text-center">
                                    <div className="loading-spinner"></div>
                                    <div
                                        className="mt-4 text-[#666] text-sm"
                                        style={{
                                            fontFamily:
                                                "system-ui, -apple-system, sans-serif",
                                            fontWeight: "600",
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

                {/* Action Buttons - positioned outside content layer at bottom-right */}
                {activeTab === "dashboard" && (
                    <div
                        className="fixed flex flex-col gap-0 z-20 -mb-0.5"
                        style={{
                            bottom: "0.5rem",
                            right: (() => {
                                const fixedWidth = 1200;
                                const shouldScale = windowWidth <= fixedWidth;
                                if (shouldScale) {
                                    return "20px"; // Close to screen edge when scaled
                                } else {
                                    const leftMargin =
                                        (windowWidth - fixedWidth) / 2;
                                    return `${leftMargin - 40}px`; // 60px to the left of viewport (outside it)
                                }
                            })(),
                        }}
                    >
                        {/* Dark Mode Toggle Button */}
                        <button
                            onClick={() => setIsDarkMode(!isDarkMode)}
                            className="p-2 rounded-lg cursor-pointer transition-all duration-200 hover:bg-black/5 -mb-2"
                            style={{
                                background: "transparent",
                                border: "none",
                                color: "#636e72",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.color = "#000";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.color = "#636e72";
                            }}
                        >
                            {isDarkMode ? (
                                <Moon size={20} />
                            ) : (
                                <Sun size={20} />
                            )}
                        </button>

                        {/* Download Button */}
                        <div className="relative">
                            <button
                                onClick={() =>
                                    setShowDownloadMenu(!showDownloadMenu)
                                }
                                onBlur={() =>
                                    setTimeout(
                                        () => setShowDownloadMenu(false),
                                        200,
                                    )
                                }
                                className="p-2 rounded-lg cursor-pointer transition-all duration-200 hover:bg-black/5"
                                style={{
                                    background: "transparent",
                                    border: "none",
                                    color: "#636e72",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.color = "#2d3436";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.color = "#636e72";
                                }}
                            >
                                <Download size={20} />
                            </button>
                            {showDownloadMenu && (
                                <div className="absolute bottom-full right-0 mb-2 bg-white border border-gray-200 rounded-lg py-2 shadow-lg z-[1000] min-w-[140px]">
                                    <div
                                        className="px-4 py-2 text-sm text-[#2d3436] cursor-pointer transition-colors duration-200 whitespace-nowrap hover:bg-[#f8f9fa]"
                                        style={{
                                            fontFamily:
                                                "system-ui, -apple-system, sans-serif",
                                            fontWeight: "600",
                                        }}
                                        onClick={() => {
                                            downloadSessionData("json");
                                            setShowDownloadMenu(false);
                                        }}
                                    >
                                        Download as JSON
                                    </div>
                                    <div
                                        className="px-4 py-2 text-sm text-[#2d3436] cursor-pointer transition-colors duration-200 whitespace-nowrap hover:bg-[#f8f9fa]"
                                        style={{
                                            fontFamily:
                                                "system-ui, -apple-system, sans-serif",
                                            fontWeight: "600",
                                        }}
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
                )}
            </div>
        </>
    );
};

export default MainTab;
