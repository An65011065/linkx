import { useEffect, useState, useMemo } from "react";
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

// New interfaces for StoryCard optimizations
interface DomainStats {
    count: number;
    favicon: string;
}

interface FocusStreak {
    time: number;
    startTime: number;
    domains: Map<string, DomainStats>;
    urls: string[];
}

interface SleepPatterns {
    lastActivityTime: number;
    firstActivityTime: number;
    estimatedSleepHours: number;
    lateNightActivity: boolean;
}

interface BreakInfo {
    start: number;
    end: number;
    duration: number;
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

    // Memoized calculations for StoryCard components
    const storyCardData = useMemo(() => {
        if (!currentSession) {
            return {
                topDomains: [],
                longestStreak: {
                    time: 0,
                    startTime: 0,
                    domains: new Map(),
                    urls: [],
                },
                longestBreak: { start: 0, end: 0, duration: 0 },
                sleepPatterns: {
                    lastActivityTime: 0,
                    firstActivityTime: 0,
                    estimatedSleepHours: 0,
                    lateNightActivity: false,
                },
                wellnessScore: 0,
            };
        }

        // Calculate top domains (from StoryCard)
        const getTopDomains = () => {
            const domainTimes: Record<string, number> = {};
            currentSession.tabSessions.forEach((tab) => {
                tab.urlVisits.forEach((visit) => {
                    domainTimes[visit.domain] =
                        (domainTimes[visit.domain] || 0) + visit.activeTime;
                });
            });
            return Object.entries(domainTimes)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 12)
                .map(([domain, time]) => ({ domain, time }));
        };

        // Calculate longest focus streak (from StoryCard)
        const getLongestStreak = (): FocusStreak => {
            const allVisits = currentSession.tabSessions
                .flatMap((tab) => tab.urlVisits)
                .filter((visit) => visit.activeTime > 0)
                .sort((a, b) => a.startTime - b.startTime);

            if (allVisits.length === 0) {
                return { time: 0, startTime: 0, domains: new Map(), urls: [] };
            }

            const MAX_GAP_BETWEEN_SESSIONS = 10 * 60 * 1000;
            let longestStreak: FocusStreak = {
                time: 0,
                startTime: 0,
                domains: new Map(),
                urls: [],
            };
            let currentStreak: FocusStreak = {
                time: 0,
                startTime: 0,
                domains: new Map(),
                urls: [],
            };
            let lastVisitEnd = 0;

            allVisits.forEach((visit) => {
                const gapFromLastVisit = visit.startTime - lastVisitEnd;
                const visitEnd = visit.startTime + visit.activeTime;

                if (gapFromLastVisit <= MAX_GAP_BETWEEN_SESSIONS) {
                    currentStreak.time += visit.activeTime;
                    const domainCount = currentStreak.domains.get(
                        visit.domain,
                    ) || {
                        count: 0,
                        favicon: `https://www.google.com/s2/favicons?domain=${visit.domain}&sz=32`,
                    };
                    domainCount.count++;
                    currentStreak.domains.set(visit.domain, domainCount);
                    currentStreak.urls.push(visit.url);
                } else {
                    if (currentStreak.time > longestStreak.time) {
                        longestStreak = {
                            time: currentStreak.time,
                            startTime: currentStreak.startTime,
                            domains: new Map(currentStreak.domains),
                            urls: [...currentStreak.urls],
                        };
                    }
                    currentStreak = {
                        time: visit.activeTime,
                        startTime: visit.startTime,
                        domains: new Map([
                            [
                                visit.domain,
                                {
                                    count: 1,
                                    favicon: `https://www.google.com/s2/favicons?domain=${visit.domain}&sz=32`,
                                },
                            ],
                        ]),
                        urls: [visit.url],
                    };
                }
                lastVisitEnd = visitEnd;
            });

            if (currentStreak.time > longestStreak.time) {
                longestStreak = {
                    time: currentStreak.time,
                    startTime: currentStreak.startTime,
                    domains: new Map(currentStreak.domains),
                    urls: [...currentStreak.urls],
                };
            }

            return longestStreak;
        };

        // Calculate longest break (from StoryCard)
        const getLongestBreak = (): BreakInfo => {
            interface TimeRange {
                start: number;
                end: number;
            }

            const allVisits: TimeRange[] = currentSession.tabSessions
                .flatMap((tab) => tab.urlVisits)
                .filter((visit) => visit.activeTime > 0)
                .map((visit) => ({
                    start: visit.startTime,
                    end: visit.endTime || visit.startTime + visit.activeTime,
                }))
                .sort((a, b) => a.start - b.start);

            if (allVisits.length === 0) {
                return { start: 0, end: 0, duration: 0 };
            }

            const now = Date.now();
            const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;
            const recentVisits: TimeRange[] = allVisits.filter(
                (visit) => visit.end > twentyFourHoursAgo && visit.start < now,
            );

            if (recentVisits.length === 0) {
                return { start: 0, end: 0, duration: 0 };
            }

            const SAME_SESSION_GAP = 10 * 60 * 1000;
            const sessions: TimeRange[] = [];
            let activeSession: TimeRange = { ...recentVisits[0] };

            for (let i = 1; i < recentVisits.length; i++) {
                const visit = recentVisits[i];
                if (visit.start <= activeSession.end + SAME_SESSION_GAP) {
                    activeSession.end = Math.max(activeSession.end, visit.end);
                } else {
                    sessions.push(activeSession);
                    activeSession = { ...visit };
                }
            }
            sessions.push(activeSession);

            let longestBreak: BreakInfo = { start: 0, end: 0, duration: 0 };

            for (let i = 0; i < sessions.length - 1; i++) {
                const session = sessions[i];
                const nextSession = sessions[i + 1];
                const breakDuration = nextSession.start - session.end;

                if (
                    breakDuration > SAME_SESSION_GAP &&
                    breakDuration > longestBreak.duration
                ) {
                    longestBreak = {
                        start: session.end,
                        end: nextSession.start,
                        duration: breakDuration,
                    };
                }
            }

            return longestBreak;
        };

        // Analyze sleep patterns (from StoryCard)
        const analyzeSleepPatterns = (): SleepPatterns => {
            const allVisits = currentSession.tabSessions
                .flatMap((tab) => tab.urlVisits)
                .filter((visit) => visit.activeTime > 0)
                .sort((a, b) => a.startTime - b.startTime);

            if (allVisits.length === 0) {
                return {
                    lastActivityTime: 0,
                    firstActivityTime: 0,
                    estimatedSleepHours: 0,
                    lateNightActivity: false,
                };
            }

            const today = new Date();
            const todayStart = new Date(
                today.getFullYear(),
                today.getMonth(),
                today.getDate(),
            );

            let lastActivityTime = 0;
            allVisits.forEach((visit) => {
                const visitEndTime =
                    visit.endTime || visit.startTime + visit.activeTime;
                if (visitEndTime > lastActivityTime) {
                    lastActivityTime = visitEndTime;
                }
            });

            const todayVisits = allVisits.filter(
                (visit) => visit.startTime >= todayStart.getTime(),
            );
            const firstActivityTime =
                todayVisits.length > 0
                    ? todayVisits[0].startTime
                    : todayStart.getTime();

            const lastActivityDate = new Date(lastActivityTime);
            let estimatedSleepHours = 0;
            if (lastActivityDate.getDate() === today.getDate()) {
                const bedTime = Math.max(
                    lastActivityTime,
                    todayStart.getTime(),
                );
                estimatedSleepHours = Math.max(
                    0,
                    (firstActivityTime - bedTime) / (1000 * 60 * 60),
                );
            } else {
                estimatedSleepHours = Math.max(
                    0,
                    (firstActivityTime - lastActivityTime) / (1000 * 60 * 60),
                );
            }

            const lateNightActivity = allVisits.some((visit) => {
                const visitDate = new Date(visit.startTime);
                const hour = visitDate.getHours();
                return hour >= 0 && hour < 5;
            });

            return {
                lastActivityTime,
                firstActivityTime,
                estimatedSleepHours: Math.min(estimatedSleepHours, 12),
                lateNightActivity,
            };
        };

        // Calculate wellness score
        const calculateWellnessScore = (): number => {
            const baseScore =
                dataService.calculateDigitalWellnessScore(currentSession);
            const sleepData = analyzeSleepPatterns();
            let sleepBonus = 0;
            let sleepPenalty = 0;

            if (sleepData.estimatedSleepHours >= 5) {
                const extraHours = sleepData.estimatedSleepHours - 5;
                sleepBonus = Math.min(extraHours * 2, 10);
            }

            if (sleepData.lateNightActivity) {
                sleepPenalty = 15;
            }

            if (
                sleepData.estimatedSleepHours > 0 &&
                sleepData.estimatedSleepHours < 5
            ) {
                const missedHours = 5 - sleepData.estimatedSleepHours;
                sleepPenalty += missedHours * 3;
            }

            return Math.max(
                0,
                Math.min(100, baseScore + sleepBonus - sleepPenalty),
            );
        };

        return {
            topDomains: getTopDomains(),
            longestStreak: getLongestStreak(),
            longestBreak: getLongestBreak(),
            sleepPatterns: analyzeSleepPatterns(),
            wellnessScore: calculateWellnessScore(),
        };
    }, [currentSession, dataService]);

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
        const refreshInterval = setInterval(fetchData, 30000);

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
        // New optimized data for StoryCard
        ...storyCardData,
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
        totalUrls: recentActivity.reduce(
            (sum, tab) => sum + tab.urlVisits.length,
            0,
        ),
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
    const sitesVisited = stats.uniqueUrls;
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
            gmail: "0s",
            outlook: "0s",
            youtube: "0s",
            chatgpt: "0s",
            icons: {
                gmail: "https://ssl.gstatic.com/ui/v1/icons/mail/rfr/gmail.ico",
                outlook: "https://outlook.office365.com/favicon.ico",
                youtube:
                    "https://www.youtube.com/s/desktop/1c21ae68/img/favicon_144.png",
                chatgpt: "https://chat.openai.com/favicon.ico",
            },
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
    // Format time based on duration
    const formatTime = (ms: number): string => {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        if (seconds < 60) {
            return `${seconds}s`;
        } else if (minutes < 60) {
            return `${minutes}m`;
        } else {
            const decimalHours = (minutes / 60).toFixed(1);
            return `${decimalHours}h`;
        }
    };
    return {
        gmail: formatTime(channelTimes.gmail),
        outlook: formatTime(channelTimes.outlook),
        youtube: formatTime(channelTimes.youtube),
        chatgpt: formatTime(channelTimes.chatgpt),
        icons: {
            gmail: "https://ssl.gstatic.com/ui/v1/icons/mail/rfr/gmail.ico",
            outlook: "https://outlook.office365.com/favicon.ico",
            youtube:
                "https://www.youtube.com/s/desktop/1c21ae68/img/favicon_144.png",
            chatgpt: "https://chat.openai.com/favicon.ico",
        },
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

// Download session data in specified format
export const downloadSessionData = async (format: "json" | "csv" = "json") => {
    const dataService = DataService.getInstance();
    const data = await dataService.formatSessionForDownload(format);
    const blob = new Blob([data], {
        type: format === "json" ? "application/json" : "text/csv",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    const timestamp = new Date().toISOString().split("T")[0];
    a.href = url;
    a.download = `linkx-session-data-${timestamp}.${format}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
};
