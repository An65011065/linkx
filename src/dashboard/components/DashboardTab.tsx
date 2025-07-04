import React, { useState, useEffect } from "react";
import StoriesComponent from "./stories";
import GhostTab from "./GhostTab";
import Shortcuts from "./Shortcuts";
import WebsiteBlocker from "./WebsiteBlocker";
import NotesOverview from "./NotesOverview";
import WeeklyInsights from "./WeeklyInsights";
import Templates from "./Templates";
import Timers from "./Timers";

const DashboardTab: React.FC = () => {
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        // Give components time to mount and load
        const timer = setTimeout(() => {
            setIsLoaded(true);
        }, 100); // Adjust timing as needed

        return () => clearTimeout(timer);
    }, []);

    if (!isLoaded) {
        return (
            <div
                style={{
                    height: "100%",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: "#000000",
                }}
            >
                <div
                    style={{
                        color: "rgba(255, 255, 255, 0.7)",
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
                height: "100%",
                fontFamily: "Arial, sans-serif",
                backgroundColor: "#000000",
                overflowY: "hidden",
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
                    background:
                        "radial-gradient(circle, rgba(66, 133, 244, 0.4) 0%, rgba(255, 107, 71, 0.2) 50%, transparent 80%)",
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
                    background:
                        "radial-gradient(circle, rgba(255, 107, 71, 0.3) 0%, transparent 70%)",
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
                    )}
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
                    <div style={{ width: "70%", height: "100%" }}>
                        <StoriesComponent />
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
                        <div style={{ height: "25%" }}>
                            <Templates />
                        </div>
                        <div style={{ height: "25%" }}>
                            <Timers />
                        </div>
                        <div style={{ height: "46%" }}>
                            <WeeklyInsights />
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
                        <div style={{ height: "60%" }}>
                            <GhostTab />
                        </div>
                        <div style={{ height: "40%" }}>
                            <Shortcuts />
                        </div>
                    </div>

                    {/* Column 2: Website Blocker (37% width) */}
                    <div style={{ width: "37%", height: "100%" }}>
                        <WebsiteBlocker />
                    </div>

                    {/* Column 3: Notes Overview (38% width) */}
                    <div style={{ width: "38%", height: "100%" }}>
                        <NotesOverview />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardTab;
