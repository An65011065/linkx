import type { BlockedSite } from "../shared/types/common.types";

class WebsiteBlocker {
    private static readonly BLOCK_RULES_KEY = "blocked_sites";
    private static readonly BLOCK_RULE_ID_COUNTER_KEY = "block_rule_id_counter";
    private static readonly OVERRIDE_LIST_KEY = "override_list";
    private currentRuleId = 1;
    private initPromise: Promise<void> | null = null;
    private temporaryAllowList = new Set<string>(); // Track temporarily allowed URLs

    constructor() {
        this.initPromise = this.initialize();
    }

    private async initialize() {
        const [counterData, overrideData] = await Promise.all([
            chrome.storage.local.get(WebsiteBlocker.BLOCK_RULE_ID_COUNTER_KEY),
            chrome.storage.local.get(WebsiteBlocker.OVERRIDE_LIST_KEY),
        ]);

        this.currentRuleId =
            counterData[WebsiteBlocker.BLOCK_RULE_ID_COUNTER_KEY] || 1;

        // Initialize the temporaryAllowList from storage
        const storedOverrides =
            overrideData[WebsiteBlocker.OVERRIDE_LIST_KEY] || [];
        this.temporaryAllowList = new Set(storedOverrides);

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
        const cleanDomain = domain
            .replace(/^https?:\/\//, "")
            .replace(/^www\./, "")
            .split("/")[0];

        const rules: chrome.declarativeNetRequest.Rule[] = [];

        // Create redirect rules for main domain and www version
        rules.push({
            id: ruleId,
            priority: 100,
            action: {
                type: "redirect",
                redirect: {
                    transform: {
                        queryTransform: {
                            addOrReplaceParams: [
                                { key: "from", value: "{url}" },
                            ],
                        },
                        scheme: "chrome-extension",
                        host: chrome.runtime.id,
                        path: "/waterfall.html",
                    },
                },
            },
            condition: {
                urlFilter: `||${cleanDomain}`,
                resourceTypes: ["main_frame"],
            },
        });

        // Add rule for www version
        rules.push({
            id: ruleId + 1,
            priority: 100,
            action: {
                type: "redirect",
                redirect: {
                    transform: {
                        queryTransform: {
                            addOrReplaceParams: [
                                { key: "from", value: "{url}" },
                            ],
                        },
                        scheme: "chrome-extension",
                        host: chrome.runtime.id,
                        path: "/waterfall.html",
                    },
                },
            },
            condition: {
                urlFilter: `||www.${cleanDomain}`,
                resourceTypes: ["main_frame"],
            },
        });

        // Add rule for all subdomains
        rules.push({
            id: ruleId + 2,
            priority: 99,
            action: {
                type: "redirect",
                redirect: {
                    transform: {
                        queryTransform: {
                            addOrReplaceParams: [
                                { key: "from", value: "{url}" },
                            ],
                        },
                        scheme: "chrome-extension",
                        host: chrome.runtime.id,
                        path: "/waterfall.html",
                    },
                },
            },
            condition: {
                regexFilter: `^https?://.*\\.${cleanDomain.replace(
                    /\./g,
                    "\\.",
                )}(/.*)?$`,
                resourceTypes: ["main_frame"],
            },
        });

        return rules;
    }

    // Allow temporary access to a blocked site (permanently overrides until manually unlocked)
    public async allowTemporaryAccess(url: string): Promise<boolean> {
        try {
            await this.ensureInitialized();

            console.log(`Allowing permanent override access to: ${url}`);

            // Parse the URL to get the domain
            const urlObj = new URL(url);
            const domain = urlObj.hostname.replace(/^www\./, "");

            // Check if this domain is currently blocked
            const blockedSites = await this.getBlockedSites();
            const blockedSite = blockedSites.find(
                (site) => site.domain === domain,
            );

            if (!blockedSite) {
                console.log(`Domain ${domain} is not currently blocked`);
                return true; // Not blocked, so allow access
            }

            // Add to temporary allow list and persist it
            this.temporaryAllowList.add(url);
            await chrome.storage.local.set({
                [WebsiteBlocker.OVERRIDE_LIST_KEY]: Array.from(
                    this.temporaryAllowList,
                ),
            });

            // Remove the blocking rules permanently until manually unlocked
            const ruleIdsToRemove = [
                blockedSite.ruleId,
                blockedSite.ruleId + 1,
                blockedSite.ruleId + 2,
            ];

            console.log(
                `Permanently removing rules until manual unlock: ${ruleIdsToRemove.join(
                    ", ",
                )}`,
            );

            await chrome.declarativeNetRequest.updateDynamicRules({
                removeRuleIds: ruleIdsToRemove,
                addRules: [],
            });

            console.log(`Domain ${domain} is now overridden and accessible`);
            return true;
        } catch (error) {
            console.error("Error allowing temporary access:", error);
            return false;
        }
    }

    // Check if a domain is temporarily overridden
    public isTemporarilyOverridden(domain: string): boolean {
        // Check if any URL with this domain is in the temporary allow list
        for (const url of this.temporaryAllowList) {
            try {
                const urlObj = new URL(url);
                const urlDomain = urlObj.hostname.replace(/^www\./, "");
                if (urlDomain === domain) {
                    return true;
                }
            } catch (err) {
                // Invalid URL, skip
                console.debug(`Invalid URL format for ${url}:`, err);
                continue;
            }
        }
        return false;
    }

    // Clean up orphaned rules on startup
    private async cleanupOrphanedRules(): Promise<void> {
        try {
            const [currentRules, blockedSites] = await Promise.all([
                chrome.declarativeNetRequest.getDynamicRules(),
                this.getBlockedSites(),
            ]);

            // Get all rule IDs that should exist based on stored sites
            const validRuleIds = new Set<number>();
            for (const site of blockedSites) {
                // Each site now has 3 rules
                for (let i = 0; i < 3; i++) {
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

            // Remove the three redirect rules
            const ruleIdsToRemove = [
                siteToUnblock.ruleId,
                siteToUnblock.ruleId + 1,
                siteToUnblock.ruleId + 2,
            ];

            console.log(`Removing rule IDs: ${ruleIdsToRemove.join(", ")}`);

            await chrome.declarativeNetRequest.updateDynamicRules({
                removeRuleIds: ruleIdsToRemove,
                addRules: [],
            });

            // Clear from temporary allow list if it exists and update storage
            const updatedAllowList = new Set(this.temporaryAllowList);
            for (const url of this.temporaryAllowList) {
                try {
                    const urlObj = new URL(url);
                    const urlDomain = urlObj.hostname.replace(/^www\./, "");
                    if (urlDomain === domain) {
                        updatedAllowList.delete(url);
                    }
                } catch (err) {
                    // Invalid URL, skip
                    console.debug(`Invalid URL format for ${url}:`, err);
                    continue;
                }
            }
            this.temporaryAllowList = updatedAllowList;
            await chrome.storage.local.set({
                [WebsiteBlocker.OVERRIDE_LIST_KEY]: Array.from(
                    this.temporaryAllowList,
                ),
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

    // Force cleanup of all orphaned rules
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
