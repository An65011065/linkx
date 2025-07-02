import React, { useState, useEffect } from "react";
import DataService from "../../data/dataService";

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
        const maxHeight = 160; // Maximum height for bars
        const baseHeight = 8;
        // Use the same scale as the average line but maintain minimum bar height
        return Math.max(baseHeight, (value / maxValue) * maxHeight);
    };

    const getAverageLinePosition = (avgValue: number) => {
        if (currentData.length === 0 || avgValue === 0) return 0;
        const maxHeight = 160; // Maximum height for bars
        // Use exact proportion for the line
        return (avgValue / maxValue) * maxHeight;
    };

    const getBarColor = () => {
        return "#4285f4"; // Use a single consistent color for all bars
    };

    const isToday = (index: number) => {
        // Today is always the last (rightmost) bar
        return index === 6;
    };

    return (
        <div
            style={{
                background: "rgba(255, 255, 255, 0.05)",
                borderRadius: "16px",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                backdropFilter: "blur(10px)",
                padding: "20px",
                width: "400px",
                position: "relative",
                overflow: "hidden",
                marginLeft: "0", // Ensure left alignment
            }}
        >
            {/* Background gradients matching StoryCard */}
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

            <div style={{ position: "relative", zIndex: 10 }}>
                {/* Header with Toggle */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "24px",
                    }}
                >
                    <h2
                        style={{
                            fontSize: "18px",
                            fontWeight: "400",
                            color: "rgba(255, 255, 255, 0.9)",
                            margin: "0",
                            fontFamily: "system-ui, -apple-system, sans-serif",
                        }}
                    >
                        This Week
                    </h2>

                    {/* Toggle with reduced size */}
                    <div
                        style={{
                            display: "flex",
                            gap: "4px",
                            background: "rgba(255, 255, 255, 0.1)",
                            borderRadius: "8px",
                            padding: "2px",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                        }}
                    >
                        <button
                            onClick={() => setViewMode("scores")}
                            style={{
                                padding: "4px 10px",
                                fontSize: "11px",
                                fontWeight: "500",
                                border: "none",
                                borderRadius: "6px",
                                background:
                                    viewMode === "scores"
                                        ? "#4285f4"
                                        : "transparent",
                                color:
                                    viewMode === "scores"
                                        ? "white"
                                        : "rgba(255, 255, 255, 0.7)",
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                                fontFamily:
                                    "system-ui, -apple-system, sans-serif",
                            }}
                        >
                            Wellness
                        </button>
                        <button
                            onClick={() => setViewMode("screenTime")}
                            style={{
                                padding: "4px 10px",
                                fontSize: "11px",
                                fontWeight: "500",
                                border: "none",
                                borderRadius: "6px",
                                background:
                                    viewMode === "screenTime"
                                        ? "#4285f4"
                                        : "transparent",
                                color:
                                    viewMode === "screenTime"
                                        ? "white"
                                        : "rgba(255, 255, 255, 0.7)",
                                cursor: "pointer",
                                transition: "all 0.2s ease",
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
                    style={{
                        position: "relative",
                    }}
                >
                    {/* Chart */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "end",
                            justifyContent: "space-between",
                            height: "220px",
                            marginBottom: "0px",
                            gap: "8px",
                            position: "relative",
                            zIndex: 2,
                            padding: "0 4px",
                        }}
                    >
                        {/* Average Line - positioned relative to the chart bottom */}
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
                                        background: "rgba(255, 255, 255, 0.4)",
                                        zIndex: 1,
                                        filter: "drop-shadow(0 0 4px rgba(255, 255, 255, 0.3))",
                                    }}
                                />
                                <div
                                    style={{
                                        position: "absolute",
                                        right: "0px",
                                        bottom: `${
                                            getAverageLinePosition(average) + 4
                                        }px`,
                                        fontSize: "11px",
                                        fontWeight: "500",
                                        color: "rgba(255, 255, 255, 0.9)",
                                        background: "rgba(0, 0, 0, 0.6)",
                                        padding: "4px 8px",
                                        borderRadius: "8px",
                                        backdropFilter: "blur(10px)",
                                        border: "1px solid rgba(255, 255, 255, 0.1)",
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
                                            fontWeight: "600",
                                            color:
                                                value === 0
                                                    ? "rgba(255, 255, 255, 0.3)"
                                                    : "rgba(255, 255, 255, 0.9)",
                                            minHeight: "16px",
                                            fontFamily:
                                                "system-ui, -apple-system, sans-serif",
                                            textShadow:
                                                value > 0
                                                    ? "0 0 8px rgba(255, 255, 255, 0.2)"
                                                    : "none",
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
                                            maxWidth: "28px",
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
                                                    borderRadius: "6px 6px 0 0",
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
};

export default WeeklyInsights;
