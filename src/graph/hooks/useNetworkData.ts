// useNetworkData.ts - Hook for managing network data

import { useEffect, useState } from "react";
import DataService from "../../data/dataService";
import type { UrlVisit } from "../../shared/types/browsing.types";
import type {
    NetworkData,
    NetworkLink,
    NetworkNode,
} from "../types/network.types";
import { isYouTubeUrl, fetchYouTubeMetadata } from "../utils/youtubeMetadata";

interface NetworkDataState extends NetworkData {
    loading: boolean;
    error: string | null;
}

// Function to normalize URLs
const normalizeUrl = (url: string): string => {
    try {
        // Handle new tab URLs
        if (
            url.startsWith("chrome://newtab") ||
            url.startsWith("about:newtab")
        ) {
            return "about:newtab";
        }

        const urlObj = new URL(url);
        // Remove www. prefix
        const hostname = urlObj.hostname.replace(/^www\./, "");
        // Remove trailing slashes
        let pathname = urlObj.pathname.replace(/\/$/, "");
        // Remove common index files
        pathname = pathname.replace(/\/(index\.(html?|php|asp|jsp))?$/, "");
        // Combine and normalize
        return `${urlObj.protocol}//${hostname}${pathname}${urlObj.search}`;
    } catch {
        return url; // Return original URL if parsing fails
    }
};

export function useNetworkData() {
    const [networkData, setNetworkData] = useState<NetworkDataState>({
        nodes: [],
        links: [],
        loading: true,
        error: null,
    });

    useEffect(() => {
        const loadNetworkData = async () => {
            try {
                const dataService = DataService.getInstance();
                const visits = await dataService.getAllUrlVisits();

                // Sort visits by timestamp to maintain chronological order
                const sortedVisits = visits.sort(
                    (a, b) => a.startTime - b.startTime,
                );

                // Create nodes for each visit instance (not just unique URLs)
                const nodes = new Map<string, NetworkNode>();
                const visitToNodeId = new Map<string, string>(); // visit.id -> node.id

                // Process visits and create separate nodes for each visit instance
                for (const visit of sortedVisits) {
                    const normalizedUrl = normalizeUrl(visit.url);

                    // Create unique node ID for this visit instance
                    const nodeId = `${normalizedUrl}_${visit.id}`;
                    visitToNodeId.set(visit.id, nodeId);

                    // Create a new node for each visit instance
                    nodes.set(nodeId, {
                        id: nodeId,
                        url: normalizedUrl,
                        domain: visit.domain,
                        title: visit.title || visit.url,
                        totalTime: visit.duration,
                        activeTime: visit.isActive ? visit.duration : 0,
                        lastVisited: visit.startTime,
                        category: visit.category,
                        originalUrls: new Set([visit.url]),
                        youtubeMetadata: null,
                        // Add visit metadata to help with layout
                        visitId: visit.id,
                        visitTimestamp: visit.startTime,
                    });
                }

                // Fetch YouTube metadata for YouTube nodes
                const youtubeNodes = Array.from(nodes.values()).filter((node) =>
                    isYouTubeUrl(node.url),
                );
                await Promise.all(
                    youtubeNodes.map(async (node) => {
                        const metadata = await fetchYouTubeMetadata(node.url);
                        if (metadata) {
                            node.youtubeMetadata = metadata;
                            node.displayName = metadata.author_name;
                            node.tooltipTitle = metadata.title;
                        }
                    }),
                );

                // Create links between visit instances based on navigation
                const links = new Map<string, NetworkLink>();

                sortedVisits.forEach((visit: UrlVisit) => {
                    const targetNodeId = visitToNodeId.get(visit.id);
                    if (!targetNodeId) return;

                    let sourceNodeId: string | null = null;

                    // For chain navigation, find the previous visit in the same tab
                    if (visit.creationMode === "chain") {
                        const previousVisits = sortedVisits.filter(
                            (v) =>
                                v.tabId === visit.tabId &&
                                v.endTime &&
                                v.endTime <= visit.startTime,
                        );

                        if (previousVisits.length > 0) {
                            // Get the most recent previous visit
                            const previousVisit = previousVisits.reduce(
                                (latest, current) =>
                                    !latest ||
                                    (current.endTime &&
                                        current.endTime > latest.endTime!)
                                        ? current
                                        : latest,
                            );
                            sourceNodeId =
                                visitToNodeId.get(previousVisit.id) || null;
                        }
                    }
                    // For hyperlink navigation, use the sourceInfo
                    else if (
                        visit.creationMode === "hyperlink" &&
                        visit.sourceInfo
                    ) {
                        // Find the source visit that matches the sourceInfo
                        const sourceVisit = sortedVisits.find(
                            (v) =>
                                v.url === visit.sourceInfo!.url &&
                                v.tabId === visit.sourceInfo!.tabId &&
                                v.startTime < visit.startTime,
                        );
                        if (sourceVisit) {
                            sourceNodeId =
                                visitToNodeId.get(sourceVisit.id) || null;
                        }
                    }

                    // Create link if we found a valid source
                    if (sourceNodeId && sourceNodeId !== targetNodeId) {
                        const linkId = `${sourceNodeId}->${targetNodeId}`;

                        if (!links.has(linkId)) {
                            links.set(linkId, {
                                source: sourceNodeId,
                                target: targetNodeId,
                                weight: 1,
                                transitions: [
                                    {
                                        timestamp: visit.startTime,
                                        sourceType: visit.creationMode,
                                    },
                                ],
                            });
                        } else {
                            // This shouldn't happen with unique visit instances, but just in case
                            const existingLink = links.get(linkId)!;
                            existingLink.weight++;
                            existingLink.transitions.push({
                                timestamp: visit.startTime,
                                sourceType: visit.creationMode,
                            });
                        }
                    }
                });

                setNetworkData({
                    nodes: Array.from(nodes.values()),
                    links: Array.from(links.values()),
                    loading: false,
                    error: null,
                });
            } catch (error) {
                setNetworkData((prev) => ({
                    ...prev,
                    loading: false,
                    error:
                        error instanceof Error
                            ? error.message
                            : "Unknown error occurred",
                }));
            }
        };

        loadNetworkData();
    }, []);

    return networkData;
}
