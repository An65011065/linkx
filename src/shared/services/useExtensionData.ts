import { useState, useEffect } from "react";
import type { BrowsingSession, TabSession } from "../types/common.types";
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

// Helper hook for activity data (hourly work and media data for last 24 hours)
export const useActivityData = () => {
    const { session, loading, error } = useExtensionData();

    const getHourlyActivityData = () => {
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
            let mediaTime = 0; // Using socialTime as media time

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
                        } else if (visit.category === "social") {
                            mediaTime += overlapDuration;
                        }
                    }
                });
            });

            hourlyData.push({
                hour: hourStart.getHours(),
                date: hourStart,
                workTime: Math.max(0, workTime),
                mediaTime: Math.max(0, mediaTime),
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
