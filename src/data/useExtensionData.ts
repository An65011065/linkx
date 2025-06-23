import { useEffect, useState } from "react";
import DataService from "./dataService";
import type { BrowsingSession, TabSession } from "./dataService";

interface ExtensionAnalytics {
    todayStats: BrowsingSession["stats"];
    weeklyAverage: {
        totalTime: number;
        workTime: number;
        socialTime: number;
    };
    topDomains: Array<{ domain: string; time: number; category: string }>;
    navigationPatterns: {
        hyperlinkRatio: number;
        averageSessionLength: number;
        multitaskingScore: number;
    };
    crossTabConnections: Array<{
        source: string;
        target: string;
        frequency: number;
    }>;
}

interface TimeEfficiencyAnalytics {
    activeVsDuration: {
        work: { active: number; total: number; efficiency: number };
        social: { active: number; total: number; efficiency: number };
        other: { active: number; total: number; efficiency: number };
    };
    overallEfficiency: number;
    backgroundTime: number;
}

interface DetailedVisitAnalytics {
    focusEfficiency: number;
    averageDwellTime: number;
    sessionDepth: number;
    navigationFlow: Array<{
        domain: string;
        leadsTo: Array<{ domain: string; count: number }>;
    }>;
}

export function useExtensionData() {
    const [currentSession, setCurrentSession] =
        useState<BrowsingSession | null>(null);
    const [recentTabs, setRecentTabs] = useState<TabSession[]>([]);
    const [analytics, setAnalytics] = useState<ExtensionAnalytics | null>(null);
    const [timeEfficiency, setTimeEfficiency] =
        useState<TimeEfficiencyAnalytics | null>(null);
    const [detailedAnalytics, setDetailedAnalytics] =
        useState<DetailedVisitAnalytics | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const dataService = DataService.getInstance();

    useEffect(() => {
        let mounted = true;

        const fetchData = async () => {
            try {
                setIsLoading(true);
                setError(null);

                const [
                    session,
                    tabs,
                    analyticsData,
                    efficiencyData,
                    detailedData,
                ] = await Promise.all([
                    dataService.getCurrentSession(),
                    dataService.getRecentTabSessions(),
                    dataService.getSessionAnalytics(),
                    dataService.getTimeEfficiencyAnalytics(),
                    dataService.getDetailedVisitAnalytics(),
                ]);

                if (mounted) {
                    setCurrentSession(session);
                    setRecentTabs(tabs);
                    setAnalytics(analyticsData);
                    setTimeEfficiency(efficiencyData);
                    setDetailedAnalytics(detailedData);
                }
            } catch (err) {
                if (mounted) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "An error occurred while fetching data",
                    );
                }
            } finally {
                if (mounted) {
                    setIsLoading(false);
                }
            }
        };

        fetchData();

        // Set up periodic refresh
        const refreshInterval = setInterval(fetchData, 30000); // Refresh every 30 seconds

        return () => {
            mounted = false;
            clearInterval(refreshInterval);
        };
    }, []);

    const refreshData = async () => {
        setIsLoading(true);
        try {
            const [session, tabs, analyticsData, efficiencyData, detailedData] =
                await Promise.all([
                    dataService.getCurrentSession(),
                    dataService.getRecentTabSessions(),
                    dataService.getSessionAnalytics(),
                    dataService.getTimeEfficiencyAnalytics(),
                    dataService.getDetailedVisitAnalytics(),
                ]);

            setCurrentSession(session);
            setRecentTabs(tabs);
            setAnalytics(analyticsData);
            setTimeEfficiency(efficiencyData);
            setDetailedAnalytics(detailedData);
            setError(null);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "An error occurred while refreshing data",
            );
        } finally {
            setIsLoading(false);
        }
    };

    return {
        currentSession,
        recentTabs,
        analytics,
        timeEfficiency,
        detailedAnalytics,
        isLoading,
        error,
        refreshData,
    };
}

// Utility function to format duration from milliseconds
export const formatDuration = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
        return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
    } else {
        return `${seconds}s`;
    }
};

// Utility function to format URLs for display
export const formatUrl = (url: string): string => {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname.replace(/^www\./, "");
    } catch {
        return url;
    }
};

// Get category breakdown as percentages
export const getCategoryBreakdown = (stats: BrowsingSession["stats"]) => {
    const { workTime, socialTime, otherTime, totalTime } = stats;

    if (totalTime === 0) {
        return { work: 0, social: 0, other: 0 };
    }

    return {
        work: Math.round((workTime / totalTime) * 100),
        social: Math.round((socialTime / totalTime) * 100),
        other: Math.round((otherTime / totalTime) * 100),
    };
};

