import React, { useState, useEffect, useRef } from "react";
import { Search, ExternalLink, X, ArrowRight } from "lucide-react";

interface SearchMatch {
    tabId: number;
    title: string;
    url: string;
    domain: string;
    favicon: string;
    matchCount: number;
    context: string; // Text snippet around the match
}

interface CrossTabSearchProps {
    children: React.ReactNode;
}

const CrossTabSearch: React.FC<CrossTabSearchProps> = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [matches, setMatches] = useState<SearchMatch[]>([]);
    const [loading, setLoading] = useState(false);
    const [allTabs, setAllTabs] = useState<chrome.tabs.Tab[]>([]);
    const searchRef = useRef<HTMLInputElement>(null);

    // Load all open tabs when search opens
    useEffect(() => {
        if (isOpen) {
            loadAllTabs();
            if (searchRef.current) {
                searchRef.current.focus();
            }
        }
    }, [isOpen]);

    // Search across tabs when query changes
    useEffect(() => {
        if (query.length > 2) {
            searchAcrossTabs(query);
        } else {
            setMatches([]);
        }
    }, [query, allTabs]);

    const loadAllTabs = async () => {
        try {
            const tabs = await chrome.tabs.query({});
            const validTabs = tabs.filter(
                (tab) =>
                    tab.url &&
                    !tab.url.startsWith("chrome://") &&
                    !tab.url.startsWith("chrome-extension://") &&
                    !tab.url.startsWith("moz-extension://") &&
                    tab.status === "complete",
            );
            setAllTabs(validTabs);
        } catch (error) {
            console.error("Error loading tabs:", error);
        }
    };

    const searchAcrossTabs = async (searchQuery: string) => {
        if (searchQuery.length < 3) return;

        setLoading(true);
        const searchMatches: SearchMatch[] = [];

        try {
            // Search each tab's content
            for (const tab of allTabs) {
                if (!tab.id || !tab.url) continue;

                try {
                    // Inject content script to search page content
                    const results = await chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        func: searchPageContent,
                        args: [searchQuery.toLowerCase()],
                    });

                    if (results[0]?.result) {
                        const { matchCount, context } = results[0].result;

                        if (matchCount > 0) {
                            const domain = new URL(tab.url).hostname.replace(
                                /^www\./,
                                "",
                            );

                            searchMatches.push({
                                tabId: tab.id,
                                title: tab.title || tab.url,
                                url: tab.url,
                                domain,
                                favicon:
                                    tab.favIconUrl ||
                                    `https://www.google.com/s2/favicons?domain=${domain}&sz=16`,
                                matchCount,
                                context,
                            });
                        }
                    }
                } catch (error) {
                    // Tab might be protected or have issues - skip it
                    console.log(`Skipping tab ${tab.id}: ${error}`);
                }
            }

            // Sort by match count (most matches first)
            searchMatches.sort((a, b) => b.matchCount - a.matchCount);
            setMatches(searchMatches);
        } catch (error) {
            console.error("Error searching tabs:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleTabClick = async (tabId: number) => {
        try {
            // Switch to the tab
            await chrome.tabs.update(tabId, { active: true });

            // Highlight the search term on the page
            if (query.length > 2) {
                await chrome.scripting.executeScript({
                    target: { tabId },
                    func: highlightSearchTerm,
                    args: [query.toLowerCase()],
                });
            }

            setIsOpen(false);
            setQuery("");
        } catch (error) {
            console.error("Error switching to tab:", error);
        }
    };

    if (!isOpen) {
        return <div onClick={() => setIsOpen(true)}>{children}</div>;
    }

    return (
        <>
            {/* Backdrop */}
            <div
                style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                    zIndex: 9999,
                    backdropFilter: "blur(4px)",
                }}
                onClick={() => setIsOpen(false)}
            />

            {/* Search Modal */}
            <div
                style={{
                    position: "fixed",
                    top: "5%",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "90%",
                    maxWidth: "600px",
                    backgroundColor: "white",
                    borderRadius: "16px",
                    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)",
                    zIndex: 10000,
                    overflow: "hidden",
                }}
            >
                {/* Search Header */}
                <div
                    style={{
                        padding: "20px",
                        borderBottom: "1px solid #e9ecef",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                    }}
                >
                    <Search size={20} color="#6c757d" />
                    <input
                        ref={searchRef}
                        type="text"
                        placeholder="Search across all open tabs..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        style={{
                            flex: 1,
                            border: "none",
                            outline: "none",
                            fontSize: "16px",
                            fontFamily: "Nunito-Regular",
                            color: "#2c3e50",
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Escape") {
                                setIsOpen(false);
                            } else if (
                                e.key === "Enter" &&
                                matches.length > 0
                            ) {
                                handleTabClick(matches[0].tabId);
                            }
                        }}
                    />
                    <X
                        size={20}
                        color="#6c757d"
                        style={{ cursor: "pointer" }}
                        onClick={() => setIsOpen(false)}
                    />
                </div>

                {/* Tab Count Info */}
                <div
                    style={{
                        padding: "8px 20px",
                        backgroundColor: "#f8f9fa",
                        fontSize: "12px",
                        color: "#6c757d",
                        borderBottom: "1px solid #e9ecef",
                    }}
                >
                    Searching across {allTabs.length} open tabs
                    {query.length > 2 &&
                        !loading &&
                        ` • ${matches.length} tabs with matches`}
                </div>

                {/* Results */}
                <div
                    style={{
                        maxHeight: "400px",
                        overflowY: "auto",
                    }}
                >
                    {loading && (
                        <div
                            style={{
                                padding: "20px",
                                textAlign: "center",
                                color: "#6c757d",
                                fontSize: "14px",
                            }}
                        >
                            Searching tabs...
                        </div>
                    )}

                    {!loading && query.length > 2 && matches.length === 0 && (
                        <div
                            style={{
                                padding: "20px",
                                textAlign: "center",
                                color: "#6c757d",
                                fontSize: "14px",
                            }}
                        >
                            No matches found for "{query}" in open tabs
                        </div>
                    )}

                    {!loading && query.length <= 2 && (
                        <div
                            style={{
                                padding: "20px",
                                textAlign: "center",
                                color: "#6c757d",
                                fontSize: "14px",
                            }}
                        >
                            Type at least 3 characters to search
                        </div>
                    )}

                    {!loading &&
                        matches.map((match, index) => (
                            <div
                                key={`${match.tabId}-${index}`}
                                onClick={() => handleTabClick(match.tabId)}
                                style={{
                                    padding: "16px 20px",
                                    borderBottom:
                                        index < matches.length - 1
                                            ? "1px solid #f8f9fa"
                                            : "none",
                                    cursor: "pointer",
                                    transition: "background-color 0.15s ease",
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: "12px",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor =
                                        "#f8f9fa";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor =
                                        "transparent";
                                }}
                            >
                                <img
                                    src={match.favicon}
                                    alt=""
                                    style={{
                                        width: "16px",
                                        height: "16px",
                                        borderRadius: "2px",
                                        marginTop: "2px",
                                        flexShrink: 0,
                                    }}
                                    onError={(e) => {
                                        e.currentTarget.style.display = "none";
                                    }}
                                />

                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                            marginBottom: "4px",
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: "14px",
                                                fontWeight: "600",
                                                color: "#2c3e50",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                                flex: 1,
                                            }}
                                        >
                                            {match.title}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: "11px",
                                                backgroundColor: "#28a745",
                                                color: "white",
                                                padding: "2px 6px",
                                                borderRadius: "10px",
                                                fontWeight: "600",
                                                flexShrink: 0,
                                            }}
                                        >
                                            {match.matchCount}{" "}
                                            {match.matchCount === 1
                                                ? "match"
                                                : "matches"}
                                        </div>
                                    </div>

                                    <div
                                        style={{
                                            fontSize: "12px",
                                            color: "#6c757d",
                                            marginBottom: "6px",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {match.domain}
                                    </div>

                                    {match.context && (
                                        <div
                                            style={{
                                                fontSize: "12px",
                                                color: "#495057",
                                                backgroundColor: "#f8f9fa",
                                                padding: "6px 8px",
                                                borderRadius: "6px",
                                                borderLeft: "3px solid #28a745",
                                                fontStyle: "italic",
                                                lineHeight: "1.4",
                                            }}
                                            dangerouslySetInnerHTML={{
                                                __html: match.context,
                                            }}
                                        />
                                    )}
                                </div>

                                <ArrowRight
                                    size={16}
                                    color="#6c757d"
                                    style={{ marginTop: "2px", flexShrink: 0 }}
                                />
                            </div>
                        ))}
                </div>

                {/* Footer */}
                {!loading && matches.length > 0 && (
                    <div
                        style={{
                            padding: "12px 20px",
                            backgroundColor: "#f8f9fa",
                            fontSize: "11px",
                            color: "#6c757d",
                            textAlign: "center",
                        }}
                    >
                        Press Enter to go to first match • ESC to close
                    </div>
                )}
            </div>
        </>
    );
};

