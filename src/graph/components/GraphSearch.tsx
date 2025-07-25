import React, { useState, useRef, useEffect, useCallback } from "react";
import { ArrowRight, Search } from "lucide-react";
import type { NetworkNode } from "../types/network.types";

interface GraphSearchProps {
    isDarkMode: boolean;
    searchTerm: string;
    onSearchChange: (term: string) => void;
    searchResults?: Set<string>;
    nodes?: NetworkNode[];
    onNodeSelect?: (nodeId: string) => void;
    className?: string;
}

const GraphSearch: React.FC<GraphSearchProps> = ({
    isDarkMode,
    searchTerm,
    onSearchChange,
    searchResults = new Set(),
    nodes = [],
    onNodeSelect,
    className = "",
}) => {
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [localValue, setLocalValue] = useState(searchTerm || "");
    const [showDropdown, setShowDropdown] = useState(false);
    const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    
    // Get filtered search result nodes
    const searchResultNodes = nodes.filter(node => searchResults.has(node.id)).slice(0, 8);
    
    // Sync local value with external searchTerm only if not focused (to avoid overriding user input)
    useEffect(() => {
        if (!isSearchFocused) {
            setLocalValue(searchTerm || "");
        }
    }, [searchTerm, isSearchFocused]);

    // Show dropdown when there are results and input is focused
    useEffect(() => {
        setShowDropdown(isSearchFocused && searchResultNodes.length > 0 && localValue.trim().length > 0);
    }, [isSearchFocused, searchResultNodes.length, localValue]);

    // Debounced search function
    const debouncedOnSearchChange = useCallback((value: string) => {
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }
        
        debounceTimeoutRef.current = setTimeout(() => {
            onSearchChange(value);
        }, 150); // 150ms debounce
    }, [onSearchChange]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setLocalValue(newValue);
        debouncedOnSearchChange(newValue);
    };

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, []);

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            // Cancel debounce and trigger immediate search
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
            onSearchChange(localValue);
        }
    };

    const truncateTitle = (title: string, maxLength: number = 40) => {
        if (title.length <= maxLength) return title;
        return title.substring(0, maxLength).trim() + '...';
    };

    const handleNodeSelect = (node: NetworkNode) => {
        setShowDropdown(false);
        setIsSearchFocused(false);
        // Set the search term to the truncated node title
        const displayTitle = node.title || new URL(node.url).hostname || 'Unknown Site';
        const truncatedTitle = truncateTitle(displayTitle);
        setLocalValue(truncatedTitle);
        onSearchChange(truncatedTitle);
        onNodeSelect?.(node.id);
    };

    const getNodeDisplayText = (node: NetworkNode) => {
        return node.title || new URL(node.url).hostname || 'Unknown Site';
    };

    const getNodeSubText = (node: NetworkNode) => {
        const url = new URL(node.url);
        return url.hostname !== node.title ? url.hostname : url.pathname;
    };

    return (
        <div
            className={`w-full max-w-2xl absolute bottom-8 left-1/2 transform -translate-x-1/2 z-[1001] ${className}`}
            style={{ pointerEvents: 'auto' }}
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
                <div className="relative" style={{ pointerEvents: 'auto' }}>
                    <input
                        type="text"
                        placeholder="Search your network..."
                        value={localValue}
                        onChange={handleChange}
                        onFocus={() => setIsSearchFocused(true)}
                        onBlur={() => {
                            setTimeout(() => {
                                setIsSearchFocused(false);
                                setShowDropdown(false);
                            }, 150);
                        }}
                        onKeyPress={handleKeyPress}
                        className={`w-full bg-transparent outline-none px-8 py-5 text-lg transition-all duration-300 pr-20 ${
                            isDarkMode
                                ? "text-slate-200 placeholder-slate-500"
                                : "text-gray-800 placeholder-gray-500"
                        }`}
                        style={{ 
                            pointerEvents: 'auto',
                            zIndex: 9999,
                            position: 'relative'
                        }}
                        autoComplete="off"
                        spellCheck={false}
                    />

                    {/* Yellow arrow button */}
                    <div className="absolute bottom-4 right-4">
                        <button
                            onClick={() => {}}
                            className="p-2 rounded-lg transition-all duration-300 hover:scale-110 active:scale-95 hover:rotate-6 group bg-[#f5b049] text-black shadow-lg hover:shadow-yellow-500/25"
                            style={{ boxShadow: "0 4px 20px rgba(245, 176, 73, 0.3)" }}
                        >
                            <ArrowRight
                                size={16}
                                className="transition-transform duration-300 group-hover:translate-x-0.5"
                            />
                        </button>
                    </div>
                </div>
                
                {/* Dropdown Results */}
                {showDropdown && (
                    <div
                        className={`absolute bottom-full mb-2 w-full rounded-xl border backdrop-blur-md transition-all duration-200 ${
                            isDarkMode
                                ? "bg-slate-900/90 border-slate-700/50"
                                : "bg-white/90 border-gray-200/50"
                        } shadow-xl max-h-80 overflow-y-auto`}
                        style={{ pointerEvents: 'auto' }}
                    >
                        {searchResultNodes.map((node, index) => (
                            <div
                                key={node.id}
                                onClick={() => handleNodeSelect(node)}
                                className={`px-4 py-3 cursor-pointer transition-all duration-150 flex items-center gap-3 ${
                                    isDarkMode
                                        ? "hover:bg-slate-800/60 border-slate-700/30"
                                        : "hover:bg-gray-100/60 border-gray-200/30"
                                } ${index !== searchResultNodes.length - 1 ? "border-b" : ""}`}
                            >
                                <div className="flex-shrink-0">
                                    <Search size={16} className={isDarkMode ? "text-slate-400" : "text-gray-500"} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className={`font-medium truncate ${
                                        isDarkMode ? "text-slate-200" : "text-gray-800"
                                    }`}>
                                        {getNodeDisplayText(node)}
                                    </div>
                                    <div className={`text-sm truncate ${
                                        isDarkMode ? "text-slate-400" : "text-gray-500"
                                    }`}>
                                        {getNodeSubText(node)}
                                    </div>
                                </div>
                                <div className="flex-shrink-0">
                                    <ArrowRight size={14} className={`transition-transform duration-200 ${
                                        isDarkMode ? "text-slate-500" : "text-gray-400"
                                    }`} />
                                </div>
                            </div>
                        ))}
                        
                        {searchResultNodes.length === 0 && localValue.trim() && (
                            <div className={`px-4 py-6 text-center ${
                                isDarkMode ? "text-slate-400" : "text-gray-500"
                            }`}>
                                No results found for "{localValue}"
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default GraphSearch;