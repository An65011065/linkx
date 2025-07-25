import React, { useState, useEffect, useCallback } from "react";
import {
    ArrowLeft,
    GitBranch,
    Globe,
    Activity,
    BarChart3,
    RotateCcw,
    TrendingDown,
    Focus,
} from "lucide-react";
import SearchBar from "./searchbar";
import FloatingHeader from "./FloatingHeader";
import GraphVisualization from "../graph/components/GraphVisualization";
import DataService from "../data/dataService";
import type { BrowsingSession } from "../data/dataService";

interface NetworkLandingPageProps {
    isDarkMode: boolean;
    onToggleDarkMode: () => void;
    currentPage: "main" | "data" | "network";
    onNavigate: (page: "main" | "data" | "network") => void;
}

interface AnalyticsData {
    currentSession: BrowsingSession | null;
    returnRate: number;
    longestChain: number;
    focusEfficiency: number;
    sessionDepth: number;
    totalSites: number;
    totalVisits: number;
    activeHours: number;
    loading: boolean;
}

const NetworkLandingPage: React.FC<NetworkLandingPageProps> = ({
    isDarkMode,
    onToggleDarkMode,
    currentPage,
    onNavigate,
}) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [searchType, setSearchType] = useState<"Search" | "Insights">(
        "Search",
    );
    const [activeMetric, setActiveMetric] = useState(0);
    const [isGraphMode, setIsGraphMode] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    // Real data state
    const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
        currentSession: null,
        returnRate: 0,
        longestChain: 0,
        focusEfficiency: 0,
        sessionDepth: 0,
        totalSites: 0,
        totalVisits: 0,
        activeHours: 0,
        loading: true,
    });

    // Load real data on component mount
    useEffect(() => {
        const loadRealData = async () => {
            try {
                const dataService = DataService.getInstance();
                const [sessionAnalytics, detailedAnalytics, currentSession] =
                    await Promise.all([
                        dataService.getSessionAnalytics(),
                        dataService.getDetailedVisitAnalytics(),
                        dataService.getCurrentSession(),
                    ]);

                // Calculate network-specific metrics
                const totalVisits = currentSession.tabSessions.reduce(
                    (total, tab) => total + tab.urlVisits.length,
                    0,
                );

                const totalActiveTime = currentSession.stats.totalTime;
                const activeHours =
                    Math.round((totalActiveTime / (1000 * 60 * 60)) * 10) / 10;

                // Calculate return rate (sites visited more than once)
                const domainVisitCounts = new Map();
                currentSession.tabSessions.forEach((tab) => {
                    tab.urlVisits.forEach((visit) => {
                        const domain = new URL(visit.url).hostname;
                        domainVisitCounts.set(
                            domain,
                            (domainVisitCounts.get(domain) || 0) + 1,
                        );
                    });
                });

                const returningDomains = Array.from(
                    domainVisitCounts.values(),
                ).filter((count) => count > 1).length;
                const returnRate = Math.round(
                    (returningDomains / domainVisitCounts.size) * 100,
                );

                // Calculate longest chain (longest single tab session)
                const longestChain = Math.max(
                    ...currentSession.tabSessions.map(
                        (tab) => tab.urlVisits.length,
                    ),
                    0,
                );

                setAnalyticsData({
                    currentSession,
                    returnRate,
                    longestChain,
                    focusEfficiency: detailedAnalytics.focusEfficiency,
                    sessionDepth: detailedAnalytics.sessionDepth,
                    totalSites: currentSession.stats.uniqueDomains,
                    totalVisits,
                    activeHours,
                    loading: false,
                });
            } catch (error) {
                console.error("Error loading analytics data:", error);
                setAnalyticsData((prev) => ({ ...prev, loading: false }));
            }
        };

        loadRealData();
    }, []);

    // Handle initial load animation
    useEffect(() => {
        const timer = setTimeout(() => setIsInitialLoad(false), 100);
        return () => clearTimeout(timer);
    }, []);

    // Real browsing metrics based on actual data
    const networkMetrics = [
        {
            label: "Return Rate",
            value: `${analyticsData.returnRate}%`,
            description: "Sites you revisit regularly",
            icon: RotateCcw,
            color: "emerald",
            trend: "+5%", // Could calculate this from historical data
        },
        {
            label: "Longest Chain",
            value: `${analyticsData.longestChain}`,
            description: "Deepest browsing rabbit hole",
            icon: GitBranch,
            color: "blue",
            trend: "New!",
        },
        {
            label: "Focus Score",
            value: `${analyticsData.focusEfficiency}%`,
            description: "Time spent actively browsing",
            icon: Focus,
            color: "purple",
            trend: `${analyticsData.focusEfficiency > 70 ? "+" : ""}${
                analyticsData.focusEfficiency - 65
            }%`,
        },
        {
            label: "Avg Depth",
            value: `${analyticsData.sessionDepth}`,
            description: "Average visits per session",
            icon: TrendingDown,
            color: "orange",
            trend: `${analyticsData.sessionDepth > 10 ? "+" : ""}${
                analyticsData.sessionDepth - 8
            }`,
        },
    ];
    const currentMetric = networkMetrics[activeMetric];

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveMetric((prev) => (prev + 1) % networkMetrics.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            const scrollY = window.scrollY;
            // Switch to graph mode when scrolling past the first page
            const triggerPoint = window.innerHeight * 0.9;
            setIsGraphMode(scrollY > triggerPoint);
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const handleGraphSearch = useCallback((searchTerm: string) => {
        // This will be passed to GraphVisualization to trigger its search
        setSearchQuery(searchTerm);
    }, []);

    const handleSearch = () => {
        if (searchQuery.trim()) {
            if (searchType === "Search") {
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
            } else {
                // Handle graph search - trigger the graph's search function
                handleGraphSearch(searchQuery);
            }
        }
    };

    const getColorClasses = (color: string, type: string) => {
        const colorMap = {
            emerald: {
                text: isDarkMode ? "text-emerald-400" : "text-emerald-600",
                bg: isDarkMode ? "bg-emerald-500/20" : "bg-emerald-100",
                border: isDarkMode
                    ? "border-emerald-500/30"
                    : "border-emerald-200",
                accent: isDarkMode ? "text-emerald-300" : "text-emerald-500",
            },
            blue: {
                text: isDarkMode ? "text-blue-400" : "text-blue-600",
                bg: isDarkMode ? "bg-blue-500/20" : "bg-blue-100",
                border: isDarkMode ? "border-blue-500/30" : "border-blue-200",
                accent: isDarkMode ? "text-blue-300" : "text-blue-500",
            },
            purple: {
                text: isDarkMode ? "text-purple-400" : "text-purple-600",
                bg: isDarkMode ? "bg-purple-500/20" : "bg-purple-100",
                border: isDarkMode
                    ? "border-purple-500/30"
                    : "border-purple-200",
                accent: isDarkMode ? "text-purple-300" : "text-purple-500",
            },
            orange: {
                text: isDarkMode ? "text-orange-400" : "text-orange-600",
                bg: isDarkMode ? "bg-orange-500/20" : "bg-orange-100",
                border: isDarkMode
                    ? "border-orange-500/30"
                    : "border-orange-200",
                accent: isDarkMode ? "text-orange-300" : "text-orange-500",
            },
        };
        return colorMap[color]?.[type] || "";
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Your network insights";
        if (hour < 17) return "Your connection patterns";
        return "Your browsing network";
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

    return (
        <div
            className={`relative transition-all duration-500 ${
                isDarkMode ? "bg-slate-950" : "bg-gray-50"
            }`}
        >
            {/* Fixed Header - shows on scroll */}
            <div
                className={`fixed top-0 left-0 right-0 z-[10001] transition-all duration-300 ${
                    isGraphMode
                        ? "translate-y-0 opacity-100"
                        : "-translate-y-full opacity-0"
                }`}
            >
                <div
                    className={`flex justify-between items-center p-4 backdrop-blur-md border-b ${
                        isDarkMode
                            ? "bg-slate-950/95 border-slate-800"
                            : "bg-gray-50/95 border-gray-200"
                    }`}
                >
                    <button
                        onClick={() => {
                            window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className={`p-2.5 rounded-xl transition-all duration-200 hover:scale-105 backdrop-blur-sm border ${
                            isDarkMode
                                ? "bg-slate-800/50 text-slate-400 hover:bg-slate-800/70 border-slate-700/30"
                                : "bg-white/50 text-gray-600 hover:bg-white/70 border-gray-200/30"
                        }`}
                    >
                        <ArrowLeft size={16} />
                    </button>

                    {/* Search bar in header */}
                    <div className="flex-1 max-w-md mx-6">
                        <SearchBar
                            isDarkMode={isDarkMode}
                            searchQuery={searchQuery}
                            onSearchQueryChange={setSearchQuery}
                            onSearch={handleSearch}
                            placeholder={
                                searchType === "Insights"
                                    ? "Search network..."
                                    : "Search web..."
                            }
                            searchType={searchType}
                            onSearchTypeChange={setSearchType}
                            showTypeSelector={true}
                            isInitialLoad={false}
                            variant="compact"
                            animationDelay="0ms"
                        />
                    </div>
                </div>
            </div>

            {/* MAIN CONTAINER THAT SPANS EVERYTHING */}
            <div className="relative min-h-screen">
                {/* Floating Header Component */}
                <FloatingHeader
                    isDarkMode={isDarkMode}
                    onToggleDarkMode={onToggleDarkMode}
                    currentPage={currentPage}
                    onNavigate={onNavigate}
                    isInitialLoad={isInitialLoad}
                />

                {/* Main Content */}
                <div className="flex flex-col items-center justify-center min-h-screen px-6 -mt-16">
                    {/* Header */}
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
                            {analyticsData.loading
                                ? "..."
                                : currentMetric.value}
                        </div>

                        <div
                            className={`text-base transition-colors duration-500 ${
                                isDarkMode ? "text-slate-500" : "text-gray-500"
                            }`}
                        >
                            {currentMetric.label} - {currentMetric.description}
                        </div>
                    </div>

                    {/* Metric Pills */}
                    <div
                        className={`flex gap-3 mb-8 transition-all duration-700 ease-out ${
                            isInitialLoad
                                ? "opacity-0 translate-y-4"
                                : "opacity-100 translate-y-0"
                        }`}
                        style={{ animationDelay: "500ms" }}
                    >
                        {networkMetrics.map((metric, index) => (
                            <button
                                key={metric.label}
                                onClick={() => setActiveMetric(index)}
                                className={`px-4 py-2 rounded-xl transition-all duration-300 text-sm font-medium border ${
                                    activeMetric === index
                                        ? `${getColorClasses(
                                              metric.color,
                                              "bg",
                                          )} ${getColorClasses(
                                              metric.color,
                                              "text",
                                          )} ${getColorClasses(
                                              metric.color,
                                              "border",
                                          )} scale-105`
                                        : isDarkMode
                                        ? "bg-slate-800/40 text-slate-400 border-slate-700/30 hover:bg-slate-800/60"
                                        : "bg-white/50 text-gray-600 border-gray-200/30 hover:bg-white/70"
                                }`}
                            >
                                {metric.label}
                            </button>
                        ))}
                    </div>

                    {/* Search using SearchBar component */}
                    <SearchBar
                        isDarkMode={isDarkMode}
                        searchQuery={searchQuery}
                        onSearchQueryChange={setSearchQuery}
                        onSearch={handleSearch}
                        placeholder={
                            searchType === "Insights"
                                ? "Search nodes, analyze paths, or explore communities"
                                : "Search web or enter address"
                        }
                        searchType={searchType}
                        onSearchTypeChange={setSearchType}
                        showTypeSelector={true}
                        isInitialLoad={isInitialLoad}
                        variant="main"
                        animationDelay="600ms"
                    />

                    {/* Bottom Stats - Minimal, borderless design matching data page */}
                    <div
                        className={`w-full max-w-lg mb-8 transition-all duration-700 ease-out ${
                            isInitialLoad
                                ? "opacity-0 translate-y-4"
                                : "opacity-100 translate-y-0"
                        }`}
                        style={{ animationDelay: "700ms" }}
                    >
                        <div className="flex justify-between items-end">
                            <div className="text-center group cursor-pointer">
                                <div
                                    className={`text-3xl font-extralight mb-1 transition-colors duration-300 ${
                                        isDarkMode
                                            ? "text-slate-200 group-hover:text-blue-400"
                                            : "text-gray-900 group-hover:text-blue-600"
                                    }`}
                                    style={{
                                        fontVariantNumeric: "tabular-nums",
                                    }}
                                >
                                    {analyticsData.loading
                                        ? "..."
                                        : analyticsData.totalSites}
                                </div>
                                <div
                                    className={`text-xs font-medium uppercase tracking-wide transition-colors duration-300 ${
                                        isDarkMode
                                            ? "text-slate-500 group-hover:text-slate-400"
                                            : "text-gray-500 group-hover:text-gray-600"
                                    }`}
                                >
                                    Sites
                                </div>
                            </div>

                            <div className="text-center group cursor-pointer">
                                <div
                                    className={`text-3xl font-extralight mb-1 transition-colors duration-300 ${
                                        isDarkMode
                                            ? "text-emerald-400 group-hover:text-emerald-300"
                                            : "text-emerald-600 group-hover:text-emerald-700"
                                    }`}
                                    style={{
                                        fontVariantNumeric: "tabular-nums",
                                    }}
                                >
                                    {analyticsData.loading
                                        ? "..."
                                        : analyticsData.totalVisits}
                                </div>
                                <div
                                    className={`text-xs font-medium uppercase tracking-wide transition-colors duration-300 ${
                                        isDarkMode
                                            ? "text-slate-500 group-hover:text-slate-400"
                                            : "text-gray-500 group-hover:text-gray-600"
                                    }`}
                                >
                                    Visits
                                </div>
                            </div>

                            <div className="text-center group cursor-pointer">
                                <div
                                    className={`text-3xl font-extralight mb-1 transition-colors duration-300 ${
                                        isDarkMode
                                            ? "text-slate-200 group-hover:text-purple-400"
                                            : "text-gray-900 group-hover:text-purple-600"
                                    }`}
                                    style={{
                                        fontVariantNumeric: "tabular-nums",
                                    }}
                                >
                                    {analyticsData.loading
                                        ? "..."
                                        : `${analyticsData.activeHours}h`}
                                </div>
                                <div
                                    className={`text-xs font-medium uppercase tracking-wide transition-colors duration-300 ${
                                        isDarkMode
                                            ? "text-slate-500 group-hover:text-slate-400"
                                            : "text-gray-500 group-hover:text-gray-600"
                                    }`}
                                >
                                    Active Time
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* GraphVisualization - Fixed container to ensure proper centering */}
                <div
                    className={`w-full h-screen relative z-[9000] bg-transparent transition-all duration-700 ease-out ${
                        isInitialLoad
                            ? "opacity-0 translate-y-4"
                            : "opacity-100 translate-y-0"
                    }`}
                    style={{ animationDelay: "800ms" }}
                >
                    <GraphVisualization
                        orientation="horizontal"
                        isStandalone={true}
                        searchTerm={
                            searchType === "Insights" ? searchQuery : ""
                        }
                        onSearchResults={(count) => {
                            // Optional: show search results count
                            console.log(`Found ${count} results`);
                        }}
                        className="w-full h-full"
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                        }}
                    />
                </div>
            </div>

            {/* Global styles */}
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
                    overflow-x: hidden;
                    scroll-behavior: smooth;
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

export default NetworkLandingPage;
