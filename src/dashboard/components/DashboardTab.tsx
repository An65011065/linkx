import React from "react";
import MainStats from "./MainStats";
import Activity from "./Activity";
import DigitalDestinations from "./DigitalDestinations";
import Channel from "./Channel";
import WebsiteBlocker from "./WebsiteBlocker";

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
                @import url('https://fonts.googleapis.com/icon?family=Material+Icons');
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
                        fontFamily: "Nunito-Bold, Arial, sans-serif",
                        fontSize: "32px",
                        fontWeight: "700",
                        color: "#000",
                        letterSpacing: "0px",
                    }}
                >
                    linkX
                </div>
                <h1
                    style={{
                        fontFamily: "Nunito-Bold, Arial, sans-serif",
                        fontSize: "56px",
                        fontWeight: "1200",
                        margin: "0",
                        marginTop: "-8px",
                        color: "#000",
                        letterSpacing: "0px",
                    }}
                >
                    Dashboard
                </h1>
                <div className="grid grid-cols-1 gap-6">
                    <MainStats />
                    <WebsiteBlocker />
                    <Activity />
                    <DigitalDestinations />
                    <Channel />
                </div>
            </div>
        </div>
    );
};

export default DashboardTab;