// Function that runs in the context of each tab to search content
function searchPageContent(searchTerm: string): {
    matchCount: number;
    context: string;
} {
    const bodyText = document.body.innerText || document.body.textContent || "";
    const lowerBodyText = bodyText.toLowerCase();
    const searchTermLower = searchTerm.toLowerCase();

    // Count matches
    const matches = lowerBodyText.split(searchTermLower).length - 1;

    // Get context around first match
    let context = "";
    if (matches > 0) {
        const firstMatchIndex = lowerBodyText.indexOf(searchTermLower);
        const start = Math.max(0, firstMatchIndex - 40);
        const end = Math.min(
            bodyText.length,
            firstMatchIndex + searchTerm.length + 40,
        );

        context = bodyText.substring(start, end);
        // Highlight the search term
        const regex = new RegExp(`(${searchTerm})`, "gi");
        context = context.replace(
            regex,
            '<mark style="background-color: #ffeb3b; padding: 1px 2px;">$1</mark>',
        );

        // Add ellipsis if truncated
        if (start > 0) context = "..." + context;
        if (end < bodyText.length) context = context + "...";
    }

    return { matchCount: matches, context };
}

// Function to highlight search term when user switches to tab
function highlightSearchTerm(searchTerm: string): void {
    // Remove any existing highlights
    const existingHighlights = document.querySelectorAll(
        ".lyncx-search-highlight",
    );
    existingHighlights.forEach((el) => {
        const parent = el.parentNode;
        if (parent) {
            parent.replaceChild(
                document.createTextNode(el.textContent || ""),
                el,
            );
            parent.normalize();
        }
    });

    // Add new highlights
    const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
    );

    const textNodes: Text[] = [];
    let node;
    while ((node = walker.nextNode())) {
        textNodes.push(node as Text);
    }

    textNodes.forEach((textNode) => {
        const text = textNode.textContent;
        if (text && text.toLowerCase().includes(searchTerm.toLowerCase())) {
            const regex = new RegExp(`(${searchTerm})`, "gi");
            const highlightedHTML = text.replace(
                regex,
                '<span class="lyncx-search-highlight" style="background-color: #ffeb3b; padding: 1px 2px; border-radius: 2px;">$1</span>',
            );

            if (highlightedHTML !== text) {
                const wrapper = document.createElement("div");
                wrapper.innerHTML = highlightedHTML;
                const fragment = document.createDocumentFragment();
                while (wrapper.firstChild) {
                    fragment.appendChild(wrapper.firstChild);
                }
                textNode.parentNode?.replaceChild(fragment, textNode);
            }
        }
    });

    // Scroll to first highlight
    const firstHighlight = document.querySelector(".lyncx-search-highlight");
    if (firstHighlight) {
        firstHighlight.scrollIntoView({ behavior: "smooth", block: "center" });
    }
}

export default CrossTabSearch;
