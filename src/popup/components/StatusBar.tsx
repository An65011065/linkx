// StatusBar.tsx - Status messages & tracking indicator
import React from "react";
import { Activity, Shield } from "lucide-react";

const StatusBar: React.FC = () => {
    const handlePrivacyInfo = () => {
        // TODO: Implement privacy info navigation
        chrome.tabs.create({ url: chrome.runtime.getURL("privacy.html") });
    };

    return (
        <div
            style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingTop: "12px",
                borderTop: "1px solid #e9ecef",
                fontSize: "11px",
            }}
        >
            <span
                style={{
                    color: "#28a745",
                    fontWeight: 500,
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                }}
            >
                <Activity size={12} color="#28a745" />
                Tracking
            </span>
            <a
                href="#"
                onClick={(e) => {
                    e.preventDefault();
                    handlePrivacyInfo();
                }}
                style={{
                    color: "#4285f4",
                    textDecoration: "none",
                    fontWeight: 500,
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                }}
            >
                <Shield size={12} />
                Privacy Info
            </a>
        </div>
    );
};

export default StatusBar;
