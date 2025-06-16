import type {
    UrlVisit,
    TabSession,
    BrowsingSession,
} from "../types/common.types";

class DataService {
    private static instance: DataService;

    private constructor() {}

    static getInstance(): DataService {
        if (!DataService.instance) {
            DataService.instance = new DataService();
        }
        return DataService.instance;
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

    // Extract domain from URL
    private extractDomain(url: string): string {
        try {
            return new URL(url).hostname;
        } catch {
            return url;
        }
    }

    // Generate unique ID
    private generateId(): string {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    // Get today's date string
    private getTodayDateString(): string {
        return new Date().toISOString().split("T")[0];
    }

    // Storage methods
    async saveTabSession(tabSession: TabSession): Promise<void> {
        const today = this.getTodayDateString();
        const session = await this.getTodaySession();

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

        await chrome.storage.local.set({ [`session_${today}`]: session });
    }

    async getTodaySession(): Promise<BrowsingSession> {
        const today = this.getTodayDateString();
        const result = await chrome.storage.local.get([`session_${today}`]);

        if (result[`session_${today}`]) {
            return result[`session_${today}`];
        }

        // Create new session for today
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

        await chrome.storage.local.set({ [`session_${today}`]: newSession });
        return newSession;
    }

    async addUrlVisit(urlVisit: UrlVisit): Promise<void> {
        const session = await this.getTodaySession();

        // Find or create tab session
        let tabSession = session.tabSessions.find(
            (ts) => ts.tabId === urlVisit.tabId,
        );
        if (!tabSession) {
            tabSession = {
                tabId: urlVisit.tabId,
                windowId: urlVisit.windowId,
                openedAt: Date.now(),
                totalActiveTime: 0,
                urlVisits: [],
            };
            session.tabSessions.push(tabSession);
        }

        // Add or update URL visit
        const existingVisitIndex = tabSession.urlVisits.findIndex(
            (v) => v.id === urlVisit.id,
        );
        if (existingVisitIndex >= 0) {
            tabSession.urlVisits[existingVisitIndex] = urlVisit;
        } else {
            tabSession.urlVisits.push(urlVisit);
        }

        // Recalculate tab's total active time
        tabSession.totalActiveTime = tabSession.urlVisits
            .filter((v) => v.isActive)
            .reduce((sum, v) => sum + v.duration, 0);

        await this.saveTabSession(tabSession);
    }

    async updateTabActiveTime(
        tabId: number,
        additionalTime: number,
    ): Promise<void> {
        const session = await this.getTodaySession();
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
        const session = await this.getTodaySession();
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
        navigationSource: UrlVisit["navigationSource"],
        title?: string,
    ): UrlVisit {
        const domain = this.extractDomain(url);
        const categoryResult = this.categorizeUrl(url, domain);

        return {
            id: this.generateId(),
            url,
            domain,
            title,
            startTime: Date.now(),
            duration: 0,
            tabId,
            windowId,
            isActive: false,
            navigationSource,
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
        const session = await this.getTodaySession();
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
}

export default DataService;
