import React, { useState, useEffect } from "react";
import { Calendar, Globe, TrendingUp, Clock, Focus } from "lucide-react";
import SearchBar from "./searchbar";
import FloatingHeader from "./FloatingHeader";
import DataService from "../data/dataService";
import type { BrowsingSession } from "../data/dataService";

interface DomainData {
    domain: string;
    time: number; // Now in milliseconds
    category: "productive" | "leisure";
}

interface DataLandingPageProps {
    isDarkMode: boolean;
    onToggleDarkMode: () => void;
    currentPage: "main" | "data" | "network" | "maintab" | "insights";
    onNavigate: (page: "main" | "data" | "network" | "maintab" | "insights", query?: string) => void;
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
    onToggleDarkMode,
    currentPage,
    onNavigate,
}) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [searchType, setSearchType] = useState<"Search" | "Insights">(
        "Search",
    );

    // Handle search type change
    const handleSearchTypeChange = (type: "Search" | "Insights") => {
        setSearchType(type);
    };
    const [isInitialLoad, setIsInitialLoad] = useState(true);

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
            time: domain.time, // Keep in milliseconds for formatTime function
            category:
                domain.category === "work" || domain.category === "other"
                    ? "productive"
                    : "leisure",
        }));

    // Calculate totals from real data
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

    // Handle initial load animation
    useEffect(() => {
        const timer = setTimeout(() => setIsInitialLoad(false), 100);
        return () => clearTimeout(timer);
    }, []);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Your morning focus";
        if (hour < 17) return "Your afternoon insights";
        return "Your daily journey";
    };

    const handleSearch = () => {
        if (searchType === "Insights") {
            onNavigate("insights", searchQuery);
            return;
        }
        
        if (searchQuery.trim()) {
            if (searchQuery.includes(".") && !searchQuery.includes(" ")) {
                window.location.href = `https://${searchQuery}`;
            } else {
                window.location.href = `https://www.google.com/search?q=${encodeURIComponent(
                    searchQuery,
                )}`;
            }
        }
    };

    // Show loading state
    if (analyticsData.loading) {
        return (
            <div
                className={`min-h-screen flex items-center justify-center transition-all duration-500 ${
                    isDarkMode ? "bg-slate-950" : "bg-gray-50"
                }`}
            >
                <div
                    className={`animate-spin rounded-full h-12 w-12 border-b-2 ${
                        isDarkMode ? "border-slate-400" : "border-gray-600"
                    }`}
                />
            </div>
        );
    }

    const formatTime = (milliseconds: number): string => {
        const totalMinutes = Math.round(milliseconds / (1000 * 60));
        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        if (hours === 0) return `${mins}m`;
        if (mins === 0) return `${hours}h`;
        return `${hours}h ${mins}m`;
    };

    return (
        <div
            className={`min-h-screen h-screen w-full transition-all duration-700 ease-out ${
                isDarkMode ? "bg-slate-950" : "bg-gray-50"
            }`}
            style={{
                margin: 0,
                padding: 0,
                position: "relative",
                overflow: "hidden",
                zIndex: 1,
                backgroundColor: "transparent"
            }}
        >
            {/* Floating Header Component */}
            <FloatingHeader
                isDarkMode={isDarkMode}
                onToggleDarkMode={onToggleDarkMode}
                currentPage={currentPage}
                onNavigate={onNavigate}
                isInitialLoad={isInitialLoad}
            />

            {/* Main content with staggered animations */}
            <div className="flex flex-col items-center justify-center min-h-screen px-6 -mt-16">
                {/* Greeting with fade-in animation - Matching main page */}
                <div
                    className={`text-center mb-8 transition-all duration-700 ease-out ${
                        isInitialLoad
                            ? "opacity-0 translate-y-4"
                            : "opacity-100 translate-y-0"
                    }`}
                    style={{ animationDelay: "400ms" }}
                >
                    <h1
                        className={`text-xl font-light mb-6 transition-colors duration-500 ${
                            isDarkMode ? "text-slate-400" : "text-gray-600"
                        }`}
                    >
                        {getGreeting()}
                    </h1>

                    {/* Enhanced time display - Matching main page style */}
                    <div
                        className={`text-7xl font-extralight tracking-tight mb-2 transition-all duration-500 ${
                            isDarkMode ? "text-slate-200" : "text-gray-900"
                        }`}
                        style={{
                            fontVariantNumeric: "tabular-nums",
                            textShadow: isDarkMode
                                ? "0 0 20px rgba(148, 163, 184, 0.1)"
                                : "0 0 20px rgba(0, 0, 0, 0.05)",
                        }}
                    >
                        {formatTime(totalTime)}
                    </div>

                    <div
                        className={`text-base transition-colors duration-500 ${
                            isDarkMode ? "text-slate-500" : "text-gray-500"
                        }`}
                    >
                        across {totalSites} websites today
                    </div>
                </div>

                {/* Productive vs Leisure Stats - Enhanced for visual hierarchy */}
                <div
                    className={`flex items-center gap-12 mb-8 transition-all duration-700 ease-out ${
                        isInitialLoad
                            ? "opacity-0 translate-y-4"
                            : "opacity-100 translate-y-0"
                    }`}
                    style={{ animationDelay: "500ms" }}
                >
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
                            isDarkMode ? "bg-slate-600" : "bg-gray-300"
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

                {/* Search using SearchBar component */}
                <SearchBar
                    isDarkMode={isDarkMode}
                    searchQuery={searchQuery}
                    onSearchQueryChange={setSearchQuery}
                    onSearch={handleSearch}
                    placeholder="Search or enter address"
                    searchType={searchType}
                    onSearchTypeChange={handleSearchTypeChange}
                    showTypeSelector={true}
                    isInitialLoad={isInitialLoad}
                    variant="main"
                    animationDelay="600ms"
                />

                {/* Domain Grid - Clean favicons with improved layout */}
                <div
                    className={`w-full max-w-md mb-8 transition-all duration-700 ease-out ${
                        isInitialLoad
                            ? "opacity-0 translate-y-4"
                            : "opacity-100 translate-y-0"
                    }`}
                    style={{ animationDelay: "700ms" }}
                >
                    {domainData.length > 0 ? (
                        <div className="flex flex-wrap justify-center gap-4">
                            {domainData.slice(0, 16).map((domain, index) => (
                                <div
                                    key={domain.domain}
                                    className={`group flex flex-col items-center gap-1.5 cursor-pointer transition-all duration-300 hover:scale-110 ${
                                        isInitialLoad
                                            ? "opacity-0 translate-y-2"
                                            : "opacity-100 translate-y-0"
                                    }`}
                                    style={{
                                        animationDelay: `${800 + index * 50}ms`,
                                        transition: `all 0.4s ease-out ${
                                            800 + index * 50
                                        }ms`,
                                    }}
                                    title={`${domain.domain} - ${formatTime(domain.time)}`}
                                >
                                    <div className="w-8 h-8 flex items-center justify-center">
                                        <img
                                            src={`https://www.google.com/s2/favicons?domain=${domain.domain}&sz=32`}
                                            alt={domain.domain}
                                            className="w-6 h-6 rounded-sm"
                                            onError={(e) => {
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
                                                        "fallback-icon text-xs";
                                                    fallback.innerHTML = "🌐";
                                                    parent.appendChild(
                                                        fallback,
                                                    );
                                                }
                                            }}
                                        />
                                    </div>
                                    <span
                                        className={`text-xs font-medium transition-colors duration-200 ${
                                            domain.category === "productive"
                                                ? isDarkMode
                                                    ? "text-emerald-400 group-hover:text-emerald-300"
                                                    : "text-emerald-600 group-hover:text-emerald-700"
                                                : isDarkMode
                                                ? "text-purple-400 group-hover:text-purple-300"
                                                : "text-purple-600 group-hover:text-purple-700"
                                        }`}
                                    >
                                        {formatTime(domain.time)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div
                            className={`text-center p-8 ${
                                isDarkMode ? "text-slate-400" : "text-gray-600"
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

                {/* Bottom Stats - Minimal, borderless design */}
                <div
                    className={`w-full max-w-lg transition-all duration-700 ease-out ${
                        isInitialLoad
                            ? "opacity-0 translate-y-4"
                            : "opacity-100 translate-y-0"
                    }`}
                    style={{ animationDelay: "900ms" }}
                >
                    <div className="flex justify-between items-end">
                        <div className="text-center group cursor-pointer">
                            <div
                                className={`text-3xl font-extralight mb-1 transition-colors duration-300 ${
                                    isDarkMode
                                        ? "text-slate-200 group-hover:text-blue-400"
                                        : "text-gray-900 group-hover:text-blue-600"
                                }`}
                                style={{ fontVariantNumeric: "tabular-nums" }}
                            >
                                {analyticsData.currentSession?.stats
                                    .totalUrls || 0}
                            </div>
                            <div
                                className={`text-xs font-medium uppercase tracking-wide transition-colors duration-300 ${
                                    isDarkMode
                                        ? "text-slate-500 group-hover:text-slate-400"
                                        : "text-gray-500 group-hover:text-gray-600"
                                }`}
                            >
                                URLs
                            </div>
                        </div>

                        <div className="text-center group cursor-pointer">
                            <div
                                className={`text-3xl font-extralight mb-1 transition-colors duration-300 ${
                                    isDarkMode
                                        ? "text-emerald-400 group-hover:text-emerald-300"
                                        : "text-emerald-600 group-hover:text-emerald-700"
                                }`}
                                style={{ fontVariantNumeric: "tabular-nums" }}
                            >
                                {productivePercentage}%
                            </div>
                            <div
                                className={`text-xs font-medium uppercase tracking-wide transition-colors duration-300 ${
                                    isDarkMode
                                        ? "text-slate-500 group-hover:text-slate-400"
                                        : "text-gray-500 group-hover:text-gray-600"
                                }`}
                            >
                                Productive
                            </div>
                        </div>

                        <div className="text-center group cursor-pointer">
                            <div
                                className={`text-3xl font-extralight mb-1 transition-colors duration-300 ${
                                    isDarkMode
                                        ? "text-slate-200 group-hover:text-purple-400"
                                        : "text-gray-900 group-hover:text-purple-600"
                                }`}
                                style={{ fontVariantNumeric: "tabular-nums" }}
                            >
                                {formatTime(analyticsData.longestStreakTime)}
                            </div>
                            <div
                                className={`text-xs font-medium uppercase tracking-wide transition-colors duration-300 ${
                                    isDarkMode
                                        ? "text-slate-500 group-hover:text-slate-400"
                                        : "text-gray-500 group-hover:text-gray-600"
                                }`}
                            >
                                Focus session
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Global styles - Matching main page */}
            <style>
                {`
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }

                html, body {
                    height: 100%;
                    margin: 0;
                    padding: 0;
                }

                input::placeholder {
                    color: ${
                        isDarkMode
                            ? "rgba(148, 163, 184, 0.5)"
                            : "rgba(107, 114, 128, 0.5)"
                    };
                    font-weight: 400;
                }

                ::-webkit-scrollbar {
                    width: 6px;
                }

                ::-webkit-scrollbar-track {
                    background: ${isDarkMode ? "#1e293b" : "#f1f5f9"};
                }

                ::-webkit-scrollbar-thumb {
                    background: ${isDarkMode ? "#475569" : "#cbd5e1"};
                    border-radius: 3px;
                }

                ::-webkit-scrollbar-thumb:hover {
                    background: ${isDarkMode ? "#64748b" : "#94a3b8"};
                }
                `}
            </style>
        </div>
    );
};

export default DataLandingPage;
