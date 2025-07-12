// Import the UrlVisit and SourceInfo from background script
import type { UrlVisit } from "./background";

// Tab session containing all visits within a single browser tab
export interface TabSession {
    tabId: number; // Chrome tab identifier
    windowId: number; // Chrome window identifier
    openedAt: number; // When tab was first created
    closedAt?: number; // When tab was closed (null if still open)
    totalActiveTime: number; // Sum of all active time in this tab
    urlVisits: UrlVisit[]; // Chronological list of URL visits
    displayNumber?: number; // Display number for UI purposes
}

export interface SessionStats {
    totalUrls: number;
    uniqueUrls: number;
    uniqueDomains: number;
    workTime: number;
    socialTime: number;
    otherTime: number;
    totalTime: number;
}

// Daily browsing session containing all tab sessions for one day
export interface BrowsingSession {
    date: string; // 'YYYY-MM-DD'
    startTime: number; // First activity timestamp
    endTime: number; // Most recent activity timestamp
    tabSessions: TabSession[]; // All tab sessions for this day
    stats: SessionStats;
}

class DataService {
    private static instance: DataService;

    private constructor() {}

    // Get singleton instance of DataService
    static getInstance(): DataService {
        if (!DataService.instance) {
            DataService.instance = new DataService();
        }
        return DataService.instance;
    }

    // Get or create today's browsing session
    async getCurrentSession(): Promise<BrowsingSession> {
        const today = new Date().toISOString().split("T")[0];
        const key = `session_${today}`;

        try {
            const result = await chrome.storage.local.get(key);
            const session = result[key] as BrowsingSession | undefined;

            if (session) {
                // Ensure uniqueUrls exists in stats for backward compatibility
                if (session.stats && !("uniqueUrls" in session.stats)) {
                    const allVisits = session.tabSessions.flatMap(
                        (ts) => ts.urlVisits,
                    );
                    const uniqueUrls = new Set(allVisits.map((v) => v.url));
                    (session.stats as SessionStats).uniqueUrls =
                        uniqueUrls.size;
                    await this.saveSession(session);
                }
                return session;
            }
        } catch (error) {
            console.error("Error loading session:", error);
        }

        // Create new session if none exists
        const newSession: BrowsingSession = {
            date: today,
            startTime: Date.now(),
            endTime: Date.now(),
            tabSessions: [],
            stats: {
                totalUrls: 0,
                uniqueUrls: 0,
                uniqueDomains: 0,
                workTime: 0,
                socialTime: 0,
                otherTime: 0,
                totalTime: 0,
            } as SessionStats,
        };

        await this.saveSession(newSession);
        return newSession;
    }

    // Add or update a URL visit in the current session
    async addUrlVisit(visit: UrlVisit): Promise<void> {
        const session = await this.getCurrentSession();

        // Find or create tab session
        let tabSession = session.tabSessions.find(
            (ts) => ts.tabId === visit.tabId,
        );
        if (!tabSession) {
            tabSession = {
                tabId: visit.tabId,
                windowId: visit.windowId,
                openedAt: visit.startTime,
                totalActiveTime: 0,
                urlVisits: [],
            };
            session.tabSessions.push(tabSession);
        }

        // Update or add the visit
        const existingIndex = tabSession.urlVisits.findIndex(
            (v) => v.id === visit.id,
        );
        if (existingIndex >= 0) {
            tabSession.urlVisits[existingIndex] = visit;
        } else {
            tabSession.urlVisits.push(visit);
        }

        // Update tab session total active time
        tabSession.totalActiveTime = tabSession.urlVisits.reduce(
            (total, v) => total + v.activeTime,
            0,
        );

        // Update session stats and save
        this.updateSessionStats(session);
        await this.saveSession(session);
    }

    // Close a tab and finalize its session data
    async closeTab(tabId: number): Promise<void> {
        const session = await this.getCurrentSession();
        const tabSession = session.tabSessions.find((ts) => ts.tabId === tabId);

        if (tabSession) {
            tabSession.closedAt = Date.now();

            // Ensure all visits in this tab are properly ended
            tabSession.urlVisits.forEach((visit) => {
                if (!visit.endTime) {
                    visit.endTime = Date.now();
                    visit.duration = visit.endTime - visit.startTime;
                }
            });

            // Recalculate final active time
            tabSession.totalActiveTime = tabSession.urlVisits.reduce(
                (total, v) => total + v.activeTime,
                0,
            );

            this.updateSessionStats(session);
            await this.saveSession(session);
        }
    }

