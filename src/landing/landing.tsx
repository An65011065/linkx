import React, { useState, useEffect, useRef } from "react";
import { Calendar, ChevronDown, ArrowRight, Moon, Sun } from "lucide-react";

interface CalendarEvent {
    id: string;
    title: string;
    time: string;
    color: string;
}

// Text animation component for insights
const AnimatedText: React.FC<{
    text: string;
    animation: "karaoke" | "filling";
    isDarkMode: boolean;
}> = ({ text, animation, isDarkMode }) => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        // Set up the characters
        element.textContent = "";
        [...text].forEach((char) => {
            const span = document.createElement("span");
            span.className = "char";
            span.textContent = char === " " ? "\u00A0" : char; // Non-breaking space for proper spacing
            span.setAttribute("data-char", char === " " ? "\u00A0" : char);
            element.appendChild(span);
        });

        // Trigger animation
        const chars = element.querySelectorAll(".char");
        chars.forEach((char, index) => {
            (char as HTMLElement).style.setProperty("--reveal", "0");
            setTimeout(() => {
                (char as HTMLElement).style.setProperty("--reveal", "1");
            }, index * 30);
        });

        return () => {
            // Clean up on unmount
            chars.forEach((char) => {
                (char as HTMLElement).style.setProperty("--reveal", "0");
            });
        };
    }, [text]);

    return (
        <div
            ref={ref}
            className={`${animation} ${
                isDarkMode ? "dark" : "light"
            } text-xl font-light`}
            style={{ position: "relative" }}
        >
            {text}
        </div>
    );
};

