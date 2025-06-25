import type { BlockedSite } from "../shared/types/common.types";

class WebsiteBlocker {
    private static readonly BLOCK_RULES_KEY = "blocked_sites";
    private static readonly BLOCK_RULE_ID_COUNTER_KEY = "block_rule_id_counter";
    private currentRuleId = 1;

    constructor() {
        this.initialize();
    }

    private async initialize() {
        // Load the current rule ID counter
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
            action: {
                type: chrome.declarativeNetRequest.RuleActionType.BLOCK,
            },
            condition: {
                urlFilter: `||${domain}/*`,
                resourceTypes: [
                    chrome.declarativeNetRequest.ResourceType.MAIN_FRAME,
                    chrome.declarativeNetRequest.ResourceType.SUB_FRAME,
                ],
            },
        };
    }

    public async blockWebsite(domain: string, hours: number): Promise<void> {
        try {
            // Get current blocked sites
            const data = await chrome.storage.local.get(
                WebsiteBlocker.BLOCK_RULES_KEY,
            );
            const blockedSites: BlockedSite[] =
                data[WebsiteBlocker.BLOCK_RULES_KEY] || [];

            // Check if site is already blocked
            const existingBlock = blockedSites.find(
                (site) => site.domain === domain,
            );
            if (existingBlock) {
                throw new Error("This website is already blocked");
            }

            // Create new rule
            const ruleId = await this.getNextRuleId();
            const rule = this.createBlockRule(domain, ruleId);

            // Add blocking rule
            await chrome.declarativeNetRequest.updateDynamicRules({
                addRules: [rule],
                removeRuleIds: [],
            });

            // Store block information
            const blockInfo: BlockedSite = {
                domain,
                ruleId,
                startTime: Date.now(),
                endTime: Date.now() + hours * 60 * 60 * 1000, // Convert hours to milliseconds
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

    public async unblockWebsite(domain: string): Promise<void> {
        try {
            // Get current blocked sites
            const data = await chrome.storage.local.get(
                WebsiteBlocker.BLOCK_RULES_KEY,
            );
            const blockedSites: BlockedSite[] =
                data[WebsiteBlocker.BLOCK_RULES_KEY] || [];

            // Find the block rule for this domain
            const siteToUnblock = blockedSites.find(
                (site) => site.domain === domain,
            );
            if (!siteToUnblock) {
                throw new Error("This website is not blocked");
            }

            // Remove the blocking rule
            await chrome.declarativeNetRequest.updateDynamicRules({
                removeRuleIds: [siteToUnblock.ruleId],
                addRules: [],
            });

            // Update stored blocked sites
            const updatedBlockedSites = blockedSites.filter(
                (site) => site.domain !== domain,
            );
            await chrome.storage.local.set({
                [WebsiteBlocker.BLOCK_RULES_KEY]: updatedBlockedSites,
            });
        } catch (error) {
            console.error("Error unblocking website:", error);
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
            await this.unblockWebsite(site.domain);
        }
    }
}

export const websiteBlocker = new WebsiteBlocker();
