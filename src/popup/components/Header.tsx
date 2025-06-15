import React from "react";

const Header: React.FC = () => {
    // TODO: Replace with real data from useExtensionData hook
    const totalUrls = 127; // PLACEHOLDER

    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "20px",
                padding: "16px 0 12px 0",
            }}
        >
            <div
                style={{
                    fontSize: "24px",
                    fontWeight: 700,
                    color: "#2d3436",
                    letterSpacing: "-0.5px",
                }}
            >
                LINKx
                <span
                    style={{
                        color: "#4285f4",
                        fontSize: "20px",
                        fontWeight: 800,
                        backgroundColor: "#f0f4ff",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        margin: "0 0 0 1px",
                    }}
                >
                    {totalUrls}
                </span>
            </div>
        </div>
    );
};

export default Header;
