import React, { useState, useEffect } from "react";
import StoriesComponent from "./stories";
import Shortcuts from "./Shortcuts";
// import WebsiteBlocker from "./WebsiteBlocker";
// import NotesOverview from "./NotesOverview";
import WeeklyInsights from "./WeeklyInsights";
import Timers from "./Timers";
import Templates from "./Templates";
// import Templates from "./light-mode/Templates";
// import Timers from "./light-mode/Timers";
// import WeeklyInsights from "./light-mode/WeeklyInsights";
// import Shortcuts from "./light-mode/Shortcuts";
import WebsiteBlocker from "./WebsiteBlocker";
import NotesOverview from "./NotesOverview";
import ScrollableContainer from "./ScrollableContainer";

interface DashboardTabProps {
    isDarkMode?: boolean;
}

const DashboardTab: React.FC<DashboardTabProps> = ({ isDarkMode = true }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [scale, setScale] = useState(1);

    useEffect(() => {
        // Give components time to mount and load
        const timer = setTimeout(() => {
            setIsLoaded(true);
        }, 100); // Adjust timing as needed

        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        const baseWidth = 1200;

        const handleResize = () => {
            const { innerWidth } = window;
            // Only scale when screen width is smaller than base width
            const newScale =
                innerWidth <= baseWidth ? innerWidth / baseWidth : 1;
            setScale(newScale);
        };

        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    if (!isLoaded) {
        return (
            <div
                style={{
                    height: "100%",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: isDarkMode ? "#000000" : "#ffffff",
                }}
            >
                <div
                    style={{
                        color: isDarkMode
                            ? "rgba(255, 255, 255, 0.7)"
                            : "rgba(0, 0, 0, 0.7)",
                        fontSize: "16px",
                        fontFamily: "Arial, sans-serif",
                    }}
                >
                    Loading...
                </div>
            </div>
        );
    }

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                overflow: "auto",
                backgroundColor: isDarkMode ? "#000000" : "#ffffff",
            }}
        >
            <div
                style={{
                    transform: `scale(${scale})`,
                    transformOrigin: "top left",
                    width: `${100 / scale}%`,
                    height: `${100 / scale}%`,
                    fontFamily: "Arial, sans-serif",
                    backgroundColor: isDarkMode ? "#000000" : "#ffffff",
                    overflow: "hidden",
                    position: "relative",
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "20px",
                }}
            >
                {/* Background gradients */}
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        right: 0,
                        width: "600px",
                        height: "600px",
                        zIndex: 10,
                        pointerEvents: "none",
                        background: isDarkMode
                            ? "radial-gradient(circle, rgba(66, 133, 244, 0.4) 0%, rgba(255, 107, 71, 0.2) 50%, transparent 80%)"
                            : "radial-gradient(circle, rgba(66, 133, 244, 0.1) 0%, rgba(255, 107, 71, 0.05) 50%, transparent 80%)",
                        filter: "blur(40px)",
                    }}
                />
                <div
                    style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        width: "400px",
                        height: "400px",
                        zIndex: 10,
                        pointerEvents: "none",
                        background: isDarkMode
                            ? "radial-gradient(circle, rgba(255, 107, 71, 0.3) 0%, transparent 70%)"
                            : "radial-gradient(circle, rgba(255, 107, 71, 0.08) 0%, transparent 70%)",
                        filter: "blur(30px)",
                    }}
                />

                <style>{`
                @font-face {
                    font-family: 'Gaegu-Bold';
                    src: url('${chrome.runtime.getURL(
                        "src/assets/fonts/Gaegu-Bold.ttf",
                    )}') format('truetype');
                    font-weight: 700;
                    font-style: normal;
                }
                @font-face {
                    font-family: 'Gaegu-Regular';
                    src: url('${chrome.runtime.getURL(
                        "src/assets/fonts/Gaegu-Regular.ttf",
                    )}') format('truetype');
                    font-weight: 400;
                    font-style: normal;
                }
                @font-face {
                    font-family: 'Gaegu-Light';
                    src: url('${chrome.runtime.getURL(
                        "src/assets/fonts/Gaegu-Light.ttf",
                    )}') format('truetype');
                    font-weight: 300;
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
                @font-face {
                    font-family: 'Nunito-Regular';
                    src: url('${chrome.runtime.getURL(
                        "src/assets/fonts/Nunito-Regular.ttf",
                    )}') format('truetype');
                    font-weight: 400;
                    font-style: normal;
                }
                @import url('https://fonts.googleapis.com/icon?family=Material+Icons');
            `}</style>

                {/* Main content */}
                <div
                    style={{
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                        position: "relative",
                        zIndex: 20,
                    }}
                >
                    {/* Row 1: Stories (75% width) */}
                    <div
                        style={{
                            height: "55%",
                            display: "flex",
                            width: "100%",
                            gap: "10px",
                        }}
                    >
                        <div
                            style={{ width: "70%", height: "100%" }}
                            id="stories-component"
                            className="dashboard-component"
                        >
                            <StoriesComponent isDarkMode={isDarkMode} />
                        </div>
                        <div
                            style={{
                                width: "30%",
                                height: "100%",
                                display: "flex",
                                flexDirection: "column",
                                gap: "0.4rem",
                            }}
                        >
                            <div
                                style={{ height: "25%" }}
                                id="templates-component"
                                className="dashboard-component"
                            >
                                <Templates isDarkMode={isDarkMode} />
                            </div>
                            <div
                                style={{ height: "25%" }}
                                id="timers-component"
                                className="dashboard-component"
                            >
                                <Timers isDarkMode={isDarkMode} />
                            </div>
                            <div
                                style={{ height: "46%" }}
                                id="weekly-insights-component"
                                className="dashboard-component"
                            >
                                <WeeklyInsights isDarkMode={isDarkMode} />
                            </div>

                            {/* <div style={{ height: "16.67%" }}>
                            <ConsolidateTabs />
                        </div> */}
                        </div>
                    </div>

                    {/* Row 2: Ghost Tabs + Shortcuts and Website Blocker */}
                    <div
                        style={{
                            height: "45%",
                            display: "flex",
                            gap: "10px",
                            width: "100%",
                            // border: "1px solid red",
                        }}
                    >
                        {/* Column 1: Ghost Tabs + Shortcuts (25% width) */}
                        <div
                            style={{
                                width: "25%",
                                height: "100%",
                                display: "flex",
                                flexDirection: "column",
                                gap: "4px",
                                // border: "1px solid white",
                            }}
                        >
                            <div
                                style={{ height: "60%" }}
                                id="scrollable-component"
                                className="dashboard-component"
                            >
                                <ScrollableContainer isDarkMode={isDarkMode} />
                            </div>
                            <div
                                style={{ height: "40%" }}
                                id="shortcuts-component"
                                className="dashboard-component"
                            >
                                <Shortcuts isDarkMode={isDarkMode} />
                            </div>
                        </div>

                        {/* Column 2: Website Blocker (37% width) */}
                        <div
                            style={{
                                width: "37%",
                                height: "100%",
                                display: "flex",
                                flexDirection: "column",
                            }}
                            id="blocker-component"
                            className="dashboard-component"
                        >
                            <WebsiteBlocker isDarkMode={isDarkMode} />
                        </div>

                        {/* Column 3: Notes Overview (38% width) */}
                        <div
                            style={{ width: "38%", height: "100%" }}
                            id="notes-component"
                            className="dashboard-component"
                        >
                            <NotesOverview isDarkMode={isDarkMode} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardTab;
