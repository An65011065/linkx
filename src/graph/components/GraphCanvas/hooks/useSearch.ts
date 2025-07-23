import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import type { NetworkNode } from "../../../types/network.types";
import { nodeMatchesSearchTerm } from "../utils/urlFormatting";
import { SEARCH_CONSTANTS } from "../utils/constants";

interface UseSearchReturn {
    searchTerm: string;
    searchResults: Set<string>;
    isSearchFocused: boolean;
    resultCount: number;
    hasResults: boolean;
    isSearching: boolean;
    setSearchTerm: (term: string) => void;
    clearSearch: () => void;
    setSearchFocus: (focused: boolean) => void;
    isNodeHighlighted: (nodeId: string) => boolean;
    searchStats: {
        totalSearched: number;
        matchCount: number;
        searchTime: number;
    };
}

/**
 * Hook for managing search functionality with debouncing
 * Extracted from your original search logic
 */
export const useSearch = (
    nodes: NetworkNode[],
    onSearchResults?: (count: number) => void,
    debounceMs: number = SEARCH_CONSTANTS.DEBOUNCE_DELAY,
): UseSearchReturn => {
    const [searchTerm, setSearchTermInternal] = useState("");
    const [searchResults, setSearchResults] = useState<Set<string>>(new Set());
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [isSearching, setIsSearching] = useState(false);

    const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const searchTimeRef = useRef<number>(0);

    // Perform the actual search
    const performSearch = useCallback(
        (term: string) => {
            const startTime = performance.now();
            setIsSearching(true);

            if (
                !term.trim() ||
                term.length < SEARCH_CONSTANTS.MIN_SEARCH_LENGTH
            ) {
                setSearchResults(new Set());
                onSearchResults?.(0);
                setIsSearching(false);
                searchTimeRef.current = 0;
                return;
            }

            // Find matching nodes using the utility function
            const matchingNodes = nodes.filter((node) =>
                nodeMatchesSearchTerm(node, term),
            );
            const resultSet = new Set(matchingNodes.map((node) => node.id));

            // Limit results for performance
            const limitedResults = Array.from(resultSet).slice(
                0,
                SEARCH_CONSTANTS.MAX_RESULTS_DISPLAY,
            );
            const finalResultSet = new Set(limitedResults);

            setSearchResults(finalResultSet);
            onSearchResults?.(finalResultSet.size);

            const endTime = performance.now();
            searchTimeRef.current = endTime - startTime;
            setIsSearching(false);
        },
        [nodes, onSearchResults],
    );

    // Debounced search function
    const debouncedSearch = useCallback(
        (term: string) => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }

            debounceTimeoutRef.current = setTimeout(() => {
                performSearch(term);
            }, debounceMs);
        },
        [performSearch, debounceMs],
    );

    // Public search term setter
    const setSearchTerm = useCallback(
        (term: string) => {
            setSearchTermInternal(term);
            debouncedSearch(term);
        },
        [debouncedSearch],
    );

    // Clear search
    const clearSearch = useCallback(() => {
        setSearchTermInternal("");
        setSearchResults(new Set());
        onSearchResults?.(0);
        setIsSearching(false);
        searchTimeRef.current = 0;

        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
            debounceTimeoutRef.current = null;
        }
    }, [onSearchResults]);

    // Set search focus state
    const setSearchFocus = useCallback((focused: boolean) => {
        setIsSearchFocused(focused);
    }, []);

    // Check if a node is highlighted by search
    const isNodeHighlighted = useCallback(
        (nodeId: string): boolean => {
            return searchResults.has(nodeId);
        },
        [searchResults],
    );

    // Derived state
    const resultCount = searchResults.size;
    const hasResults = resultCount > 0;

    // Search statistics
    const searchStats = useMemo(
        () => ({
            totalSearched: nodes.length,
            matchCount: resultCount,
            searchTime: searchTimeRef.current,
        }),
        [nodes.length, resultCount],
    );

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, []);

    // Re-run search when nodes change (if we have a search term)
    useEffect(() => {
        if (searchTerm.trim()) {
            debouncedSearch(searchTerm);
        }
    }, [nodes, searchTerm, debouncedSearch]);

    return {
        searchTerm,
        searchResults,
        isSearchFocused,
        resultCount,
        hasResults,
        isSearching,
        setSearchTerm,
        clearSearch,
        setSearchFocus,
        isNodeHighlighted,
        searchStats,
    };
};

/**
 * Hook variant for external search term control (standalone mode)
 */
export const useExternalSearch = (
    nodes: NetworkNode[],
    externalSearchTerm: string,
    onSearchResults?: (count: number) => void,
): {
    searchResults: Set<string>;
    resultCount: number;
    hasResults: boolean;
    isNodeHighlighted: (nodeId: string) => boolean;
} => {
    const [searchResults, setSearchResults] = useState<Set<string>>(new Set());

    // Perform search when external term changes
    useEffect(() => {
        if (!externalSearchTerm.trim()) {
            setSearchResults(new Set());
            onSearchResults?.(0);
            return;
        }

        const matchingNodes = nodes.filter((node) =>
            nodeMatchesSearchTerm(node, externalSearchTerm),
        );
        const resultSet = new Set(matchingNodes.map((node) => node.id));

        setSearchResults(resultSet);
        onSearchResults?.(resultSet.size);
    }, [nodes, externalSearchTerm, onSearchResults]);

    const isNodeHighlighted = useCallback(
        (nodeId: string): boolean => {
            return searchResults.has(nodeId);
        },
        [searchResults],
    );

    return {
        searchResults,
        resultCount: searchResults.size,
        hasResults: searchResults.size > 0,
        isNodeHighlighted,
    };
};

/**
 * Hook for search history and suggestions
 */
export const useSearchHistory = (maxHistorySize: number = 10) => {
    const [searchHistory, setSearchHistory] = useState<string[]>([]);
    const [suggestions, setSuggestions] = useState<string[]>([]);

    const addToHistory = useCallback(
        (term: string) => {
            if (!term.trim()) return;

            setSearchHistory((prev) => {
                const filtered = prev.filter((item) => item !== term);
                const newHistory = [term, ...filtered].slice(0, maxHistorySize);
                return newHistory;
            });
        },
        [maxHistorySize],
    );

    const clearHistory = useCallback(() => {
        setSearchHistory([]);
    }, []);

    const getSuggestions = useCallback(
        (currentTerm: string): string[] => {
            if (!currentTerm.trim()) return [];

            return searchHistory
                .filter(
                    (item) =>
                        item
                            .toLowerCase()
                            .includes(currentTerm.toLowerCase()) &&
                        item !== currentTerm,
                )
                .slice(0, 5);
        },
        [searchHistory],
    );

    return {
        searchHistory,
        suggestions,
        addToHistory,
        clearHistory,
        getSuggestions,
    };
};
