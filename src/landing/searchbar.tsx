import React, { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown, ArrowRight, Search } from "lucide-react";
import type { NetworkNode } from "../graph/types/network.types";

interface SearchBarProps {
    isDarkMode: boolean;
    searchQuery: string;
    onSearchQueryChange: (query: string) => void;
    onSearch: () => void;
    placeholder?: string;
    searchType?: "Search" | "Insights" | "Network";
    onSearchTypeChange?: (type: "Search" | "Insights" | "Network") => void;
    showTypeSelector?: boolean;
    isInitialLoad?: boolean;
    animationDelay?: string;
    variant?: "main" | "data";
    className?: string;
    // Network-specific props
    isNetworkPage?: boolean;
    networkNodes?: NetworkNode[];
    onNetworkUrlSelect?: (url: string, nodeId: string) => void;
}

interface UrlSuggestion {
    id: string;
    url: string;
    title: string;
    domain: string;
}

// Enhanced text animation component for insights
const AnimatedText: React.FC<{
    text: string;
    animation: "karaoke" | "filling";
    isDarkMode: boolean;
}> = ({ text, animation, isDarkMode }) => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        element.textContent = "";
        [...text].forEach((char, index) => {
            const span = document.createElement("span");
            span.className = "char";
            span.textContent = char === " " ? "\u00A0" : char;
            span.setAttribute("data-char", char === " " ? "\u00A0" : char);
            span.style.setProperty("--char-index", index.toString());
            element.appendChild(span);
        });

        const chars = element.querySelectorAll(".char");
        chars.forEach((char, index) => {
            (char as HTMLElement).style.setProperty("--reveal", "0");
            setTimeout(() => {
                (char as HTMLElement).style.setProperty("--reveal", "1");
            }, index * 25);
        });

        return () => {
            chars.forEach((char) => {
                (char as HTMLElement).style.setProperty("--reveal", "0");
            });
        };
    }, [text]);

    const baseColor = isDarkMode ? "hsl(0, 0%, 65%)" : "hsl(0, 0%, 45%)";
    const dimColor = isDarkMode
        ? "hsla(0, 0%, 60%, 0.2)"
        : "hsla(0, 0%, 50%, 0.2)";

    return (
        <>
            <div
                ref={ref}
                className={`${animation} text-xl font-light`}
                style={{ position: "relative" }}
            />
            <style>
                {`
                .${animation} .char {
                    color: ${dimColor};
                    position: relative;
                    display: inline-block;
                    transition: all 0.2s ease;
                }

                .${animation} .char:after {
                    content: attr(data-char);
                    position: absolute;
                    left: 0;
                    top: 0;
                    color: ${baseColor};
                    visibility: visible;
                    clip-path: inset(${
                        animation === "karaoke"
                            ? "0 calc((100 - (var(--reveal, 0) * 100)) * 1%) 0 0"
                            : "calc((100 - (var(--reveal, 0) * 100)) * 1%) 0 0 0"
                    });
                    transition: clip-path 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                }
                `}
            </style>
        </>
    );
};

