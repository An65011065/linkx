import React from "react";
import { useExtensionData } from "../../data/useExtensionData";

interface TopSite {
    url: string;
    timeSpent: number;
    percentage: number;
}

const DigitalDestinations: React.FC = () => {
    const { session, loading, error } = useExtensionData();

    // Calculate top sites data
    const calculateTopSites = (): TopSite[] => {
        if (!session) return [];

        // Calculate total time spent across all URLs
        let totalTime = 0;
        const urlTimeMap = new Map<string, number>();

        session.tabSessions.forEach((tabSession) => {
            tabSession.urlVisits.forEach((visit) => {
                if (!visit.isActive) return;

                const duration = visit.duration;
                totalTime += duration;

                const url = visit.url;
                urlTimeMap.set(url, (urlTimeMap.get(url) || 0) + duration);
            });
        });

        // Convert to array and sort by time spent
        const topSites = Array.from(urlTimeMap.entries())
            .map(([url, duration]) => ({
                url,
                timeSpent: duration / (1000 * 60), // Convert milliseconds to minutes
                percentage: (duration / totalTime) * 100,
            }))
            .sort((a, b) => b.timeSpent - a.timeSpent)
            .slice(0, 3); // Get top 3 sites

        return topSites;
    };

    if (loading) {
        return (
            <div
                style={{
                    padding: "20px 0",
                    fontFamily: "Nunito-Regular, Arial, sans-serif",
                    color: "#666",
                    fontSize: "14px",
                }}
            >
                Loading digital destinations data...
            </div>
        );
    }

    if (error) {
        return (
            <div
                style={{
                    padding: "20px 0",
                    fontFamily: "Nunito-Regular, Arial, sans-serif",
                    color: "#d63031",
                    fontSize: "14px",
                }}
            >
                Error loading digital destinations data: {error}
            </div>
        );
    }

    const topSites = calculateTopSites();

    const formatTime = (minutes: number): string => {
        if (minutes < 60) {
            return `${Math.round(minutes)}m`;
        }
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = Math.round(minutes % 60);
        return `${hours}h ${remainingMinutes}m`;
    };

    const formatUrl = (url: string): string => {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname.replace("www.", "");
        } catch {
            return url;
        }
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
            <div
                style={{
                    marginTop: "40px",
                    width: "100%",
                    maxWidth: "600px",
                    height: "300px", // Match Activity height
                }}
            >
                {/* Header */}
                <div
                    style={{
                        marginBottom: "10px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
                    <h2
                        style={{
                            fontFamily: "Nunito-Bold, Arial, sans-serif",
                            fontSize: "24px",
                            fontWeight: "700",
                            color: "#000",
                            margin: "0",
                        }}
                    >
                        Digital Champions
                    </h2>
                </div>

                {/* Sites List */}
                <div
                    style={{
                        // backgroundColor: "#fff",
                        padding: "0px",
                        // boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                        height: "calc(100% - 60px)", // Account for header height
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                    }}
                >
                    {topSites.map((site, index) => (
                        <div
                            key={site.url}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "16px 0",
                                borderBottom:
                                    index < topSites.length - 1
                                        ? "1px solid #f0f0f0"
                                        : "none",
                                flex: 1,
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "16px",
                                }}
                            >
                                <div
                                    style={{
                                        width: "40px",
                                        height: "40px",
                                        backgroundColor: "#f0f0f0",
                                        borderRadius: "8px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontFamily:
                                            "Nunito-Bold, Arial, sans-serif",
                                        fontSize: "18px",
                                        color: "#666",
                                    }}
                                >
                                    {index + 1}
                                </div>
                                <div
                                    style={{
                                        fontFamily:
                                            "Nunito-Regular, Arial, sans-serif",
                                        fontSize: "14px",
                                        color: "#333",
                                    }}
                                >
                                    {formatUrl(site.url)}
                                </div>
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "24px",
                                }}
                            >
                                <div
                                    style={{
                                        fontFamily:
                                            "Nunito-Regular, Arial, sans-serif",
                                        fontSize: "14px",
                                        color: "#666",
                                    }}
                                >
                                    {formatTime(site.timeSpent)}
                                </div>
                                <div
                                    style={{
                                        fontFamily:
                                            "Nunito-Bold, Arial, sans-serif",
                                        fontSize: "14px",
                                        color: "#10b981",
                                        backgroundColor: "#e9f5f3",
                                        padding: "4px 12px",
                                        borderRadius: "12px",
                                    }}
                                >
                                    {Math.round(site.percentage)}%
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
};

export default DigitalDestinations;
