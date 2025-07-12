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
        let hostname = urlObj.hostname.replace(/^www\./, "");
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

                // Create nodes for each unique normalized URL
                const nodes = new Map<string, NetworkNode>();

                // Process visits and create base nodes
                for (const visit of visits) {
                    const normalizedUrl = normalizeUrl(visit.url);
                    if (!nodes.has(normalizedUrl)) {
                        nodes.set(normalizedUrl, {
                            id: normalizedUrl,
                            url: normalizedUrl,
                            domain: visit.domain,
                            title: visit.title || visit.url,
                            totalTime: 0,
                            activeTime: 0,
                            lastVisited: visit.startTime,
                            category: visit.category,

                            originalUrls: new Set([visit.url]),
                            youtubeMetadata: null, // Add this field
                        });
                    } else {
                        nodes.get(normalizedUrl)!.originalUrls.add(visit.url);
                        if (
                            visit.title &&
                            (!nodes.get(normalizedUrl)!.title ||
                                nodes.get(normalizedUrl)!.title ===
                                    nodes.get(normalizedUrl)!.url)
                        ) {
                            nodes.get(normalizedUrl)!.title = visit.title;
                        }
                    }

                    const node = nodes.get(normalizedUrl)!;
                    node.totalTime += visit.duration;
                    if (visit.isActive) {
                        node.activeTime += visit.duration;
                    }
                    node.lastVisited = Math.max(
                        node.lastVisited,
                        visit.startTime,
                    );
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
                            // Update the display title for YouTube nodes
                            node.displayName = metadata.author_name;
                            node.tooltipTitle = metadata.title;
                        }
                    }),
                );

                // Create links between nodes based on navigation
                const links = new Map<string, NetworkLink>();
                visits.forEach((visit: UrlVisit) => {
                    // For chain navigation, use the previous visit in the same tab
                    if (visit.creationMode === "chain") {
                        const previousVisits = visits.filter(
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

                            const sourceNode = nodes.get(
                                normalizeUrl(previousVisit.url),
                            );
                            const targetNode = nodes.get(
                                normalizeUrl(visit.url),
                            );

                            if (
                                sourceNode &&
                                targetNode &&
                                sourceNode !== targetNode
                            ) {
                                const linkId = `${sourceNode.id}->${targetNode.id}`;
                                const existingLink = links.get(linkId);

                                if (existingLink) {
                                    existingLink.weight++;
                                    existingLink.transitions.push({
                                        timestamp: visit.startTime,
                                        sourceType: visit.creationMode,
                                    });
                                } else {
                                    links.set(linkId, {
                                        source: sourceNode.id,
                                        target: targetNode.id,
                                        weight: 1,
                                        transitions: [
                                            {
                                                timestamp: visit.startTime,
                                                sourceType: visit.creationMode,
                                            },
                                        ],
                                    });
                                }
                            }
                        }
                    }
                    // For hyperlink navigation, use the sourceInfo
                    else if (
                        visit.creationMode === "hyperlink" &&
                        visit.sourceInfo
                    ) {
                        const sourceNode = nodes.get(
                            normalizeUrl(visit.sourceInfo.url),
                        );
                        const targetNode = nodes.get(normalizeUrl(visit.url));

                        if (
                            sourceNode &&
                            targetNode &&
                            sourceNode !== targetNode
                        ) {
                            const linkId = `${sourceNode.id}->${targetNode.id}`;
                            const existingLink = links.get(linkId);

                            if (existingLink) {
                                existingLink.weight++;
                                existingLink.transitions.push({
                                    timestamp: visit.startTime,
                                    sourceType: visit.creationMode,
                                });
                            } else {
                                links.set(linkId, {
                                    source: sourceNode.id,
                                    target: targetNode.id,
                                    weight: 1,
                                    transitions: [
                                        {
                                            timestamp: visit.startTime,
                                            sourceType: visit.creationMode,
                                        },
                                    ],
                                });
                            }
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
