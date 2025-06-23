import React from "react";
import { useExtensionData } from "../../data/useExtensionData";
import type { TabSession } from "../../data/dataService";
import UrlVisit from "../../data/dataService";

interface DomainData {
    domain: string;
    visits: number;
    totalTime: number;
    category: "work" | "social" | "other";
}

const DigitalDestinations: React.FC = () => {
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
                    Loading destinations...
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
                    Error loading destinations: {error}
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
                    No destination data available
                </div>
            </div>
        );
    }

    // Calculate top destinations from currentSession
    const getTopDestinations = (): DomainData[] => {
        const domainMap = new Map<string, DomainData>();

        currentSession.tabSessions.forEach((tabSession: TabSession) => {
            tabSession.urlVisits.forEach((visit: UrlVisit) => {
                const domain = visit.domain;
                const existing = domainMap.get(domain);

                if (existing) {
                    existing.visits += 1;
                    existing.totalTime += visit.duration || 0;
                } else {
                    domainMap.set(domain, {
                        domain,
                        visits: 1,
                        totalTime: visit.duration || 0,
                        category: visit.category as "work" | "social" | "other",
                    });
                }
            });
        });

        return Array.from(domainMap.values())
            .sort((a, b) => b.totalTime - a.totalTime)
            .slice(0, 10);
    };

    const topDestinations = getTopDestinations();

    const formatTime = (milliseconds: number): string => {
        const minutes = Math.floor(milliseconds / (1000 * 60));
        if (minutes < 60) {
            return `${minutes}m`;
        }
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours}h ${remainingMinutes}m`;
    };

    const getCategoryColor = (category: string): string => {
        switch (category) {
            case "work":
                return "#4285f4";
            case "social":
                return "#ff6b47";
            default:
                return "#6c757d";
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
            <div style={{ margin: "40px 24px", width: "auto" }}>
                <h2
                    style={{
                        fontFamily: "Nunito-Bold, Arial, sans-serif",
                        fontSize: "20px",
                        color: "#2d3436",
                        marginBottom: "20px",
                    }}
                >
                    Top Digital Destinations
                </h2>
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                    }}
                >
                    {topDestinations.map((destination, index) => (
                        <div
                            key={destination.domain}
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: "12px 16px",
                                backgroundColor: "#f8f9fa",
                                borderRadius: "8px",
                                borderLeft: `4px solid ${getCategoryColor(
                                    destination.category,
                                )}`,
                            }}
                        >
                            <div>
                                <div
                                    style={{
                                        fontFamily:
                                            "Nunito-Bold, Arial, sans-serif",
                                        fontSize: "14px",
                                        color: "#2d3436",
                                        marginBottom: "4px",
                                    }}
                                >
                                    {destination.domain}
                                </div>
                                <div
                                    style={{
                                        fontFamily:
                                            "Nunito-Regular, Arial, sans-serif",
                                        fontSize: "12px",
                                        color: "#636e72",
                                    }}
                                >
                                    {destination.visits} visits •{" "}
                                    {destination.category}
                                </div>
                            </div>
                            <div
                                style={{
                                    fontFamily:
                                        "Nunito-Bold, Arial, sans-serif",
                                    fontSize: "14px",
                                    color: getCategoryColor(
                                        destination.category,
                                    ),
                                }}
                            >
                                {formatTime(destination.totalTime)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
};

export default DigitalDestinations;
