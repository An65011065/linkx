import React from "react";

const DashboardTab: React.FC = () => {
    return (
        <div
            style={{
                height: "100vh",
                fontFamily: "Arial, sans-serif",
                backgroundColor: "#f9fafb",
                overflow: "auto",
            }}
        >
            <style>{`
                @font-face {
                    font-family: 'Nunito-ExtraBold';
                    src: url('${chrome.runtime.getURL(
                        "src/assets/fonts/Nunito-ExtraBold.ttf",
                    )}') format('truetype');
                    font-weight: 800;
                    font-style: normal;
                }
            `}</style>
            <div style={{ paddingTop: "40px", paddingLeft: "52px" }}>
                <div
                    style={{
                        fontFamily: "Nunito-ExtraBold, Arial, sans-serif",
                        fontSize: "18px",
                        fontWeight: "800",
                        color: "#666",
                        letterSpacing: "1px",
                    }}
                >
                    LINKx
                </div>
                <h1
                    style={{
                        fontFamily: "Nunito-ExtraBold, Arial, sans-serif",
                        fontSize: "48px",
                        fontWeight: "800",
                        margin: "0",
                        marginTop: "-8px",
                        color: "#000",
                        letterSpacing: "2px",
                    }}
                >
                    DASHBOARD
                </h1>
            </div>
        </div>
    );
};

export default DashboardTab;
