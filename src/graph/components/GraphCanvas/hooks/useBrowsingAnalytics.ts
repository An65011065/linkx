import { useState, useEffect } from "react";
import DataService from "../../../../data/dataService";
import type { UrlVisit } from "../../../../shared/types/browsing.types";

interface BrowsingMetrics {
    returnRate: number; // % of sites you revisit vs one-time visits
    longestChain: number; // Longest sequence without returning to previous domain
    sessionDepth: number; // Average visits per tab session
    focusEfficiency: number; // How much of total time was actually focused
    hyperlinkRatio: number; // % navigation via links vs typing
    multitaskingScore: number; // How much tab switching happens
    averageDwellTime: number; // Average time spent per visit (in minutes)
    totalSites: number; // Total unique sites visited
    totalVisits: number; // Total page visits
    activeHours: number; // Total active browsing time (in hours)
}

interface AnalyticsState {
    metrics: BrowsingMetrics;
    loading: boolean;
    error: string | null;
    lastUpdated: number;
}

export function useBrowsingAnalytics() {
    const [analyticsState, setAnalyticsState] = useState<AnalyticsState>({
        metrics: {
            returnRate: 0,
            longestChain: 0,
            sessionDepth: 0,
            focusEfficiency: 0,
            hyperlinkRatio: 0,
            multitaskingScore: 0,
            averageDwellTime: 0,
            totalSites: 0,
            totalVisits: 0,
            activeHours: 0,
        },
        loading: true,
        error: null,
        lastUpdated: 0,
    });

    const calculateReturnRate = (visits: UrlVisit[]): number => {
        if (visits.length === 0) return 0;

        const domainVisits = new Map<string, number>();
        visits.forEach((visit) => {
            domainVisits.set(
                visit.domain,
                (domainVisits.get(visit.domain) || 0) + 1,
            );
        });

        const revisitedDomains = Array.from(domainVisits.values()).filter(
            (count) => count > 1,
        ).length;
        const totalUniqueDomains = domainVisits.size;

        return totalUniqueDomains > 0
            ? Math.round((revisitedDomains / totalUniqueDomains) * 100)
            : 0;
    };

    const calculateLongestChain = (visits: UrlVisit[]): number => {
        if (visits.length === 0) return 0;

        const sortedVisits = visits.sort((a, b) => a.startTime - b.startTime);
        const visitedDomains = new Set<string>();
        let currentChain = 0;
        let longestChain = 0;

        for (const visit of sortedVisits) {
            if (visitedDomains.has(visit.domain)) {
                // Chain broken - we've returned to a previous domain
                longestChain = Math.max(longestChain, currentChain);
                visitedDomains.clear();
                currentChain = 1;
                visitedDomains.add(visit.domain);
            } else {
                // Continue chain - new domain
                visitedDomains.add(visit.domain);
                currentChain++;
            }
        }

        return Math.max(longestChain, currentChain);
    };

    const loadAnalytics = async () => {
        try {
            setAnalyticsState((prev) => ({
                ...prev,
                loading: true,
                error: null,
            }));

            const dataService = DataService.getInstance();

            // Get current session data
            const [sessionAnalytics, detailedAnalytics, allVisits] =
                await Promise.all([
                    dataService.getSessionAnalytics(),
                    dataService.getDetailedVisitAnalytics(),
                    dataService.getAllUrlVisits(),
                ]);

            // Calculate our custom metrics
            const returnRate = calculateReturnRate(allVisits);
            const longestChain = calculateLongestChain(allVisits);

            // Convert milliseconds to minutes/hours
            const averageDwellTime = Math.round(
                detailedAnalytics.averageDwellTime / (1000 * 60),
            ); // minutes
            const totalActiveTime = sessionAnalytics.todayStats.totalTime;
            const activeHours =
                Math.round((totalActiveTime / (1000 * 60 * 60)) * 10) / 10; // hours with 1 decimal

            const metrics: BrowsingMetrics = {
                returnRate,
                longestChain,
                sessionDepth: detailedAnalytics.sessionDepth,
                focusEfficiency: detailedAnalytics.focusEfficiency,
                hyperlinkRatio:
                    sessionAnalytics.navigationPatterns.hyperlinkRatio,
                multitaskingScore:
                    sessionAnalytics.navigationPatterns.multitaskingScore,
                averageDwellTime,
                totalSites: sessionAnalytics.todayStats.uniqueDomains,
                totalVisits: sessionAnalytics.todayStats.totalUrls,
                activeHours,
            };

            setAnalyticsState({
                metrics,
                loading: false,
                error: null,
                lastUpdated: Date.now(),
            });
        } catch (error) {
            console.error("Error loading browsing analytics:", error);
            setAnalyticsState((prev) => ({
                ...prev,
                loading: false,
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to load analytics",
            }));
        }
    };

    // Load analytics on mount and set up periodic refresh
    useEffect(() => {
        loadAnalytics();

        // Refresh every 30 seconds to keep data current
        const interval = setInterval(loadAnalytics, 30000);

        return () => clearInterval(interval);
    }, []);

    return {
        ...analyticsState,
        refresh: loadAnalytics,
    };
}

// Helper hook for getting specific metric trends over time
export function useMetricTrends(
    metric: keyof BrowsingMetrics,
    days: number = 7,
) {
    const [trends, setTrends] = useState<
        Array<{ date: string; value: number }>
    >([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadTrends = async () => {
            try {
                const dataService = DataService.getInstance();
                const sessions = await dataService.getSessionHistory(days);

                const trendData = sessions.map((session) => {
                    // You'd need to implement metric calculation for historical sessions
                    // For now, return mock data structure
                    return {
                        date: session.date,
                        value: 0, // Would calculate the specific metric here
                    };
                });

                setTrends(trendData);
            } catch (error) {
                console.error("Error loading metric trends:", error);
            } finally {
                setLoading(false);
            }
        };

        loadTrends();
    }, [metric, days]);

    return { trends, loading };
}
