import React, { useState } from "react";
import { useExtensionData } from "../../data/useExtensionData";

interface WasteData {
    url: string;
    domain: string;
    title: string;
    totalDuration: number;
    activeTime: number;
    wastedTime: number;
    wasteRatio: number;
    visitCount: number;
}

const GhostTabs: React.FC = () => {
    const { currentSession, isLoading, error } = useExtensionData();
    const [hoveredUrl, setHoveredUrl] = useState<string | null>(null);

    // Process waste data by URL (today only)
    const processWasteData = (): WasteData[] => {
        if (!currentSession) return [];
        const urlMap = new Map<string, WasteData>();
        const today = new Date();
        const todayStart = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate(),
        );
        const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

        // Aggregate all visits by URL (today only)
        currentSession.tabSessions.forEach((tab) => {
            tab.urlVisits.forEach((visit) => {
                const visitDate = new Date(visit.startTime);
                const isTodayVisit =
                    visitDate >= todayStart && visitDate < todayEnd;

                if (visit.duration > 0 && isTodayVisit) {
                    const wastedTime = visit.duration - visit.activeTime;
                    if (!urlMap.has(visit.url)) {
                        urlMap.set(visit.url, {
                            url: visit.url,
                            domain: visit.domain,
                            title: visit.title || visit.url,
                            totalDuration: 0,
                            activeTime: 0,
                            wastedTime: 0,
                            wasteRatio: 0,
                            visitCount: 0,
                        });
                    }
                    const urlData = urlMap.get(visit.url)!;
                    urlData.totalDuration += visit.duration;
                    urlData.activeTime += visit.activeTime;
                    urlData.wastedTime += wastedTime;
                    urlData.visitCount += 1;
                }
            });
        });

        // Calculate waste ratios and sort
        const wasteArray = Array.from(urlMap.values())
            .map((data) => ({
                ...data,
                wasteRatio:
                    data.totalDuration > 0
                        ? (data.wastedTime / data.totalDuration) * 100
                        : 0,
            }))
            .filter((d) => d.wastedTime > 60000) // Only show URLs with >1 min waste
            .sort((a, b) => b.wastedTime - a.wastedTime)
            .slice(0, 8); // Top 8 URLs

        return wasteArray;
    };

    // Calculate average metrics for today
    const calculateAverageMetrics = () => {
        if (!currentSession) return { avgActiveTime: 0, avgTimeToClose: 0 };

        const today = new Date();
        const todayStart = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate(),
        );
        const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

        let totalActiveTime = 0;
        let totalDuration = 0;
        let visitCount = 0;

        currentSession.tabSessions.forEach((tab) => {
            tab.urlVisits.forEach((visit) => {
                const visitDate = new Date(visit.startTime);
                const isTodayVisit =
                    visitDate >= todayStart && visitDate < todayEnd;

                if (visit.duration > 0 && isTodayVisit) {
                    totalActiveTime += visit.activeTime;
                    totalDuration += visit.duration;
                    visitCount++;
                }
            });
        });

        return {
            avgActiveTime: visitCount > 0 ? totalActiveTime / visitCount : 0,
            avgTimeToClose: visitCount > 0 ? totalDuration / visitCount : 0,
        };
    };

    const formatTime = (ms: number): string => {
        const minutes = Math.floor(ms / (1000 * 60));
        const hours = Math.floor(minutes / 60);
        if (hours > 0) {
            return `${hours}h`;
        }
        return `${minutes}m`;
    };

    const formatHours = (ms: number): string => {
        const hours = ms / (1000 * 60 * 60);
        if (hours >= 1) {
            return `${hours.toFixed(1)}h`;
        }
        const minutes = Math.floor(ms / (1000 * 60));
        return `${minutes}m`;
    };

    const wasteData = processWasteData();
    const averageMetrics = calculateAverageMetrics();

    if (isLoading || error || !currentSession) {
        return null;
    }

    return (
        <div
            style={{
                background: "rgba(255, 255, 255, 0.05)",
                borderRadius: "1rem",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                backdropFilter: "blur(10px)",
                padding: "1rem",
                width: "100%",
                height: "100%",
                position: "relative",
            }}
        >
            {/* Title */}
            <h3
                style={{
                    fontSize: "1rem",
                    fontWeight: "600",
                    color: "rgba(255, 255, 255, 0.9)",
                    margin: "0 0 0.5rem 0",
                    fontFamily: "system-ui, -apple-system, sans-serif",
                }}
            >
                Ghost Websites
            </h3>

            {/* Grid - 4 columns */}
            {wasteData.length > 0 ? (
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(4, 1fr)",
                        gap: "0.1rem",
                        marginBottom: "1rem",
                    }}
                >
                    {wasteData.map((urlData) => (
                        <div
                            key={urlData.url}
                            onMouseEnter={() => setHoveredUrl(urlData.url)}
                            onMouseLeave={() => setHoveredUrl(null)}
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: "0.1rem",
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                                transform:
                                    hoveredUrl === urlData.url
                                        ? "translateY(-0.125rem)"
                                        : "none",
                                width: "4rem",
                                padding: "0.1rem",
                                borderRadius: "0.3rem",
                                background:
                                    hoveredUrl === urlData.url
                                        ? "rgba(255, 255, 255, 0.1)"
                                        : "transparent",
                            }}
                        >
                            {/* Favicon */}
                            <div>
                                <img
                                    src={`https://www.google.com/s2/favicons?domain=${urlData.domain}&sz=32`}
                                    alt={urlData.domain}
                                    style={{
                                        width: "1.125rem",
                                        height: "1.125rem",
                                        borderRadius: "0.25rem",
                                    }}
                                    onError={(e) => {
                                        const target =
                                            e.target as HTMLImageElement;
                                        target.style.display = "none";
                                        const parent = target.parentElement;
                                        if (parent) {
                                            parent.innerHTML = `<span style="color: rgba(255, 255, 255, 0.6); font-size: 0.75rem; font-weight: 500;">${urlData.domain[0].toUpperCase()}</span>`;
                                        }
                                    }}
                                />
                            </div>
                            {/* Wasted time */}
                            <div
                                style={{
                                    fontSize: "0.6875rem",
                                    fontWeight: "500",
                                    color: "rgba(255, 255, 255, 0.7)",
                                    fontFamily:
                                        "system-ui, -apple-system, sans-serif",
                                }}
                            >
                                {formatHours(urlData.wastedTime)}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div
                    style={{
                        textAlign: "center",
                        color: "rgba(255, 255, 255, 0.5)",
                        fontSize: "0.875rem",
                        marginBottom: "1rem",
                        fontFamily: "system-ui, -apple-system, sans-serif",
                    }}
                >
                    No ghost tabs today
                </div>
            )}

            {/* Average Metrics */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "1rem",
                    marginTop: "auto",
                }}
            >
                <div
                    style={{
                        flex: 1,
                        textAlign: "center",
                        padding: "0.5rem",
                        background: "rgba(255, 255, 255, 0.05)",
                        borderRadius: "0.5rem",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                    }}
                >
                    <div
                        style={{
                            fontSize: "0.75rem",
                            color: "rgba(255, 255, 255, 0.6)",
                            marginBottom: "0.25rem",
                            fontFamily: "system-ui, -apple-system, sans-serif",
                        }}
                    >
                        Avg Active Time
                    </div>
                    <div
                        style={{
                            fontSize: "0.875rem",
                            fontWeight: "600",
                            color: "rgba(255, 255, 255, 0.9)",
                            fontFamily: "system-ui, -apple-system, sans-serif",
                        }}
                    >
                        {formatTime(averageMetrics.avgActiveTime)}
                    </div>
                </div>
                <div
                    style={{
                        flex: 1,
                        textAlign: "center",
                        padding: "0.5rem",
                        background: "rgba(255, 255, 255, 0.05)",
                        borderRadius: "0.5rem",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                    }}
                >
                    <div
                        style={{
                            fontSize: "0.75rem",
                            color: "rgba(255, 255, 255, 0.6)",
                            marginBottom: "0.25rem",
                            fontFamily: "system-ui, -apple-system, sans-serif",
                        }}
                    >
                        Avg Close Time
                    </div>
                    <div
                        style={{
                            fontSize: "0.875rem",
                            fontWeight: "600",
                            color: "rgba(255, 255, 255, 0.9)",
                            fontFamily: "system-ui, -apple-system, sans-serif",
                        }}
                    >
                        {formatTime(averageMetrics.avgTimeToClose)}
                    </div>
                </div>
            </div>

            {/* Hover tooltip */}
            {hoveredUrl && (
                <div
                    style={{
                        position: "absolute",
                        top: "100%",
                        left: "50%",
                        transform: "translateX(-50%)",
                        marginTop: "0.5rem",
                        background: "rgba(0, 0, 0, 0.9)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        borderRadius: "0.5rem",
                        padding: "0.75rem",
                        zIndex: 500000,
                        minWidth: "15rem",
                        maxWidth: "20rem",
                        boxShadow: "0 0.25rem 1rem rgba(0,0,0,0.3)",
                    }}
                >
                    {(() => {
                        const data = wasteData.find(
                            (d) => d.url === hoveredUrl,
                        );
                        if (!data) return null;
                        return (
                            <>
                                <div
                                    style={{
                                        fontSize: "0.75rem",
                                        fontWeight: "500",
                                        color: "rgba(255, 255, 255, 0.9)",
                                        marginBottom: "0.5rem",
                                        wordBreak: "break-word",
                                    }}
                                >
                                    {data.title}
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        fontSize: "0.6875rem",
                                        color: "rgba(255, 255, 255, 0.6)",
                                        marginBottom: "0.25rem",
                                    }}
                                >
                                    <span>Wasted Time</span>
                                    <span
                                        style={{
                                            color: "#ff6b47",
                                            fontWeight: "500",
                                        }}
                                    >
                                        {formatTime(data.wastedTime)}
                                    </span>
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        fontSize: "0.6875rem",
                                        color: "rgba(255, 255, 255, 0.6)",
                                        marginBottom: "0.25rem",
                                    }}
                                >
                                    <span>Active Time</span>
                                    <span>{formatTime(data.activeTime)}</span>
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        fontSize: "0.6875rem",
                                        color: "rgba(255, 255, 255, 0.6)",
                                        marginBottom: "0.25rem",
                                    }}
                                >
                                    <span>Waste Ratio</span>
                                    <span>{Math.round(data.wasteRatio)}%</span>
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        fontSize: "0.6875rem",
                                        color: "rgba(255, 255, 255, 0.6)",
                                    }}
                                >
                                    <span>Visits</span>
                                    <span>{data.visitCount}</span>
                                </div>
                            </>
                        );
                    })()}
                </div>
            )}
        </div>
    );
};

export default GhostTabs;
