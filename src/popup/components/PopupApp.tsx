import React from "react";
// import Header from "./Header";
// import CategoryBreakdown from "./CategoryBreakdown";
// import RecentSessions from "./RecentSessions";
// import SecondaryMetrics from "./SecondaryMetrics";
// import ActionControls from "./ActionControls";
// import StatusBar from "./StatusBar";

const PopupApp: React.FC = () => {
    return (
        <div
            style={{
                width: "380px",
                height: "580px",
                padding: "16px",
                fontFamily:
                    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                backgroundColor: "white",
                color: "#2d3436",
                lineHeight: 1.4,
            }}
        >
            {/* <Header />
            <CategoryBreakdown />
            <RecentSessions />
            <SecondaryMetrics />
            <ActionControls />
            <StatusBar /> */}
        </div>
    );
};

export default PopupApp;
