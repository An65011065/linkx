import React from "react";
import Activity from "./Activity";
import Channel from "./Channel";
import WebsiteBlocker from "./WebsiteBlocker";
import StoriesComponent from "./stories";
import WeeklyInsights from "./WeeklyInsights";

const DashboardTab: React.FC = () => {
    return (
        <div
            style={{
                height: "110vh",
                fontFamily: "Arial, sans-serif",
                backgroundColor: "#000000",
                overflowY: "hidden",
                position: "relative", // Added for absolute positioning of Channel
            }}
        >
            {/* Blue gradient - top right */}
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
            {/* Orange gradient - bottom left */}
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

            {/* Channel component positioned at top-right */}
            <div
                style={{ position: "absolute", top: 35, right: 1, zIndex: 20 }}
            >
                <Channel />
            </div>

            <div
                style={{
                    paddingTop: "32px",
                    paddingLeft: "32px",
                    paddingRight: "32px",
                    height: "100%",
                    overflowY: "hidden",
                    position: "relative",
                    zIndex: 20,
                }}
            >
                {/* Main Content Grid */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "600px 1fr",
                        alignItems: "start",
                    }}
                >
                    {/* Left Column - Stats Cards */}
                    <div>
                        <StoriesComponent />
                    </div>
                </div>

                {/* Other Components */}
                <div
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "30px",
                        marginTop: "5px",
                        alignItems: "start",
                    }}
                >
                    <WeeklyInsights />
                </div>
            </div>
        </div>
    );
};

export default DashboardTab;
