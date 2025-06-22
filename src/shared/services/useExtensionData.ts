import { useState, useEffect } from "react";
import type {
    BrowsingSession,
    TabSession,
    UrlVisit,
} from "../types/browsing.types";
import DataService from "./dataService";

interface ExtensionData {
    session: BrowsingSession | null;
    timeline: TabSession[];
    loading: boolean;
    error: string | null;
}

export const useExtensionData = (
    refreshInterval: number = 1000,
): ExtensionData => {
    const [data, setData] = useState<ExtensionData>({
        session: null,
        timeline: [],
        loading: true,
        error: null,
    });

    const fetchData = async () => {
        try {
            const dataService = DataService.getInstance();
            const [session, timeline] = await Promise.all([
                dataService.getTodaySession(),
                dataService.getBrowsingTimeline(6), // Last 6 hours
            ]);

            setData({
                session,
                timeline,
                loading: false,
                error: null,
            });
        } catch (error) {
            console.error("Error fetching extension data:", error);
            setData((prev) => ({
                ...prev,
                loading: false,
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to fetch data",
            }));
        }
    };

    useEffect(() => {
        // Initial fetch
        fetchData();

        // Set up periodic refresh
        const interval = setInterval(fetchData, refreshInterval);

        return () => clearInterval(interval);
    }, [refreshInterval]);

    return data;
};

// Helper hook for stats data specifically
export const useStatsData = () => {
    const { session, loading, error } = useExtensionData();

    return {
        stats: session?.stats || {
            totalUrls: 0,
            uniqueDomains: 0,
            workTime: 0,
            socialTime: 0,
            otherTime: 0,
        },
        totalActiveTime: session
            ? session.stats.workTime +
              session.stats.socialTime +
              session.stats.otherTime
            : 0,
        loading,
        error,
    };
};

// Helper hook for timeline data specifically
export const useTimelineData = () => {
    const { timeline, loading, error } = useExtensionData();

    return {
        timeline,
        loading,
        error,
    };
};

// Helper hook for activity data (hourly work and other data for last 24 hours)
export const useActivityData = () => {
    const { session, loading, error } = useExtensionData();

    const getHourlyActivityData = () => {
        if (!session) {
            console.log("No session data available");
            return [];
        }

        console.log("Current session:", {
            date: session.date,
            tabCount: session.tabSessions.length,
            totalUrls: session.tabSessions.reduce(
                (sum, tab) => sum + tab.urlVisits.length,
                0,
            ),
            stats: session.stats,
        });

        // Log categorized URLs and time spent
        const categoryStats = {
            work: { urls: new Set<string>(), timeSpent: 0 },
            social: { urls: new Set<string>(), timeSpent: 0 },
            other: { urls: new Set<string>(), timeSpent: 0 },
        };

        session.tabSessions.forEach((tabSession, idx) => {
            console.log(`Tab session ${idx}:`, {
                tabId: tabSession.tabId,
                visitCount: tabSession.urlVisits.length,
                activeVisits: tabSession.urlVisits.filter((v) => v.isActive)
                    .length,
            });

            tabSession.urlVisits.forEach((visit) => {
                if (!visit.isActive) return;

                const timeInHours = visit.duration / (1000 * 60 * 60);
                categoryStats[visit.category].urls.add(visit.url);
                categoryStats[visit.category].timeSpent += timeInHours;

                // Log individual visits for debugging
                console.log(`Visit in tab ${tabSession.tabId}:`, {
                    url: visit.url,
                    category: visit.category,
                    duration: timeInHours.toFixed(2) + "h",
                    isActive: visit.isActive,
                });
            });
        });

        // Convert Sets to Arrays for better console logging
        const formattedStats = Object.entries(categoryStats).map(
            ([category, data]) => ({
                category,
                urls: Array.from(data.urls),
                timeSpent: Number(data.timeSpent.toFixed(2)),
            }),
        );

        console.log("Category Statistics:", formattedStats);

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
                    if (!visit.isActive) return;

                    const visitStart = new Date(visit.startTime);
                    const visitEnd = visit.endTime
                        ? new Date(visit.endTime)
                        : new Date();

                    // Check if visit overlaps with this hour
                    if (visitStart < hourEnd && visitEnd > hourStart) {
                        const overlapStart =
                            visitStart > hourStart ? visitStart : hourStart;
                        const overlapEnd =
                            visitEnd < hourEnd ? visitEnd : hourEnd;
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

    return {
        activityData: getHourlyActivityData(),
        loading,
        error,
    };
};

// Helper hook for channel-specific data
export const useChannelData = () => {
    const { session, loading, error } = useExtensionData();

    const calculateChannelTime = (
        urlVisits: UrlVisit[],
        domainPatterns: string[],
    ): number => {
        return (
            urlVisits.reduce((total, visit) => {
                if (!visit.isActive) return total;

                const domain = visit.domain.toLowerCase();
                const matchesDomain = domainPatterns.some((pattern) =>
                    domain.includes(pattern),
                );

                if (matchesDomain) {
                    const duration = visit.duration || 0;
                    return total + duration;
                }
                return total;
            }, 0) /
            (1000 * 60 * 60)
        ); // Convert to hours
    };

    const getChannelData = () => {
        if (!session) {
            return {
                gmail: 0,
                outlook: 0,
                youtube: 0,
                chatgpt: 0,
            };
        }

        const allVisits = session.tabSessions.flatMap((tab) => tab.urlVisits);

        return {
            gmail: calculateChannelTime(allVisits, ["gmail", "mail.google"]),
            outlook: calculateChannelTime(allVisits, [
                "outlook",
                "office.com",
                "live.com",
            ]),
            youtube: calculateChannelTime(allVisits, ["youtube", "youtu.be"]),
            chatgpt: calculateChannelTime(allVisits, [
                "chatgpt",
                "chat.openai",
                "openai.com",
            ]),
        };
    };

    return {
        channelData: getChannelData(),
        loading,
        error,
    };
};