// Get top domains with formatted data
export const getTopDomains = (
    analytics: ExtensionAnalytics | null,
    limit: number = 5,
) => {
    if (!analytics?.topDomains) return [];

    return analytics.topDomains.slice(0, limit).map((domain) => ({
        ...domain,
        formattedTime: formatDuration(domain.time),
        percentage:
            analytics.topDomains.length > 0
                ? Math.round((domain.time / analytics.topDomains[0].time) * 100)
                : 0,
    }));
};

// Get recent activity summary
export const getActivitySummary = (recentActivity: TabSession[]) => {
    const totalTabs = recentActivity.length;
    const totalUrls = recentActivity.reduce(
        (sum, tab) => sum + tab.urlVisits.length,
        0,
    );
    const totalActiveTime = recentActivity.reduce(
        (sum, tab) => sum + tab.totalActiveTime,
        0,
    );

    const categoryTimes = recentActivity.reduce(
        (acc, tab) => {
            tab.urlVisits.forEach((visit) => {
                acc[visit.category] += visit.activeTime;
            });
            return acc;
        },
        { work: 0, social: 0, other: 0 },
    );

    return {
        totalTabs,
        totalUrls,
        totalActiveTime,
        formattedActiveTime: formatDuration(totalActiveTime),
        categoryTimes: {
            work: formatDuration(categoryTimes.work),
            social: formatDuration(categoryTimes.social),
            other: formatDuration(categoryTimes.other),
        },
    };
};

// Get navigation insights
export const getNavigationInsights = (
    analytics: ExtensionAnalytics | null,
    detailedAnalytics: DetailedVisitAnalytics | null,
) => {
    if (!analytics || !detailedAnalytics) return [];

    const insights = [];

    // Hyperlink vs chain navigation
    if (analytics.navigationPatterns.hyperlinkRatio > 70) {
        insights.push(
            "High link-following behavior - focused research sessions",
        );
    } else if (analytics.navigationPatterns.hyperlinkRatio < 30) {
        insights.push("Mostly direct navigation - task-switching behavior");
    } else {
        insights.push("Balanced navigation between links and direct access");
    }

    // Multitasking analysis
    if (analytics.navigationPatterns.multitaskingScore > 60) {
        insights.push("High multitasking - many tabs active simultaneously");
    } else if (analytics.navigationPatterns.multitaskingScore < 30) {
        insights.push("Focused browsing - few tabs at a time");
    }

    // Session depth
    if (detailedAnalytics.sessionDepth > 5) {
        insights.push("Deep browsing sessions - thorough exploration");
    } else if (detailedAnalytics.sessionDepth < 3) {
        insights.push("Brief site visits - quick information gathering");
    }

    // Focus efficiency
    if (detailedAnalytics.focusEfficiency > 80) {
        insights.push("Excellent focus - minimal background browsing");
    } else if (detailedAnalytics.focusEfficiency < 50) {
        insights.push("Distracted browsing - many background tabs");
    }

    return insights;
};

// Get time comparison insights
export const getTimeInsights = (efficiency: TimeEfficiencyAnalytics | null) => {
    if (!efficiency) return null;

    const insights = [];
    const { work, social, other } = efficiency.activeVsDuration;

    // Work efficiency
    if (work.efficiency > 80) {
        insights.push("Highly focused work sessions");
    } else if (work.efficiency < 50) {
        insights.push("Work time includes significant background browsing");
    }

    // Social vs work comparison
    if (social.efficiency > work.efficiency) {
        insights.push("More focused on social content than work");
    }

    // Other category efficiency
    if (
        other.efficiency > work.efficiency &&
        other.efficiency > social.efficiency
    ) {
        insights.push("Most focused on non-work/non-social content");
    }

    // Overall efficiency
    if (efficiency.overallEfficiency > 75) {
        insights.push("Excellent overall focus and attention");
    } else if (efficiency.overallEfficiency < 50) {
        insights.push("Significant time spent with background tabs");
    }

    return {
        insights,
        backgroundTimeFormatted: formatDuration(efficiency.backgroundTime),
        efficiencyScore: efficiency.overallEfficiency,
    };
};

// Quick stats for popup/summary views
export const getQuickStats = (session: BrowsingSession | null) => {
    if (!session) {
        return {
            activeTime: "0m",
            sitesVisited: 0,
            topCategory: "none",
            sessionLength: "0m",
        };
    }

    const { stats } = session;
    const activeTime = formatDuration(stats.totalTime);
    const sitesVisited = stats.totalUrls;

    // Determine top category
    let topCategory = "other";
    if (stats.workTime > stats.socialTime && stats.workTime > stats.otherTime) {
        topCategory = "work";
    } else if (stats.socialTime > stats.otherTime) {
        topCategory = "social";
    }

    const sessionLength = formatDuration(session.endTime - session.startTime);

    return {
        activeTime,
        sitesVisited,
        topCategory,
        sessionLength,
    };
};

