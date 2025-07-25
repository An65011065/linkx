import React, { useState } from "react";
import LandingPage from "./landing";
import DataLandingPage from "./dataLanding";
import NetworkLandingPage from "./networkLanding";
import MainTab from "../main/MainTab";
import "../main/styles/sunlit-window.css";

const AppRouter: React.FC = () => {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [currentPage, setCurrentPage] = useState<"main" | "data" | "network" | "maintab">(
        "main",
    );
    const [showSunlitAnimation, setShowSunlitAnimation] = useState(false);

    const handleToggleDarkMode = () => {
        setIsDarkMode(!isDarkMode);
    };

    const handleNavigate = (page: "main" | "data" | "network" | "maintab") => {
        setCurrentPage(page);
    };

    const handleSunlitAnimationToggle = (show: boolean) => {
        setShowSunlitAnimation(show);
    };

    // Render the appropriate page based on currentPage state
    return (
        <>
            {/* Sunlit Window Animation Background */}
            {showSunlitAnimation && (
                <div className="animation-container" style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    zIndex: -1,
                    pointerEvents: 'none'
                }}>
                    <div id="dappled-light">
                        <div id="glow"></div>
                        <div id="glow-bounce"></div>
                        <div className="perspective">
                            <div 
                                id="leaves"
                                style={{
                                    backgroundImage: `url('${chrome.runtime.getURL("src/assets/leaves.png")}')`
                                }}
                            >
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
            )}

            {/* Page Content */}
            {(() => {
                switch (currentPage) {
                    case "main":
                        return (
                            <LandingPage
                                isDarkMode={isDarkMode}
                                onToggleDarkMode={handleToggleDarkMode}
                                currentPage={currentPage}
                                onNavigate={handleNavigate}
                                onSunlitAnimationToggle={handleSunlitAnimationToggle}
                            />
                        );
                    case "data":
                        return (
                            <DataLandingPage
                                isDarkMode={isDarkMode}
                                onToggleDarkMode={handleToggleDarkMode}
                                currentPage={currentPage}
                                onNavigate={handleNavigate}
                                onSunlitAnimationToggle={handleSunlitAnimationToggle}
                            />
                        );
                    case "network":
                        return (
                            <NetworkLandingPage
                                isDarkMode={isDarkMode}
                                onToggleDarkMode={handleToggleDarkMode}
                                currentPage={currentPage}
                                onNavigate={handleNavigate}
                                onSunlitAnimationToggle={handleSunlitAnimationToggle}
                            />
                        );
                    case "maintab":
                        return <MainTab initialDarkMode={isDarkMode} />;
                    default:
                        return (
                            <LandingPage
                                isDarkMode={isDarkMode}
                                onToggleDarkMode={handleToggleDarkMode}
                                currentPage={currentPage}
                                onNavigate={handleNavigate}
                                onSunlitAnimationToggle={handleSunlitAnimationToggle}
                            />
                        );
                }
            })()}
        </>
    );
};

export default AppRouter;
