import React from "react";
import { useExtensionData } from "../../data/useExtensionData";

const Header: React.FC = () => {
    const { currentSession, isLoading } = useExtensionData();

    const totalUrls =
        currentSession?.tabSessions.reduce(
            (total, tab) => total + tab.urlVisits.length,
            0,
        ) || 0;

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
                {isLoading ? "..." : `${totalUrls} sites visited`}
            </div>
        </div>
    );
};

export default Header;
