import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, ArrowRight, Search } from "lucide-react";

interface SearchBarProps {
    isDarkMode: boolean;
    searchQuery: string;
    onSearchQueryChange: (query: string) => void;
    onSearch: () => void;
    placeholder?: string;
    searchType?: "Search" | "Insights";
    onSearchTypeChange?: (type: "Search" | "Insights") => void;
    showTypeSelector?: boolean;
    isInitialLoad?: boolean;
    animationDelay?: string;
    variant?: "main" | "data";
    className?: string;
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
}) => {
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [currentPlaceholderIndex, setCurrentPlaceholderIndex] = useState(0);

    const dropdownRef = useRef<HTMLDivElement>(null);

    // Rotating insight placeholders
    const insightPlaceholders = [
        "Analyze market trends...",
        "Find patterns in data...",
        "Generate insights...",
        "Explore connections...",
        "Discover opportunities...",
    ];

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

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsDropdownOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
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
                ? "bg-yellow-500 text-black"
                : "bg-yellow-400 text-gray-900 hover:bg-yellow-500",
            shadow: searchQuery
                ? "0 4px 20px rgba(245, 158, 11, 0.3)"
                : "0 2px 10px rgba(245, 158, 11, 0.2)",
            hoverShadow: "hover:shadow-yellow-500/25",
        };
    };

    const buttonColors = getButtonColor();

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
                        placeholder={
                            searchType === "Search" || !showTypeSelector
                                ? placeholder
                                : ""
                        }
                        value={searchQuery}
                        onChange={(e) => onSearchQueryChange(e.target.value)}
                        onFocus={() => setIsSearchFocused(true)}
                        onBlur={() => setIsSearchFocused(false)}
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
                                    className={`absolute top-full right-0 mt-1 w-20 rounded-md overflow-hidden z-10 transition-all duration-200 ${
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
                                    {["Search", "Insights"].map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => {
                                                onSearchTypeChange(
                                                    type as
                                                        | "Search"
                                                        | "Insights",
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
        </div>
    );
};

export default SearchBar;
