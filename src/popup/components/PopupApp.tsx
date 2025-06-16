import React from "react";
import Header from "./Header";
import StatsPanel from "./StatsPanel";
import TimelineChart from "./TimelineChart";
import ActionControls from "./ActionControls";
// import StatusBar from "./StatusBar";

const PopupApp: React.FC = () => {
    return (
        <div
            style={{
                width: "340px",
                height: "500px",
                padding: "20px",
                fontFamily:
                    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                backgroundColor: "white",
                borderRadius: "16px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                position: "relative",
            }}
        >
            <Header />
            <StatsPanel />
            <TimelineChart />
            <ActionControls />
            {/* <StatusBar /> */}
        </div>
    );
};

export default PopupApp;
