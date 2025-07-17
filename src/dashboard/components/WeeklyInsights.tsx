import React, { useState, useEffect, useRef } from "react";
import AuthService from "../../services/authService";

interface WeeklyInsightsProps {
    isDarkMode?: boolean;
}

const WeeklyInsights: React.FC<WeeklyInsightsProps> = ({
    isDarkMode = false,
}) => {
    const [viewMode, setViewMode] = useState<"scores" | "screenTime">(
        "screenTime",
    ); // Default to screenTime
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
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const authService = AuthService.getInstance();

    useEffect(() => {
        loadWeeklyData();
    }, []);

    const loadWeeklyData = async () => {
        try {
            setLoading(true);
            setError(null);
            console.log("🔄 Loading weekly insights from API...");

            const response = await authService.makeApiCall(
                "GET",
                "/insights/weekly?days=7",
            );

            if (response.ok) {
                const apiData = await response.json();
                console.log("✅ Weekly insights API response:", apiData);

                // Create a map of date to session data
                const sessionMap = new Map();
                (apiData.sessions || []).forEach((session: any) => {
                    sessionMap.set(session.date, session);
                });

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
                        console.log(
                            `📊 Processing session for ${date}:`,
                            session,
                        );
                        weekData[index] = session.wellnessScore || 0;
                        screenTimeData[index] =
                            session.totalTime || session.stats?.totalTime || 0;
                    }
                });

                console.log("✅ Processed weekly data:", {
                    scores: weekData,
                    screenTime: screenTimeData,
                    days,
                });

                setData({
                    scores: weekData,
                    screenTime: screenTimeData,
                    days: days,
                });
            } else {
                console.error(
                    "❌ Failed to load weekly insights:",
                    response.status,
                );
                const errorData = await response.json().catch(() => ({}));
                console.error("Error details:", errorData);
                setError("Failed to load weekly insights");

                // Set default empty data on error
                const days = Array.from({ length: 7 }, (_, i) => {
                    const date = new Date();
                    date.setDate(date.getDate() - (6 - i));
                    return date.toLocaleDateString("en-US", {
                        weekday: "short",
                    });
                });

                setData({
                    scores: Array(7).fill(0),
                    screenTime: Array(7).fill(0),
                    days: days,
                });
            }
        } catch (err) {
            console.error("❌ Error loading weekly insights:", err);
            setError("Failed to load weekly insights");

            // Set default empty data on error
            const days = Array.from({ length: 7 }, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - (6 - i));
                return date.toLocaleDateString("en-US", { weekday: "short" });
            });

            setData({
                scores: Array(7).fill(0),
                screenTime: Array(7).fill(0),
                days: days,
            });
        } finally {
            setLoading(false);
        }
    };

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

    // Format screen time (milliseconds to readable format)
    const formatScreenTime = (milliseconds: number) => {
        if (milliseconds === 0) return "0m";

        const hours = Math.floor(milliseconds / (1000 * 60 * 60));
        const minutes = Math.floor(
            (milliseconds % (1000 * 60 * 60)) / (1000 * 60),
        );

        if (hours > 0) {
            return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
        }
        return `${minutes}m`;
    };

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

    // Show loading state
    if (loading) {
        return (
            <div
                className={`
                    h-full w-full rounded-xl border flex items-center justify-center
                    ${
                        isDarkMode
                            ? "bg-white/5 border-white/10"
                            : "bg-white border-gray-200"
                    }
                `}
            >
                <div className="text-center">
                    <div
                        className={`
                            w-6 h-6 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-2
                            ${
                                isDarkMode
                                    ? "border-white/30"
                                    : "border-gray-300"
                            }
                        `}
                    />
                    <div
                        className={`
                            text-sm
                            ${isDarkMode ? "text-white/50" : "text-gray-500"}
                        `}
                    >
                        Loading insights...
                    </div>
                </div>
            </div>
        );
    }

    // Show error state
    if (error) {
        return (
            <div
                className={`
                    h-full w-full rounded-xl border flex items-center justify-center p-4
                    ${
                        isDarkMode
                            ? "bg-white/5 border-white/10"
                            : "bg-white border-gray-200"
                    }
                `}
            >
                <div className="text-center">
                    <div className="text-red-500 text-sm mb-2">⚠️</div>
                    <div
                        className={`
                            text-sm
                            ${isDarkMode ? "text-white/70" : "text-gray-600"}
                        `}
                    >
                        {error}
                    </div>
                    <button
                        onClick={loadWeeklyData}
                        className={`
                            mt-2 px-3 py-1 text-xs rounded-lg transition-colors
                            ${
                                isDarkMode
                                    ? "bg-white/10 text-white hover:bg-white/20"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }
                        `}
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

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

                        {/* Simple Toggle */}
                        <div
                            style={{
                                position: "relative",
                                display: "inline-flex",
                                background: "rgba(255, 255, 255, 0.05)",
                                border: "1px solid rgba(255, 255, 255, 0.1)",
                                borderRadius: "20px",
                                padding: "3px",
                                width: "180px",
                                height: "32px",
                            }}
                        >
                            {/* Sliding Background */}
                            <div
                                style={{
                                    position: "absolute",
                                    top: "3px",
                                    left:
                                        viewMode === "screenTime"
                                            ? "3px"
                                            : "50%",
                                    width: "calc(50% - 3px)",
                                    height: "calc(100% - 6px)",
                                    background: "#4285f4",
                                    borderRadius: "17px",
                                    transition: "left 0.25s ease-out",
                                    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.3)",
                                }}
                            />

                            {/* Screen Time Button */}
                            <button
                                onClick={() => setViewMode("screenTime")}
                                style={{
                                    position: "relative",
                                    zIndex: 2,
                                    width: "50%",
                                    height: "100%",
                                    background: "transparent",
                                    border: "none",
                                    borderRadius: "17px",
                                    cursor: "pointer",
                                    fontSize: "11px",
                                    fontWeight: "500",
                                    color:
                                        viewMode === "screenTime"
                                            ? "#ffffff"
                                            : "rgba(255, 255, 255, 0.6)",
                                    transition: "color 0.25s ease-out",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontFamily:
                                        "system-ui, -apple-system, sans-serif",
                                }}
                            >
                                Screen Time
                            </button>

                            {/* Wellness Button */}
                            <button
                                onClick={() => setViewMode("scores")}
                                style={{
                                    position: "relative",
                                    zIndex: 2,
                                    width: "50%",
                                    height: "100%",
                                    background: "transparent",
                                    border: "none",
                                    borderRadius: "17px",
                                    cursor: "pointer",
                                    fontSize: "11px",
                                    fontWeight: "500",
                                    color:
                                        viewMode === "scores"
                                            ? "#ffffff"
                                            : "rgba(255, 255, 255, 0.6)",
                                    transition: "color 0.25s ease-out",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontFamily:
                                        "system-ui, -apple-system, sans-serif",
                                }}
                            >
                                Wellness
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

                {/* Simple Toggle */}
                <div
                    style={{
                        position: "relative",
                        display: "inline-flex",
                        background: "#f3f4f6",
                        border: "1px solid #e5e7eb",
                        borderRadius: "20px",
                        padding: "3px",
                        width: "180px",
                        height: "32px",
                    }}
                >
                    {/* Sliding Background */}
                    <div
                        style={{
                            position: "absolute",
                            top: "3px",
                            left: viewMode === "screenTime" ? "3px" : "50%",
                            width: "calc(50% - 3px)",
                            height: "calc(100% - 6px)",
                            background: "#ffffff",
                            borderRadius: "17px",
                            transition: "left 0.25s ease-out",
                            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                        }}
                    />

                    {/* Screen Time Button */}
                    <button
                        onClick={() => setViewMode("screenTime")}
                        style={{
                            position: "relative",
                            zIndex: 2,
                            width: "50%",
                            height: "100%",
                            background: "transparent",
                            border: "none",
                            borderRadius: "17px",
                            cursor: "pointer",
                            fontSize: "11px",
                            fontWeight: "500",
                            color:
                                viewMode === "screenTime"
                                    ? "#000000"
                                    : "#6b7280",
                            transition: "color 0.25s ease-out",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontFamily: "system-ui, -apple-system, sans-serif",
                        }}
                    >
                        Screen Time
                    </button>

                    {/* Wellness Button */}
                    <button
                        onClick={() => setViewMode("scores")}
                        style={{
                            position: "relative",
                            zIndex: 2,
                            width: "50%",
                            height: "100%",
                            background: "transparent",
                            border: "none",
                            borderRadius: "17px",
                            cursor: "pointer",
                            fontSize: "11px",
                            fontWeight: "500",
                            color:
                                viewMode === "scores" ? "#000000" : "#6b7280",
                            transition: "color 0.25s ease-out",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontFamily: "system-ui, -apple-system, sans-serif",
                        }}
                    >
                        Wellness
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
