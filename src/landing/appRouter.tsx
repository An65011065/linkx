import React, { useState, useEffect } from "react";
import LandingPage from "./landing";
import DataLandingPage from "./dataLanding";
import NetworkLandingPage from "./networkLanding";
import InsightsLandingPage from "./insightsLanding";
import MainTab from "../main/MainTab";
import "../main/styles/sunlit-window.css";

const AppRouter: React.FC = () => {
    // Initialize with user preference, fallback to system preference
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const saved = localStorage.getItem('theme-preference');
        if (saved === 'dark') return true;
        if (saved === 'light') return false;
        // No saved preference - use system
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    });
    const [currentPage, setCurrentPage] = useState<"main" | "data" | "network" | "maintab" | "insights">(
        "main",
    );
    const [insightsQuery, setInsightsQuery] = useState("");

    // Listen for system theme changes (only if no manual override)
    useEffect(() => {
        const saved = localStorage.getItem('theme-preference');
        if (saved || !window.matchMedia) return; // User has manual preference or no media query support
        
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        
        const handleChange = (e: MediaQueryListEvent) => {
            setIsDarkMode(e.matches);
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    const handleToggleDarkMode = () => {
        const newMode = !isDarkMode;
        setIsDarkMode(newMode);
        // Save user preference
        localStorage.setItem('theme-preference', newMode ? 'dark' : 'light');
    };

    const handleNavigate = (page: "main" | "data" | "network" | "maintab" | "insights", query?: string) => {
        setCurrentPage(page);
        if (page === "insights" && query) {
            setInsightsQuery(query);
        }
    };


    // Render the appropriate page based on currentPage state
    return (
        <>
            {/* Sunlit Window Animation Background - Show for all landing pages */}
            {currentPage !== "maintab" && (
                <div className={`animation-container ${isDarkMode ? 'night-mode' : ''}`} style={{
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
                            />
                        );
                    case "data":
                        return (
                            <DataLandingPage
                                isDarkMode={isDarkMode}
                                onToggleDarkMode={handleToggleDarkMode}
                                currentPage={currentPage}
                                onNavigate={handleNavigate}
                            />
                        );
                    case "network":
                        return (
                            <NetworkLandingPage
                                isDarkMode={isDarkMode}
                                onToggleDarkMode={handleToggleDarkMode}
                                currentPage={currentPage}
                                onNavigate={handleNavigate}
                            />
                        );
                    case "maintab":
                        return <MainTab initialDarkMode={isDarkMode} />;
                    case "insights":
                        return (
                            <InsightsLandingPage
                                isDarkMode={isDarkMode}
                                onToggleDarkMode={handleToggleDarkMode}
                                currentPage={currentPage}
                                onNavigate={handleNavigate}
                                initialQuery={insightsQuery}
                            />
                        );
                    default:
                        return (
                            <LandingPage
                                isDarkMode={isDarkMode}
                                onToggleDarkMode={handleToggleDarkMode}
                                currentPage={currentPage}
                                onNavigate={handleNavigate}
                            />
                        );
                }
            })()}
        </>
    );
};

export default AppRouter;