// Get channel-specific time data (in hours)
export const getChannelData = (session: BrowsingSession | null) => {
    if (!session) {
        return {
            gmail: 0,
            outlook: 0,
            youtube: 0,
            chatgpt: 0,
        };
    }

    const allVisits = session.tabSessions.flatMap((ts) => ts.urlVisits);
    const channelTimes = {
        gmail: 0,
        outlook: 0,
        youtube: 0,
        chatgpt: 0,
    };

    allVisits.forEach((visit) => {
        const domain = visit.domain.toLowerCase();
        const timeSpent = visit.activeTime; // Use activeTime (focused time)

        if (domain.includes("gmail") || domain.includes("mail.google")) {
            channelTimes.gmail += timeSpent;
        } else if (
            domain.includes("outlook") ||
            domain.includes("office.com") ||
            domain.includes("live.com")
        ) {
            channelTimes.outlook += timeSpent;
        } else if (domain.includes("youtube") || domain.includes("youtu.be")) {
            channelTimes.youtube += timeSpent;
        } else if (
            domain.includes("chatgpt") ||
            domain.includes("chat.openai") ||
            domain.includes("openai.com")
        ) {
            channelTimes.chatgpt += timeSpent;
        }
    });

    // Convert milliseconds to hours
    return {
        gmail: channelTimes.gmail / (1000 * 60 * 60),
        outlook: channelTimes.outlook / (1000 * 60 * 60),
        youtube: channelTimes.youtube / (1000 * 60 * 60),
        chatgpt: channelTimes.chatgpt / (1000 * 60 * 60),
    };
};

// Get channel-specific URL counts
export const getChannelUrlCounts = (session: BrowsingSession | null) => {
    if (!session) {
        return {
            gmail: 0,
            outlook: 0,
            youtube: 0,
            chatgpt: 0,
        };
    }

    const allVisits = session.tabSessions.flatMap((ts) => ts.urlVisits);
    const counts = {
        gmail: 0,
        outlook: 0,
        youtube: 0,
        chatgpt: 0,
    };

    allVisits.forEach((visit) => {
        const domain = visit.domain.toLowerCase();

        if (domain.includes("gmail") || domain.includes("mail.google")) {
            counts.gmail++;
        } else if (
            domain.includes("outlook") ||
            domain.includes("office.com") ||
            domain.includes("live.com")
        ) {
            counts.outlook++;
        } else if (domain.includes("youtube") || domain.includes("youtu.be")) {
            counts.youtube++;
        } else if (
            domain.includes("chatgpt") ||
            domain.includes("chat.openai") ||
            domain.includes("openai.com")
        ) {
            counts.chatgpt++;
        }
    });

    return counts;
};

// Get hourly activity data for charts
export const getHourlyActivityData = (session: BrowsingSession | null) => {
    if (!session) return [];

    const now = new Date();
    const hourlyData = [];

    // Generate 24 hours of data (current hour - 23 hours to current hour)
    for (let i = 23; i >= 0; i--) {
        const hourStart = new Date(now);
        hourStart.setHours(hourStart.getHours() - i, 0, 0, 0);
        const hourEnd = new Date(hourStart);
        hourEnd.setHours(hourEnd.getHours() + 1);

        let workTime = 0;
        let otherTime = 0; // Combined non-work time

        // Aggregate time for this hour from all tab sessions
        session.tabSessions.forEach((tabSession) => {
            tabSession.urlVisits.forEach((visit) => {
                const visitStart = new Date(visit.startTime);
                const visitEnd = visit.endTime
                    ? new Date(visit.endTime)
                    : new Date();

                // Check if visit overlaps with this hour
                if (visitStart < hourEnd && visitEnd > hourStart) {
                    const overlapStart =
                        visitStart > hourStart ? visitStart : hourStart;
                    const overlapEnd = visitEnd < hourEnd ? visitEnd : hourEnd;
                    const overlapDuration =
                        (overlapEnd.getTime() - overlapStart.getTime()) /
                        (1000 * 60 * 60); // in hours

                    if (visit.category === "work") {
                        workTime += overlapDuration;
                    } else {
                        // Combine both social and other into otherTime
                        otherTime += overlapDuration;
                    }
                }
            });
        });

        hourlyData.push({
            hour: hourStart.getHours(),
            date: hourStart,
            workTime: Math.max(0, workTime),
            otherTime: Math.max(0, otherTime),
        });
    }

    return hourlyData;
};
