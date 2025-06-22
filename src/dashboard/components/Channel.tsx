import React from "react";
import ChannelCard from "./ChannelCard";
import { useExtensionData } from "../../shared/services/useExtensionData";
import { useChannelData } from "../../shared/services/useExtensionData";

const Channel: React.FC = () => {
    const { session, loading, error } = useExtensionData();
    const { channelData } = useChannelData();

    // Format time to one decimal place and add "h" suffix
    const formatTime = (hours: number): string => {
        return `${hours.toFixed(1)}h`;
    };

    if (loading) {
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

    // Calculate URL counts for each domain
    const getUrlCounts = () => {
        if (!session) {
            return {
                gmail: 0,
                outlook: 0,
                youtube: 0,
                chatgpt: 0,
            };
        }

        const counts = {
            gmail: 0,
            outlook: 0,
            youtube: 0,
            chatgpt: 0,
        };

        session.tabSessions.forEach((tabSession) => {
            tabSession.urlVisits.forEach((visit) => {
                if (!visit.isActive) return;

                const domain = visit.domain.toLowerCase();
                if (
                    domain.includes("gmail") ||
                    domain.includes("mail.google")
                ) {
                    counts.gmail++;
                } else if (
                    domain.includes("outlook") ||
                    domain.includes("office.com") ||
                    domain.includes("live.com")
                ) {
                    counts.outlook++;
                } else if (
                    domain.includes("youtube") ||
                    domain.includes("youtu.be")
                ) {
                    counts.youtube++;
                } else if (
                    domain.includes("chatgpt") ||
                    domain.includes("chat.openai") ||
                    domain.includes("openai.com")
                ) {
                    counts.chatgpt++;
                }
            });
        });

        return counts;
    };

    const urlCounts = getUrlCounts();

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
