import type { NetworkNode } from "../../../types/network.types";
import { URL_CONSTANTS } from "./constants";

/**
 * Check if URL is a new tab URL
 * Extracted from your original isNewTabUrl function
 */
export const isNewTabUrl = (url: string): boolean => {
    return URL_CONSTANTS.NEW_TAB_URLS.some((newTabUrl) =>
        url.startsWith(newTabUrl),
    );
};

/**
 * Check if URL is a Google search URL
 */
export const isGoogleSearchUrl = (url: string): boolean => {
    try {
        const urlObj = new URL(url);
        const isGoogleDomain = URL_CONSTANTS.GOOGLE_DOMAINS.some((domain) =>
            urlObj.hostname.includes(domain),
        );
        const isSearchPath = URL_CONSTANTS.GOOGLE_SEARCH_PATHS.includes(
            urlObj.pathname,
        );
        return isGoogleDomain && isSearchPath;
    } catch {
        return false;
    }
};

/**
 * Clean and format Google search URLs
 * Extracted from your original cleanGoogleUrl function
 */
export const cleanGoogleUrl = (url: string): string => {
    try {
        const urlObj = new URL(url);
        if (isGoogleSearchUrl(url)) {
            const searchQuery = urlObj.searchParams.get("q");
            if (searchQuery) {
                const truncatedQuery =
                    searchQuery.length > URL_CONSTANTS.SEARCH_QUERY_MAX_LENGTH
                        ? searchQuery.substring(
                              0,
                              URL_CONSTANTS.SEARCH_QUERY_MAX_LENGTH,
                          ) + "..."
                        : searchQuery;
                return `Google: ${truncatedQuery}`;
            }
            return "Google Search";
        }
        return url;
    } catch {
        return url;
    }
};

/**
 * Extract meaningful path segment from URL
 */
export const extractMeaningfulPathSegment = (url: string): string | null => {
    try {
        const urlObj = new URL(url);
        const pathname = urlObj.pathname;

        if (!pathname || pathname === "/" || pathname.length <= 1) {
            return null;
        }

        const segments = pathname
            .split("/")
            .filter((segment) => segment.length > 0);

        if (segments.length === 0) {
            return null;
        }

        // Take the last meaningful segment
        const lastSegment = segments[segments.length - 1];

        // Clean up the segment
        let cleaned = lastSegment;

        // Remove common file extensions
        URL_CONSTANTS.REMOVE_EXTENSIONS.forEach((ext) => {
            if (cleaned.endsWith(ext)) {
                cleaned = cleaned.slice(0, -ext.length);
            }
        });

        // Replace URL encoding and separators
        cleaned = cleaned.replace(/%20/g, " ").replace(/[-_]/g, " ").trim();

        if (cleaned.length <= 2) {
            return null;
        }

        // Truncate if too long
        return cleaned.length > URL_CONSTANTS.URL_SEGMENT_MAX_LENGTH
            ? cleaned.substring(0, URL_CONSTANTS.URL_SEGMENT_MAX_LENGTH) + "..."
            : cleaned;
    } catch {
        return null;
    }
};

/**
 * Get hostname without www prefix
 */
export const getCleanHostname = (url: string): string => {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname.replace(/^www\./, "");
    } catch {
        return url;
    }
};

/**
 * Format URL for display based on available metadata
 * Extracted and enhanced from your original formatUrl function
 */
export const formatUrl = (url: string, node?: NetworkNode): string => {
    try {
        // Handle new tab URLs
        if (isNewTabUrl(url)) {
            return "New Tab";
        }

        // Use page title if available and different from URL
        if (node?.title && node.title.trim() && node.title !== url) {
            const title =
                node.title.length > URL_CONSTANTS.TITLE_MAX_LENGTH
                    ? node.title.substring(0, URL_CONSTANTS.TITLE_MAX_LENGTH) +
                      "..."
                    : node.title;
            return title;
        }

        // Use YouTube metadata if available
        if (node?.youtubeMetadata?.title) {
            const title =
                node.youtubeMetadata.title.length >
                URL_CONSTANTS.TITLE_MAX_LENGTH
                    ? node.youtubeMetadata.title.substring(
                          0,
                          URL_CONSTANTS.TITLE_MAX_LENGTH,
                      ) + "..."
                    : node.youtubeMetadata.title;
            return title;
        }

        // Handle Google search URLs specially
        const cleanedGoogleUrl = cleanGoogleUrl(url);
        if (cleanedGoogleUrl !== url) {
            return cleanedGoogleUrl;
        }

        // Try to extract meaningful path segment
        const pathSegment = extractMeaningfulPathSegment(url);
        if (pathSegment) {
            return pathSegment;
        }

        // Fallback to clean hostname
        return getCleanHostname(url);
    } catch {
        // Final fallback - truncate the original URL
        return url.length > URL_CONSTANTS.TITLE_MAX_LENGTH
            ? url.substring(0, URL_CONSTANTS.TITLE_MAX_LENGTH) + "..."
            : url;
    }
};

/**
 * Get favicon URL for a given website URL
 * Extracted from your original getIconUrl function
 */
export const getIconUrl = (url: string): string => {
    try {
        const urlObj = new URL(url);
        const domain = urlObj.hostname;
        return `${URL_CONSTANTS.FAVICON_SERVICE}?domain=${domain}&sz=${URL_CONSTANTS.FAVICON_SIZE}`;
    } catch {
        // Return empty string for invalid URLs - browser will handle fallback
        return "";
    }
};

/**
 * Get instant fallback icon based on URL domain
 * Returns SVG data URLs for immediate display
 */