    // Get all URL visits from current session
    async getAllUrlVisits(): Promise<UrlVisit[]> {
        const session = await this.getCurrentSession();
        return session.tabSessions.flatMap((ts) => ts.urlVisits);
    }

    // Get recent tab sessions for timeline display
    async getRecentTabSessions(hours: number = 6): Promise<TabSession[]> {
        const session = await this.getCurrentSession();
        const hoursAgo = Date.now() - hours * 60 * 60 * 1000;

        return session.tabSessions.filter(
            (ts) => ts.openedAt >= hoursAgo && ts.urlVisits.length > 0,
        );
    }

    // Get sessions from multiple days for historical analysis
    async getSessionHistory(days: number = 7): Promise<BrowsingSession[]> {
        const sessions: BrowsingSession[] = [];

        for (let i = 0; i < days; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split("T")[0];
            const key = `session_${dateStr}`;

            try {
                const result = await chrome.storage.local.get(key);
                if (result[key]) {
                    sessions.push(result[key]);
                }
            } catch (error) {
                console.error(`Error loading session for ${dateStr}:`, error);
            }
        }

        return sessions.sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        );
    }

    // Calculate and update session statistics including duration and navigation patterns
    private updateSessionStats(session: BrowsingSession): void {
        const allVisits = session.tabSessions.flatMap((ts) => ts.urlVisits);
        const uniqueUrls = new Set(allVisits.map((v) => v.url));
        const uniqueDomains = new Set(allVisits.map((v) => v.domain));

        session.stats = {
            totalUrls: allVisits.length,
            uniqueUrls: uniqueUrls.size,
            uniqueDomains: uniqueDomains.size,
            workTime: this.calculateCategoryTime(allVisits, "work"),
            socialTime: this.calculateCategoryTime(allVisits, "social"),
            otherTime: this.calculateCategoryTime(allVisits, "other"),
            totalTime: allVisits.reduce((sum, v) => sum + v.activeTime, 0),
        };

        // Update session time bounds
        if (allVisits.length > 0) {
            session.startTime = Math.min(...allVisits.map((v) => v.startTime));
            session.endTime = Math.max(
                ...allVisits.map((v) => v.endTime || v.startTime),
            );
        }
    }

    // Calculate total active time for a specific category
    private calculateCategoryTime(
        visits: UrlVisit[],
        category: "work" | "social" | "other",
    ): number {
        return visits
            .filter((v) => v.category === category)
            .reduce((total, v) => total + v.activeTime, 0);
    }

    // Calculate total duration (including background time) for a specific category
    private calculateCategoryDuration(
        visits: UrlVisit[],
        category: "work" | "social" | "other",
    ): number {
        return visits
            .filter((v) => v.category === category)
            .reduce((total, v) => total + v.duration, 0);
    }

    // Get time comparison between active vs total duration
    async getTimeEfficiencyAnalytics(): Promise<{
        activeVsDuration: {
            work: { active: number; total: number; efficiency: number };
            social: { active: number; total: number; efficiency: number };
            other: { active: number; total: number; efficiency: number };
        };
        overallEfficiency: number;
        backgroundTime: number;
    }> {
        const session = await this.getCurrentSession();
        const allVisits = session.tabSessions.flatMap((ts) => ts.urlVisits);

        const calculateEfficiency = (category: "work" | "social" | "other") => {
            const active = this.calculateCategoryTime(allVisits, category);
            const total = this.calculateCategoryDuration(allVisits, category);
            const efficiency =
                total > 0 ? Math.round((active / total) * 100) : 0;
            return { active, total, efficiency };
        };

        const work = calculateEfficiency("work");
        const social = calculateEfficiency("social");
        const other = calculateEfficiency("other");

        const totalActive = work.active + social.active + other.active;
        const totalDuration = work.total + social.total + other.total;
        const overallEfficiency =
            totalDuration > 0
                ? Math.round((totalActive / totalDuration) * 100)
                : 0;
        const backgroundTime = totalDuration - totalActive;

        return {
            activeVsDuration: { work, social, other },
            overallEfficiency,
            backgroundTime,
        };
    }

    // Save session to Chrome local storage
    private async saveSession(session: BrowsingSession): Promise<void> {
        const key = `session_${session.date}`;
        try {
            await chrome.storage.local.set({ [key]: session });
        } catch (error) {
            console.error("Error saving session:", error);
        }
    }

    // Get storage usage information for debugging
    async getStorageInfo(): Promise<{ bytesInUse: number; quota: number }> {
        try {
            const bytesInUse = await chrome.storage.local.getBytesInUse();
            return {
                bytesInUse,
                quota: chrome.storage.local.QUOTA_BYTES,
            };
        } catch (error) {
            console.error("Error getting storage info:", error);
            return { bytesInUse: 0, quota: 0 };
        }
    }

    // Clean up old session data to prevent storage overflow
    async cleanupOldSessions(keepDays: number = 30): Promise<void> {
        try {
            const allKeys = await chrome.storage.local.get(null);
            const sessionKeys = Object.keys(allKeys).filter((key) =>
                key.startsWith("session_"),
            );

            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - keepDays);
            const cutoffStr = cutoffDate.toISOString().split("T")[0];

            const keysToDelete = sessionKeys.filter((key) => {
                const dateStr = key.replace("session_", "");
                return dateStr < cutoffStr;
            });

            if (keysToDelete.length > 0) {
                await chrome.storage.local.remove(keysToDelete);
                console.log(`Cleaned up ${keysToDelete.length} old sessions`);
            }
        } catch (error) {
            console.error("Error cleaning up old sessions:", error);
        }
    }

    // Export session data for backup or analysis
    async exportSessionData(dateStr?: string): Promise<BrowsingSession | null> {
        const key = `session_${
            dateStr || new Date().toISOString().split("T")[0]
        }`;
        try {
            const result = await chrome.storage.local.get(key);
            return result[key] || null;
        } catch (error) {
            console.error("Error exporting session data:", error);
            return null;
        }
    }

    // Import session data from backup
    async importSessionData(session: BrowsingSession): Promise<void> {
        const key = `session_${session.date}`;
        try {
            await chrome.storage.local.set({ [key]: session });
        } catch (error) {
            console.error("Error importing session data:", error);
        }
    }

    // Get simple analytics for dashboard display including navigation patterns
    async getSessionAnalytics(): Promise<{
        todayStats: BrowsingSession["stats"];
        weeklyAverage: {
            totalTime: number;
            workTime: number;
            socialTime: number;
        };
        topDomains: Array<{ domain: string; time: number; category: string }>;
        navigationPatterns: {
            hyperlinkRatio: number; // % of navigation via links vs typing
            averageSessionLength: number; // Average time per site visit
            multitaskingScore: number; // How much tab switching happens
        };
        crossTabConnections: Array<{
            source: string;
            target: string;
            frequency: number;
        }>;
    }> {
        const today = await this.getCurrentSession();
        const weekSessions = await this.getSessionHistory(7);

        // Calculate weekly averages
        const weeklyTotals = weekSessions.reduce(
            (acc, session) => ({
                totalTime: acc.totalTime + session.stats.totalTime,
                workTime: acc.workTime + session.stats.workTime,
                socialTime: acc.socialTime + session.stats.socialTime,
            }),
            { totalTime: 0, workTime: 0, socialTime: 0 },
        );

        const weeklyAverage = {
            totalTime: Math.round(
                weeklyTotals.totalTime / Math.max(weekSessions.length, 1),
            ),
            workTime: Math.round(
                weeklyTotals.workTime / Math.max(weekSessions.length, 1),
            ),
            socialTime: Math.round(
                weeklyTotals.socialTime / Math.max(weekSessions.length, 1),
            ),
        };

        // Get top domains from today
        const allVisits = today.tabSessions.flatMap((ts) => ts.urlVisits);
        const domainTimes = new Map<
            string,
            { time: number; category: string }
        >();

        allVisits.forEach((visit) => {
            const current = domainTimes.get(visit.domain) || {
                time: 0,
                category: visit.category,
            };
            current.time += visit.activeTime;
            domainTimes.set(visit.domain, current);
        });

        const topDomains = Array.from(domainTimes.entries())
            .sort(([, a], [, b]) => b.time - a.time)
            .slice(0, 10)
            .map(([domain, data]) => ({
                domain,
                time: data.time,
                category: data.category,
            }));

        // Analyze navigation patterns using creationMode
        const navigationPatterns = this.analyzeNavigationPatterns(allVisits);

        // Analyze cross-tab connections using sourceInfo
        const crossTabConnections = this.analyzeCrossTabConnections(allVisits);

        return {
            todayStats: today.stats,
            weeklyAverage,
            topDomains,
            navigationPatterns,
            crossTabConnections,
        };
    }

    // Analyze navigation patterns from visit data
    private analyzeNavigationPatterns(visits: UrlVisit[]): {
        hyperlinkRatio: number;
        averageSessionLength: number;
        multitaskingScore: number;
    } {
        if (visits.length === 0) {
            return {
                hyperlinkRatio: 0,
                averageSessionLength: 0,
                multitaskingScore: 0,
            };
        }

        // Calculate hyperlink vs chain navigation ratio
        const hyperlinkCount = visits.filter(
            (v) => v.creationMode === "hyperlink",
        ).length;
        const hyperlinkRatio = Math.round(
            (hyperlinkCount / visits.length) * 100,
        );

        // Calculate average session length using duration field
        const completedVisits = visits.filter((v) => v.duration > 0);
        const averageSessionLength =
            completedVisits.length > 0
                ? Math.round(
                      completedVisits.reduce((sum, v) => sum + v.duration, 0) /
                          completedVisits.length,
                  )
                : 0;

        // Calculate multitasking score (unique tabs used)
        const uniqueTabs = new Set(visits.map((v) => v.tabId)).size;
        const multitaskingScore = Math.round(
            (uniqueTabs / Math.max(visits.length, 1)) * 100,
        );

        return {
            hyperlinkRatio,
            averageSessionLength,
            multitaskingScore,
        };
    }

    // Analyze cross-tab navigation connections using sourceInfo
    private analyzeCrossTabConnections(visits: UrlVisit[]): Array<{
        source: string;
        target: string;
        frequency: number;
    }> {
        const connections = new Map<string, number>();

        visits.forEach((visit) => {
            if (visit.sourceInfo && visit.creationMode === "hyperlink") {
                // This is a cross-tab navigation
                const sourceUrl = new URL(
                    visit.sourceInfo.url,
                ).hostname.replace(/^www\./, "");
                const targetUrl = visit.domain;
                const connectionKey = `${sourceUrl} → ${targetUrl}`;

                connections.set(
                    connectionKey,
                    (connections.get(connectionKey) || 0) + 1,
                );
            }
        });

        return Array.from(connections.entries())
            .map(([connection, frequency]) => {
                const [source, target] = connection.split(" → ");
                return { source, target, frequency };
            })
            .sort((a, b) => b.frequency - a.frequency)
            .slice(0, 10); // Top 10 connections
    }

    // Get detailed visit analytics including duration vs active time
    async getDetailedVisitAnalytics(): Promise<{
        focusEfficiency: number; // activeTime / duration ratio
        averageDwellTime: number; // Average time spent per visit
        sessionDepth: number; // Average visits per tab session
        navigationFlow: Array<{
            domain: string;
            leadsTo: Array<{ domain: string; count: number }>;
        }>;
    }> {
        const session = await this.getCurrentSession();
        const allVisits = session.tabSessions.flatMap((ts) => ts.urlVisits);

        // Calculate focus efficiency (how much of total time was actually focused)
        const completedVisits = allVisits.filter((v) => v.duration > 0);
        const totalDuration = completedVisits.reduce(
            (sum, v) => sum + v.duration,
            0,
        );
        const totalActiveTime = completedVisits.reduce(
            (sum, v) => sum + v.activeTime,
            0,
        );
        const focusEfficiency =
            totalDuration > 0
                ? Math.round((totalActiveTime / totalDuration) * 100)
                : 0;

        // Calculate average dwell time
        const averageDwellTime =
            completedVisits.length > 0
                ? Math.round(totalActiveTime / completedVisits.length)
                : 0;

        // Calculate session depth
        const sessionDepth =
            session.tabSessions.length > 0
                ? Math.round(allVisits.length / session.tabSessions.length)
                : 0;

        // Build navigation flow map
        const navigationFlow = this.buildNavigationFlow(allVisits);

        return {
            focusEfficiency,
            averageDwellTime,
            sessionDepth,
            navigationFlow,
        };
    }

    // Build navigation flow showing which domains lead to which others
    private buildNavigationFlow(visits: UrlVisit[]): Array<{
        domain: string;
        leadsTo: Array<{ domain: string; count: number }>;
    }> {
        const flowMap = new Map<string, Map<string, number>>();

        visits.forEach((visit) => {
            if (visit.sourceInfo) {
                const sourceDomain = new URL(
                    visit.sourceInfo.url,
                ).hostname.replace(/^www\./, "");
                const targetDomain = visit.domain;

                if (!flowMap.has(sourceDomain)) {
                    flowMap.set(sourceDomain, new Map());
                }

                const targetMap = flowMap.get(sourceDomain)!;
                targetMap.set(
                    targetDomain,
                    (targetMap.get(targetDomain) || 0) + 1,
                );
            }
        });

        return Array.from(flowMap.entries()).map(([domain, targets]) => ({
            domain,
            leadsTo: Array.from(targets.entries())
                .map(([target, count]) => ({ domain: target, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5), // Top 5 destinations per source
        }));
    }

    // Format session data for download
    async formatSessionForDownload(
        format: "json" | "csv" = "json",
    ): Promise<string> {
        const session = await this.getCurrentSession();

        if (format === "json") {
            return JSON.stringify(session, null, 2);
        }

        interface FlattenedVisit {
            date: string;
            tabId: number;
            windowId: number;
            url: string;
            domain: string;
            title: string;
            startTime: string;
            endTime: string;
            duration: number;
            activeTime: number;
            category: "work" | "social" | "other";
            creationMode: "chain" | "hyperlink";
            sourceUrl: string;
            sourceTabId: string;
        }

        // For CSV, flatten the data structure
        const rows: FlattenedVisit[] = [];
        session.tabSessions.forEach((tabSession) => {
            tabSession.urlVisits.forEach((visit) => {
                rows.push({
                    date: session.date,
                    tabId: visit.tabId,
                    windowId: visit.windowId,
                    url: visit.url,
                    domain: visit.domain,
                    title: visit.title || "",
                    startTime: new Date(visit.startTime).toISOString(),
                    endTime: visit.endTime
                        ? new Date(visit.endTime).toISOString()
                        : "",
                    duration: visit.duration,
                    activeTime: visit.activeTime,
                    category: visit.category,
                    creationMode: visit.creationMode,
                    sourceUrl: visit.sourceInfo?.url || "",
                    sourceTabId: visit.sourceInfo?.tabId?.toString() || "",
                });
            });
        });

        // Convert to CSV
        const headers = Object.keys(rows[0] || {});
        const csvRows = [
            headers.join(","),
            ...rows.map((row) =>
                headers
                    .map((header) =>
                        JSON.stringify(
                            row[header as keyof FlattenedVisit] || "",
                        ),
                    )
                    .join(","),
            ),
        ];

        return csvRows.join("\n");
    }

    // Format time from milliseconds to hours and minutes
    formatTime(milliseconds: number): string {
        const hours = Math.floor(milliseconds / (1000 * 60 * 60));
        const minutes = Math.floor(
            (milliseconds % (1000 * 60 * 60)) / (1000 * 60),
        );
        return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    }

    // Calculate digital wellness score for a session
    calculateDigitalWellnessScore(session: {
        stats: SessionStats;
        tabSessions: { urlVisits: UrlVisit[] }[];
    }): number {
        let score = 50;

        // Calculate productivity ratio
        const totalTime = session.stats.totalTime;
        const productiveTime = session.stats.workTime + session.stats.otherTime;
        const productivityRatio =
            totalTime > 0 ? productiveTime / totalTime : 0;
        score += Math.round(productivityRatio * 30);

        // Calculate longest focus streak
        const longestStreak = this.calculateLongestStreak(session);
        if (longestStreak.time > 30 * 60 * 1000) {
            // 30 minutes
            score += 15;
        } else if (longestStreak.time > 15 * 60 * 1000) {
            // 15 minutes
            score += 8;
        }

        // Adjust for number of unique URLs
        if (session.stats.uniqueUrls > 500) {
            score -= 10;
        } else if (session.stats.uniqueUrls > 300) {
            score -= 5;
        }

        score += 5;
        return Math.max(0, Math.min(100, score));
    }

    // Calculate longest focus streak on a single domain
    private calculateLongestStreak(session: {
        tabSessions: { urlVisits: UrlVisit[] }[];
    }): { domain: string; time: number } {
        const allVisits = session.tabSessions
            .flatMap((tab) => tab.urlVisits)
            .filter((visit) => visit.activeTime > 0)
            .sort((a, b) => a.startTime - b.startTime);

        if (allVisits.length === 0) {
            return { domain: "", time: 0 };
        }

        const MAX_GAP_BETWEEN_SESSIONS = 10 * 60 * 1000; // 10 minutes

        let longestStreak = { domain: "", time: 0 };
        let currentStreak = { domain: "", time: 0 };
        let lastVisitEnd = 0;

        allVisits.forEach((visit) => {
            const gapFromLastVisit = visit.startTime - lastVisitEnd;
            const visitEnd = visit.startTime + visit.activeTime;

            if (
                visit.domain === currentStreak.domain &&
                gapFromLastVisit <= MAX_GAP_BETWEEN_SESSIONS
            ) {
                currentStreak.time += visit.activeTime;
            } else {
                if (currentStreak.time > longestStreak.time) {
                    longestStreak = { ...currentStreak };
                }
                currentStreak = {
                    domain: visit.domain,
                    time: visit.activeTime,
                };
            }

            lastVisitEnd = visitEnd;
        });

        if (currentStreak.time > longestStreak.time) {
            longestStreak = { ...currentStreak };
        }

        return longestStreak;
    }
}

export default DataService;
