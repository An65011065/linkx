import type { BlockedSite } from "../shared/types/common.types";

class WebsiteBlocker {
    private static readonly BLOCK_RULES_KEY = "blocked_sites";
    private static readonly BLOCK_RULE_ID_COUNTER_KEY = "block_rule_id_counter";
    private currentRuleId = 1;
    private initPromise: Promise<void> | null = null;

    constructor() {
        this.initPromise = this.initialize();
    }

    private async initialize() {
        const data = await chrome.storage.local.get(
            WebsiteBlocker.BLOCK_RULE_ID_COUNTER_KEY,
        );
        this.currentRuleId =
            data[WebsiteBlocker.BLOCK_RULE_ID_COUNTER_KEY] || 1;

        // Clean up orphaned rules on startup
        await this.cleanupOrphanedRules();
    }

    private async ensureInitialized() {
        if (this.initPromise) {
            await this.initPromise;
            this.initPromise = null;
        }
    }

    private async getNextRuleId(): Promise<number> {
        await this.ensureInitialized();
        const ruleId = this.currentRuleId++;
        await chrome.storage.local.set({
            [WebsiteBlocker.BLOCK_RULE_ID_COUNTER_KEY]: this.currentRuleId,
        });
        return ruleId;
    }

    private createBlockRules(
        domain: string,
        ruleId: number,
    ): chrome.declarativeNetRequest.Rule[] {
        // Clean the domain - remove protocol and www
        const cleanDomain = domain
            .replace(/^https?:\/\//, "")
            .replace(/^www\./, "")
            .split("/")[0];

        const rules: chrome.declarativeNetRequest.Rule[] = [];
        const resourceTypes = [
            "main_frame",
            "sub_frame",
            "stylesheet",
            "script",
            "image",
            "font",
            "object",
            "xmlhttprequest",
            "ping",
            "csp_report",
            "media",
            "websocket",
            "webtransport",
            "webbundle",
            "other",
        ] as chrome.declarativeNetRequest.ResourceType[];

        // Method 1: Block main domain with all resource types
        rules.push({
            id: ruleId,
            priority: 100,
            action: { type: "block" },
            condition: {
                urlFilter: `||${cleanDomain}`,
                resourceTypes: resourceTypes,
            },
        });

        // Method 2: Block www version with all resource types
        rules.push({
            id: ruleId + 1,
            priority: 100,
            action: { type: "block" },
            condition: {
                urlFilter: `||www.${cleanDomain}`,
                resourceTypes: resourceTypes,
            },
        });

        // Method 3: Block using requestDomains (most reliable for main frames)
        rules.push({
            id: ruleId + 2,
            priority: 99,
            action: { type: "block" },
            condition: {
                requestDomains: [cleanDomain, `www.${cleanDomain}`],
                resourceTypes: ["main_frame", "sub_frame"],
            },
        });

        // Method 4: Block using initiatorDomains as backup
        rules.push({
            id: ruleId + 3,
            priority: 98,
            action: { type: "block" },
            condition: {
                initiatorDomains: [cleanDomain, `www.${cleanDomain}`],
                resourceTypes: ["main_frame", "sub_frame"],
            },
        });

        // Method 5: Comprehensive regex for main domain and www
        rules.push({
            id: ruleId + 4,
            priority: 97,
            action: { type: "block" },
            condition: {
                regexFilter: `^https?://(www\\.)?${cleanDomain.replace(
                    /\./g,
                    "\\.",
                )}(/.*)?$`,
                resourceTypes: ["main_frame", "sub_frame"],
            },
        });

        // Method 6: Block all subdomains
        rules.push({
            id: ruleId + 5,
            priority: 96,
            action: { type: "block" },
            condition: {
                regexFilter: `^https?://.*\\.${cleanDomain.replace(
                    /\./g,
                    "\\.",
                )}(/.*)?$`,
                resourceTypes: ["main_frame", "sub_frame"],
            },
        });

        // Method 7: Block HTTP and HTTPS explicitly
        rules.push({
            id: ruleId + 6,
            priority: 95,
            action: { type: "block" },
            condition: {
                regexFilter: `^http://(www\\.)?${cleanDomain.replace(
                    /\./g,
                    "\\.",
                )}(/.*)?$`,
                resourceTypes: resourceTypes,
            },
        });

        rules.push({
            id: ruleId + 7,
            priority: 95,
            action: { type: "block" },
            condition: {
                regexFilter: `^https://(www\\.)?${cleanDomain.replace(
                    /\./g,
                    "\\.",
                )}(/.*)?$`,
                resourceTypes: resourceTypes,
            },
        });

        return rules;
    }

    // NEW: Clean up orphaned rules on startup
    private async cleanupOrphanedRules(): Promise<void> {
        try {
            const [currentRules, blockedSites] = await Promise.all([
                chrome.declarativeNetRequest.getDynamicRules(),
                this.getBlockedSites(),
            ]);

            // Get all rule IDs that should exist based on stored sites
            const validRuleIds = new Set<number>();
            for (const site of blockedSites) {
                for (let i = 0; i < 8; i++) {
                    validRuleIds.add(site.ruleId + i);
                }
            }

            // Find orphaned rules (rules that exist but aren't in storage)
            const orphanedRuleIds = currentRules
                .map((rule) => rule.id)
                .filter((id) => !validRuleIds.has(id));

            if (orphanedRuleIds.length > 0) {
                console.log(
                    `Found ${orphanedRuleIds.length} orphaned rules, cleaning up...`,
                );
                await chrome.declarativeNetRequest.updateDynamicRules({
                    removeRuleIds: orphanedRuleIds,
                    addRules: [],
                });
                console.log(
                    `Cleaned up orphaned rules: ${orphanedRuleIds.join(", ")}`,
                );
            }
        } catch (error) {
            console.error("Error cleaning up orphaned rules:", error);
        }
    }

    public async blockWebsite(domain: string, hours: number): Promise<void> {
        await this.ensureInitialized();

        try {
            const data = await chrome.storage.local.get(
                WebsiteBlocker.BLOCK_RULES_KEY,
            );
            const blockedSites: BlockedSite[] =
                data[WebsiteBlocker.BLOCK_RULES_KEY] || [];

            // Clean the domain for consistent checking
            const cleanDomain = domain
                .replace(/^https?:\/\//, "")
                .replace(/^www\./, "")
                .split("/")[0];

            // Check if already blocked
            const existingBlock = blockedSites.find(
                (site) => site.domain === cleanDomain,
            );
            if (existingBlock) {
                throw new Error("This website is already blocked");
            }

            // Get rule IDs (we need 8 IDs for the 8 rules)
            const ruleId = await this.getNextRuleId();
            for (let i = 0; i < 7; i++) {
                await this.getNextRuleId(); // Reserve additional IDs
            }

            const startTime = Date.now();
            const endTime = startTime + hours * 60 * 60 * 1000;

            // Create the blocking rules
            const rules = this.createBlockRules(cleanDomain, ruleId);

            console.log(
                `Creating ${rules.length} blocking rules for ${cleanDomain}:`,
                rules,
            );

            // Apply the rules first
            await chrome.declarativeNetRequest.updateDynamicRules({
                addRules: rules,
                removeRuleIds: [],
            });

            // Verify rules were actually added
            const existingRules =
                await chrome.declarativeNetRequest.getDynamicRules();
            const addedRuleIds = rules.map((r) => r.id);
            const actuallyAdded = existingRules.filter((r) =>
                addedRuleIds.includes(r.id),
            );

            if (actuallyAdded.length !== rules.length) {
                // If not all rules were added, clean up the ones that were
                await chrome.declarativeNetRequest.updateDynamicRules({
                    removeRuleIds: actuallyAdded.map((r) => r.id),
                    addRules: [],
                });
                throw new Error(
                    `Failed to add all blocking rules. Added ${actuallyAdded.length} out of ${rules.length} rules.`,
                );
            }

            // Only store the block info if all rules were successfully added
            const blockInfo: BlockedSite = {
                domain: cleanDomain,
                ruleId,
                startTime,
                endTime,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            };

            blockedSites.push(blockInfo);
            await chrome.storage.local.set({
                [WebsiteBlocker.BLOCK_RULES_KEY]: blockedSites,
            });

            console.log(
                `Successfully blocked ${cleanDomain} for ${hours} hours`,
            );
        } catch (error) {
            console.error("Error blocking website:", error);
            throw error;
        }
    }

    public async unlockWebsite(domain: string): Promise<void> {
        await this.ensureInitialized();

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
                throw new Error("This website is not blocked");
            }

            // Remove all eight blocking rules
            const ruleIdsToRemove = [
                siteToUnblock.ruleId,
                siteToUnblock.ruleId + 1,
                siteToUnblock.ruleId + 2,
                siteToUnblock.ruleId + 3,
                siteToUnblock.ruleId + 4,
                siteToUnblock.ruleId + 5,
                siteToUnblock.ruleId + 6,
                siteToUnblock.ruleId + 7,
            ];

            console.log(`Removing rule IDs: ${ruleIdsToRemove.join(", ")}`);

            await chrome.declarativeNetRequest.updateDynamicRules({
                removeRuleIds: ruleIdsToRemove,
                addRules: [],
            });

            // Remove from storage
            const updatedBlockedSites = blockedSites.filter(
                (site) => site.domain !== domain,
            );
            await chrome.storage.local.set({
                [WebsiteBlocker.BLOCK_RULES_KEY]: updatedBlockedSites,
            });

            console.log(`Successfully unblocked ${domain}`);
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
        await this.ensureInitialized();

        const blockedSites = await this.getBlockedSites();
        const now = Date.now();
        const expiredSites = blockedSites.filter((site) => site.endTime <= now);

        for (const site of expiredSites) {
            try {
                await this.unlockWebsite(site.domain);
                console.log(
                    `Automatically unblocked expired site: ${site.domain}`,
                );
            } catch (error) {
                console.error(
                    `Failed to unblock expired site ${site.domain}:`,
                    error,
                );
            }
        }
    }

    // NEW: Force cleanup of all orphaned rules
    public async forceCleanupOrphanedRules(): Promise<void> {
        await this.ensureInitialized();
        await this.cleanupOrphanedRules();
    }

    // Debug method to check current rules
    public async debugRules(): Promise<void> {
        await this.ensureInitialized();

        const rules = await chrome.declarativeNetRequest.getDynamicRules();
        console.log("Current dynamic rules:", rules);

        const blockedSites = await this.getBlockedSites();
        console.log("Blocked sites in storage:", blockedSites);

        // Check for mismatches
        const validRuleIds = new Set<number>();
        for (const site of blockedSites) {
            for (let i = 0; i < 8; i++) {
                validRuleIds.add(site.ruleId + i);
            }
        }

        const orphanedRuleIds = rules
            .map((rule) => rule.id)
            .filter((id) => !validRuleIds.has(id));

        if (orphanedRuleIds.length > 0) {
            console.warn(
                `Found ${orphanedRuleIds.length} orphaned rules:`,
                orphanedRuleIds,
            );
        }
    }

    // Helper method to check if a site is currently blocked
    public async isBlocked(domain: string): Promise<boolean> {
        const blockedSites = await this.getBlockedSites();
        const now = Date.now();

        return blockedSites.some(
            (site) =>
                site.domain === domain &&
                site.startTime <= now &&
                site.endTime > now,
        );
    }

    // Helper method to get time remaining for a blocked site
    public async getTimeRemaining(domain: string): Promise<number> {
        const blockedSites = await this.getBlockedSites();
        const site = blockedSites.find((s) => s.domain === domain);

        if (!site) return 0;

        const remaining = site.endTime - Date.now();
        return Math.max(0, remaining);
    }

    // Format remaining time as human readable
    public formatTimeRemaining(milliseconds: number): string {
        const hours = Math.floor(milliseconds / (1000 * 60 * 60));
        const minutes = Math.floor(
            (milliseconds % (1000 * 60 * 60)) / (1000 * 60),
        );

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else {
            return `${minutes}m`;
        }
    }
}

export const websiteBlocker = new WebsiteBlocker();
