import React, { useState, useEffect } from "react";
import { Bookmark, Calendar, Clock, ExternalLink } from "lucide-react";

interface SmartBookmark {
    id: string;
    url: string;
    title: string;
    favicon?: string;
    status: "active" | "expired";
    openCount: number;
    lastOpened: number;
    createdAt: number;
    expiresAt: number;
}

interface SmartBookmarksProps {
    isDarkMode: boolean;
}

const SmartBookmarks: React.FC<SmartBookmarksProps> = ({ isDarkMode }) => {
    const [bookmarks, setBookmarks] = useState<SmartBookmark[]>([]);
    const [hoveredUrl, setHoveredUrl] = useState<string | null>(null);

    // Load bookmarks from storage
    useEffect(() => {
        loadBookmarks();
        const interval = setInterval(checkExpiredBookmarks, 60000); // Check every minute
        return () => clearInterval(interval);
    }, []);

    const loadBookmarks = async () => {
        try {
            const result = await chrome.storage.local.get(["smartBookmarks"]);
            if (result.smartBookmarks) {
                const loadedBookmarks = JSON.parse(result.smartBookmarks);
                setBookmarks(loadedBookmarks);
            }
        } catch (error) {
            console.error("Error loading bookmarks:", error);
        }
    };

    const saveBookmarks = async (updatedBookmarks: SmartBookmark[]) => {
        try {
            await chrome.storage.local.set({
                smartBookmarks: JSON.stringify(updatedBookmarks),
            });
            setBookmarks(updatedBookmarks);
        } catch (error) {
            console.error("Error saving bookmarks:", error);
        }
    };

    const checkExpiredBookmarks = () => {
        const now = Date.now();
        const updatedBookmarks = bookmarks.map((bookmark) => {
            if (bookmark.status === "active" && now > bookmark.expiresAt) {
                return { ...bookmark, status: "expired" as const };
            }
            return bookmark;
        });

        if (JSON.stringify(updatedBookmarks) !== JSON.stringify(bookmarks)) {
            saveBookmarks(updatedBookmarks);
        }
    };

    const handleBookmarkClick = async (bookmark: SmartBookmark) => {
        if (bookmark.status === "expired") return;

        // Open in new tab
        window.open(bookmark.url, "_blank");

        // Update bookmark stats
        const now = Date.now();
        const updatedBookmarks = bookmarks.map((b) => {
            if (b.id === bookmark.id) {
                return {
                    ...b,
                    openCount: b.openCount + 1,
                    lastOpened: now,
                    expiresAt: now + 3 * 24 * 60 * 60 * 1000, // Reset 3-day timer
                    status: "active" as const,
                };
            }
            return b;
        });

        await saveBookmarks(updatedBookmarks);
    };

    const addBookmark = async (url: string, title: string) => {
        const now = Date.now();
        const newBookmark: SmartBookmark = {
            id: `bookmark_${now}`,
            url,
            title,
            status: "active",
            openCount: 0,
            lastOpened: 0,
            createdAt: now,
            expiresAt: now + 3 * 24 * 60 * 60 * 1000, // 3 days from now
        };

        const updatedBookmarks = [...bookmarks, newBookmark];
        await saveBookmarks(updatedBookmarks);
    };

    const getFavicon = (url: string) => {
        try {
            const domain = new URL(url).hostname;
            return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
        } catch {
            return null;
        }
    };

    const formatDomain = (url: string) => {
        try {
            const domain = new URL(url).hostname;
            return domain.replace("www.", "");
        } catch {
            return url;
        }
    };

    const getTimeUntilExpiry = (expiresAt: number) => {
        const now = Date.now();
        const timeLeft = expiresAt - now;
        const hours = Math.floor(timeLeft / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d`;
        if (hours > 0) return `${hours}h`;
        return "Soon";
    };

    // Filter out expired bookmarks and sort by open count (desc), then by last opened (desc)
    const activeBookmarks = bookmarks
        .filter((bookmark) => bookmark.status === "active")
        .sort((a, b) => {
            // Prioritize open count, then last opened
            if (a.openCount !== b.openCount) {
                return b.openCount - a.openCount;
            }
            return b.lastOpened - a.lastOpened;
        });

    // Show only first 8 active bookmarks in grid
    const displayedBookmarks = activeBookmarks.slice(0, 8);

    return (
        <div
            className={`
                w-full h-full rounded-lg p-3 transition-all duration-300
                ${
                    isDarkMode
                        ? "bg-white/5 border border-white/10"
                        : "bg-white border border-gray-200 shadow-lg"
                }
            `}
            style={{ overflow: "visible" }}
        >
            {/* Title */}
            <div className="flex items-center gap-2 mb-2">
                <Bookmark
                    size={16}
                    className={isDarkMode ? "text-white" : "text-gray-700"}
                />
                <h3
                    className={`text-sm font-medium ${
                        isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                >
                    Smart Bookmarks
                </h3>
            </div>

            {/* Grid - 4 columns x 2 rows */}
            <div className="flex-1">
                {displayedBookmarks.length > 0 ? (
                    <div className="grid grid-cols-4 gap-1 mb-3">
                        {displayedBookmarks.map((bookmark) => (
                            <div
                                key={bookmark.id}
                                onMouseEnter={() => setHoveredUrl(bookmark.url)}
                                onMouseLeave={() => setHoveredUrl(null)}
                                onClick={() => handleBookmarkClick(bookmark)}
                                className={`
                                    flex flex-col items-center gap-1 p-1 rounded-lg 
                                    transition-all duration-200 cursor-pointer
                                    hover:-translate-y-0.5
                                    ${
                                        isDarkMode
                                            ? "hover:bg-white/10"
                                            : "hover:bg-gray-50 hover:shadow-md"
                                    }
                                    ${
                                        hoveredUrl === bookmark.url
                                            ? isDarkMode
                                                ? "bg-white/15 scale-105"
                                                : "bg-blue-50 scale-105"
                                            : ""
                                    }
                                `}
                            >
                                {/* Favicon - Larger Size */}
                                <div className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center">
                                    {getFavicon(bookmark.url) ? (
                                        <img
                                            src={getFavicon(bookmark.url) || ""}
                                            alt=""
                                            className="w-10 h-10"
                                            onError={(e) => {
                                                e.currentTarget.style.display =
                                                    "none";
                                            }}
                                        />
                                    ) : (
                                        <ExternalLink
                                            size={24}
                                            className={
                                                isDarkMode
                                                    ? "text-white/60"
                                                    : "text-gray-400"
                                            }
                                        />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div
                        className={`text-center text-xs mb-3 ${
                            isDarkMode ? "text-white/50" : "text-gray-500"
                        }`}
                    >
                        No bookmarks yet
                    </div>
                )}
            </div>

            {/* Hover tooltip */}
            {hoveredUrl && (
                <div
                    className={`
                        fixed pointer-events-none z-50
                        rounded-lg shadow-xl p-3 min-w-48 max-w-64 border 
                        backdrop-blur-sm
                        ${
                            isDarkMode
                                ? "bg-gray-900/90 border-white/20 text-white"
                                : "bg-white/90 border-gray-200 text-gray-900"
                        }
                    `}
                    style={{
                        left: "50%",
                        top: "10px",
                        transform: "translateX(-50%)",
                    }}
                >
                    <div className="font-medium text-sm mb-1">
                        {formatDomain(hoveredUrl)}
                    </div>
                    <div
                        className={`text-xs break-all ${
                            isDarkMode ? "text-white/70" : "text-gray-600"
                        }`}
                    >
                        {hoveredUrl}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SmartBookmarks;
