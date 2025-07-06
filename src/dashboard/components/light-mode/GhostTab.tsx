import React, { useState } from "react";
import { useExtensionData } from "../../../data/useExtensionData";

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
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-5 w-full h-full relative flex flex-col">
            {/* Title */}
            <h3 className="text-lg font-medium text-black mb-2">
                Ghost Websites
            </h3>

            {/* Grid - 4 columns */}
            <div className="flex-1">
                {wasteData.length > 0 ? (
                    <div className="grid grid-cols-4 gap-1">
                        {wasteData.map((urlData) => (
                            <div
                                key={urlData.url}
                                onMouseEnter={() => setHoveredUrl(urlData.url)}
                                onMouseLeave={() => setHoveredUrl(null)}
                                className={`flex flex-col items-center gap-1 cursor-pointer transition-all duration-200 p-0 rounded-lg hover:bg-gray-50 hover:-translate-y-0.5 ${
                                    hoveredUrl === urlData.url
                                        ? "bg-gray-50 shadow-md"
                                        : ""
                                }`}
                            >
                                {/* Favicon */}
                                <div>
                                    <img
                                        src={`https://www.google.com/s2/favicons?domain=${urlData.domain}&sz=32`}
                                        alt={urlData.domain}
                                        className="w-5 h-5 rounded"
                                        onError={(e) => {
                                            const target =
                                                e.target as HTMLImageElement;
                                            target.style.display = "none";
                                            const parent = target.parentElement;
                                            if (parent) {
                                                parent.innerHTML = `<span class="text-gray-600 text-xs font-medium">${urlData.domain[0].toUpperCase()}</span>`;
                                            }
                                        }}
                                    />
                                </div>
                                {/* Wasted time */}
                                <div className="text-xs font-medium text-gray-700">
                                    {formatHours(urlData.wastedTime)}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-gray-500 text-sm mb-3">
                        No ghost tabs today
                    </div>
                )}
            </div>

            {/* Average Metrics */}
            <div className="flex justify-between gap-2 mt-3">
                <div className="flex-1 text-center p-1 bg-white/80 rounded-lg border border-gray-100">
                    <div className="text-xs font-light uppercase text-gray-400 mb-1">
                        Avg Active Time
                    </div>
                    <div className="text-sm font-medium text-black">
                        {formatTime(averageMetrics.avgActiveTime)}
                    </div>
                </div>
                <div className="flex-1 text-center p-1 bg-white/80 rounded-lg border border-gray-100">
                    <div className="text-xs font-light uppercase text-gray-400 mb-1">
                        Avg Close Time
                    </div>
                    <div className="text-sm font-medium text-black">
                        {formatTime(averageMetrics.avgTimeToClose)}
                    </div>
                </div>
            </div>

            {/* Hover tooltip */}
            {hoveredUrl && (
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl p-4 z-50 min-w-60 max-w-80">
                    {(() => {
                        const data = wasteData.find(
                            (d) => d.url === hoveredUrl,
                        );
                        if (!data) return null;
                        return (
                            <>
                                <div className="text-sm font-medium text-black mb-3 break-words">
                                    {data.title}
                                </div>
                                <div className="flex justify-between text-xs text-gray-600 mb-2">
                                    <span>Wasted Time</span>
                                    <span className="text-red-500 font-medium">
                                        {formatTime(data.wastedTime)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-xs text-gray-600 mb-2">
                                    <span>Active Time</span>
                                    <span className="text-black font-medium">
                                        {formatTime(data.activeTime)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-xs text-gray-600 mb-2">
                                    <span>Waste Ratio</span>
                                    <span className="text-black font-medium">
                                        {Math.round(data.wasteRatio)}%
                                    </span>
                                </div>
                                <div className="flex justify-between text-xs text-gray-600">
                                    <span>Visits</span>
                                    <span className="text-black font-medium">
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

export default GhostTabs;
