import React, { useState, useEffect, useRef, useCallback } from "react";
import { Search, ChevronDown } from "lucide-react";
import type { NetworkNode } from "../graph/types/network.types";

interface NetworkSearchBarProps {
    nodes: NetworkNode[];
    isDarkMode: boolean;
    onUrlSelect: (url: string, nodeId: string) => void;
    onSearchChange: (searchTerm: string) => void;
    className?: string;
}

interface UrlSuggestion {
    id: string;
    url: string;
    title: string;
    domain: string;
}

const NetworkSearchBar: React.FC<NetworkSearchBarProps> = ({
    nodes,
    isDarkMode,
    onUrlSelect,
    onSearchChange,
    className = "",
}) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [suggestions, setSuggestions] = useState<UrlSuggestion[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(-1);

    const searchInputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Extract domain from URL for display
    const extractDomain = useCallback((url: string): string => {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname.replace(/^www\./, "");
        } catch {
            return url;
        }
    }, []);

    // Generate URL suggestions based on search term
    const generateSuggestions = useCallback(
        (searchTerm: string): UrlSuggestion[] => {
            if (!searchTerm.trim() || searchTerm.length < 2) {
                return [];
            }

            const searchTermLower = searchTerm.toLowerCase();
            const matchingNodes = nodes.filter((node) => {
                const url = node.url.toLowerCase();
                const title = (node.title || "").toLowerCase();
                const domain = extractDomain(node.url).toLowerCase();

                return (
                    url.includes(searchTermLower) ||
                    title.includes(searchTermLower) ||
                    domain.includes(searchTermLower)
                );
            });

            // Sort by relevance - exact domain matches first, then URL matches, then title matches
            const sortedNodes = matchingNodes.sort((a, b) => {
                const aDomain = extractDomain(a.url).toLowerCase();
                const bDomain = extractDomain(b.url).toLowerCase();
                const aUrl = a.url.toLowerCase();
                const bUrl = b.url.toLowerCase();
                const aTitle = (a.title || "").toLowerCase();
                const bTitle = (b.title || "").toLowerCase();

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

                // URL match gets second priority
                if (
                    aUrl.includes(searchTermLower) &&
                    !bUrl.includes(searchTermLower)
                )
                    return -1;
                if (
                    !aUrl.includes(searchTermLower) &&
                    bUrl.includes(searchTermLower)
                )
                    return 1;

                // Title match gets third priority
                if (
                    aTitle.includes(searchTermLower) &&
                    !bTitle.includes(searchTermLower)
                )
                    return -1;
                if (
                    !aTitle.includes(searchTermLower) &&
                    bTitle.includes(searchTermLower)
                )
                    return 1;

                return 0;
            });

            // Limit to top 8 results and deduplicate by URL
            const seen = new Set<string>();
            return sortedNodes
                .filter((node) => {
                    if (seen.has(node.url)) return false;
                    seen.add(node.url);
                    return true;
                })
                .slice(0, 8)
                .map((node) => ({
                    id: node.id,
                    url: node.url,
                    title: node.title || extractDomain(node.url),
                    domain: extractDomain(node.url),
                }));
        },
        [nodes, extractDomain],
    );

    // Update suggestions when search changes
    useEffect(() => {
        const newSuggestions = generateSuggestions(searchQuery);
        setSuggestions(newSuggestions);
        setSelectedIndex(-1);
        setShowDropdown(newSuggestions.length > 0 && isSearchFocused);
    }, [searchQuery, generateSuggestions, isSearchFocused]);

    // Handle search input change
    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        onSearchChange(value);
    };

    // Handle URL selection
    const handleUrlSelect = (suggestion: UrlSuggestion) => {
        setSearchQuery(suggestion.domain); // Show domain in search bar
        setShowDropdown(false);
        setIsSearchFocused(false);
        onUrlSelect(suggestion.url, suggestion.id);
        searchInputRef.current?.blur();
    };

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!showDropdown || suggestions.length === 0) return;

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                setSelectedIndex((prev) =>
                    prev < suggestions.length - 1 ? prev + 1 : prev,
                );
                break;
            case "ArrowUp":
                e.preventDefault();
                setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
                break;
            case "Enter":
                e.preventDefault();
                if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
                    handleUrlSelect(suggestions[selectedIndex]);
                }
                break;
            case "Escape":
                setShowDropdown(false);
                setIsSearchFocused(false);
                searchInputRef.current?.blur();
                break;
        }
    };

    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setShowDropdown(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Handle search focus
    const handleSearchFocus = () => {
        setIsSearchFocused(true);
        if (suggestions.length > 0) {
            setShowDropdown(true);
        }
    };

    const handleSearchBlur = () => {
        // Delay to allow for dropdown clicks
        setTimeout(() => {
            setIsSearchFocused(false);
            setShowDropdown(false);
        }, 150);
    };

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <div
                className={`flex items-center rounded-xl backdrop-blur-xl border transition-all duration-300 ${
                    isDarkMode
                        ? "bg-slate-800/60 border-slate-700/40"
                        : "bg-white/80 border-amber-200/50"
                } ${isSearchFocused ? "scale-[1.02]" : ""}`}
            >
                <div className="flex items-center gap-3 px-4 py-2.5 flex-1">
                    <Search
                        size={16}
                        className={`transition-colors duration-200 ${
                            isSearchFocused
                                ? isDarkMode
                                    ? "text-slate-200"
                                    : "text-amber-800"
                                : isDarkMode
                                ? "text-slate-400"
                                : "text-amber-500"
                        }`}
                    />
                    <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search for any website from your browsing history..."
                        value={searchQuery}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        onFocus={handleSearchFocus}
                        onBlur={handleSearchBlur}
                        onKeyDown={handleKeyDown}
                        className={`flex-1 bg-transparent outline-none text-sm font-light ${
                            isDarkMode
                                ? "text-slate-200 placeholder-slate-400"
                                : "text-amber-900 placeholder-amber-600"
                        }`}
                    />
                    {showDropdown && (
                        <ChevronDown
                            size={16}
                            className={`transition-colors duration-200 ${
                                isDarkMode ? "text-slate-400" : "text-amber-500"
                            }`}
                        />
                    )}
                </div>
            </div>

            {/* Dropdown with URL suggestions */}
            {showDropdown && suggestions.length > 0 && (
                <div
                    className={`absolute top-full left-0 right-0 mt-2 rounded-xl backdrop-blur-xl border shadow-xl overflow-hidden z-50 ${
                        isDarkMode
                            ? "bg-slate-800/95 border-slate-700/40"
                            : "bg-white/95 border-amber-200/50"
                    }`}
                >
                    <div className="max-h-64 overflow-y-auto">
                        {suggestions.map((suggestion, index) => (
                            <button
                                key={suggestion.id}
                                onClick={() => handleUrlSelect(suggestion)}
                                className={`w-full px-4 py-3 text-left transition-all duration-150 border-b last:border-b-0 ${
                                    isDarkMode
                                        ? "border-slate-700/30"
                                        : "border-amber-200/30"
                                } ${
                                    index === selectedIndex
                                        ? isDarkMode
                                            ? "bg-slate-700/50"
                                            : "bg-amber-100/50"
                                        : isDarkMode
                                        ? "hover:bg-slate-700/30"
                                        : "hover:bg-amber-50/50"
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    {/* Favicon placeholder */}
                                    <div
                                        className={`w-4 h-4 rounded flex-shrink-0 ${
                                            isDarkMode
                                                ? "bg-slate-600"
                                                : "bg-amber-300"
                                        }`}
                                    />

                                    <div className="flex-1 min-w-0">
                                        <div
                                            className={`font-medium text-sm truncate ${
                                                isDarkMode
                                                    ? "text-slate-200"
                                                    : "text-amber-900"
                                            }`}
                                        >
                                            {suggestion.title}
                                        </div>
                                        <div
                                            className={`text-xs truncate mt-0.5 ${
                                                isDarkMode
                                                    ? "text-slate-400"
                                                    : "text-amber-600"
                                            }`}
                                        >
                                            {suggestion.domain}
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Footer with search tip */}
                    <div
                        className={`px-4 py-2 text-xs border-t ${
                            isDarkMode
                                ? "bg-slate-900/50 border-slate-700/30 text-slate-500"
                                : "bg-amber-50/50 border-amber-200/30 text-amber-600"
                        }`}
                    >
                        Press ↑↓ to navigate, Enter to select, Esc to close
                    </div>
                </div>
            )}
        </div>
    );
};

export default NetworkSearchBar;
