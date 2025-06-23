import React from "react";
import ChannelCard from "./ChannelCard";
import {
    useExtensionData,
    getChannelData,
    getChannelUrlCounts,
} from "../../data/useExtensionData";

const Channel: React.FC = () => {
    const { currentSession, isLoading, error } = useExtensionData();

    // Format time to one decimal place and add "h" suffix
    const formatTime = (hours: number): string => {
        return `${hours.toFixed(1)}h`;
    };

    if (isLoading) {
        return (
            <div style={{ margin: "40px 24px", width: "auto" }}>
                <div
                    style={{
                        fontFamily: "Nunito-Regular, Arial, sans-serif",
                        fontSize: "14px",
                        color: "#666",
                        padding: "20px 0",
                    }}
                >
                    Loading channel data...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ margin: "40px 24px", width: "auto" }}>
                <div
                    style={{
                        fontFamily: "Nunito-Regular, Arial, sans-serif",
                        fontSize: "14px",
                        color: "#d63031",
                        padding: "20px 0",
                    }}
                >
                    Error loading channel data: {error}
                </div>
            </div>
        );
    }

    const channelData = getChannelData(currentSession);
    const urlCounts = getChannelUrlCounts(currentSession);

    return (
        <>
            <style>{`
                @font-face {
                    font-family: 'Nunito-Regular';
                    src: url('${chrome.runtime.getURL(
                        "src/assets/fonts/Nunito-Regular.ttf",
                    )}') format('truetype');
                    font-weight: 400;
                    font-style: normal;
                }
                @font-face {
                    font-family: 'Nunito-Bold';
                    src: url('${chrome.runtime.getURL(
                        "src/assets/fonts/Nunito-Bold.ttf",
                    )}') format('truetype');
                    font-weight: 700;
                    font-style: normal;
                }
            `}</style>
            <div
                style={{
                    margin: "-10px 88px 40px 24px",
                    width: "auto",
                    backgroundColor: "#e9f5f3",
                    padding: "32px",
                    borderRadius: "24px",
                    display: "flex",
                    alignItems: "center",
                    gap: "32px",
                    overflow: "hidden",
                }}
            >
                {/* Left side - Title and description */}
                <div
                    style={{
                        flex: "0 0 180px",
                    }}
                >
                    <h2
                        style={{
                            fontFamily: "Nunito-Bold, Arial, sans-serif",
                            fontSize: "24px",
                            fontWeight: "700",
                            color: "#000",
                            margin: "0",
                            marginBottom: "8px",
                        }}
                    >
                        Channels
                    </h2>
                    <p
                        style={{
                            fontFamily: "Nunito-Regular, Arial, sans-serif",
                            fontSize: "14px",
                            color: "#666",
                            margin: "0",
                            lineHeight: "1.4",
                        }}
                    >
                        Your channels statistics for{" "}
                        <span style={{ fontWeight: "700" }}>1 day</span> period.
                    </p>
                </div>

                {/* Center - Channel Cards */}
                <div
                    style={{
                        display: "flex",
                        gap: "16px",
                        flex: "1",
                        justifyContent: "center",
                        overflow: "auto",
                        padding: "24px 0",
                        margin: "0 -8px",
                    }}
                >
                    <ChannelCard
                        icon="📮"
                        domain="Outlook"
                        urlCount={urlCounts.outlook}
                        timeSpent={formatTime(channelData.outlook)}
                        iconColor="#0078d4"
                    />
                    <ChannelCard
                        icon="📺"
                        domain="YouTube"
                        urlCount={urlCounts.youtube}
                        timeSpent={formatTime(channelData.youtube)}
                        iconColor="#ff0000"
                    />
                    <ChannelCard
                        icon="🤖"
                        domain="ChatGPT"
                        urlCount={urlCounts.chatgpt}
                        timeSpent={formatTime(channelData.chatgpt)}
                        iconColor="#10a37f"
                    />
                    <ChannelCard
                        icon="📧"
                        domain="Gmail"
                        urlCount={urlCounts.gmail}
                        timeSpent={formatTime(channelData.gmail)}
                        iconColor="#ea4335"
                    />
                </div>

                {/* Right side - Full Stats button */}
                <button
                    style={{
                        backgroundColor: "#10b981",
                        color: "white",
                        border: "none",
                        borderRadius: "12px",
                        padding: "16px 12px",
                        fontFamily: "Nunito-Bold, Arial, sans-serif",
                        fontSize: "14px",
                        fontWeight: "700",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "8px",
                        transition: "background-color 0.2s ease",
                        flex: "0 0 auto",
                        minWidth: "70px",
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#059669";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "#10b981";
                    }}
                    onClick={() => {
                        // TODO: Navigate to full stats page
                        console.log("Navigate to full stats");
                    }}
                >
                    <span>Full</span>
                    <span>Stats</span>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path
                            d="M6 12L10 8L6 4"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </button>
            </div>
        </>
    );
};

export default Channel;
