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
