import React, { useState, useEffect, useCallback } from "react";
import { GitBranch, RotateCcw, TrendingDown, Focus } from "lucide-react";
import SearchBar from "./searchbar";
import FloatingHeader from "./FloatingHeader";
import GraphVisualization from "../graph/components/GraphVisualization";
import DataService from "../data/dataService";
import type { BrowsingSession } from "../data/dataService";
import { useNetworkData } from "../graph/hooks/useNetworkData";

interface NetworkLandingPageProps {
    isDarkMode: boolean;
    onToggleDarkMode: () => void;
    currentPage: "main" | "data" | "network" | "maintab";
    onNavigate: (page: "main" | "data" | "network" | "maintab") => void;
    onSunlitAnimationToggle: (show: boolean) => void;
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
    onSunlitAnimationToggle,
}) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [searchType, setSearchType] = useState<
        "Search" | "Insights" | "Network"
    >("Search");

    // Handle sunlit animation when Insights is selected
    const handleSearchTypeChange = (type: "Search" | "Insights" | "Network") => {
        setSearchType(type);
        onSunlitAnimationToggle(type === "Insights");
    };
    const [activeMetric, setActiveMetric] = useState(0);
    const [isGraphMode, setIsGraphMode] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

    // Get network data for search suggestions
    const { nodes: networkNodes } = useNetworkData();

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

    // Load real data
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

                const totalVisits = currentSession.tabSessions.reduce(
                    (total, tab) => total + tab.urlVisits.length,
                    0,
                );
                const activeHours =
                    Math.round(
                        (currentSession.stats.totalTime / (1000 * 60 * 60)) *
                            10,
                    ) / 10;

                // Calculate return rate
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

    // Network metrics
    const networkMetrics = [
        {
            label: "Return Rate",
            value: `${analyticsData.returnRate}%`,
            description: "Sites you revisit regularly",
            icon: RotateCcw,
            color: "emerald",
        },
        {
            label: "Longest Chain",
            value: `${analyticsData.longestChain}`,
            description: "Deepest browsing rabbit hole",
            icon: GitBranch,
            color: "blue",
        },
        {
            label: "Focus Score",
            value: `${analyticsData.focusEfficiency}%`,
            description: "Time spent actively browsing",
            icon: Focus,
            color: "purple",
        },
        {
            label: "Avg Depth",
            value: `${analyticsData.sessionDepth}`,
            description: "Average visits per session",
            icon: TrendingDown,
            color: "orange",
        },
    ];
    const currentMetric = networkMetrics[activeMetric];

    // Auto-rotate metrics
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveMetric((prev) => (prev + 1) % networkMetrics.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    // Scroll handler for sticky SearchBar - once activated, stays active
    useEffect(() => {
        const handleScroll = () => {
            const scrollY = window.scrollY;
            const triggerPoint = window.innerHeight * 0.3; // Trigger at 30% scroll

            // Once we reach the trigger point, keep it active (don't turn off)
            if (scrollY > triggerPoint && !isGraphMode) {
                setIsGraphMode(true);
            }
            // Only turn off if we scroll back to the very top
            else if (scrollY < 100 && isGraphMode) {
                setIsGraphMode(false);
            }
        };
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, [isGraphMode]);

    // Handlers
    const handleGraphSearch = useCallback((searchTerm: string) => {
        setSearchQuery(searchTerm);
    }, []);

    const truncateTitle = (title: string, maxLength: number = 40) => {
        if (title.length <= maxLength) return title;
        return title.substring(0, maxLength).trim() + '...';
    };

    const handleNetworkUrlSelect = (url: string, nodeId: string) => {
        console.log('🔗 Network URL selected:', url, nodeId);
        setSelectedNodeId(nodeId);
        // Find the node to get its title instead of just the domain
        const selectedNode = networkNodes?.find(node => node.id === nodeId);
        const displayText = selectedNode?.title || new URL(url).hostname;
        const truncatedTitle = truncateTitle(displayText);
        setSearchQuery(truncatedTitle);
        // Auto-scroll to graph section when a network URL is selected
        scrollToGraph();
    };

    const scrollToGraph = useCallback(() => {
        console.log('🔽 Scroll to graph triggered');
        const graphElement = document.querySelector('[data-graph-section]') as HTMLElement;
        if (graphElement) {
            console.log('📍 Graph element found, scrolling...');
            graphElement.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start'
            });
        } else {
            console.log('❌ Graph element not found, using fallback');
            window.scrollTo({ 
                top: window.innerHeight, 
                behavior: 'smooth' 
            });
        }
    }, []);

    const handleSearch = () => {
        console.log('🔍 Search triggered:', searchQuery, 'Type:', searchType);
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
            } else if (searchType === "Insights") {
                console.log('📊 Insights search - triggering scroll');
                handleGraphSearch(searchQuery);
                scrollToGraph();
            } else if (searchType === "Network") {
                console.log('🌐 Network search - triggering scroll');
                handleGraphSearch(searchQuery);
                scrollToGraph();
            }
        }
    };

    const getColorClasses = (color: string) => {
        const colorMap = {
            emerald: isDarkMode
                ? "text-emerald-400 bg-emerald-500/20 border-emerald-500/30"
                : "text-emerald-600 bg-emerald-100 border-emerald-200",
            blue: isDarkMode
                ? "text-blue-400 bg-blue-500/20 border-blue-500/30"
                : "text-blue-600 bg-blue-100 border-blue-200",
            purple: isDarkMode
                ? "text-purple-400 bg-purple-500/20 border-purple-500/30"
                : "text-purple-600 bg-purple-100 border-purple-200",
            orange: isDarkMode
                ? "text-orange-400 bg-orange-500/20 border-orange-500/30"
                : "text-orange-600 bg-orange-100 border-orange-200",
        };
        return colorMap[color] || "";
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Your network insights";
        if (hour < 17) return "Your connection patterns";
        return "Your browsing network";
    };

    // Loading state
    if (analyticsData.loading) {
        return (
            <div
                className={`min-h-screen flex items-center justify-center ${
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
            className={`relative ${isDarkMode ? "bg-slate-950" : "bg-gray-50"}`}
            style={{
                zIndex: 1,
                backgroundColor: searchType === "Insights" ? "transparent" : (isDarkMode ? "#0f172a" : "#f9fafb")
            }}
        >
            {/* Floating Header */}
            <FloatingHeader
                isDarkMode={isDarkMode}
                onToggleDarkMode={onToggleDarkMode}
                currentPage={currentPage}
                onNavigate={onNavigate}
                isInitialLoad={isInitialLoad}
            />

            {/* Main Content */}
            <div className="min-h-screen flex flex-col items-center justify-center px-6 -mt-16">
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
                        className={`text-xl font-light mb-6 ${
                            isDarkMode ? "text-slate-400" : "text-gray-600"
                        }`}
                    >
                        {getGreeting()}
                    </h1>
                    <div
                        className={`text-7xl font-extralight tracking-tight mb-2 ${
                            isDarkMode ? "text-slate-200" : "text-gray-900"
                        }`}
                        style={{
                            fontVariantNumeric: "tabular-nums",
                            textShadow: isDarkMode
                                ? "0 0 20px rgba(148, 163, 184, 0.1)"
                                : "0 0 20px rgba(0, 0, 0, 0.05)",
                        }}
                    >
                        {currentMetric.value}
                    </div>
                    <div
                        className={`text-base ${
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

                {/* SearchBar - Sticky when scrolling */}
                <div
                    className={`sticky top-0 z-[10000] w-full max-w-2xl transition-all duration-300 ${
                        isGraphMode
                            ? `backdrop-blur-md border-b py-4 ${
                                  isDarkMode
                                      ? "bg-slate-950/95 border-slate-800"
                                      : "bg-gray-50/95 border-gray-200"
                              }`
                            : "bg-transparent"
                    }`}
                >
                    <SearchBar
                        isDarkMode={isDarkMode}
                        searchQuery={searchQuery}
                        onSearchQueryChange={setSearchQuery}
                        onSearch={handleSearch}
                        placeholder={
                            searchType === "Network"
                                ? "Search for any website from your browsing history..."
                                : searchType === "Insights"
                                ? "Search nodes, analyze paths, or explore communities"
                                : "Search web or enter address"
                        }
                        searchType={searchType}
                        onSearchTypeChange={handleSearchTypeChange}
                        showTypeSelector={true}
                        isInitialLoad={isInitialLoad}
                        variant="main"
                        animationDelay="600ms"
                        isNetworkPage={true}
                        networkNodes={networkNodes || []}
                        onNetworkUrlSelect={handleNetworkUrlSelect}
                    />
                </div>

                {/* Bottom Stats */}
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
                                style={{ fontVariantNumeric: "tabular-nums" }}
                            >
                                {analyticsData.totalSites}
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
                                style={{ fontVariantNumeric: "tabular-nums" }}
                            >
                                {analyticsData.totalVisits}
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
                                style={{ fontVariantNumeric: "tabular-nums" }}
                            >
                                {analyticsData.activeHours}h
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

            {/* GraphVisualization */}
            <div
                data-graph-section
                className={`w-full h-screen relative z-[9000] transition-all duration-700 ease-out ${
                    isInitialLoad
                        ? "opacity-0 translate-y-4"
                        : "opacity-100 translate-y-0"
                }`}
                style={{ animationDelay: "800ms" }}
            >
                <GraphVisualization
                    orientation="horizontal"
                    isStandalone={true}
                    searchTerm={searchQuery}
                    selectedNodeId={selectedNodeId}
                    onSearchResults={(count) =>
                        console.log(`Found ${count} results`)
                    }
                    onSearchChange={(term) => {
                        setSearchQuery(term);
                        setSearchType("Insights");
                        // Auto-scroll when search changes in the graph
                        if (term.trim()) {
                            scrollToGraph();
                        }
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

            {/* Global styles */}
            <style>{`
                * { margin: 0; padding: 0; box-sizing: border-box; }
                html, body { 
                    height: 100%; 
                    overflow-x: hidden; 
                    scroll-behavior: smooth;
                    /* Disable browser zoom */
                    touch-action: pan-x pan-y;
                    -ms-touch-action: pan-x pan-y;
                }
                
                /* Disable zoom on double tap and pinch */
                * {
                    -webkit-touch-callout: none;
                    -webkit-user-select: none;
                    -khtml-user-select: none;
                    -moz-user-select: none;
                    -ms-user-select: none;
                    user-select: none;
                    -webkit-tap-highlight-color: transparent;
                }
                
                /* Re-enable text selection for inputs and text elements */
                input, textarea, [contenteditable] {
                    -webkit-user-select: text;
                    -khtml-user-select: text;
                    -moz-user-select: text;
                    -ms-user-select: text;
                    user-select: text;
                }
                
                /* Prevent zoom on input focus (iOS Safari) */
                input, select, textarea {
                    font-size: 16px !important;
                }
                
                input::placeholder { color: ${
                    isDarkMode
                        ? "rgba(148, 163, 184, 0.5)"
                        : "rgba(107, 114, 128, 0.5)"
                }; }
                ::-webkit-scrollbar { width: 6px; }
                ::-webkit-scrollbar-track { background: ${
                    isDarkMode ? "#1e293b" : "#f1f5f9"
                }; }
                ::-webkit-scrollbar-thumb { background: ${
                    isDarkMode ? "#475569" : "#cbd5e1"
                }; border-radius: 3px; }
                ::-webkit-scrollbar-thumb:hover { background: ${
                    isDarkMode ? "#64748b" : "#94a3b8"
                }; }
            `}</style>
        </div>
    );
};

export default NetworkLandingPage;
