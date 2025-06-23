import React from "react";
import { useExtensionData, formatDuration } from "../../data/useExtensionData";

const Activity: React.FC = () => {
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
                    Loading activity data...
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
                    Error loading activity data: {error}
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
                    No activity data available
                </div>
            </div>
        );
    }

    // Calculate activity summary from currentSession
    const getActivitySummary = () => {
        const allVisits = currentSession.tabSessions.flatMap(
            (tab) => tab.urlVisits,
        );
        const totalTime = currentSession.stats.totalTime;
        // const activeVisits = allVisits.filter((visit) => visit.isActive);

        return {
            totalVisits: allVisits.length,
            activeTime: formatDuration(totalTime),
            categories: {
                work: formatDuration(currentSession.stats.workTime),
                social: formatDuration(currentSession.stats.socialTime),
                other: formatDuration(currentSession.stats.otherTime),
            },
        };
    };

    const activitySummary = getActivitySummary();

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
                <h2
                    style={{
                        fontFamily: "Nunito-Bold, Arial, sans-serif",
                        fontSize: "20px",
                        color: "#2d3436",
                        marginBottom: "20px",
                    }}
                >
                    Activity Summary
                </h2>
                <div
                    style={{
                        fontFamily: "Nunito-Regular, Arial, sans-serif",
                        fontSize: "14px",
                        color: "#636e72",
                        lineHeight: "1.6",
                    }}
                >
                    <p>Total visits: {activitySummary.totalVisits}</p>
                    <p>Active time: {activitySummary.activeTime}</p>
                    <p>Work time: {activitySummary.categories.work}</p>
                    <p>Social time: {activitySummary.categories.social}</p>
                    <p>Other time: {activitySummary.categories.other}</p>
                </div>
            </div>
        </>
    );
};

export default Activity;
