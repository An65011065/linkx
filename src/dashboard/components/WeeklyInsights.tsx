import React, { useState, useEffect, useRef } from "react";
import DataService from "../../data/dataService";

interface WeeklyInsightsProps {
    isDarkMode?: boolean;
}

const WeeklyInsights: React.FC<WeeklyInsightsProps> = ({
    isDarkMode = false,
}) => {
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
        return "#4285f4"; // Blue for both modes
    };

    const isToday = (index: number) => {
        // Today is always the last (rightmost) bar
        return index === 6;
    };

    if (isDarkMode) {
        return (
            <div
                style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    borderRadius: "16px",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    backdropFilter: "blur(10px)",
                    padding: "12px",
                    paddingLeft: "14px",
                    paddingRight: "14px",
                    height: "100%",
                    width: "100%",
                    position: "relative",
                    overflow: "hidden",
                    marginLeft: "0",
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                {/* Background gradients */}
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        right: 0,
                        width: "150px",
                        height: "150px",
                        background:
                            "radial-gradient(circle, rgba(66, 133, 244, 0.3) 0%, transparent 70%)",
                        filter: "blur(30px)",
                        pointerEvents: "none",
                    }}
                />
                <div
                    style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        width: "100px",
                        height: "100px",
                        background:
                            "radial-gradient(circle, rgba(255, 107, 71, 0.2) 0%, transparent 70%)",
                        filter: "blur(20px)",
                        pointerEvents: "none",
                    }}
                />

                <div
                    style={{
                        position: "relative",
                        zIndex: 10,
                        display: "flex",
                        flexDirection: "column",
                        height: "100%",
                    }}
                >
                    {/* Header with Toggle */}
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "16px",
                            flexShrink: 0,
                        }}
                    >
                        <h2
                            style={{
                                fontSize: "16px",
                                fontWeight: "500",
                                color: "#ffffff",
                                margin: 0,
                                fontFamily:
                                    "system-ui, -apple-system, sans-serif",
                            }}
                        >
                            Weekly Scores
                        </h2>
                        {/* Toggle */}
                        <div
                            style={{
                                display: "flex",
                                gap: "2px",
                                background: "rgba(255, 255, 255, 0.05)",
                                border: "1px solid rgba(255, 255, 255, 0.1)",
                                borderRadius: "16px",
                                padding: "4px",
                            }}
                        >
                            <button
                                onClick={() => setViewMode("scores")}
                                style={{
                                    padding: "4px 12px",
                                    fontSize: "11px",
                                    fontWeight: "500",
                                    border: "none",
                                    borderRadius: "12px",
                                    cursor: "pointer",
                                    transition: "all 0.2s ease",
                                    background:
                                        viewMode === "scores"
                                            ? "#4285f4"
                                            : "transparent",
                                    color:
                                        viewMode === "scores"
                                            ? "white"
                                            : "rgba(255, 255, 255, 0.7)",
                                    fontFamily:
                                        "system-ui, -apple-system, sans-serif",
                                }}
                            >
                                Wellness
                            </button>
                            <button
                                onClick={() => setViewMode("screenTime")}
                                style={{
                                    padding: "4px 12px",
                                    fontSize: "11px",
                                    fontWeight: "500",
                                    border: "none",
                                    borderRadius: "12px",
                                    cursor: "pointer",
                                    transition: "all 0.2s ease",
                                    background:
                                        viewMode === "screenTime"
                                            ? "#4285f4"
                                            : "transparent",
                                    color:
                                        viewMode === "screenTime"
                                            ? "white"
                                            : "rgba(255, 255, 255, 0.7)",
                                    fontFamily:
                                        "system-ui, -apple-system, sans-serif",
                                }}
                            >
                                Screen Time
                            </button>
                        </div>
                    </div>

                    {/* Chart Container */}
                    <div
                        ref={chartContainerRef}
                        style={{
                            flex: 1,
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "flex-end",
                            minHeight: "120px",
                        }}
                    >
                        {/* Chart */}
                        <div
                            style={{
                                display: "flex",
                                alignItems: "end",
                                justifyContent: "space-between",
                                height: "auto",
                                marginBottom: "0px",
                                gap: "8px",
                                position: "relative",
                                zIndex: 2,
                                padding: "0 4px",
                            }}
                        >
                            {/* Average Line */}
                            {average > 0 && (
                                <>
                                    <div
                                        style={{
                                            position: "absolute",
                                            left: "0px",
                                            right: "0px",
                                            bottom: `${getAverageLinePosition(
                                                average,
                                            )}px`,
                                            height: "1px",
                                            background:
                                                "rgba(255, 255, 255, 0.4)",
                                            zIndex: 1,
                                            filter: "drop-shadow(0 0 4px rgba(255, 255, 255, 0.3))",
                                        }}
                                    />
                                    <div
                                        style={{
                                            position: "absolute",
                                            right: "0px",
                                            bottom: `${
                                                getAverageLinePosition(
                                                    average,
                                                ) + 4
                                            }px`,
                                            fontSize: "11px",
                                            fontWeight: "500",
                                            color: "rgba(255, 255, 255, 0.9)",
                                            background: "rgba(0, 0, 0, 0.8)",
                                            padding: "4px 8px",
                                            borderRadius: "8px",
                                            backdropFilter: "blur(4px)",
                                            border: "1px solid rgba(255, 255, 255, 0.2)",
                                            zIndex: 3,
                                            fontFamily:
                                                "system-ui, -apple-system, sans-serif",
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
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            flex: 1,
                                            gap: "8px",
                                        }}
                                    >
                                        {/* Value Label */}
                                        <div
                                            style={{
                                                fontSize: "11px",
                                                fontWeight: "500",
                                                color:
                                                    value === 0
                                                        ? "rgba(255, 255, 255, 0.3)"
                                                        : "rgba(255, 255, 255, 0.9)",
                                                minHeight: "14px",
                                                fontFamily:
                                                    "system-ui, -apple-system, sans-serif",
                                                textAlign: "center",
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                            }}
                                        >
                                            {value === 0
                                                ? "—"
                                                : viewMode === "scores"
                                                ? Math.round(value)
                                                : formatScreenTime(value)}
                                        </div>

                                        {/* Bar */}
                                        <div
                                            style={{
                                                width: "100%",
                                                maxWidth: "1.75rem",
                                                height: `${Math.max(
                                                    getBarHeight(value),
                                                    4,
                                                )}px`,
                                                background:
                                                    value === 0
                                                        ? "rgba(255, 255, 255, 0.1)"
                                                        : getBarColor(),
                                                borderRadius: "6px 6px 3px 3px",
                                                transition: "all 0.3s ease",
                                                cursor:
                                                    value > 0
                                                        ? "pointer"
                                                        : "default",
                                                filter:
                                                    value > 0
                                                        ? `drop-shadow(0 0 8px ${getBarColor()})`
                                                        : "none",
                                                position: "relative",
                                            }}
                                            onMouseEnter={(e) => {
                                                if (value > 0) {
                                                    e.currentTarget.style.transform =
                                                        "scale(1.05)";
                                                    e.currentTarget.style.filter = `drop-shadow(0 0 12px ${getBarColor()})`;
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform =
                                                    "scale(1)";
                                                e.currentTarget.style.filter =
                                                    value > 0
                                                        ? `drop-shadow(0 0 8px ${getBarColor()})`
                                                        : "none";
                                            }}
                                        >
                                            {/* Gradient overlay for bars with data */}
                                            {value > 0 && (
                                                <div
                                                    style={{
                                                        position: "absolute",
                                                        top: 0,
                                                        left: 0,
                                                        right: 0,
                                                        height: "30%",
                                                        background:
                                                            "linear-gradient(to bottom, rgba(255, 255, 255, 0.3), transparent)",
                                                        borderRadius:
                                                            "6px 6px 0 0",
                                                    }}
                                                />
                                            )}
                                        </div>

                                        {/* Day Label */}
                                        <div
                                            style={{
                                                fontSize: "12px",
                                                fontWeight: isTodayBar
                                                    ? "600"
                                                    : "400",
                                                color: isTodayBar
                                                    ? "#4285f4"
                                                    : "rgba(255, 255, 255, 0.7)",
                                                fontFamily:
                                                    "system-ui, -apple-system, sans-serif",
                                                textShadow: isTodayBar
                                                    ? "0 0 8px rgba(66, 133, 244, 0.4)"
                                                    : "none",
                                            }}
                                        >
                                            {day}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Light Mode
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
                                    className={`text-xs font-medium min-h-4 text-center whitespace-nowrap overflow-hidden ${
                                        value === 0
                                            ? "text-gray-400"
                                            : "text-black"
                                    }`}
                                    style={{ textOverflow: "ellipsis" }}
                                >
                                    {value === 0
                                        ? "—"
                                        : viewMode === "scores"
                                        ? Math.round(value)
                                        : formatScreenTime(value)}
                                </div>
                                {/* Bar */}
                                <div
                                    className={`w-full rounded-lg transition-all duration-300 cursor-pointer relative ${
                                        value === 0 ? "bg-gray-100" : ""
                                    }`}
                                    style={{
                                        height: `${Math.max(
                                            getBarHeight(value),
                                            4,
                                        )}px`,
                                        maxWidth: "1.75rem",
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
