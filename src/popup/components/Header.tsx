import React from "react";
import { useStatsData } from "../../shared/services/useExtensionData";

const Header: React.FC = () => {
    const { stats, loading } = useStatsData();

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
                {loading ? "..." : `${stats.totalUrls} sites visited`}
            </div>
        </div>
    );
};

export default Header;
