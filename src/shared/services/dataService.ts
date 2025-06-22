import type {
    UrlVisit,
    TabSession,
    BrowsingSession,
} from "../types/browsing.types";

class DataService {
    private static instance: DataService;

    private constructor() {}

    static getInstance(): DataService {
        if (!DataService.instance) {
            DataService.instance = new DataService();
        }
        return DataService.instance;
    }

    // Get today's session data
    async getTodaySession(): Promise<BrowsingSession> {
        return this.getCurrentSession();
    }

    // Get current session data
    async getCurrentSession(): Promise<BrowsingSession> {
        const today = this.getTodayDateString();
        const key = `session_${today}`;

        try {
            const result = await chrome.storage.local.get(key);
            const session = result[key] as BrowsingSession;

            if (session) {
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
            totalActiveTime: 0,
            tabSessions: [],
            stats: {
                totalUrls: 0,
                uniqueDomains: 0,
                workTime: 0,
                socialTime: 0,
                otherTime: 0,
            },
        };

        await this.saveSession(newSession);
        return newSession;
    }

    // Category classification based on domain
    private categorizeUrl(
        url: string,
        domain: string,
    ): { category: "work" | "social" | "other"; confidence: number } {
        const workDomains = [
            "github.com",
            "gitlab.com",
            "bitbucket.org",
            "docs.google.com",
            "drive.google.com",
            "sheets.google.com",
            "slides.google.com",
            "notion.so",
            "airtable.com",
            "trello.com",
            "asana.com",
            "monday.com",
            "slack.com",
            "teams.microsoft.com",
            "zoom.us",
            "stackoverflow.com",
            "developer.mozilla.org",
            "npmjs.com",
            "aws.amazon.com",
            "console.cloud.google.com",
            "portal.azure.com",
            "figma.com",
            "sketch.com",
            "invision.com",
            "linear.app",
            "jira.atlassian.com",
            "confluence.atlassian.com",
        ];

        const socialDomains = [
            "youtube.com",
            "youtu.be",
            "netflix.com",
            "hulu.com",
            "disneyplus.com",
            "facebook.com",
            "instagram.com",
            "twitter.com",
            "x.com",
            "linkedin.com",
            "tiktok.com",
            "snapchat.com",
            "reddit.com",
            "pinterest.com",
            "twitch.tv",
            "discord.com",
            "telegram.org",
            "whatsapp.com",
            "spotify.com",
            "soundcloud.com",
            "apple.com/music",
        ];

        if (workDomains.some((d) => domain.includes(d))) {
            return { category: "work", confidence: 0.9 };
        }

        if (socialDomains.some((d) => domain.includes(d))) {
            return { category: "social", confidence: 0.9 };
        }

        // Check URL patterns for additional context
        if (
            url.includes("docs") ||
            url.includes("documentation") ||
            url.includes("api")
        ) {
            return { category: "work", confidence: 0.6 };
        }

        if (
            url.includes("watch") ||
            url.includes("video") ||
            url.includes("stream")
        ) {
            return { category: "social", confidence: 0.6 };
        }

        return { category: "other", confidence: 0.5 };
    }

    // Get today's date string
    private getTodayDateString(): string {
        return new Date().toISOString().split("T")[0];
    }

    // Storage methods
    async saveTabSession(tabSession: TabSession): Promise<void> {
        const today = this.getTodayDateString();
        const session = await this.getCurrentSession();

        const existingIndex = session.tabSessions.findIndex(
            (ts) => ts.tabId === tabSession.tabId,
        );
        if (existingIndex >= 0) {
            session.tabSessions[existingIndex] = tabSession;
        } else {
            session.tabSessions.push(tabSession);
        }

        // Recalculate stats
        session.stats = this.calculateStats(session.tabSessions);
        session.totalActiveTime =
            session.stats.workTime +
            session.stats.socialTime +
            session.stats.otherTime;
        session.endTime = Date.now();

        await this.saveSession(session);
    }

    async addUrlVisit(visit: UrlVisit): Promise<void> {
        // Get current session
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

        // Update or add URL visit
        const existingVisitIndex = tabSession.urlVisits.findIndex(
            (v) => v.id === visit.id,
        );
        if (existingVisitIndex >= 0) {
            tabSession.urlVisits[existingVisitIndex] = visit;
        } else {
            tabSession.urlVisits.push(visit);
        }

        // Update tab session stats
        tabSession.totalActiveTime = tabSession.urlVisits.reduce((total, v) => {
            return total + (v.isActive ? v.duration : 0);
        }, 0);

        // Update session stats
        this.updateSessionStats(session);

        // Save session
        await this.saveSession(session);
    }

    async updateTabActiveTime(
        tabId: number,
        additionalTime: number,
    ): Promise<void> {
        const session = await this.getCurrentSession();
        const tabSession = session.tabSessions.find((ts) => ts.tabId === tabId);

        if (tabSession && tabSession.urlVisits.length > 0) {
            // Update the latest URL visit for this tab
            const latestVisit =
                tabSession.urlVisits[tabSession.urlVisits.length - 1];
            if (!latestVisit.endTime) {
                latestVisit.duration += additionalTime;
                latestVisit.endTime = Date.now();
                await this.addUrlVisit(latestVisit);
            }
        }
    }

    async closeTab(tabId: number): Promise<void> {
        const session = await this.getCurrentSession();
        const tabSession = session.tabSessions.find((ts) => ts.tabId === tabId);

        if (tabSession) {
            tabSession.closedAt = Date.now();

            // End any active URL visits
            tabSession.urlVisits.forEach((visit) => {
                if (!visit.endTime) {
                    visit.endTime = Date.now();
                    visit.duration = visit.endTime - visit.startTime;
                }
            });

            await this.saveTabSession(tabSession);
        }
    }

    createUrlVisit(
        url: string,
        tabId: number,
        windowId: number,
        creationMode: "chain" | "hyperlink",
        sourceInfo?: { nodeId: string; url: string; tabId: number },
        title?: string,
    ): UrlVisit {
        const now = Date.now();
        const domain = new URL(url).hostname;
        const categoryResult = this.categorizeUrl(url, domain);

        return {
            id: `${now}-${Math.random().toString(36).substr(2, 9)}`,
            url,
            domain,
            title,
            startTime: now,
            duration: 0,
            tabId,
            windowId,
            isActive: false,
            creationMode,
            sourceInfo,
            category: categoryResult.category,
            categoryConfidence: categoryResult.confidence,
        };
    }

    private calculateStats(tabSessions: TabSession[]) {
        const stats = {
            totalUrls: 0,
            uniqueDomains: new Set<string>(),
            workTime: 0,
            socialTime: 0,
            otherTime: 0,
        };

        tabSessions.forEach((tabSession) => {
            tabSession.urlVisits.forEach((visit) => {
                if (visit.isActive) {
                    stats.totalUrls++;
                    stats.uniqueDomains.add(visit.domain);

                    const timeInHours = visit.duration / (1000 * 60 * 60);
                    switch (visit.category) {
                        case "work":
                            stats.workTime += timeInHours;
                            break;
                        case "social":
                            stats.socialTime += timeInHours;
                            break;
                        case "other":
                            stats.otherTime += timeInHours;
                            break;
                    }
                }
            });
        });

        return {
            totalUrls: stats.totalUrls,
            uniqueDomains: stats.uniqueDomains.size,
            workTime: stats.workTime,
            socialTime: stats.socialTime,
            otherTime: stats.otherTime,
        };
    }

    // Get browsing timeline for display (last N hours)
    async getBrowsingTimeline(hoursBack: number = 3): Promise<TabSession[]> {
        const session = await this.getCurrentSession();
        const cutoffTime = Date.now() - hoursBack * 60 * 60 * 1000;

        return session.tabSessions
            .filter((tabSession) =>
                tabSession.urlVisits.some(
                    (visit) => visit.startTime >= cutoffTime,
                ),
            )
            .map((tabSession, index) => ({
                ...tabSession,
                displayNumber: index + 1,
                urlVisits: tabSession.urlVisits.filter(
                    (visit) => visit.startTime >= cutoffTime,
                ),
            }))
            .filter((tabSession) => tabSession.urlVisits.length > 0);
    }

    async getAllUrlVisits(): Promise<UrlVisit[]> {
        const session = await this.getCurrentSession();
        return session.tabSessions.flatMap((ts) => ts.urlVisits);
    }

    private async saveSession(session: BrowsingSession): Promise<void> {
        const key = `session_${session.date}`;
        try {
            await chrome.storage.local.set({ [key]: session });
        } catch (error) {
            console.error("Error saving session:", error);
        }
    }

    private updateSessionStats(session: BrowsingSession): void {
        const allVisits = session.tabSessions.flatMap((ts) => ts.urlVisits);
        const uniqueDomains = new Set(allVisits.map((v) => v.domain));

        session.stats = {
            totalUrls: allVisits.length,
            uniqueDomains: uniqueDomains.size,
            workTime: this.calculateCategoryTime(allVisits, "work"),
            socialTime: this.calculateCategoryTime(allVisits, "social"),
            otherTime: this.calculateCategoryTime(allVisits, "other"),
        };
    }

    private calculateCategoryTime(
        visits: UrlVisit[],
        category: "work" | "social" | "other",
    ): number {
        return visits
            .filter((v) => v.category === category)
            .reduce((total, v) => total + v.duration, 0);
    }
}

export default DataService;