const SearchBar: React.FC<SearchBarProps> = ({
    isDarkMode,
    searchQuery,
    onSearchQueryChange,
    onSearch,
    placeholder = "Search or enter address",
    searchType = "Search",
    onSearchTypeChange,
    showTypeSelector = false,
    isInitialLoad = false,
    animationDelay = "600ms",
    variant = "main",
    className = "",
    isNetworkPage = false,
    networkNodes = [],
    onNetworkUrlSelect,
}) => {
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [currentPlaceholderIndex, setCurrentPlaceholderIndex] = useState(0);
    const [showNetworkSuggestions, setShowNetworkSuggestions] = useState(false);
    const [networkSuggestions, setNetworkSuggestions] = useState<
        UrlSuggestion[]
    >([]);
    const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

    const dropdownRef = useRef<HTMLDivElement>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);

    // Rotating insight placeholders
    const insightPlaceholders = [
        "Analyze market trends...",
        "Find patterns in data...",
        "Generate insights...",
        "Explore connections...",
        "Discover opportunities...",
    ];

    // Extract domain from URL for display
    const extractDomain = useCallback((url: string): string => {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname.replace(/^www\./, "");
        } catch {
            return url;
        }
    }, []);

    // Generate URL suggestions for network search
    const generateNetworkSuggestions = useCallback(
        (searchTerm: string): UrlSuggestion[] => {
            if (
                !searchTerm.trim() ||
                searchTerm.length < 2 ||
                !networkNodes.length
            ) {
                return [];
            }

            const searchTermLower = searchTerm.toLowerCase();
            const matchingNodes = networkNodes.filter((node) => {
                const url = node.url.toLowerCase();
                const title = (node.title || "").toLowerCase();
                const domain = extractDomain(node.url).toLowerCase();

                return (
                    url.includes(searchTermLower) ||
                    title.includes(searchTermLower) ||
                    domain.includes(searchTermLower)
                );
            });

            // Sort by relevance and deduplicate
            const seen = new Set<string>();
            return matchingNodes
                .sort((a, b) => {
                    const aDomain = extractDomain(a.url).toLowerCase();
                    const bDomain = extractDomain(b.url).toLowerCase();

                    // Exact domain match gets highest priority
                    if (
                        aDomain.includes(searchTermLower) &&
                        !bDomain.includes(searchTermLower)
                    )
                        return -1;
                    if (
                        !aDomain.includes(searchTermLower) &&
                        bDomain.includes(searchTermLower)
                    )
                        return 1;
                    return 0;
                })
                .filter((node) => {
                    if (seen.has(node.url)) return false;
                    seen.add(node.url);
                    return true;
                })
                .slice(0, 6)
                .map((node) => ({
                    id: node.id,
                    url: node.url,
                    title: node.title || extractDomain(node.url),
                    domain: extractDomain(node.url),
                }));
        },
        [networkNodes, extractDomain],
    );

    // Update network suggestions when search changes
    useEffect(() => {
        if (searchType === "Network" && searchQuery) {
            const suggestions = generateNetworkSuggestions(searchQuery);
            setNetworkSuggestions(suggestions);
            setShowNetworkSuggestions(
                suggestions.length > 0 && isSearchFocused,
            );
            setSelectedSuggestionIndex(-1);
        } else {
            setShowNetworkSuggestions(false);
            setNetworkSuggestions([]);
        }
    }, [searchQuery, searchType, generateNetworkSuggestions, isSearchFocused]);

    // Auto-select Network type when on network page
    useEffect(() => {
        if (isNetworkPage && onSearchTypeChange && searchType !== "Network") {
            onSearchTypeChange("Network");
        }
    }, [isNetworkPage, onSearchTypeChange, searchType]);

    // Rotate placeholder text for insights
    useEffect(() => {
        if (searchType === "Insights" && !isSearchFocused && showTypeSelector) {
            const interval = setInterval(() => {
                setCurrentPlaceholderIndex(
                    (prev) => (prev + 1) % insightPlaceholders.length,
                );
            }, 2500);
            return () => clearInterval(interval);
        }
    }, [
        searchType,
        isSearchFocused,
        showTypeSelector,
        insightPlaceholders.length,
    ]);

    // Close dropdowns when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsDropdownOpen(false);
            }
            if (
                suggestionsRef.current &&
                !suggestionsRef.current.contains(event.target as Node)
            ) {
                setShowNetworkSuggestions(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Handle network URL selection
    const handleNetworkUrlSelect = (suggestion: UrlSuggestion) => {
        onSearchQueryChange(suggestion.domain); // Show domain in search bar
        setShowNetworkSuggestions(false);
        setIsSearchFocused(false);
        onNetworkUrlSelect?.(suggestion.url, suggestion.id);
    };

    // Handle keyboard navigation for network suggestions
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (
            searchType === "Network" &&
            showNetworkSuggestions &&
            networkSuggestions.length > 0
        ) {
            switch (e.key) {
                case "ArrowDown":
                    e.preventDefault();
                    setSelectedSuggestionIndex((prev) =>
                        prev < networkSuggestions.length - 1 ? prev + 1 : prev,
                    );
                    break;
                case "ArrowUp":
                    e.preventDefault();
                    setSelectedSuggestionIndex((prev) =>
                        prev > 0 ? prev - 1 : -1,
                    );
                    break;
                case "Enter":
                    e.preventDefault();
                    if (
                        selectedSuggestionIndex >= 0 &&
                        selectedSuggestionIndex < networkSuggestions.length
                    ) {
                        handleNetworkUrlSelect(
                            networkSuggestions[selectedSuggestionIndex],
                        );
                        return;
                    }
                    break;
                case "Escape":
                    setShowNetworkSuggestions(false);
                    setIsSearchFocused(false);
                    break;
            }
        }

        if (e.key === "Enter" && selectedSuggestionIndex === -1) {
            onSearch();
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        // handleKeyDown already handles Enter for network suggestions
        if (searchType !== "Network" && e.key === "Enter") {
            onSearch();
        }
    };

    const getButtonColor = () => {
        if (variant === "data") {
            return {
                base: searchQuery
                    ? "bg-blue-500 text-white"
                    : "bg-blue-400 text-white hover:bg-blue-500",
                shadow: searchQuery
                    ? "0 4px 20px rgba(59, 130, 246, 0.3)"
                    : "0 2px 10px rgba(59, 130, 246, 0.2)",
                hoverShadow: "hover:shadow-blue-500/25",
            };
        }

        return {
            base: searchQuery
                ? "bg-[#f5b049] text-black"
                : "bg-[#f5b84d] text-gray-900",
            shadow: searchQuery
                ? "0 4px 20px rgba(191, 138, 57, 0.3)"
                : "0 2px 10px rgba(207, 149, 62, 0.3)",
            hoverShadow: "hover:shadow-yellow-500/25",
        };
    };

    const buttonColors = getButtonColor();

    // Get the appropriate placeholder text
    const getPlaceholderText = () => {
        if (searchType === "Network") {
            return "Search for any website from your browsing history...";
        }
        if (searchType === "Search" || !showTypeSelector) {
            return placeholder;
        }
        return ""; // For Insights with animated placeholder
    };

    // Get available search types based on context
    const getAvailableSearchTypes = () => {
        const baseTypes = ["Search", "Insights"];
        if (isNetworkPage) {
            return ["Network", ...baseTypes];
        }
        return baseTypes;
    };

    return (
        <div
            className={`w-full max-w-2xl mb-12 relative transition-all duration-700 ease-out ${
                isInitialLoad
                    ? "opacity-0 translate-y-4 scale-95"
                    : "opacity-100 translate-y-0 scale-100"
            } ${className}`}
            style={{ animationDelay }}
        >
            <div
                className={`rounded-2xl backdrop-blur-md border transition-all duration-300 ease-out ${
                    isDarkMode
                        ? "bg-slate-900/50 border-slate-700/50"
                        : "bg-white/70 border-gray-200/50"
                } ${
                    isSearchFocused
                        ? "shadow-2xl scale-[1.02] " +
                          (isDarkMode
                              ? "border-slate-600/70"
                              : "border-gray-300/70")
                        : "shadow-lg hover:shadow-xl hover:scale-[1.01]"
                }`}
            >
                <div className="relative">
                    <input
                        type="text"
                        placeholder={getPlaceholderText()}
                        value={searchQuery}
                        onChange={(e) => onSearchQueryChange(e.target.value)}
                        onFocus={() => setIsSearchFocused(true)}
                        onBlur={() => {
                            // Delay to allow for suggestion clicks
                            setTimeout(() => setIsSearchFocused(false), 150);
                        }}
                        onKeyDown={handleKeyDown}
                        onKeyPress={handleKeyPress}
                        className={`w-full bg-transparent outline-none px-8 py-5 text-lg transition-all duration-300 ${
                            showTypeSelector ? "pr-32" : "pr-20"
                        } ${
                            isDarkMode
                                ? "text-slate-200 placeholder-slate-500"
                                : "text-gray-800 placeholder-gray-500"
                        }`}
                    />

                    {/* Enhanced animated placeholder for insights */}
                    {searchType === "Insights" &&
                        !searchQuery &&
                        !isSearchFocused &&
                        showTypeSelector && (
                            <div
                                className="absolute left-8 top-5 pointer-events-none overflow-hidden"
                                style={{ minWidth: "200px" }}
                                key={`${currentPlaceholderIndex}-${searchType}`}
                            >
                                <AnimatedText
                                    text={
                                        insightPlaceholders[
                                            currentPlaceholderIndex
                                        ]
                                    }
                                    animation={
                                        currentPlaceholderIndex % 2 === 0
                                            ? "karaoke"
                                            : "filling"
                                    }
                                    isDarkMode={isDarkMode}
                                />
                            </div>
                        )}

                    {/* Bottom controls */}
                    <div className="absolute bottom-4 right-4 flex items-center gap-2">
                        {/* Search type dropdown - only show if enabled */}
                        {showTypeSelector && onSearchTypeChange && (
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() =>
                                        setIsDropdownOpen(!isDropdownOpen)
                                    }
                                    className={`flex items-center gap-1 px-2 py-1 text-sm transition-all duration-200 hover:scale-105 active:scale-95 ${
                                        isDarkMode
                                            ? "text-slate-400 hover:text-slate-300"
                                            : "text-gray-500 hover:text-gray-700"
                                    }`}
                                >
                                    {searchType}
                                    <ChevronDown
                                        size={12}
                                        className={`transition-transform duration-300 ${
                                            isDropdownOpen ? "rotate-180" : ""
                                        }`}
                                    />
                                </button>

                                {/* Enhanced dropdown */}
                                <div
                                    className={`absolute top-full right-0 mt-1 w-24 rounded-md overflow-hidden z-10 transition-all duration-200 ${
                                        isDropdownOpen
                                            ? "opacity-100 translate-y-0 scale-100"
                                            : "opacity-0 translate-y-[-10px] scale-95 pointer-events-none"
                                    } ${
                                        isDarkMode
                                            ? "bg-slate-900/95"
                                            : "bg-white/95"
                                    }`}
                                    style={{ backdropFilter: "blur(12px)" }}
                                >
                                    {getAvailableSearchTypes().map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => {
                                                onSearchTypeChange(
                                                    type as
                                                        | "Search"
                                                        | "Insights"
                                                        | "Network",
                                                );
                                                setIsDropdownOpen(false);
                                            }}
                                            className={`w-full px-3 py-2 text-left text-sm capitalize transition-all duration-200 hover:scale-105 ${
                                                searchType === type
                                                    ? isDarkMode
                                                        ? "text-slate-200 bg-slate-800/50"
                                                        : "text-gray-800 bg-gray-100/50"
                                                    : isDarkMode
                                                    ? "text-slate-400 hover:text-slate-300 hover:bg-slate-800/30"
                                                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-100/30"
                                            }`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Enhanced send button */}
                        <button
                            onClick={onSearch}
                            className={`p-2 rounded-lg transition-all duration-300 hover:scale-110 active:scale-95 hover:rotate-6 group ${buttonColors.base} shadow-lg ${buttonColors.hoverShadow}`}
                            style={{ boxShadow: buttonColors.shadow }}
                        >
                            {variant === "data" ? (
                                <Search
                                    size={16}
                                    className="transition-transform duration-300 group-hover:scale-110"
                                />
                            ) : (
                                <ArrowRight
                                    size={16}
                                    className="transition-transform duration-300 group-hover:translate-x-0.5"
                                />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Network URL Suggestions Dropdown */}
            {searchType === "Network" &&
                showNetworkSuggestions &&
                networkSuggestions.length > 0 && (
                    <div
                        ref={suggestionsRef}
                        className={`absolute top-full left-0 right-0 mt-2 rounded-xl backdrop-blur-xl border shadow-xl overflow-hidden z-50 ${
                            isDarkMode
                                ? "bg-slate-800/95 border-slate-700/40"
                                : "bg-white/95 border-gray-200/50"
                        }`}
                    >
                        <div className="max-h-64 overflow-y-auto">
                            {networkSuggestions.map((suggestion, index) => (
                                <button
                                    key={suggestion.id}
                                    onClick={() =>
                                        handleNetworkUrlSelect(suggestion)
                                    }
                                    className={`w-full px-4 py-3 text-left transition-all duration-150 border-b last:border-b-0 ${
                                        isDarkMode
                                            ? "border-slate-700/30"
                                            : "border-gray-200/30"
                                    } ${
                                        index === selectedSuggestionIndex
                                            ? isDarkMode
                                                ? "bg-slate-700/50"
                                                : "bg-gray-100/50"
                                            : isDarkMode
                                            ? "hover:bg-slate-700/30"
                                            : "hover:bg-gray-50/50"
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        {/* Favicon placeholder */}
                                        <div
                                            className={`w-4 h-4 rounded flex-shrink-0 ${
                                                isDarkMode
                                                    ? "bg-slate-600"
                                                    : "bg-gray-300"
                                            }`}
                                        />

                                        <div className="flex-1 min-w-0">
                                            <div
                                                className={`font-medium text-sm truncate ${
                                                    isDarkMode
                                                        ? "text-slate-200"
                                                        : "text-gray-900"
                                                }`}
                                            >
                                                {suggestion.title}
                                            </div>
                                            <div
                                                className={`text-xs truncate mt-0.5 ${
                                                    isDarkMode
                                                        ? "text-slate-400"
                                                        : "text-gray-600"
                                                }`}
                                            >
                                                {suggestion.domain}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Footer with navigation tip */}
                        <div
                            className={`px-4 py-2 text-xs border-t ${
                                isDarkMode
                                    ? "bg-slate-900/50 border-slate-700/30 text-slate-500"
                                    : "bg-gray-50/50 border-gray-200/30 text-gray-600"
                            }`}
                        >
                            Press ↑↓ to navigate, Enter to select, Esc to close
                        </div>
                    </div>
                )}
        </div>
    );
};

export default SearchBar;
