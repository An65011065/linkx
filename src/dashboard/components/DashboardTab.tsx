import React from "react";
import MainStats from "./MainStats";
import Activity from "./Activity";
import Channel from "./Channel";
import DigitalDestinations from "./DigitalDestinations";
import GraphWidget from "./GraphWidget";

const DashboardTab: React.FC = () => {
    return (
        <div
            style={{
                height: "100vh",
                fontFamily: "Arial, sans-serif",
                backgroundColor: "#f9fafb",
                overflowY: "hidden",
            }}
        >
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
            `}</style>
            <div
                style={{
                    paddingTop: "32px",
                    paddingLeft: "52px",
                    height: "100%",
                    overflowY: "auto",
                }}
            >
                <div
                    style={{
                        fontFamily: "Gaegu-Bold, Arial, sans-serif",
                        fontSize: "22px",
                        fontWeight: "700",
                        color: "#666",
                        letterSpacing: "0px",
                    }}
                >
                    LINKx
                </div>
                <h1
                    style={{
                        fontFamily: "Gaegu-Bold, Arial, sans-serif",
                        fontSize: "56px",
                        fontWeight: "1200",
                        margin: "0",
                        marginTop: "-8px",
                        color: "#000",
                        letterSpacing: "-4px",
                    }}
                >
                    DASHBOARD
                </h1>
                <MainStats />
                <div
                    style={{
                        display: "flex",
                        gap: "200px",
                        alignItems: "flex-start",
                    }}
                >
                    <Activity />
                    <div>
                        <GraphWidget />
                        <DigitalDestinations />
                    </div>
                </div>
                <Channel />
            </div>
        </div>
    );
};

export default DashboardTab;
