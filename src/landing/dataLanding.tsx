import React, { useState, useEffect } from "react";
import { Search, ArrowRight, Moon, Sun, ArrowLeft, Globe } from "lucide-react";
import DataService from "../data/dataService";
import type { BrowsingSession } from "../data/dataService";
import "./landing.css";

interface DomainData {
    domain: string;
    time: number;
    category: "productive" | "leisure";
}

interface DataLandingPageProps {
    isDarkMode: boolean;
    currentPage: "main" | "data" | "network";
    onNavigate: (page: "main" | "data" | "network") => void;
}

interface AnalyticsData {
    currentSession: BrowsingSession | null;
    topDomains: Array<{ domain: string; time: number; category: string }>;
    focusEfficiency: number;
    sessionDepth: number;
    longestStreakTime: number;
    wellnessScore: number;
    loading: boolean;
}

const DataLandingPage: React.FC<DataLandingPageProps> = ({
    isDarkMode,
    currentPage,
    onNavigate,
}) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    // Real data state
    const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
        currentSession: null,
        topDomains: [],
        focusEfficiency: 0,
        sessionDepth: 0,
        longestStreakTime: 0,
        wellnessScore: 0,
        loading: true,
    });

    // Load real data on component mount
    useEffect(() => {
        const loadRealData = async () => {
            try {
                const dataService = DataService.getInstance();

                // Get all the real data we need
                const [sessionAnalytics, detailedAnalytics, currentSession] =
                    await Promise.all([
                        dataService.getSessionAnalytics(),
                        dataService.getDetailedVisitAnalytics(),
                        dataService.getCurrentSession(),
                    ]);

                // Calculate wellness score
                const wellnessScore =
                    dataService.calculateDigitalWellnessScore(currentSession);

                setAnalyticsData({
                    currentSession,
                    topDomains: sessionAnalytics.topDomains,
                    focusEfficiency: detailedAnalytics.focusEfficiency,
                    sessionDepth: detailedAnalytics.sessionDepth,
                    longestStreakTime:
                        Math.max(
                            ...currentSession.tabSessions.map((ts) =>
                                Math.max(
                                    ...ts.urlVisits.map(
                                        (visit) => visit.activeTime,
                                    ),
                                ),
                            ),
                        ) || 0,
                    wellnessScore,
                    loading: false,
                });
            } catch (error) {
                console.error("Error loading analytics data:", error);
                setAnalyticsData((prev) => ({ ...prev, loading: false }));
            }
        };

        loadRealData();
    }, []);

    // Convert analytics data to display format
    const domainData: DomainData[] = analyticsData.topDomains
        .slice(0, 16)
        .map((domain) => ({
            domain: domain.domain,
            time: Math.round(domain.time / (1000 * 60)), // Convert ms to minutes
            // Fix category mapping: work + other = productive, social = leisure
            category:
                domain.category === "work" || domain.category === "other"
                    ? "productive"
                    : "leisure",
        }));

    // Calculate totals from real data (fixed to match new category logic)
    const totalTime = analyticsData.currentSession?.stats.totalTime || 0;
    const productiveTime =
        (analyticsData.currentSession?.stats.workTime || 0) +
        (analyticsData.currentSession?.stats.otherTime || 0);
    const leisureTime = analyticsData.currentSession?.stats.socialTime || 0;
    const totalSites = analyticsData.currentSession?.stats.uniqueDomains || 0;

    // Calculate focus sessions (sessions longer than 15 minutes)
    const focusSessions =
        analyticsData.currentSession?.tabSessions.filter(
            (session) => session.totalActiveTime > 15 * 60 * 1000,
        ).length || 0;

    // Calculate productive percentage
    const productivePercentage =
        totalTime > 0 ? Math.round((productiveTime / totalTime) * 100) : 0;

    const getGreeting = () => {
        const now = new Date();
        const hour = now.getHours();
        let greeting = "Hello";

        if (hour < 12) greeting = "Good morning";
        else if (hour < 17) greeting = "Good afternoon";
        else greeting = "Good evening";

        return greeting;
    };

    const handleSearch = () => {
        if (searchQuery.trim()) {
            if (searchQuery.includes(".") && !searchQuery.includes(" ")) {
                window.open(`https://${searchQuery}`, "_blank");
            } else {
                window.open(
                    `https://www.google.com/search?q=${encodeURIComponent(
                        searchQuery,
                    )}`,
                    "_blank",
                );
            }
        }
    };

    const formatTime = (milliseconds: number): string => {
        const totalMinutes = Math.round(milliseconds / (1000 * 60));
        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        if (hours === 0) return `${mins}m`;
        if (mins === 0) return `${hours}h`;
        return `${hours}h ${mins}m`;
    };

    // Show loading state
    if (analyticsData.loading) {
        return (
            <div
                className={`min-h-screen flex items-center justify-center transition-all duration-500 ${
                    isDarkMode
                        ? "bg-slate-950"
                        : "bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100"
                }`}
            >
                <div
                    className={`animate-spin rounded-full h-12 w-12 border-b-2 ${
                        isDarkMode ? "border-slate-400" : "border-amber-600"
                    }`}
                />
            </div>
        );
    }

    return (
        <div
            className={`min-h-screen transition-all duration-500 ${
                isDarkMode
                    ? "bg-slate-950"
                    : "bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100"
            }`}
        >
            {/* Header - Using same spacing and styling as main page */}
            <div className="flex justify-between items-center p-6">
                <div
                    className={`flex items-center gap-1 p-1 rounded-xl backdrop-blur-sm border ${
                        isDarkMode
                            ? "bg-slate-800/40 border-slate-700/30"
                            : "bg-white/50 border-amber-200/30"
                    }`}
                >
                    <button
                        onClick={() => onNavigate("main")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                            currentPage === "main"
                                ? isDarkMode
                                    ? "bg-slate-700/60 text-slate-200"
                                    : "bg-amber-100/60 text-amber-800"
                                : isDarkMode
                                ? "text-slate-400 hover:text-slate-300"
                                : "text-amber-600 hover:text-amber-700"
                        }`}
                    >
                        Home
                    </button>
                    <button
                        onClick={() => onNavigate("data")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                            currentPage === "data"
                                ? isDarkMode
                                    ? "bg-slate-700/60 text-slate-200"
                                    : "bg-amber-100/60 text-amber-800"
                                : isDarkMode
                                ? "text-slate-400 hover:text-slate-300"
                                : "text-amber-600 hover:text-amber-700"
                        }`}
                    >
                        Data
                    </button>
                    <button
                        onClick={() => onNavigate("network")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                            currentPage === "network"
                                ? isDarkMode
                                    ? "bg-slate-700/60 text-slate-200"
                                    : "bg-amber-100/60 text-amber-800"
                                : isDarkMode
                                ? "text-slate-400 hover:text-slate-300"
                                : "text-amber-600 hover:text-amber-700"
                        }`}
                    >
                        Network
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex flex-col items-center justify-start min-h-[60vh] px-6">
                {/* Header Stats - Matching main page typography */}
                <div className="text-center mb-12 animate-in fade-in duration-800">
                    <h1
                        className={`text-3xl font-light mb-3 animate-in slide-in-from-top-4 duration-600 delay-200 ${
                            isDarkMode ? "text-slate-200" : "text-amber-900"
                        }`}
                    >
                        {getGreeting()}
                    </h1>
                    <p
                        className={`text-base mb-8 animate-in fade-in duration-500 delay-400 ${
                            isDarkMode ? "text-slate-400" : "text-amber-600"
                        }`}
                    >
                        Your digital activity today
                    </p>
                    <div
                        className={`text-6xl font-extralight mb-4 tracking-tight animate-in zoom-in duration-700 delay-500 ${
                            isDarkMode ? "text-slate-300" : "text-amber-800"
                        }`}
                        style={{ fontVariantNumeric: "tabular-nums" }}
                    >
                        {formatTime(totalTime)}
                    </div>
                    <div
                        className={`text-lg font-light animate-in fade-in duration-500 delay-600 ${
                            isDarkMode ? "text-slate-400" : "text-amber-600"
                        }`}
                    >
                        across {totalSites} websites
                    </div>
                </div>

                {/* Productive vs Leisure Stats */}
                <div className="flex items-center gap-12 mb-12 animate-in fade-in duration-600 delay-700">
                    <div className="text-center">
                        <div
                            className={`text-2xl font-light mb-2 ${
                                isDarkMode
                                    ? "text-emerald-400"
                                    : "text-emerald-600"
                            }`}
                        >
                            {formatTime(productiveTime)}
                        </div>
                        <div
                            className={`text-sm font-medium uppercase tracking-wide ${
                                isDarkMode
                                    ? "text-emerald-400/70"
                                    : "text-emerald-600/70"
                            }`}
                        >
                            Productive
                        </div>
                    </div>
                    <div
                        className={`w-px h-12 ${
                            isDarkMode ? "bg-slate-600" : "bg-amber-300"
                        }`}
                    ></div>
                    <div className="text-center">
                        <div
                            className={`text-2xl font-light mb-2 ${
                                isDarkMode
                                    ? "text-purple-400"
                                    : "text-purple-600"
                            }`}
                        >
                            {formatTime(leisureTime)}
                        </div>
                        <div
                            className={`text-sm font-medium uppercase tracking-wide ${
                                isDarkMode
                                    ? "text-purple-400/70"
                                    : "text-purple-600/70"
                            }`}
                        >
                            Leisure
                        </div>
                    </div>
                </div>

                {/* Search - Exactly matching main page */}
                <div className="w-full max-w-2xl mb-12 animate-in slide-in-from-bottom-4 duration-600 delay-800">
                    <div
                        className={`flex items-center gap-4 px-6 py-4 rounded-2xl backdrop-blur-xl shadow-lg transition-all duration-300 border ${
                            isDarkMode
                                ? "bg-slate-800/50 border-slate-700/30"
                                : "bg-white/70 border-amber-200/40"
                        } ${isSearchFocused ? "scale-[1.02] shadow-2xl" : ""}`}
                    >
                        <Search
                            size={18}
                            className={`transition-colors duration-200 ${
                                isSearchFocused
                                    ? isDarkMode
                                        ? "text-slate-200"
                                        : "text-amber-800"
                                    : isDarkMode
                                    ? "text-slate-400"
                                    : "text-amber-500"
                            }`}
                        />
                        <input
                            type="text"
                            placeholder="Search or enter address"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => setIsSearchFocused(true)}
                            onBlur={() => setIsSearchFocused(false)}
                            onKeyPress={(e) =>
                                e.key === "Enter" && handleSearch()
                            }
                            className={`flex-1 bg-transparent outline-none text-lg ${
                                isDarkMode ? "text-slate-200" : "text-amber-900"
                            }`}
                        />
                        {searchQuery && (
                            <button
                                onClick={handleSearch}
                                className={`transition-all duration-200 hover:scale-110 ${
                                    isDarkMode
                                        ? "text-slate-300"
                                        : "text-amber-600"
                                }`}
                            >
                                <ArrowRight size={18} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Domain Grid - Clean favicons without backgrounds */}
                <div className="w-full max-w-md animate-in fade-in duration-600 delay-900">
                    {domainData.length > 0 ? (
                        <div className="flex flex-wrap justify-center gap-3 mb-8">
                            {domainData.map((domain, index) => (
                                <div
                                    key={domain.domain}
                                    className="group flex flex-col items-center gap-2 cursor-pointer animate-in slide-in-from-bottom-4"
                                    style={{
                                        animationDuration: "400ms",
                                        animationDelay: `${
                                            1000 + index * 30
                                        }ms`,
                                    }}
                                    title={domain.domain}
                                >
                                    <div className="w-8 h-8 flex items-center justify-center transition-all duration-200 hover:scale-110">
                                        <img
                                            src={`https://www.google.com/s2/favicons?domain=${domain.domain}&sz=32`}
                                            alt={domain.domain}
                                            className="w-6 h-6 rounded-sm"
                                            onError={(e) => {
                                                // Fallback to a generic globe icon if favicon fails
                                                const target =
                                                    e.target as HTMLImageElement;
                                                target.style.display = "none";
                                                const parent =
                                                    target.parentElement;
                                                if (
                                                    parent &&
                                                    !parent.querySelector(
                                                        ".fallback-icon",
                                                    )
                                                ) {
                                                    const fallback =
                                                        document.createElement(
                                                            "div",
                                                        );
                                                    fallback.className =
                                                        "fallback-icon";
                                                    fallback.innerHTML = "🌐";
                                                    fallback.style.fontSize =
                                                        "12px";
                                                    parent.appendChild(
                                                        fallback,
                                                    );
                                                }
                                            }}
                                        />
                                    </div>
                                    <span
                                        className={`text-xs font-medium ${
                                            domain.category === "productive"
                                                ? isDarkMode
                                                    ? "text-emerald-400"
                                                    : "text-emerald-600"
                                                : isDarkMode
                                                ? "text-purple-400"
                                                : "text-purple-600"
                                        }`}
                                    >
                                        {domain.time}m
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div
                            className={`text-center p-8 ${
                                isDarkMode ? "text-slate-400" : "text-amber-600"
                            }`}
                        >
                            <Globe
                                size={24}
                                className="mx-auto mb-2 opacity-50"
                            />
                            <p className="text-sm">
                                Start browsing to see your activity
                            </p>
                        </div>
                    )}
                </div>

                {/* Bottom Stats - Using real calculated data */}
                <div className="w-full max-w-2xl animate-in fade-in duration-600 delay-1200">
                    <div className="grid grid-cols-3 gap-3">
                        <div
                            className={`text-center p-4 rounded-xl backdrop-blur-xl border transition-all duration-200 hover:scale-105 ${
                                isDarkMode
                                    ? "bg-slate-800/40 border-slate-700/30"
                                    : "bg-white/50 border-amber-200/30"
                            }`}
                        >
                            <div
                                className={`text-2xl font-light mb-1 ${
                                    isDarkMode
                                        ? "text-slate-200"
                                        : "text-amber-900"
                                }`}
                            >
                                {focusSessions}
                            </div>
                            <div
                                className={`text-xs font-medium ${
                                    isDarkMode
                                        ? "text-slate-400"
                                        : "text-amber-600"
                                }`}
                            >
                                Focus sessions
                            </div>
                        </div>
                        <div
                            className={`text-center p-4 rounded-xl backdrop-blur-xl border transition-all duration-200 hover:scale-105 ${
                                isDarkMode
                                    ? "bg-slate-800/40 border-slate-700/30"
                                    : "bg-white/50 border-amber-200/30"
                            }`}
                        >
                            <div
                                className={`text-2xl font-light mb-1 ${
                                    isDarkMode
                                        ? "text-emerald-400"
                                        : "text-emerald-600"
                                }`}
                            >
                                {productivePercentage}%
                            </div>
                            <div
                                className={`text-xs font-medium ${
                                    isDarkMode
                                        ? "text-slate-400"
                                        : "text-amber-600"
                                }`}
                            >
                                Productive
                            </div>
                        </div>
                        <div
                            className={`text-center p-4 rounded-xl backdrop-blur-xl border transition-all duration-200 hover:scale-105 ${
                                isDarkMode
                                    ? "bg-slate-800/40 border-slate-700/30"
                                    : "bg-white/50 border-amber-200/30"
                            }`}
                        >
                            <div
                                className={`text-2xl font-light mb-1 ${
                                    isDarkMode
                                        ? "text-slate-200"
                                        : "text-amber-900"
                                }`}
                                style={{ fontVariantNumeric: "tabular-nums" }}
                            >
                                {formatTime(analyticsData.longestStreakTime)}
                            </div>
                            <div
                                className={`text-xs font-medium ${
                                    isDarkMode
                                        ? "text-slate-400"
                                        : "text-amber-600"
                                }`}
                            >
                                Longest session
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                input::placeholder {
                    color: ${
                        isDarkMode
                            ? "rgba(148, 163, 184, 0.5)"
                            : "rgba(217, 119, 6, 0.5)"
                    };
                    font-weight: 400;
                }
            `}</style>
        </div>
    );
};

export default DataLandingPage;