export const getFallbackIcon = (url: string): string => {
    try {
        const urlObj = new URL(url);
        const domain = urlObj.hostname.toLowerCase();

        // Common site icons
        if (domain.includes("youtube")) {
            return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='%23ff0000'%3E%3Cpath d='M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z'/%3E%3C/svg%3E";
        }
        if (domain.includes("google")) {
            return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24'%3E%3Cpath fill='%234285f4' d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'/%3E%3Cpath fill='%2334a853' d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'/%3E%3Cpath fill='%23fbbc05' d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'/%3E%3Cpath fill='%23ea4335' d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'/%3E%3C/svg%3E";
        }
        if (domain.includes("instagram")) {
            return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24'%3E%3Cpath fill='url(%23a)' d='M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z'/%3E%3Cdefs%3E%3ClinearGradient id='a' x1='0%25' x2='100%25' y1='0%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23f09433'/%3E%3Cstop offset='25%25' stop-color='%23e6683c'/%3E%3Cstop offset='50%25' stop-color='%23dc2743'/%3E%3Cstop offset='75%25' stop-color='%23cc2366'/%3E%3Cstop offset='100%25' stop-color='%23bc1888'/%3E%3C/linearGradient%3E%3C/defs%3E%3C/svg%3E";
        }
        if (domain.includes("twitter") || domain.includes("x.com")) {
            return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='%23000'%3E%3Cpath d='M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z'/%3E%3C/svg%3E";
        }

        // Generic website icon
        return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='%23666'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z'/%3E%3C/svg%3E";
    } catch {
        return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='%23666'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z'/%3E%3C/svg%3E";
    }
};

/**
 * Extract search query from Google search URL
 */
export const extractGoogleSearchQuery = (url: string): string | null => {
    try {
        if (!isGoogleSearchUrl(url)) {
            return null;
        }

        const urlObj = new URL(url);
        return urlObj.searchParams.get("q");
    } catch {
        return null;
    }
};

/**
 * Check if a search term matches a node's content
 * Used for search functionality
 */
export const nodeMatchesSearchTerm = (
    node: NetworkNode,
    searchTerm: string,
): boolean => {
    if (!searchTerm.trim()) {
        return false;
    }

    const searchTermLower = searchTerm.toLowerCase();

    // Check URL
    const nodeUrl = node.url.toLowerCase();
    if (nodeUrl.includes(searchTermLower)) {
        return true;
    }

    // Check page title
    const nodeTitle = node.title?.toLowerCase() || "";
    if (nodeTitle.includes(searchTermLower)) {
        return true;
    }

    // Check YouTube metadata
    const youtubeTitle = (node.youtubeMetadata?.title || "").toLowerCase();
    if (youtubeTitle.includes(searchTermLower)) {
        return true;
    }

    // Check YouTube author
    const youtubeAuthor = (
        node.youtubeMetadata?.author_name || ""
    ).toLowerCase();
    if (youtubeAuthor.includes(searchTermLower)) {
        return true;
    }

    // Special handling for Google search URLs
    if (isGoogleSearchUrl(node.url)) {
        const searchQuery = extractGoogleSearchQuery(node.url);
        if (
            searchQuery &&
            searchQuery.toLowerCase().includes(searchTermLower)
        ) {
            return true;
        }
    }

    return false;
};

/**
 * Get display title for tooltip content
 */
export const getTooltipTitle = (node: NetworkNode): string => {
    if (node.youtubeMetadata) {
        return node.youtubeMetadata.title;
    }

    if (isNewTabUrl(node.url)) {
        return "New Tab";
    }

    if (node.title && node.title.trim() && node.title !== node.url) {
        return node.title;
    }

    // Special handling for Google search URLs
    if (isGoogleSearchUrl(node.url)) {
        const searchQuery = extractGoogleSearchQuery(node.url);
        if (searchQuery) {
            return `Google Search: "${searchQuery}"`;
        }
        return "Google Search";
    }

    return formatUrl(node.url, node);
};

/**
 * Get display subtitle for tooltip content (e.g., YouTube author)
 */
export const getTooltipSubtitle = (node: NetworkNode): string | null => {
    if (node.youtubeMetadata?.author_name) {
        return `by ${node.youtubeMetadata.author_name}`;
    }

    return null;
};

/**
 * Validate if a URL is properly formatted
 */
export const isValidUrl = (url: string): boolean => {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
};

/**
 * Normalize URL for comparison (remove trailing slashes, fragments, etc.)
 */
export const normalizeUrl = (url: string): string => {
    try {
        const urlObj = new URL(url);

        // Remove fragment
        urlObj.hash = "";

        // Remove trailing slash from pathname (except for root)
        if (urlObj.pathname !== "/" && urlObj.pathname.endsWith("/")) {
            urlObj.pathname = urlObj.pathname.slice(0, -1);
        }

        // Sort search parameters for consistency
        urlObj.searchParams.sort();

        return urlObj.toString();
    } catch {
        return url;
    }
};

/**
 * Extract domain from URL
 */
export const extractDomain = (url: string): string => {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname;
    } catch {
        return "";
    }
};

/**
 * Check if two URLs are from the same domain
 */
export const isSameDomain = (url1: string, url2: string): boolean => {
    const domain1 = extractDomain(url1);
    const domain2 = extractDomain(url2);
    return domain1 === domain2 && domain1 !== "";
};

/**
 * Get URL protocol (http, https, chrome, etc.)
 */
export const getUrlProtocol = (url: string): string => {
    try {
        const urlObj = new URL(url);
        return urlObj.protocol.replace(":", "");
    } catch {
        return "";
    }
};

/**
 * Check if URL is a secure HTTPS URL
 */
export const isSecureUrl = (url: string): boolean => {
    return getUrlProtocol(url) === "https";
};
