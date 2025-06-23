import React from "react";
import { useExtensionData } from "../../data/useExtensionData";

// Define types locally since the import was failing
interface StatCardProps {
    label: string;
    value: string;
    color: string;
    bgColor: string;
}

const MainStats: React.FC = () => {
    const { currentSession, isLoading, error } = useExtensionData();

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
                    Loading stats...
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
                    Error loading stats: {error}
                </div>
            </div>
        );
    }

    if (!currentSession) {
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
                    No stats available
                </div>
            </div>
        );
    }

    // Calculate stats from currentSession
    const stats = currentSession.stats;
    const totalActiveTime = stats.totalTime;

    const StatCard: React.FC<StatCardProps> = ({
        label,
        value,
        color,
        bgColor,
    }) => (
        <div
            style={{
                backgroundColor: bgColor,
                borderRadius: "16px",
                padding: "20px",
                textAlign: "center",
                flex: 1,
                minWidth: "120px",
            }}
        >
            <div
                style={{
                    fontSize: "24px",
                    fontWeight: 700,
                    color: color,
                    marginBottom: "8px",
                    fontFamily: "Nunito-Bold, Arial, sans-serif",
                }}
            >
                {value}
            </div>
            <div
                style={{
                    fontSize: "12px",
                    color: "#636e72",
                    fontWeight: 500,
                    fontFamily: "Nunito-Regular, Arial, sans-serif",
                }}
            >
                {label}
            </div>
        </div>
    );

    const formatTime = (milliseconds: number): string => {
        const hours = Math.floor(milliseconds / (1000 * 60 * 60));
        const minutes = Math.floor(
            (milliseconds % (1000 * 60 * 60)) / (1000 * 60),
        );

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    };

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
            <div style={{ margin: "40px 24px", width: "auto" }}>
                <h1
                    style={{
                        fontSize: "32px",
                        fontWeight: 700,
                        color: "#2d3436",
                        marginBottom: "8px",
                        fontFamily: "Nunito-Bold, Arial, sans-serif",
                    }}
                >
                    Today's Overview
                </h1>
                <p
                    style={{
                        fontSize: "16px",
                        color: "#636e72",
                        marginBottom: "32px",
                        fontFamily: "Nunito-Regular, Arial, sans-serif",
                    }}
                >
                    Your browsing activity at a glance
                </p>

                <div
                    style={{
                        display: "flex",
                        gap: "16px",
                        marginBottom: "32px",
                        flexWrap: "wrap",
                    }}
                >
                    <StatCard
                        label="Total Sites"
                        value={stats.totalUrls.toString()}
                        color="#4285f4"
                        bgColor="#e8f0fe"
                    />
                    <StatCard
                        label="Unique Domains"
                        value={stats.uniqueDomains.toString()}
                        color="#34a853"
                        bgColor="#e6f4ea"
                    />
                    <StatCard
                        label="Active Time"
                        value={formatTime(totalActiveTime)}
                        color="#ea4335"
                        bgColor="#fce8e6"
                    />
                </div>

                <div
                    style={{
                        display: "flex",
                        gap: "16px",
                        flexWrap: "wrap",
                    }}
                >
                    <StatCard
                        label="Work Time"
                        value={formatTime(stats.workTime)}
                        color="#4285f4"
                        bgColor="#e8f0fe"
                    />
                    <StatCard
                        label="Social Time"
                        value={formatTime(stats.socialTime)}
                        color="#ff6b47"
                        bgColor="#fff5f4"
                    />
                    <StatCard
                        label="Other Time"
                        value={formatTime(stats.otherTime)}
                        color="#6c757d"
                        bgColor="#f8f9fa"
                    />
                </div>
            </div>
        </>
    );
};

export default MainStats;
