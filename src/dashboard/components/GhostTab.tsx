import React, { useState } from "react";
import { Ghost } from "lucide-react";
import { useExtensionData } from "../../data/useExtensionData";

interface WasteData {
    url: string;
    domain: string;
    title: string;
    wastedTime: number;
    activeTime: number;
    wasteRatio: number;
    visitCount: number;
}

interface AverageMetrics {
    avgActiveTime: number;
    avgTimeToClose: number;
}

interface GhostTabProps {
    isDarkMode?: boolean;
}

const GhostTab: React.FC<GhostTabProps> = ({ isDarkMode = false }) => {
    const { currentSession, isLoading, error } = useExtensionData();
    const [hoveredUrl, setHoveredUrl] = useState<string | null>(null);

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
                            wastedTime: 0,
                            activeTime: 0,
                            wasteRatio: 0,
                            visitCount: 0,
                        });
                    }

                    const urlData = urlMap.get(visit.url)!;
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
                    data.wastedTime + data.activeTime > 0
                        ? (data.wastedTime /
                              (data.wastedTime + data.activeTime)) *
                          100
                        : 0,
            }))
            .filter((data) => data.wastedTime > 0) // Only include URLs with waste
            .sort((a, b) => b.wastedTime - a.wastedTime) // Sort by most wasted time
            .slice(0, 8); // Limit to top 8

        return wasteArray;
    };

    const calculateAverageMetrics = (): AverageMetrics => {
        if (!currentSession) {
            return { avgActiveTime: 0, avgTimeToClose: 0 };
        }

        let totalActiveTime = 0;
        let totalDuration = 0;
        let visitCount = 0;

        currentSession.tabSessions.forEach((tab) => {
            tab.urlVisits.forEach((visit) => {
                if (visit.duration > 0) {
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
            className={`rounded-2xl p-3 w-full h-full relative flex flex-col backdrop-blur-sm ${
                isDarkMode
                    ? "bg-white/5 border border-white/10"
                    : "bg-white border border-gray-200 shadow-lg"
            }`}
            style={{ overflow: "visible" }}
        >
            {/* Title */}
            <div className="flex items-center gap-2 mb-2">
                <Ghost
                    size={16}
                    className={isDarkMode ? "text-white" : "text-gray-700"}
                />
                <h3
                    className={`text-sm font-medium ${
                        isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                >
                    Ghost Websites
                </h3>
            </div>

            {/* Grid - 4 columns */}
            <div className="flex-1">
                {wasteData.length > 0 ? (
                    <div className="grid grid-cols-4 gap-1 mb-3">
                        {wasteData.map((urlData) => (
                            <div
                                key={urlData.url}
                                onMouseEnter={() => {
                                    setHoveredUrl(urlData.url);
                                }}
                                onMouseLeave={() => {
                                    setHoveredUrl(null);
                                }}
                                className={`
                                    flex flex-col items-center gap-1 cursor-pointer 
                                    transition-all duration-200 p-1 rounded-lg 
                                    hover:-translate-y-0.5
                                    ${
                                        isDarkMode
                                            ? "hover:bg-white/10"
                                            : "hover:bg-gray-50 hover:shadow-md"
                                    }
                                    ${
                                        hoveredUrl === urlData.url
                                            ? isDarkMode
                                                ? "bg-white/10"
                                                : "bg-gray-50 shadow-md"
                                            : ""
                                    }
                                `}
                            >
                                {/* Favicon */}
                                <div>
                                    <img
                                        src={`https://www.google.com/s2/favicons?domain=${urlData.domain}&sz=32`}
                                        alt={urlData.domain}
                                        className="w-4 h-4 rounded"
                                        onError={(e) => {
                                            const target =
                                                e.target as HTMLImageElement;
                                            target.style.display = "none";
                                            const parent = target.parentElement;
                                            if (parent) {
                                                parent.innerHTML = `<span class="${
                                                    isDarkMode
                                                        ? "text-white/60"
                                                        : "text-gray-600"
                                                } text-xs font-medium">${urlData.domain[0].toUpperCase()}</span>`;
                                            }
                                        }}
                                    />
                                </div>
                                {/* Wasted time */}
                                <div
                                    className={`text-xs font-medium ${
                                        isDarkMode
                                            ? "text-white/70"
                                            : "text-gray-700"
                                    }`}
                                >
                                    {formatHours(urlData.wastedTime)}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div
                        className={`text-center text-xs mb-3 ${
                            isDarkMode ? "text-white/50" : "text-gray-500"
                        }`}
                    >
                        No ghost tabs today
                    </div>
                )}
            </div>

            {/* Average Metrics */}
            <div className="flex gap-1.5 mt-auto">
                <div
                    className={`flex-1 text-center p-2 rounded-lg border ${
                        isDarkMode
                            ? "bg-white/5 border-white/10"
                            : "bg-white/80 border-gray-100"
                    }`}
                >
                    <div
                        className={`text-xs font-light uppercase mb-1 tracking-wider ${
                            isDarkMode ? "text-white/60" : "text-gray-400"
                        }`}
                    >
                        Avg Active
                    </div>
                    <div
                        className={`text-xs font-medium ${
                            isDarkMode ? "text-white/90" : "text-gray-900"
                        }`}
                    >
                        {formatTime(averageMetrics.avgActiveTime)}
                    </div>
                </div>
                <div
                    className={`flex-1 text-center p-2 rounded-lg border ${
                        isDarkMode
                            ? "bg-white/5 border-white/10"
                            : "bg-white/80 border-gray-100"
                    }`}
                >
                    <div
                        className={`text-xs font-light uppercase mb-1 tracking-wider ${
                            isDarkMode ? "text-white/60" : "text-gray-400"
                        }`}
                    >
                        Avg Close
                    </div>
                    <div
                        className={`text-xs font-medium ${
                            isDarkMode ? "text-white/90" : "text-gray-900"
                        }`}
                    >
                        {formatTime(averageMetrics.avgTimeToClose)}
                    </div>
                </div>
            </div>

            {/* Hover tooltip */}
            {hoveredUrl && (
                <div
                    className={`
            fixed pointer-events-none z-50
            rounded-lg shadow-xl p-3 min-w-48 max-w-64 border 
            backdrop-blur-sm
            ${
                isDarkMode
                    ? "bg-black/90 border-white/20"
                    : "bg-white border-gray-200"
            }
        `}
                    style={{
                        left: "50%",
                        top: "20%",
                        transform: "translate(-50%, 20%)",
                        zIndex: 9999,
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
                                    className={`text-xs font-medium mb-2 break-words ${
                                        isDarkMode
                                            ? "text-white/90"
                                            : "text-gray-900"
                                    }`}
                                >
                                    {data.title}
                                </div>
                                <div
                                    className={`flex justify-between text-xs mb-1 ${
                                        isDarkMode
                                            ? "text-white/60"
                                            : "text-gray-600"
                                    }`}
                                >
                                    <span>Wasted Time</span>
                                    <span
                                        className={`font-medium ${
                                            isDarkMode
                                                ? "text-red-400"
                                                : "text-red-500"
                                        }`}
                                    >
                                        {formatTime(data.wastedTime)}
                                    </span>
                                </div>
                                <div
                                    className={`flex justify-between text-xs mb-1 ${
                                        isDarkMode
                                            ? "text-white/60"
                                            : "text-gray-600"
                                    }`}
                                >
                                    <span>Active Time</span>
                                    <span
                                        className={`font-medium ${
                                            isDarkMode
                                                ? "text-white/90"
                                                : "text-gray-900"
                                        }`}
                                    >
                                        {formatTime(data.activeTime)}
                                    </span>
                                </div>
                                <div
                                    className={`flex justify-between text-xs mb-1 ${
                                        isDarkMode
                                            ? "text-white/60"
                                            : "text-gray-600"
                                    }`}
                                >
                                    <span>Waste Ratio</span>
                                    <span
                                        className={`font-medium ${
                                            isDarkMode
                                                ? "text-white/90"
                                                : "text-gray-900"
                                        }`}
                                    >
                                        {Math.round(data.wasteRatio)}%
                                    </span>
                                </div>
                                <div
                                    className={`flex justify-between text-xs ${
                                        isDarkMode
                                            ? "text-white/60"
                                            : "text-gray-600"
                                    }`}
                                >
                                    <span>Visits</span>
                                    <span
                                        className={`font-medium ${
                                            isDarkMode
                                                ? "text-white/90"
                                                : "text-gray-900"
                                        }`}
                                    >
                                        {data.visitCount}
                                    </span>
                                </div>
                            </>
                        );
                    })()}
                </div>
            )}
        </div>
    );
};

export default GhostTab;
