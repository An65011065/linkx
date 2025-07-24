import React, { useState } from "react";
import { Search, ArrowRight, ChevronDown, Moon, Sun } from "lucide-react";

interface FloatingHeaderProps {
    isDarkMode: boolean;
    onToggleDarkMode: () => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onSearch: () => void;
    currentPage?: "main" | "data" | "network";
    onNavigate?: (page: "main" | "data" | "network") => void;
    className?: string;
}

const FloatingHeader: React.FC<FloatingHeaderProps> = ({
    isDarkMode,
    onToggleDarkMode,
    searchQuery,
    onSearchChange,
    onSearch,
    currentPage,
    onNavigate,
    className = "",
}) => {
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [searchType, setSearchType] = useState<"search" | "insights">(
        "search",
    );
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            onSearch();
        }
    };

    return (
        <div
            className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-2xl px-6 ${className}`}
        >
            <div
                className={`backdrop-blur-xl rounded-2xl shadow-2xl border transition-all duration-300 ${
                    isDarkMode
                        ? "bg-slate-900/90 border-slate-700/50"
                        : "bg-white/90 border-white/50"
                } ${isSearchFocused ? "scale-[1.02]" : ""}`}
            >
                {/* Navigation Pills - Only show if navigation is provided */}
                {onNavigate && currentPage && (
                    <div className="flex justify-center pt-4 pb-2">
                        <div
                            className={`flex items-center gap-1 p-1 rounded-xl ${
                                isDarkMode
                                    ? "bg-slate-800/50"
                                    : "bg-gray-100/50"
                            }`}
                        >
                            {["main", "data", "network"].map((page) => (
                                <button
                                    key={page}
                                    onClick={() => onNavigate(page as any)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 capitalize ${
                                        currentPage === page
                                            ? isDarkMode
                                                ? "bg-slate-700 text-slate-200"
                                                : "bg-white text-gray-800"
                                            : isDarkMode
                                            ? "text-slate-400 hover:text-slate-300"
                                            : "text-gray-600 hover:text-gray-800"
                                    }`}
                                >
                                    {page === "main" ? "home" : page}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Search Section */}
                <div className="p-4">
                    <div className="flex items-center rounded-xl overflow-hidden">
                        {/* Search Input */}
                        <div className="flex items-center gap-3 px-4 py-3 flex-1">
                            <Search
                                size={18}
                                className={`transition-colors duration-200 ${
                                    isSearchFocused
                                        ? isDarkMode
                                            ? "text-slate-300"
                                            : "text-gray-700"
                                        : isDarkMode
                                        ? "text-slate-500"
                                        : "text-gray-400"
                                }`}
                            />
                            <input
                                type="text"
                                placeholder={
                                    searchType === "search"
                                        ? "Search or enter address"
                                        : "Search insights, data, patterns..."
                                }
                                value={searchQuery}
                                onChange={(e) => onSearchChange(e.target.value)}
                                onFocus={() => setIsSearchFocused(true)}
                                onBlur={() => setIsSearchFocused(false)}
                                onKeyPress={handleKeyPress}
                                className={`flex-1 bg-transparent outline-none text-lg font-light ${
                                    isDarkMode
                                        ? "text-slate-200"
                                        : "text-gray-800"
                                }`}
                            />
                            {searchQuery && (
                                <button
                                    onClick={onSearch}
                                    className={`transition-all duration-200 hover:scale-110 ${
                                        isDarkMode
                                            ? "text-slate-400 hover:text-slate-300"
                                            : "text-gray-500 hover:text-gray-700"
                                    }`}
                                >
                                    <ArrowRight size={18} />
                                </button>
                            )}
                        </div>

                        {/* Search Type Picker */}
                        <div className="relative">
                            <button
                                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium capitalize rounded-r-xl border-l transition-all duration-200 ${
                                    isDarkMode
                                        ? "text-slate-300 border-slate-700 hover:bg-slate-800/50"
                                        : "text-gray-700 border-gray-200 hover:bg-gray-50"
                                }`}
                                onClick={() =>
                                    setIsDropdownOpen(!isDropdownOpen)
                                }
                            >
                                {searchType}
                                <ChevronDown
                                    size={14}
                                    className={`transition-transform duration-200 ${
                                        isDropdownOpen ? "rotate-180" : ""
                                    }`}
                                />
                            </button>

                            {isDropdownOpen && (
                                <div
                                    className={`absolute right-0 top-full mt-2 w-32 rounded-lg border backdrop-blur-xl z-50 shadow-xl ${
                                        isDarkMode
                                            ? "bg-slate-800/90 border-slate-700/50"
                                            : "bg-white/90 border-gray-200/50"
                                    }`}
                                >
                                    {["search", "insights"].map((type) => (
                                        <button
                                            key={type}
                                            className={`w-full px-4 py-3 text-left text-sm capitalize transition-all duration-200 ${
                                                type === "search"
                                                    ? "rounded-t-lg"
                                                    : "rounded-b-lg"
                                            } ${
                                                searchType === type
                                                    ? isDarkMode
                                                        ? "bg-slate-700/50 text-slate-200"
                                                        : "bg-gray-100 text-gray-800"
                                                    : isDarkMode
                                                    ? "text-slate-300 hover:bg-slate-700/30"
                                                    : "text-gray-700 hover:bg-gray-50"
                                            }`}
                                            onClick={() => {
                                                setSearchType(type as any);
                                                setIsDropdownOpen(false);
                                            }}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Dark Mode Toggle */}
                <div className="flex justify-end p-4 pt-0">
                    <button
                        onClick={onToggleDarkMode}
                        className={`p-2 rounded-lg transition-all duration-200 hover:scale-105 ${
                            isDarkMode
                                ? "bg-slate-800/50 text-slate-400 hover:bg-slate-800/70"
                                : "bg-gray-100/50 text-gray-600 hover:bg-gray-100/70"
                        }`}
                    >
                        {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FloatingHeader;
