import React, { useState, useEffect, useCallback } from "react";
import {
    Search,
    ArrowRight,
    Moon,
    Sun,
    ArrowLeft,
    TrendingUp,
    Zap,
    GitBranch,
    Target,
    Globe,
    Users,
    Activity,
    BarChart3,
    ChevronDown,
    RotateCcw,
    TrendingDown,
    Focus,
} from "lucide-react";
import GraphVisualization from "../graph/components/GraphVisualization";
import { useBrowsingAnalytics } from "../graph/components/GraphCanvas/hooks/useBrowsingAnalytics";

interface NetworkLandingPageProps {
    isDarkMode: boolean;
    onBack: (page: string) => void;
}

const NetworkLandingPage: React.FC<NetworkLandingPageProps> = ({
    isDarkMode,
    onBack,
}) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [activeMetric, setActiveMetric] = useState(0);
    const [isGraphMode, setIsGraphMode] = useState(false);
    const [scrollPosition, setScrollPosition] = useState(0);
    const [searchType, setSearchType] = useState("graph"); // "graph" or "google"
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Get real browsing analytics
    const {
        metrics,
        loading: analyticsLoading,
        error: analyticsError,
    } = useBrowsingAnalytics();

    // Real browsing metrics based on actual data
    const networkMetrics = [
        {
            label: "Return Rate",
            value: `${metrics.returnRate}%`,
            description: "Sites you revisit regularly",
            icon: RotateCcw,
            color: "emerald",
            trend: "+5%", // Could calculate this from historical data
        },
        {
            label: "Longest Chain",
            value: `${metrics.longestChain}`,
            description: "Deepest browsing rabbit hole",
            icon: GitBranch,
            color: "blue",
            trend: "New!",
        },
        {
            label: "Focus Score",
            value: `${metrics.focusEfficiency}%`,
            description: "Time spent actively browsing",
            icon: Focus,
            color: "purple",
            trend: `${metrics.focusEfficiency > 70 ? "+" : ""}${
                metrics.focusEfficiency - 65
            }%`,
        },
        {
            label: "Avg Depth",
            value: `${metrics.sessionDepth}`,
            description: "Average visits per session",
            icon: TrendingDown,
            color: "orange",
            trend: `${metrics.sessionDepth > 10 ? "+" : ""}${
                metrics.sessionDepth - 8
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
            setScrollPosition(scrollY);
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
            if (searchType === "google") {
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

    const getColorClasses = (color, type) => {
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

    return (
        <div
            className={`relative transition-all duration-500 ${
                isDarkMode
                    ? "bg-slate-950"
                    : "bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100"
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
                            : "bg-amber-50/95 border-amber-200"
                    }`}
                >
                    <button
                        onClick={() => {
                            window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className={`p-2.5 rounded-xl transition-all duration-200 hover:scale-105 backdrop-blur-sm border ${
                            isDarkMode
                                ? "bg-slate-800/50 text-slate-400 hover:bg-slate-800/70 border-slate-700/30"
                                : "bg-white/50 text-amber-600 hover:bg-white/70 border-amber-200/30"
                        }`}
                    >
                        <ArrowLeft size={16} />
                    </button>

                    {/* Search bar in header */}
                    <div className="flex-1 max-w-md mx-6">
                        <div
                            className={`flex items-center rounded-xl backdrop-blur-xl border transition-all duration-300 ${
                                isDarkMode
                                    ? "bg-slate-800/60 border-slate-700/40"
                                    : "bg-white/80 border-amber-200/50"
                            } ${isSearchFocused ? "scale-[1.02]" : ""}`}
                        >
                            <div className="flex items-center gap-3 px-4 py-2.5 flex-1">
                                <Search
                                    size={16}
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
                                    placeholder={
                                        searchType === "graph"
                                            ? "Search network..."
                                            : "Search web..."
                                    }
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                    onFocus={() => setIsSearchFocused(true)}
                                    onBlur={() => setIsSearchFocused(false)}
                                    onKeyPress={(e) =>
                                        e.key === "Enter" && handleSearch()
                                    }
                                    className={`flex-1 bg-transparent outline-none text-sm font-light ${
                                        isDarkMode
                                            ? "text-slate-200"
                                            : "text-amber-900"
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
                                        <ArrowRight size={16} />
                                    </button>
                                )}
                            </div>

                            {/* Search Type Dropdown */}
                            <div className="relative">
                                <button
                                    className={`flex items-center gap-2 px-3 py-2.5 text-sm font-medium capitalize rounded-r-xl border-l transition-all duration-200 ${
                                        isDarkMode
                                            ? "text-slate-300 border-slate-600 hover:bg-slate-700/50"
                                            : "text-amber-700 border-amber-300 hover:bg-amber-50"
                                    }`}
                                    onClick={() =>
                                        setIsDropdownOpen(!isDropdownOpen)
                                    }
                                >
                                    {searchType}
                                    <ChevronDown
                                        size={14}
                                        className={`transition-transform duration-200 ${
                                            isDropdownOpen ? "rotate-180" : ""
                                        }`}
                                    />
                                </button>

                                {isDropdownOpen && (
                                    <div
                                        className={`absolute right-0 top-full mt-1 w-24 rounded-lg border backdrop-blur-xl z-[10002] ${
                                            isDarkMode
                                                ? "bg-slate-800/90 border-slate-700/40"
                                                : "bg-white/90 border-amber-200/50"
                                        }`}
                                    >
                                        <button
                                            className={`w-full px-3 py-2 text-left text-sm capitalize rounded-t-lg transition-all duration-200 ${
                                                searchType === "graph"
                                                    ? isDarkMode
                                                        ? "bg-slate-700/50 text-slate-200"
                                                        : "bg-amber-100 text-amber-800"
                                                    : isDarkMode
                                                    ? "text-slate-300 hover:bg-slate-700/30"
                                                    : "text-amber-700 hover:bg-amber-50"
                                            }`}
                                            onClick={() => {
                                                setSearchType("graph");
                                                setIsDropdownOpen(false);
                                            }}
                                        >
                                            Graph
                                        </button>
                                        <button
                                            className={`w-full px-3 py-2 text-left text-sm capitalize rounded-b-lg transition-all duration-200 ${
                                                searchType === "google"
                                                    ? isDarkMode
                                                        ? "bg-slate-700/50 text-slate-200"
                                                        : "bg-amber-100 text-amber-800"
                                                    : isDarkMode
                                                    ? "text-slate-300 hover:bg-slate-700/30"
                                                    : "text-amber-700 hover:bg-amber-50"
                                            }`}
                                            onClick={() => {
                                                setSearchType("google");
                                                setIsDropdownOpen(false);
                                            }}
                                        >
                                            Google
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <button
                        className={`p-2.5 rounded-xl transition-all duration-200 hover:scale-105 backdrop-blur-sm border ${
                            isDarkMode
                                ? "bg-slate-800/50 text-slate-400 hover:bg-slate-800/70 border-slate-700/30"
                                : "bg-white/50 text-amber-600 hover:bg-white/70 border-amber-200/30"
                        }`}
                    >
                        {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
                    </button>
                </div>
            </div>

            {/* MAIN CONTAINER THAT SPANS EVERYTHING */}
            <div className="relative min-h-screen">
                {/* Landing Page Header - static */}
                <div className="flex justify-between items-center p-6">
                    <div
                        className={`flex items-center gap-1 p-1 rounded-xl backdrop-blur-sm border ${
                            isDarkMode
                                ? "bg-slate-800/40 border-slate-700/30"
                                : "bg-white/50 border-amber-200/30"
                        }`}
                    >
                        <button
                            onClick={() => onBack("main")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                                isDarkMode
                                    ? "text-slate-400 hover:text-slate-300"
                                    : "text-amber-600 hover:text-amber-700"
                            }`}
                        >
                            Home
                        </button>
                        <button
                            onClick={() => onBack("data")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                                isDarkMode
                                    ? "text-slate-400 hover:text-slate-300"
                                    : "text-amber-600 hover:text-amber-700"
                            }`}
                        >
                            Data
                        </button>
                        <button
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                                isDarkMode
                                    ? "bg-slate-700/60 text-slate-200"
                                    : "bg-amber-100/60 text-amber-800"
                            }`}
                        >
                            Network
                        </button>
                    </div>

                    <button
                        className={`p-2.5 rounded-xl transition-all duration-200 hover:scale-105 backdrop-blur-sm border ${
                            isDarkMode
                                ? "bg-slate-800/50 text-slate-400 hover:bg-slate-800/70 border-slate-700/30"
                                : "bg-white/50 text-amber-600 hover:bg-white/70 border-amber-200/30"
                        }`}
                    >
                        {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
                    </button>
                </div>

                {/* Main Content */}
                <div className="flex flex-col items-center px-6">
                    {/* Header */}
                    <div className="text-center mb-6 animate-in fade-in duration-800">
                        <h1
                            className={`text-4xl font-extralight mb-2 tracking-tight animate-in slide-in-from-top-4 duration-600 delay-200 ${
                                isDarkMode ? "text-slate-200" : "text-amber-900"
                            }`}
                        >
                            Network Intelligence
                        </h1>
                        <p
                            className={`text-base animate-in fade-in duration-500 delay-400 ${
                                isDarkMode ? "text-slate-400" : "text-amber-600"
                            }`}
                        >
                            {analyticsLoading
                                ? "Loading browsing patterns..."
                                : analyticsError
                                ? "Error loading data"
                                : "Real-time analysis of your browsing patterns"}
                        </p>
                    </div>

                    {/* Featured Metric - Large Display */}
                    <div className="mb-8 text-center animate-in zoom-in duration-700 delay-500">
                        <div className="flex items-center justify-center gap-4 mb-3">
                            <div
                                className={`p-3 rounded-2xl ${getColorClasses(
                                    currentMetric.color,
                                    "bg",
                                )} border ${getColorClasses(
                                    currentMetric.color,
                                    "border",
                                )}`}
                            >
                                <currentMetric.icon
                                    size={24}
                                    className={getColorClasses(
                                        currentMetric.color,
                                        "text",
                                    )}
                                />
                            </div>
                            <div className="text-left">
                                <div
                                    className={`text-6xl font-extralight tracking-tight ${getColorClasses(
                                        currentMetric.color,
                                        "text",
                                    )}`}
                                    style={{
                                        fontVariantNumeric: "tabular-nums",
                                    }}
                                >
                                    {analyticsLoading
                                        ? "..."
                                        : currentMetric.value}
                                </div>
                                <div
                                    className={`text-sm font-medium uppercase tracking-wide ${
                                        isDarkMode
                                            ? "text-slate-400"
                                            : "text-amber-600"
                                    }`}
                                >
                                    {currentMetric.label}
                                </div>
                            </div>
                            <div className="text-left ml-2">
                                <div
                                    className={`text-lg font-medium ${getColorClasses(
                                        currentMetric.color,
                                        "accent",
                                    )}`}
                                >
                                    {analyticsLoading
                                        ? "..."
                                        : currentMetric.trend}
                                </div>
                                <div
                                    className={`text-xs ${
                                        isDarkMode
                                            ? "text-slate-500"
                                            : "text-amber-500"
                                    }`}
                                >
                                    24h change
                                </div>
                            </div>
                        </div>
                        <p
                            className={`text-sm max-w-sm ${
                                isDarkMode ? "text-slate-400" : "text-amber-600"
                            }`}
                        >
                            {currentMetric.description}
                        </p>
                    </div>

                    {/* Metric Pills */}
                    <div className="flex gap-3 mb-8 animate-in fade-in duration-600 delay-700">
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
                                        : "bg-white/50 text-amber-600 border-amber-200/30 hover:bg-white/70"
                                }`}
                            >
                                {metric.label}
                            </button>
                        ))}
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="w-full max-w-4xl mb-8 animate-in fade-in duration-600 delay-800">
                        <div className="grid grid-cols-3 gap-4">
                            <div
                                className={`text-center p-4 rounded-xl backdrop-blur-xl border transition-all duration-200 hover:scale-105 ${
                                    isDarkMode
                                        ? "bg-slate-800/40 border-slate-700/30"
                                        : "bg-white/50 border-amber-200/30"
                                }`}
                            >
                                <Globe
                                    size={20}
                                    className={`mx-auto mb-2 ${
                                        isDarkMode
                                            ? "text-blue-400"
                                            : "text-blue-600"
                                    }`}
                                />
                                <div
                                    className={`text-2xl font-light mb-1 ${
                                        isDarkMode
                                            ? "text-slate-200"
                                            : "text-amber-900"
                                    }`}
                                >
                                    {analyticsLoading
                                        ? "..."
                                        : metrics.totalSites}
                                </div>
                                <div
                                    className={`text-xs font-medium ${
                                        isDarkMode
                                            ? "text-slate-400"
                                            : "text-amber-600"
                                    }`}
                                >
                                    Sites
                                </div>
                            </div>
                            <div
                                className={`text-center p-4 rounded-xl backdrop-blur-xl border transition-all duration-200 hover:scale-105 ${
                                    isDarkMode
                                        ? "bg-slate-800/40 border-slate-700/30"
                                        : "bg-white/50 border-amber-200/30"
                                }`}
                            >
                                <Activity
                                    size={20}
                                    className={`mx-auto mb-2 ${
                                        isDarkMode
                                            ? "text-emerald-400"
                                            : "text-emerald-600"
                                    }`}
                                />
                                <div
                                    className={`text-2xl font-light mb-1 ${
                                        isDarkMode
                                            ? "text-slate-200"
                                            : "text-amber-900"
                                    }`}
                                >
                                    {analyticsLoading
                                        ? "..."
                                        : metrics.totalVisits}
                                </div>
                                <div
                                    className={`text-xs font-medium ${
                                        isDarkMode
                                            ? "text-slate-400"
                                            : "text-amber-600"
                                    }`}
                                >
                                    Visits
                                </div>
                            </div>
                            <div
                                className={`text-center p-4 rounded-xl backdrop-blur-xl border transition-all duration-200 hover:scale-105 ${
                                    isDarkMode
                                        ? "bg-slate-800/40 border-slate-700/30"
                                        : "bg-white/50 border-amber-200/30"
                                }`}
                            >
                                <BarChart3
                                    size={20}
                                    className={`mx-auto mb-2 ${
                                        isDarkMode
                                            ? "text-orange-400"
                                            : "text-orange-600"
                                    }`}
                                />
                                <div
                                    className={`text-2xl font-light mb-1 ${
                                        isDarkMode
                                            ? "text-slate-200"
                                            : "text-amber-900"
                                    }`}
                                >
                                    {analyticsLoading
                                        ? "..."
                                        : `${metrics.activeHours}h`}
                                </div>
                                <div
                                    className={`text-xs font-medium ${
                                        isDarkMode
                                            ? "text-slate-400"
                                            : "text-amber-600"
                                    }`}
                                >
                                    Active Time
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* STICKY SEARCH BAR - NOW AT THE TOP LEVEL */}
                <div className="sticky top-6 z-[10005] flex justify-center px-6 mb-16">
                    {/* Add a background spacer that reserves space */}
                    <div className="absolute inset-0 -inset-x-8 -inset-y-4"></div>
                    <div className="w-full max-w-2xl animate-in slide-in-from-bottom-4 duration-600 delay-900 relative">
                        {/* Add a backdrop div that extends beyond the search bar */}
                        <div
                            className={`absolute inset-0 -inset-x-8 -inset-y-4 rounded-3xl backdrop-blur-xl ${
                                isDarkMode
                                    ? "bg-slate-950/90"
                                    : "bg-amber-50/90"
                            }`}
                            style={{ zIndex: -1 }}
                        />
                        <div
                            className={`relative flex items-center rounded-2xl shadow-xl transition-all duration-300 border ${
                                isDarkMode
                                    ? "bg-slate-800/95 border-slate-700/40"
                                    : "bg-white/95 border-amber-200/50"
                            } ${
                                isSearchFocused ? "scale-[1.02] shadow-2xl" : ""
                            }`}
                        >
                            <div className="flex items-center gap-4 px-6 py-4 flex-1">
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
                                    placeholder={
                                        searchType === "graph"
                                            ? "Search nodes, analyze paths, or explore communities"
                                            : "Search web or enter address"
                                    }
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                    onFocus={() => setIsSearchFocused(true)}
                                    onBlur={() => setIsSearchFocused(false)}
                                    onKeyPress={(e) =>
                                        e.key === "Enter" && handleSearch()
                                    }
                                    className={`flex-1 bg-transparent outline-none text-lg font-light ${
                                        isDarkMode
                                            ? "text-slate-200"
                                            : "text-amber-900"
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

                            {/* Search Type Dropdown */}
                            <div className="relative">
                                <button
                                    className={`flex items-center gap-2 px-5 py-4 text-sm font-medium capitalize rounded-r-2xl border-l transition-all duration-200 ${
                                        isDarkMode
                                            ? "text-slate-300 border-slate-600 hover:bg-slate-700/50"
                                            : "text-amber-700 border-amber-300 hover:bg-amber-50"
                                    }`}
                                    onClick={() =>
                                        setIsDropdownOpen(!isDropdownOpen)
                                    }
                                >
                                    {searchType}
                                    <ChevronDown
                                        size={14}
                                        className={`transition-transform duration-200 ${
                                            isDropdownOpen ? "rotate-180" : ""
                                        }`}
                                    />
                                </button>

                                {isDropdownOpen && (
                                    <div
                                        className={`absolute right-0 top-full mt-2 w-28 rounded-lg border backdrop-blur-xl z-[10002] shadow-xl ${
                                            isDarkMode
                                                ? "bg-slate-800/90 border-slate-700/40"
                                                : "bg-white/90 border-amber-200/50"
                                        }`}
                                    >
                                        <button
                                            className={`w-full px-4 py-3 text-left text-sm capitalize rounded-t-lg transition-all duration-200 ${
                                                searchType === "graph"
                                                    ? isDarkMode
                                                        ? "bg-slate-700/50 text-slate-200"
                                                        : "bg-amber-100 text-amber-800"
                                                    : isDarkMode
                                                    ? "text-slate-300 hover:bg-slate-700/30"
                                                    : "text-amber-700 hover:bg-amber-50"
                                            }`}
                                            onClick={() => {
                                                setSearchType("graph");
                                                setIsDropdownOpen(false);
                                            }}
                                        >
                                            Graph
                                        </button>
                                        <button
                                            className={`w-full px-4 py-3 text-left text-sm capitalize rounded-b-lg transition-all duration-200 ${
                                                searchType === "google"
                                                    ? isDarkMode
                                                        ? "bg-slate-700/50 text-slate-200"
                                                        : "bg-amber-100 text-amber-800"
                                                    : isDarkMode
                                                    ? "text-slate-300 hover:bg-slate-700/30"
                                                    : "text-amber-700 hover:bg-amber-50"
                                            }`}
                                            onClick={() => {
                                                setSearchType("google");
                                                setIsDropdownOpen(false);
                                            }}
                                        >
                                            Google
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* GraphVisualization - Fixed container to ensure proper centering */}
                <div className="w-full h-screen relative z-[9000] bg-transparent">
                    <GraphVisualization
                        orientation="horizontal"
                        isStandalone={true}
                        searchTerm={searchType === "graph" ? searchQuery : ""}
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

            <style>{`
                * {
                    margin: 0;
                    padding: 0;
                }
                
                html, body {
                    height: 100%;
                    overflow-x: hidden;
                    scroll-behavior: smooth;
                }
                
                input::placeholder {
                    color: ${
                        isDarkMode
                            ? "rgba(148, 163, 184, 0.5)"
                            : "rgba(217, 119, 6, 0.5)"
                    };
                    font-weight: 300;
                }
            `}</style>
        </div>
    );
};

export default NetworkLandingPage;