const LandingPage: React.FC = () => {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentTime, setCurrentTime] = useState(new Date());
    const [currentPage, setCurrentPage] = useState<"main" | "data" | "network">(
        "main",
    );
    const [searchType, setSearchType] = useState<"Search" | "Insights">(
        "Search",
    );
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [showAllEvents, setShowAllEvents] = useState(false);
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    // Refs for positioning
    const searchRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const calendarRef = useRef<HTMLDivElement>(null);

    // Mock calendar events - replace with real data
    const upcomingEvents: CalendarEvent[] = [
        {
            id: "1",
            title: "Team Standup",
            time: "10:00 AM",
            color: "bg-blue-500",
        },
        {
            id: "2",
            title: "Design Review",
            time: "2:30 PM",
            color: "bg-green-500",
        },
        {
            id: "3",
            title: "Client Call",
            time: "4:00 PM",
            color: "bg-purple-500",
        },
    ];
    const nextEvent = upcomingEvents[0];

    // Rotating insight placeholders
    const insightPlaceholders = [
        "Analyze market trends...",
        "Find patterns in data...",
        "Generate insights...",
        "Explore connections...",
        "Discover opportunities...",
    ];
    const [currentPlaceholderIndex, setCurrentPlaceholderIndex] = useState(0);

    // Update time every minute
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    // Rotate placeholder text - faster switching
    useEffect(() => {
        if (searchType === "Insights" && !isSearchFocused) {
            const interval = setInterval(() => {
                setCurrentPlaceholderIndex(
                    (prev) => (prev + 1) % insightPlaceholders.length,
                );
            }, 2500); // Faster switching - 2.5 seconds total
            return () => clearInterval(interval);
        }
    }, [searchType, insightPlaceholders.length, isSearchFocused]);

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
                calendarRef.current &&
                !calendarRef.current.contains(event.target as Node)
            ) {
                setShowAllEvents(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleSearch = () => {
        if (searchQuery.trim()) {
            if (searchQuery.includes(".") && !searchQuery.includes(" ")) {
                window.open(`https://${searchQuery}`, "_blank");
            } else {
                window.open(
                    `https://www.google.com/search?q=${encodeURIComponent(
                        searchQuery,
                    )}`,
                    "_blank",
                );
            }
        }
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getGreeting = () => {
        const hour = currentTime.getHours();
        if (hour < 12) return "Good morning";
        if (hour < 17) return "Good afternoon";
        return "Good evening";
    };

    // Handle input focus - clear placeholder
    const handleSearchFocus = () => {
        setIsSearchFocused(true);
    };

    // Handle input blur - restore placeholder if empty
    const handleSearchBlur = () => {
        setIsSearchFocused(false);
    };

    return (
        // Fixed: Added global reset styles and proper full-screen coverage
        <div
            className={`min-h-screen h-screen w-full transition-all duration-300 ${
                isDarkMode ? "bg-slate-950" : "bg-gray-50"
            }`}
            style={{
                margin: 0,
                padding: 0,
                position: "relative",
                overflow: "hidden",
            }}
        >
            {/* Simple Floating Header - Just Navigation + Dark Mode */}
            <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
                <div
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl backdrop-blur-md border ${
                        isDarkMode
                            ? "bg-slate-900/80 border-slate-700/50"
                            : "bg-white/80 border-gray-200/50"
                    }`}
                >
                    {/* Navigation Pills */}
                    <div
                        className={`flex gap-1 p-1 rounded-lg ${
                            isDarkMode ? "bg-slate-800/50" : "bg-gray-100/50"
                        }`}
                    >
                        {[
                            { key: "main", label: "Home" },
                            { key: "data", label: "Data" },
                            { key: "network", label: "Network" },
                        ].map(({ key, label }) => (
                            <button
                                key={key}
                                onClick={() => setCurrentPage(key as any)}
                                className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                                    currentPage === key
                                        ? isDarkMode
                                            ? "bg-slate-700 text-slate-200"
                                            : "bg-white text-gray-800 shadow-sm"
                                        : isDarkMode
                                        ? "text-slate-400 hover:text-slate-300"
                                        : "text-gray-600 hover:text-gray-800"
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                    {/* Dark Mode Toggle */}
                    <button
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        className={`p-2 rounded-lg transition-all ${
                            isDarkMode
                                ? "text-slate-400 hover:bg-slate-800/50"
                                : "text-gray-600 hover:bg-gray-100"
                        }`}
                    >
                        {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
                    </button>
                </div>
            </div>
            {/* Main Content - Pushed higher for better visual balance */}
            <div className="flex flex-col items-center justify-center min-h-screen px-6 -mt-16">
                {/* Greeting */}
                <div className="text-center mb-8">
                    <h1
                        className={`text-xl font-light mb-6 ${
                            isDarkMode ? "text-slate-400" : "text-gray-600"
                        }`}
                    >
                        {getGreeting()}
                    </h1>
                    {/* Large Time */}
                    <div
                        className={`text-7xl font-extralight tracking-tight mb-2 ${
                            isDarkMode ? "text-slate-200" : "text-gray-900"
                        }`}
                        style={{ fontVariantNumeric: "tabular-nums" }}
                    >
                        {formatTime(currentTime)}
                    </div>
                    <div
                        className={`text-base ${
                            isDarkMode ? "text-slate-500" : "text-gray-500"
                        }`}
                    >
                        {currentTime.toLocaleDateString([], {
                            weekday: "long",
                            month: "long",
                            day: "numeric",
                        })}
                    </div>
                </div>
                {/* Search Bar - More compact and with relative positioning */}
                <div
                    className="w-full max-w-2xl mb-12 relative"
                    ref={searchRef}
                >
                    <div
                        className={`rounded-2xl backdrop-blur-md border transition-all duration-300 ${
                            isDarkMode
                                ? "bg-slate-900/50 border-slate-700/50"
                                : "bg-white/70 border-gray-200/50"
                        } ${isSearchFocused ? "shadow-xl" : "shadow-sm"}`}
                    >
                        <div className="relative">
                            <input
                                type="text"
                                placeholder={
                                    searchType === "Search"
                                        ? "Search or enter address"
                                        : ""
                                }
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={handleSearchFocus}
                                onBlur={handleSearchBlur}
                                onKeyPress={(e) =>
                                    e.key === "Enter" && handleSearch()
                                }
                                className={`w-full bg-transparent outline-none px-8 py-5 text-lg pr-32 ${
                                    isDarkMode
                                        ? "text-slate-200"
                                        : "text-gray-800"
                                }`}
                            />
                            {/* Animated Text for Insights placeholder */}
                            {searchType === "Insights" &&
                                !searchQuery &&
                                !isSearchFocused && (
                                    <div
                                        className="absolute left-8 top-5 pointer-events-none overflow-hidden"
                                        style={{ minWidth: "200px" }}
                                        key={currentPlaceholderIndex} // Force re-render for instant switching
                                    >
                                        <AnimatedText
                                            text={
                                                insightPlaceholders[
                                                    currentPlaceholderIndex
                                                ]
                                            }
                                            animation={
                                                currentPlaceholderIndex % 2 ===
                                                0
                                                    ? "karaoke"
                                                    : "filling"
                                            }
                                            isDarkMode={isDarkMode}
                                        />
                                    </div>
                                )}
                            {/* Bottom right controls */}
                            <div className="absolute bottom-4 right-4 flex items-center gap-2">
                                {/* Search Type Picker - Minimal Design */}
                                <div className="relative" ref={dropdownRef}>
                                    <button
                                        onClick={() =>
                                            setIsDropdownOpen(!isDropdownOpen)
                                        }
                                        className={`flex items-center gap-1 px-2 py-1 text-sm transition-all ${
                                            isDarkMode
                                                ? "text-slate-400 hover:text-slate-300"
                                                : "text-gray-500 hover:text-gray-700"
                                        }`}
                                    >
                                        {searchType}
                                        <ChevronDown
                                            size={12}
                                            className={`transition-transform ${
                                                isDropdownOpen
                                                    ? "rotate-180"
                                                    : ""
                                            }`}
                                        />
                                    </button>
                                    {/* Minimal dropdown - no borders or shadows */}
                                    {isDropdownOpen && (
                                        <div
                                            className={`absolute top-full right-0 mt-1 w-20 rounded-md overflow-hidden z-10 ${
                                                isDarkMode
                                                    ? "bg-slate-900/90"
                                                    : "bg-white/90"
                                            }`}
                                            style={{
                                                backdropFilter: "blur(12px)",
                                            }}
                                        >
                                            {["Search", "Insights"].map(
                                                (type) => (
                                                    <button
                                                        key={type}
                                                        onClick={() => {
                                                            setSearchType(
                                                                type as any,
                                                            );
                                                            setIsDropdownOpen(
                                                                false,
                                                            );
                                                        }}
                                                        className={`w-full px-3 py-2 text-left text-sm capitalize transition-all ${
                                                            searchType === type
                                                                ? isDarkMode
                                                                    ? "text-slate-200"
                                                                    : "text-gray-800"
                                                                : isDarkMode
                                                                ? "text-slate-400 hover:text-slate-300"
                                                                : "text-gray-500 hover:text-gray-700"
                                                        }`}
                                                    >
                                                        {type}
                                                    </button>
                                                ),
                                            )}
                                        </div>
                                    )}
                                </div>
                                {/* Send Button - Always visible */}
                                <button
                                    onClick={handleSearch}
                                    className={`p-2 rounded-lg transition-all hover:scale-105 ${
                                        searchQuery
                                            ? "bg-yellow-500 text-black"
                                            : "bg-yellow-400 text-gray-900"
                                    }`}
                                >
                                    <ArrowRight
                                        size={16}
                                        color={
                                            searchQuery
                                                ? "black"
                                                : "currentColor"
                                        }
                                    />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* What's Next - Calendar Events - FIXED: Absolute positioning to prevent layout shift */}
                {nextEvent ? (
                    <div className="relative" style={{ minHeight: "40px" }}>
                        <div className="absolute top-0 left-1/2 transform -translate-x-1/2">
                            <div
                                className="flex items-center px-2 py-2 cursor-pointer transition-all hover:opacity-80"
                                onClick={() => setShowAllEvents(!showAllEvents)}
                                style={{ minWidth: "280px" }}
                            >
                                <Calendar
                                    size={18}
                                    className={
                                        isDarkMode
                                            ? "text-slate-400"
                                            : "text-gray-600"
                                    }
                                />
                                <span
                                    className={`font-medium ml-3 ${
                                        isDarkMode
                                            ? "text-slate-200"
                                            : "text-gray-800"
                                    }`}
                                >
                                    {nextEvent.title}
                                </span>
                                <span
                                    className={`text-sm ml-auto ${
                                        isDarkMode
                                            ? "text-slate-400"
                                            : "text-gray-600"
                                    }`}
                                >
                                    {nextEvent.time}
                                </span>
                                <ChevronDown
                                    size={16}
                                    className={`transition-transform ml-2 ${
                                        showAllEvents ? "rotate-180" : ""
                                    } ${
                                        isDarkMode
                                            ? "text-slate-400"
                                            : "text-gray-400"
                                    }`}
                                />
                            </div>

                            {/* FIXED: Show all events inline without popup styling */}
                            {showAllEvents && upcomingEvents.length > 1 && (
                                <div className="mt-2 space-y-1">
                                    {upcomingEvents.slice(1).map((event) => (
                                        <div
                                            key={event.id}
                                            className="flex items-center px-2 py-2"
                                            style={{ minWidth: "280px" }}
                                        >
                                            {/* Empty space to align with main calendar icon */}
                                            <div
                                                style={{ width: "18px" }}
                                            ></div>
                                            <span
                                                className={`font-medium ml-3 ${
                                                    isDarkMode
                                                        ? "text-slate-200"
                                                        : "text-gray-800"
                                                }`}
                                            >
                                                {event.title}
                                            </span>
                                            <span
                                                className={`text-sm ${
                                                    isDarkMode
                                                        ? "text-slate-400"
                                                        : "text-gray-600"
                                                }`}
                                                style={{
                                                    marginLeft: "auto",
                                                    marginRight: "26px",
                                                }}
                                            >
                                                {event.time}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div
                        className={`text-center ${
                            isDarkMode ? "text-slate-500" : "text-gray-500"
                        }`}
                    >
                        <Calendar
                            size={20}
                            className="mx-auto mb-2 opacity-50"
                        />
                        <p className="text-sm">No upcoming events</p>
                    </div>
                )}
            </div>

            {/* CSS for text animations */}
            <style jsx>{`
                /* Global reset */
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }

                html,
                body {
                    height: 100%;
                    margin: 0;
                    padding: 0;
                }

                /* Karaoke animation */
                .karaoke {
                    margin-bottom: 10px;
                }

                .karaoke .char {
                    color: ${isDarkMode
                        ? "hsla(0, 0%, 60%, 0.25)"
                        : "hsla(0, 0%, 50%, 0.25)"};
                    position: relative;
                    display: inline-block;
                }

                .karaoke .char:after {
                    content: attr(data-char);
                    position: absolute;
                    left: 0;
                    top: 0;
                    color: ${isDarkMode
                        ? "hsl(0, 0%, 60%)"
                        : "hsl(0, 0%, 50%)"};
                    visibility: visible;
                    clip-path: inset(
                        0 calc((100 - (var(--reveal, 0) * 100)) * 1%) 0 0
                    );
                    transition: clip-path 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }

                /* Filling animation */
                .filling {
                    margin-bottom: 10px;
                }

                .filling .char {
                    color: ${isDarkMode
                        ? "hsla(0, 0%, 60%, 0.25)"
                        : "hsla(0, 0%, 50%, 0.25)"};
                    position: relative;
                    display: inline-block;
                }

                .filling .char:after {
                    content: attr(data-char);
                    position: absolute;
                    left: 0;
                    top: 0;
                    color: ${isDarkMode
                        ? "hsl(0, 0%, 60%)"
                        : "hsl(0, 0%, 50%)"};
                    visibility: visible;
                    clip-path: inset(
                        calc((100 - (var(--reveal, 0) * 100)) * 1%) 0 0 0
                    );
                    transition: clip-path 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }
            `}</style>
        </div>
    );
};

export default LandingPage;
