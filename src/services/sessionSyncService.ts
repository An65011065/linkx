// src/services/sessionSyncService.ts - Add this file to your extension
import AuthService from "./authService";
import DataService from "../data/dataService";

class SessionSyncService {
    private static instance: SessionSyncService;
    private dataService = DataService.getInstance();
    private syncInterval: number | null = null;
    private lastSyncTime: number = 0;

    private constructor() {}

    static getInstance(): SessionSyncService {
        if (!SessionSyncService.instance) {
            SessionSyncService.instance = new SessionSyncService();
        }
        return SessionSyncService.instance;
    }

    // Get AuthService instance (lazy to avoid circular dependency)
    private getAuthService(): AuthService {
        return AuthService.getInstance();
    }

    // Start periodic sync when user is authenticated
    async startPeriodicSync(): Promise<void> {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }

        // Sync every 5 minutes
        this.syncInterval = window.setInterval(() => {
            this.syncCurrentSession();
        }, 5 * 60 * 1000);

        // Also sync immediately
        await this.syncCurrentSession();
    }

    // Stop periodic sync
    stopPeriodicSync(): void {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }

    // Sync current session to backend (privacy-safe - no URLs)
    async syncCurrentSession(): Promise<void> {
        try {
            const session = await this.dataService.getCurrentSession();

            // Calculate wellness score
            const wellnessScore =
                this.dataService.calculateDigitalWellnessScore(session);

            // Prepare ONLY aggregated stats (no URLs, domains, or identifying data)
            const sessionData = {
                date: session.date,
                stats: {
                    totalTime: session.stats.totalTime,
                    workTime: session.stats.workTime,
                    socialTime: session.stats.socialTime,
                    otherTime: session.stats.otherTime,
                    totalUrls: session.stats.totalUrls,
                    uniqueUrls: session.stats.uniqueUrls,
                    uniqueDomains: session.stats.uniqueDomains,
                },
                wellnessScore,
            };

            console.log("🔄 Syncing privacy-safe session data to backend:", {
                date: sessionData.date,
                totalTime: sessionData.stats.totalTime,
                wellnessScore: sessionData.wellnessScore,
            });

            const authService = this.getAuthService();
            const response = await authService.makeApiCall(
                "POST",
                "/insights/session",
                sessionData,
            );

            if (response.ok) {
                this.lastSyncTime = Date.now();
                console.log("✅ Session synced successfully (privacy-safe)");
            } else {
                console.error("❌ Failed to sync session:", response.status);
            }
        } catch (error) {
            console.error("❌ Error syncing session:", error);
        }
    }

    // Sync historical sessions (run once when user first authenticates)
    // PRIVACY-SAFE: Only sends aggregated stats, no URLs or domains
    async syncHistoricalSessions(days: number = 7): Promise<void> {
        try {
            console.log(
                `🔄 Syncing ${days} days of historical data (privacy-safe)...`,
            );

            const sessions = await this.dataService.getSessionHistory(days);

            for (const session of sessions) {
                const wellnessScore =
                    this.dataService.calculateDigitalWellnessScore(session);

                // ONLY aggregated stats - no URLs, domains, or identifying info
                const sessionData = {
                    date: session.date,
                    stats: {
                        totalTime: session.stats.totalTime,
                        workTime: session.stats.workTime,
                        socialTime: session.stats.socialTime,
                        otherTime: session.stats.otherTime,
                        totalUrls: session.stats.totalUrls,
                        uniqueUrls: session.stats.uniqueUrls,
                        uniqueDomains: session.stats.uniqueDomains,
                    },
                    wellnessScore,
                };

                try {
                    const authService = this.getAuthService();
                    const response = await authService.makeApiCall(
                        "POST",
                        "/insights/session",
                        sessionData,
                    );
                    if (response.ok) {
                        console.log(
                            `✅ Synced privacy-safe session for ${session.date}`,
                        );
                    } else {
                        console.warn(
                            `⚠️ Failed to sync ${session.date}:`,
                            response.status,
                        );
                    }
                } catch (error) {
                    console.warn(`⚠️ Error syncing ${session.date}:`, error);
                }

                // Add small delay to avoid overwhelming the server
                await new Promise((resolve) => setTimeout(resolve, 100));
            }

            console.log("✅ Privacy-safe historical sync complete");
        } catch (error) {
            console.error("❌ Error syncing historical sessions:", error);
        }
    }

    // Get last sync time for debugging
    getLastSyncTime(): number {
        return this.lastSyncTime;
    }
}

export default SessionSyncService;
