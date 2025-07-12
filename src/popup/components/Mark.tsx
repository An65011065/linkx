import React, { useState, useEffect } from "react";
import { Bookmark } from "lucide-react";

interface SmartBookmark {
    id: string;
    url: string;
    title: string;
    status: "active" | "expired";
    openCount: number;
    lastOpened: number;
    createdAt: number;
    expiresAt: number;
}

const BookmarkButton: React.FC = () => {
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [currentTab, setCurrentTab] = useState<chrome.tabs.Tab | null>(null);

    useEffect(() => {
        // Get current tab info
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                setCurrentTab(tabs[0]);
                checkIfBookmarked(tabs[0].url || "");
            }
        });
    }, []);

    const checkIfBookmarked = async (url: string) => {
        try {
            const result = await chrome.storage.local.get(["smartBookmarks"]);
            if (result.smartBookmarks) {
                const bookmarks = JSON.parse(result.smartBookmarks);
                const existingBookmark = bookmarks.find(
                    (b: SmartBookmark) =>
                        b.url === url && b.status === "active",
                );
                setIsBookmarked(!!existingBookmark);
            }
        } catch (error) {
            console.error("Error checking bookmark status:", error);
        }
    };

    const handleBookmark = async () => {
        if (!currentTab?.url || !currentTab?.title) return;

        setIsLoading(true);

        try {
            const result = await chrome.storage.local.get(["smartBookmarks"]);
            let bookmarks: SmartBookmark[] = [];

            if (result.smartBookmarks) {
                bookmarks = JSON.parse(result.smartBookmarks);
            }

            if (isBookmarked) {
                // Remove bookmark
                bookmarks = bookmarks.filter((b) => b.url !== currentTab.url);
                setIsBookmarked(false);
            } else {
                // Add bookmark
                const now = Date.now();
                const newBookmark: SmartBookmark = {
                    id: `bookmark_${now}`,
                    url: currentTab.url,
                    title: currentTab.title,
                    status: "active",
                    openCount: 0,
                    lastOpened: 0,
                    createdAt: now,
                    expiresAt: now + 3 * 24 * 60 * 60 * 1000, // 3 days from now
                };
                bookmarks.push(newBookmark);
                setIsBookmarked(true);
            }

            // Save updated bookmarks
            await chrome.storage.local.set({
                smartBookmarks: JSON.stringify(bookmarks),
            });
        } catch (error) {
            console.error("Error updating bookmark:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            onClick={handleBookmark}
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                cursor: isLoading ? "not-allowed" : "pointer",
                padding: "6px",
                borderRadius: "10px",
                transition: "all 0.2s ease",
                opacity: isLoading ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
                if (!isLoading) {
                    e.currentTarget.style.backgroundColor = "#e9ecef";
                }
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
            }}
        >
            {isLoading ? (
                <div
                    style={{
                        width: "24px",
                        height: "24px",
                        border: "2px solid #e9ecef",
                        borderTop: "2px solid #4285f4",
                        borderRadius: "50%",
                        animation: "spin 1s linear infinite",
                    }}
                />
            ) : isBookmarked ? (
                <Bookmark
                    size={24}
                    color="#dc3545"
                    fill="#dc3545"
                    strokeWidth={2}
                />
            ) : (
                <Bookmark size={24} color="#495057" strokeWidth={2} />
            )}
            <span
                style={{
                    fontSize: "12px",
                    fontFamily: "Nunito-Regular",
                    color: "#2c3e50",
                    fontWeight: "500",
                    marginTop: "4px",
                }}
            >
                Bookmark
            </span>
        </div>
    );
};

export default BookmarkButton;
