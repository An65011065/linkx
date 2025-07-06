import React, { useState, useEffect, useRef } from "react";
import DataService from "../../../data/dataService";

const WeeklyInsights: React.FC = () => {
    const [viewMode, setViewMode] = useState<"scores" | "screenTime">("scores");
    const [data, setData] = useState<{
        scores: number[];
        screenTime: number[];
        days: string[];
    }>({
        scores: Array(7).fill(0),
        screenTime: Array(7).fill(0),
        days: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    });
    const [chartHeight, setChartHeight] = useState(0);
    const chartContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const loadWeeklyData = async () => {
            const dataService = DataService.getInstance();
            const sessions = await dataService.getSessionHistory(7);

            // Create a map of date to session data
            const sessionMap = new Map(
                sessions.map((session) => [session.date, session]),
            );

            // Get dates for the last 7 days (today and 6 days before)
            const dates = Array.from({ length: 7 }, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - (6 - i)); // 6 days ago to today
                return date.toISOString().split("T")[0];
            });

            // Initialize arrays
            const weekData = Array(7).fill(0);
            const screenTimeData = Array(7).fill(0);
            const days = dates.map((date) =>
                new Date(date).toLocaleDateString("en-US", {
                    weekday: "short",
                }),
            );

            // Fill in data where we have sessions
            dates.forEach((date, index) => {
                const session = sessionMap.get(date);
                if (session) {
                    weekData[index] =
                        dataService.calculateDigitalWellnessScore(session);
                    screenTimeData[index] = session.stats.totalTime;
                }
            });

            setData({
                scores: weekData,
                screenTime: screenTimeData,
                days: days,
            });
        };

        loadWeeklyData();
    }, []);

    // Calculate available chart height dynamically
    useEffect(() => {
        const updateChartHeight = () => {
            if (chartContainerRef.current) {
                const containerRect =
                    chartContainerRef.current.getBoundingClientRect();
                // Reserve space for labels (value labels + day labels) and some padding
                const reservedSpace = 60; // ~16px for value labels + ~16px for day labels + padding
                const availableHeight = containerRect.height - reservedSpace;
                setChartHeight(Math.max(availableHeight, 80)); // Minimum 80px for bars
            }
        };

        updateChartHeight();
        window.addEventListener("resize", updateChartHeight);
        return () => window.removeEventListener("resize", updateChartHeight);
    }, []);

    const currentData = viewMode === "scores" ? data.scores : data.screenTime;
    const maxValue = Math.max(...currentData);
    const nonZeroValues = currentData.filter((val) => val > 0);
    const average =
        nonZeroValues.length > 0
            ? nonZeroValues.reduce((a, b) => a + b, 0) / nonZeroValues.length
            : 0;

    const dataService = DataService.getInstance();
    const formatScreenTime = (milliseconds: number) =>
        dataService.formatTime(milliseconds);

    const getBarHeight = (value: number) => {
        if (currentData.length === 0 || value === 0) return 0;
        const maxHeight = chartHeight * 0.8; // Use 80% of available chart height
        const baseHeight = 8;
        // Use the same scale as the average line but maintain minimum bar height
        return Math.max(baseHeight, (value / maxValue) * maxHeight);
    };

    const getAverageLinePosition = (avgValue: number) => {
        const CHART_BOTTOM_OFFSET = 24;
        if (currentData.length === 0 || avgValue === 0)
            return CHART_BOTTOM_OFFSET;
        const maxHeight = chartHeight * 0.8; // Use 80% of available chart height
        // Use exact proportion for the line
        return CHART_BOTTOM_OFFSET + (avgValue / maxValue) * maxHeight;
    };

    const getBarColor = () => {
        return "#22c55e"; // Proper calming green (green-500)
    };

    const isToday = (index: number) => {
        // Today is always the last (rightmost) bar
        return index === 6;
    };

    return (
        <div className="bg-white rounded-xl p-4 border border-gray-200 h-full w-full relative overflow-hidden flex flex-col">
            {/* Header with Toggle */}
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
                <h2 className="text-lg font-medium text-black m-0">
                    Weekly Scores
                </h2>
                {/* Toggle matching StoryCard button style */}
                <div className="flex gap-0.5 bg-white border border-gray-200 rounded-full p-1">
                    <button
                        onClick={() => setViewMode("scores")}
                        className={`px-3 py-1 text-xs font-medium border-none rounded-full cursor-pointer transition-all duration-200 ${
                            viewMode === "scores"
                                ? "bg-gray-100 text-black"
                                : "bg-transparent text-gray-600 hover:text-black"
                        }`}
                    >
                        Wellness
                    </button>
                    <button
                        onClick={() => setViewMode("screenTime")}
                        className={`px-3 py-1 text-xs font-medium border-none rounded-full cursor-pointer transition-all duration-200 ${
                            viewMode === "screenTime"
                                ? "bg-gray-100 text-black"
                                : "bg-transparent text-gray-600 hover:text-black"
                        }`}
                    >
                        Screen Time
                    </button>
                </div>
            </div>

            {/* Chart Container */}
            <div
                ref={chartContainerRef}
                className="flex-1 flex flex-col justify-end"
                style={{ minHeight: "120px" }}
            >
                {/* Chart */}
                <div className="flex items-end justify-between h-auto mb-0 gap-2 relative z-10 px-1">
                    {/* Average Line - positioned relative to the chart bottom */}
                    {average > 0 && (
                        <>
                            <div
                                className="absolute left-0 right-0 h-px bg-gray-200 z-10"
                                style={{
                                    bottom: `${getAverageLinePosition(
                                        average,
                                    )}px`,
                                }}
                            />
                            <div
                                className="absolute right-0 text-xs font-medium text-gray-600 bg-white px-2 py-1 rounded-lg shadow-sm border border-gray-200 z-20"
                                style={{
                                    bottom: `${
                                        getAverageLinePosition(average) + 4
                                    }px`,
                                }}
                            >
                                Avg:{" "}
                                {viewMode === "scores"
                                    ? Math.round(average)
                                    : formatScreenTime(average)}
                            </div>
                        </>
                    )}
                    {data.days.map((day, index) => {
                        const isTodayBar = isToday(index);
                        const value = currentData[index];
                        return (
                            <div
                                key={`${day}-${index}`}
                                className="flex flex-col items-center flex-1 gap-2"
                            >
                                {/* Value Label */}
                                <div
                                    className={`text-xs font-medium min-h-4 ${
                                        value === 0
                                            ? "text-gray-400"
                                            : "text-black"
                                    }`}
                                >
                                    {value === 0
                                        ? "—"
                                        : viewMode === "scores"
                                        ? Math.round(value)
                                        : formatScreenTime(value)}
                                </div>
                                {/* Bar */}
                                <div
                                    className={`w-full max-w-7 rounded-lg transition-all duration-300 cursor-pointer relative ${
                                        value === 0 ? "bg-gray-100" : ""
                                    }`}
                                    style={{
                                        height: `${Math.max(
                                            getBarHeight(value),
                                            4,
                                        )}px`,
                                        backgroundColor:
                                            value === 0
                                                ? undefined
                                                : getBarColor(),
                                    }}
                                    onMouseEnter={(e) => {
                                        if (value > 0) {
                                            e.currentTarget.style.transform =
                                                "scale(1.05)";
                                            e.currentTarget.style.boxShadow =
                                                "0 4px 12px rgba(0, 0, 0, 0.1)";
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform =
                                            "scale(1)";
                                        e.currentTarget.style.boxShadow =
                                            "none";
                                    }}
                                >
                                    {/* Gradient overlay for bars with data */}
                                    {value > 0 && (
                                        <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/20 to-transparent rounded-t-lg" />
                                    )}
                                </div>
                                {/* Day Label */}
                                <div
                                    className={`text-xs ${
                                        isTodayBar
                                            ? "font-medium text-green-500"
                                            : "font-light text-gray-600"
                                    }`}
                                >
                                    {day}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default WeeklyInsights;
