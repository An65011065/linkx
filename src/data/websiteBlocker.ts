import type { BlockedSite } from "../shared/types/common.types";

class WebsiteBlocker {
    private static readonly BLOCK_RULES_KEY = "blocked_sites";
    private static readonly BLOCK_RULE_ID_COUNTER_KEY = "block_rule_id_counter";
    private currentRuleId = 1;

    constructor() {
        this.initialize();
    }

    private async initialize() {
        const data = await chrome.storage.local.get(
            WebsiteBlocker.BLOCK_RULE_ID_COUNTER_KEY,
        );
        this.currentRuleId =
            data[WebsiteBlocker.BLOCK_RULE_ID_COUNTER_KEY] || 1;
    }

    private async getNextRuleId(): Promise<number> {
        const ruleId = this.currentRuleId++;
        await chrome.storage.local.set({
            [WebsiteBlocker.BLOCK_RULE_ID_COUNTER_KEY]: this.currentRuleId,
        });
        return ruleId;
    }

    private createBlockRule(
        domain: string,
        ruleId: number,
    ): chrome.declarativeNetRequest.Rule {
        return {
            id: ruleId,
            priority: 1,
            action: { type: "block" },
            condition: {
                urlFilter: `||${domain}/*`,
                resourceTypes: ["main_frame", "sub_frame"],
            },
        };
    }

    // Helper method to convert timezone-aware times to UTC
    private convertToUTC(dateTime: string, timezone: string): number {
        // Create a date object with the timezone
        const date = new Date(`${dateTime}T00:00:00`);

        // Get timezone offset in minutes
        const tempDate = new Date(
            date.toLocaleString("en-US", { timeZone: timezone }),
        );
        const utcDate = new Date(
            date.toLocaleString("en-US", { timeZone: "UTC" }),
        );
        const timezoneOffset = utcDate.getTime() - tempDate.getTime();

        return date.getTime() + timezoneOffset;
    }

    // Helper method to parse time string (HH:MM) into minutes
    private parseTimeToMinutes(timeString: string): number {
        const [hours, minutes] = timeString.split(":").map(Number);
        return hours * 60 + minutes;
    }

    // Overloaded method for backwards compatibility (hours-based blocking)
    public async blockWebsite(domain: string, hours: number): Promise<void>;
    // New method with timezone support
    public async blockWebsite(
        domain: string,
        startTime: string,
        endTime: string,
        timezone: string,
        startDate?: string,
    ): Promise<void>;
    // Implementation
    public async blockWebsite(
        domain: string,
        hoursOrStartTime: number | string,
        endTime?: string,
        timezone?: string,
        startDate?: string,
    ): Promise<void> {
        try {
            const data = await chrome.storage.local.get(
                WebsiteBlocker.BLOCK_RULES_KEY,
            );
            const blockedSites: BlockedSite[] =
                data[WebsiteBlocker.BLOCK_RULES_KEY] || [];

            const existingBlock = blockedSites.find(
                (site) => site.domain === domain,
            );
            if (existingBlock) {
                throw new Error("This website is already blocked");
            }

            const ruleId = await this.getNextRuleId();

            let blockStartTime: number;
            let blockEndTime: number;
            let blockTimezone: string;

            // Handle backwards compatibility (hours-based blocking)
            if (typeof hoursOrStartTime === "number") {
                blockStartTime = Date.now();
                blockEndTime = Date.now() + hoursOrStartTime * 60 * 60 * 1000;
                blockTimezone =
                    Intl.DateTimeFormat().resolvedOptions().timeZone;
            } else {
                // New timezone-based blocking
                if (!endTime || !timezone) {
                    throw new Error(
                        "Start time, end time, and timezone are required",
                    );
                }

                blockTimezone = timezone;
                const today =
                    startDate || new Date().toISOString().split("T")[0];

                // Parse times
                const startMinutes = this.parseTimeToMinutes(hoursOrStartTime);
                const endMinutes = this.parseTimeToMinutes(endTime);

                // Create dates for start and end times
                const startDateTime = new Date(
                    `${today}T${hoursOrStartTime}:00`,
                );
                let endDateTime = new Date(`${today}T${endTime}:00`);

                // If end time is before start time, assume next day
                if (endMinutes <= startMinutes) {
                    endDateTime.setDate(endDateTime.getDate() + 1);
                }

                // Convert to UTC with timezone consideration
                const startInUserTz = new Date(
                    startDateTime.toLocaleString("en-US", {
                        timeZone: timezone,
                    }),
                );
                const startInUTC = new Date(
                    startDateTime.toLocaleString("en-US", { timeZone: "UTC" }),
                );
                const tzOffset = startInUTC.getTime() - startInUserTz.getTime();

                blockStartTime = startDateTime.getTime() + tzOffset;
                blockEndTime = endDateTime.getTime() + tzOffset;

                // If the start time is in the past, start immediately
                if (blockStartTime < Date.now()) {
                    blockStartTime = Date.now();
                }
            }

            // Create the rule immediately (for current blocking) or schedule it
            const shouldStartNow = blockStartTime <= Date.now();

            if (shouldStartNow) {
                const rule = this.createBlockRule(domain, ruleId);
                await chrome.declarativeNetRequest.updateDynamicRules({
                    addRules: [rule],
                    removeRuleIds: [],
                });
            }

            const blockInfo: BlockedSite = {
                domain,
                ruleId,
                startTime: blockStartTime,
                endTime: blockEndTime,
                timezone: blockTimezone,
                scheduledStartTime: shouldStartNow
                    ? blockStartTime
                    : blockStartTime,
                scheduledEndTime: blockEndTime,
            };

            blockedSites.push(blockInfo);
            await chrome.storage.local.set({
                [WebsiteBlocker.BLOCK_RULES_KEY]: blockedSites,
            });
        } catch (error) {
            console.error("Error blocking website:", error);
            throw error;
        }
    }

