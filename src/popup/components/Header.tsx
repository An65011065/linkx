import React from "react";

const Header: React.FC = () => {
    // TODO: Replace with real data from useExtensionData hook
    const totalUrls = 12; // Dynamic count based on timeline data

    return (
        <div style={{ textAlign: "center", marginBottom: "16px" }}>
            <div
                style={{
                    fontSize: "24px",
                    fontWeight: 700,
                    color: "#2d3436",
                    marginBottom: "6px",
                }}
            >
                LINKx
            </div>
            <div
                style={{
                    fontSize: "13px",
                    color: "#4285f4",
                    fontWeight: 600,
                    marginBottom: "4px",
                }}
            >
                {totalUrls} sites visited
            </div>
        </div>
    );
};

export default Header;
