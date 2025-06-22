export interface YouTubeMetadata {
    title: string;
    author_name: string;
    author_url: string;
    thumbnail_url: string;
}

const metadataCache = new Map<string, YouTubeMetadata>();

export const isYouTubeUrl = (url: string): boolean => {
    try {
        const urlObj = new URL(url);
        return (
            urlObj.hostname === "www.youtube.com" ||
            urlObj.hostname === "youtube.com"
        );
    } catch {
        return false;
    }
};

export const getYouTubeVideoId = (url: string): string | null => {
    try {
        const urlObj = new URL(url);
        return urlObj.searchParams.get("v");
    } catch {
        return null;
    }
};

export const fetchYouTubeMetadata = async (
    url: string,
): Promise<YouTubeMetadata | null> => {
    if (!isYouTubeUrl(url)) return null;

    // Check cache first
    if (metadataCache.has(url)) {
        return metadataCache.get(url)!;
    }

    try {
        const response = await fetch(
            `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
        );

        if (!response.ok) return null;

        const data = await response.json();
        const metadata: YouTubeMetadata = {
            title: data.title,
            author_name: data.author_name,
            author_url: data.author_url,
            thumbnail_url: data.thumbnail_url,
        };

        // Cache the result
        metadataCache.set(url, metadata);
        return metadata;
    } catch (error) {
        console.error("Error fetching YouTube metadata:", error);
        return null;
    }
};

export const getFormattedYouTubeLabel = (
    url: string,
    metadata: YouTubeMetadata | null,
): string => {
    if (!metadata) return new URL(url).hostname;
    return `${metadata.author_name} - ${metadata.title}`;
};