    public async unlockWebsite(domain: string): Promise<void> {
        try {
            const data = await chrome.storage.local.get(
                WebsiteBlocker.BLOCK_RULES_KEY,
            );
            const blockedSites: BlockedSite[] =
                data[WebsiteBlocker.BLOCK_RULES_KEY] || [];

            const siteToUnblock = blockedSites.find(
                (site) => site.domain === domain,
            );
            if (!siteToUnblock) {
                throw new Error("This website is not locked");
            }

            await chrome.declarativeNetRequest.updateDynamicRules({
                removeRuleIds: [siteToUnblock.ruleId],
                addRules: [],
            });

            const updatedBlockedSites = blockedSites.filter(
                (site) => site.domain !== domain,
            );
            await chrome.storage.local.set({
                [WebsiteBlocker.BLOCK_RULES_KEY]: updatedBlockedSites,
            });
        } catch (error) {
            console.error("Error unlocking website:", error);
            throw error;
        }
    }

    public async getBlockedSites(): Promise<BlockedSite[]> {
        const data = await chrome.storage.local.get(
            WebsiteBlocker.BLOCK_RULES_KEY,
        );
        return data[WebsiteBlocker.BLOCK_RULES_KEY] || [];
    }

    public async cleanupExpiredBlocks(): Promise<void> {
        const blockedSites = await this.getBlockedSites();
        const now = Date.now();
        const expiredSites = blockedSites.filter((site) => site.endTime <= now);

        for (const site of expiredSites) {
            await this.unlockWebsite(site.domain);
        }
    }

    // New method to handle scheduled blocks
    public async processScheduledBlocks(): Promise<void> {
        const blockedSites = await this.getBlockedSites();
        const now = Date.now();

        for (const site of blockedSites) {
            // Check if we need to start a scheduled block
            if (
                site.scheduledStartTime &&
                site.scheduledStartTime <= now &&
                site.startTime > now
            ) {
                const rule = this.createBlockRule(site.domain, site.ruleId);
                await chrome.declarativeNetRequest.updateDynamicRules({
                    addRules: [rule],
                    removeRuleIds: [],
                });

                // Update the site to mark it as active
                site.startTime = now;

                // Update storage
                const data = await chrome.storage.local.get(
                    WebsiteBlocker.BLOCK_RULES_KEY,
                );
                const allSites: BlockedSite[] =
                    data[WebsiteBlocker.BLOCK_RULES_KEY] || [];
                const updatedSites = allSites.map((s) =>
                    s.domain === site.domain ? site : s,
                );
                await chrome.storage.local.set({
                    [WebsiteBlocker.BLOCK_RULES_KEY]: updatedSites,
                });
            }
        }
    }

    // Helper method to format time in user's timezone
    public formatTimeInTimezone(timestamp: number, timezone: string): string {
        return new Date(timestamp).toLocaleString("en-US", {
            timeZone: timezone,
            weekday: "short",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }
}

export const websiteBlocker = new WebsiteBlocker();
