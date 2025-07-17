import React, { useState, useEffect, useRef } from "react";
import {
    Search,
    FileText,
    GitBranch,
    Calendar,
    Clock,
    Bookmark,
    Hash,
    Globe,
    ExternalLink,
} from "lucide-react";

interface SearchMatch {
    tabId: number;
    title: string;
    url: string;
    domain: string;
    favicon: string;
    matchCount: number;
    context: string;
}

interface SpotlightSearchProps {
    onClose: () => void;
    isVisible: boolean;
}

const SpotlightSearch: React.FC<SpotlightSearchProps> = ({
    onClose,
    isVisible,
}) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [matches, setMatches] = useState<SearchMatch[]>([]);
    const [loading, setLoading] = useState(false);
    const [allTabs, setAllTabs] = useState<any[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);

    // Static command options
    const staticCommands = [
        {
            id: "new-doc",
            icon: FileText,
            title: "Create a new text document",
            type: "command" as const,
            action: () => {
                console.log("Creating new document...");
                if (typeof chrome !== "undefined" && chrome.runtime) {
                    chrome.runtime.sendMessage({ type: "CREATE_DOCUMENT" });
                }
                onClose();
            },
        },
        {
            id: "new-repo",
            icon: GitBranch,
            title: "New Git Repository",
            subtitle: "Initialize a new git repository",
            type: "command" as const,
            action: () => {
                console.log("Creating new git repository...");
                if (typeof chrome !== "undefined" && chrome.runtime) {
                    chrome.runtime.sendMessage({ type: "CREATE_REPOSITORY" });
                }
                onClose();
            },
        },
        {
            id: "create-event",
            icon: Calendar,
            title: "Create Event",
            subtitle: "Schedule a new calendar event",
            type: "command" as const,
            action: () => {
                console.log("Creating new event...");
                if (typeof chrome !== "undefined" && chrome.runtime) {
                    chrome.runtime.sendMessage({ type: "CREATE_EVENT" });
                }
                onClose();
            },
        },
        {
            id: "set-reminder",
            icon: Clock,
            title: "Set Reminder",
            subtitle: "Create a new reminder",
            type: "command" as const,
            action: () => {
                console.log("Setting reminder...");
                if (typeof chrome !== "undefined" && chrome.runtime) {
                    chrome.runtime.sendMessage({ type: "SET_REMINDER" });
                }
                onClose();
            },
        },
        {
            id: "bookmark-page",
            icon: Bookmark,
            title: "Bookmark Current Page",
            subtitle: "Save current page to bookmarks",
            type: "command" as const,
            action: () => {
                console.log("Bookmarking page...");
                if (typeof chrome !== "undefined" && chrome.runtime) {
                    chrome.runtime.sendMessage({ type: "BOOKMARK_PAGE" });
                }
                onClose();
            },
        },
        {
            id: "summarize-page",
            icon: Hash,
            title: "Summarize Page",
            subtitle: "Generate page summary",
            type: "command" as const,
            action: () => {
                console.log("Summarizing page...");
                if (typeof chrome !== "undefined" && chrome.runtime) {
                    chrome.runtime.sendMessage({ type: "SUMMARIZE_PAGE" });
                }
                onClose();
            },
        },
    ];

    // Load tabs when component becomes visible
    useEffect(() => {
        if (isVisible) {
            loadAllTabs();
        }
    }, [isVisible]);

    // Search tabs when query changes
    useEffect(() => {
        if (searchQuery.length > 2) {
            searchAcrossTabs(searchQuery);
        } else {
            setMatches([]);
            setLoading(false);
        }
    }, [searchQuery, allTabs]);

    const loadAllTabs = async () => {
        try {
            console.log("🔍 Loading all tabs...");

            if (typeof chrome === "undefined" || !chrome.runtime) {
                console.warn("⚠️ Chrome runtime not available");
                setAllTabs([]);
                return;
            }

            // Request tabs from background script
            const response = await chrome.runtime.sendMessage({
                type: "GET_ALL_TABS",
            });

            if (response && response.success && response.tabs) {
                setAllTabs(response.tabs);
                console.log(
                    `✅ Loaded ${response.tabs.length} tabs for search`,
                );
            } else {
                console.warn("⚠️ No tabs received from background script");
                setAllTabs([]);
            }
        } catch (error) {
            console.error("❌ Error loading tabs:", error);
            setAllTabs([]);
        }
    };

    const searchAcrossTabs = async (searchTerm: string) => {
        if (searchTerm.length < 1) return;

        setLoading(true);
        console.log(
            `🔍 Searching for "${searchTerm}" across ${allTabs.length} tabs`,
        );

        try {
            if (typeof chrome === "undefined" || !chrome.runtime) {
                console.warn("⚠️ Chrome runtime not available for search");
                setMatches([]);
                setLoading(false);
                return;
            }

            // Request search from background script
            const response = await chrome.runtime.sendMessage({
                type: "SEARCH_TABS",
                searchTerm: searchTerm.toLowerCase(),
                tabs: allTabs,
            });

            if (response && response.success && response.matches) {
                setMatches(response.matches);
                console.log(
                    `✅ Found ${response.matches.length} tabs with matches`,
                );
            } else {
                console.warn("⚠️ No matches received from background script");
                setMatches([]);
            }
        } catch (error) {
            console.error("❌ Error searching tabs:", error);
            setMatches([]);
        } finally {
            setLoading(false);
        }
    };

    const handleTabClick = async (tabId: number) => {
        try {
            console.log(`🔗 Switching to tab ${tabId}`);

            if (typeof chrome === "undefined" || !chrome.runtime) {
                console.warn("⚠️ Chrome runtime not available for tab switch");
                onClose();
                return;
            }

            // Request tab switch from background script
            const response = await chrome.runtime.sendMessage({
                type: "SWITCH_TO_TAB",
                tabId: tabId,
            });

            if (response && response.success) {
                console.log(`✅ Successfully switched to tab ${tabId}`);
            } else {
                console.error("❌ Failed to switch tab");
            }

            onClose();
        } catch (error) {
            console.error("❌ Error switching to tab:", error);
            onClose();
        }
    };

    // Filter commands based on search query
    const filteredCommands = staticCommands.filter(
        (command) =>
            command.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (command.subtitle &&
                command.subtitle
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase())),
    );

    // Combine filtered commands and tab matches
    const allResults = [
        ...filteredCommands.map((cmd, index) => ({
            ...cmd,
            resultIndex: index,
        })),
        ...matches.map((match, index) => ({
            ...match,
            type: "tab" as const,
            resultIndex: filteredCommands.length + index,
            action: () => handleTabClick(match.tabId),
        })),
    ];

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isVisible) return;

            switch (e.key) {
                case "Escape":
                    onClose();
                    break;
                case "ArrowDown":
                    e.preventDefault();
                    setSelectedIndex((prev) =>
                        prev < allResults.length - 1 ? prev + 1 : 0,
                    );
                    break;
                case "ArrowUp":
                    e.preventDefault();
                    setSelectedIndex((prev) =>
                        prev > 0 ? prev - 1 : allResults.length - 1,
                    );
                    break;
                case "Enter":
                    e.preventDefault();
                    if (allResults[selectedIndex]) {
                        allResults[selectedIndex].action();
                    }
                    break;
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isVisible, selectedIndex, allResults, onClose]);

    // Focus input when visible
    useEffect(() => {
        if (isVisible && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isVisible]);

    // Reset selected index when search changes
    useEffect(() => {
        setSelectedIndex(0);
    }, [searchQuery]);

    if (!isVisible) return null;

    return (
        <div className="spotlight-overlay">
            <div className="spotlight-container">
                {/* Search Header */}
                <div className="spotlight-search-header">
                    <Search className="spotlight-search-icon" />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search word or command"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="spotlight-search-input"
                    />
                </div>

                {/* Commands List */}
                <div className="spotlight-commands">
                    {loading && (
                        <div className="spotlight-loading">
                            Searching {allTabs.length} tabs...
                        </div>
                    )}

                    {!loading &&
                        allResults.length === 0 &&
                        searchQuery.length > 2 && (
                            <div className="spotlight-no-results">
                                No commands or tabs found for "{searchQuery}"
                            </div>
                        )}

                    {!loading &&
                        allResults.length === 0 &&
                        searchQuery.length <= 2 && (
                            <div className="spotlight-no-results">
                                {searchQuery.length === 0
                                    ? "Type to search commands and tabs"
                                    : "Type a character to search tabs"}
                            </div>
                        )}

                    {!loading &&
                        allResults.map((result, index) => {
                            const isSelected = index === selectedIndex;

                            return (
                                <div
                                    key={
                                        result.type === "tab"
                                            ? `tab-${result.tabId}`
                                            : result.id
                                    }
                                >
                                    <div
                                        onClick={result.action}
                                        className={`spotlight-command-item ${
                                            isSelected ? "selected" : ""
                                        }`}
                                    >
                                        {result.type === "tab" ? (
                                            <>
                                                <div className="spotlight-tab-favicon">
                                                    <img
                                                        src={result.favicon}
                                                        alt=""
                                                        onError={(e) => {
                                                            e.currentTarget.style.display =
                                                                "none";
                                                        }}
                                                    />
                                                    <Globe className="spotlight-tab-fallback-icon" />
                                                </div>
                                                <div className="spotlight-command-content">
                                                    <div className="spotlight-command-title">
                                                        {result.title}
                                                        <span className="spotlight-match-count">
                                                            {result.matchCount}{" "}
                                                            {result.matchCount ===
                                                            1
                                                                ? "match"
                                                                : "matches"}
                                                        </span>
                                                    </div>
                                                    <div className="spotlight-command-subtitle">
                                                        {result.domain}
                                                    </div>
                                                    {result.context && (
                                                        <div
                                                            className="spotlight-tab-context"
                                                            dangerouslySetInnerHTML={{
                                                                __html: result.context,
                                                            }}
                                                        />
                                                    )}
                                                </div>
                                                <ExternalLink className="spotlight-command-arrow" />
                                            </>
                                        ) : (
                                            <>
                                                <result.icon className="spotlight-command-icon" />
                                                <div className="spotlight-command-content">
                                                    <div className="spotlight-command-title">
                                                        {result.title}
                                                    </div>
                                                    {result.subtitle && (
                                                        <div className="spotlight-command-subtitle">
                                                            {result.subtitle}
                                                        </div>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    {index < allResults.length - 1 && (
                                        <div className="spotlight-separator" />
                                    )}
                                </div>
                            );
                        })}
                </div>

                {/* Footer */}
                <div className="spotlight-footer">
                    <span>↑↓ to navigate</span>
                    <span>↵ to select</span>
                    <span>esc to close</span>
                </div>
            </div>
        </div>
    );
};

export default SpotlightSearch;
