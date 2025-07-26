import React, { useState, useEffect, useRef } from "react";
import { Calendar, ChevronDown } from "lucide-react";
import SearchBar from "./searchbar";
import FloatingHeader from "./FloatingHeader";
import { useCalendarData, CalendarEvent, AuthUser } from "../components/CalendarDataProvider";

interface LandingPageProps {
    isDarkMode: boolean;
    onToggleDarkMode: () => void;
    currentPage: "main" | "data" | "network" | "maintab" | "insights";
    onNavigate: (page: "main" | "data" | "network" | "maintab" | "insights", query?: string) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({
    isDarkMode,
    onToggleDarkMode,
    currentPage,
    onNavigate,
}) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [currentTime, setCurrentTime] = useState(new Date());
    const [searchType, setSearchType] = useState<"Search" | "Ask">(
        "Search",
    );
    const { user, calendarEvents, isLoading, error } = useCalendarData();

    // Debug logging for Landing page
    useEffect(() => {
        console.log('🏠 Landing page data update:', {
            user: user ? user.email : 'none',
            userHasAccessToken: user ? !!user.accessToken : false,
            calendarEventsCount: calendarEvents.length,
            isLoading
        });
    }, [user, calendarEvents, isLoading]);

    // Handle search type change
    const handleSearchTypeChange = (type: "Search" | "Ask") => {
        setSearchType(type);
    };
    const [showAllEvents, setShowAllEvents] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    // Refs for positioning and animation
    const calendarRef = useRef<HTMLDivElement>(null);
    const mainContentRef = useRef<HTMLDivElement>(null);

    const formatEventTime = (date: Date) => {
        return date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
    };

    // Fallback to hardcoded events if no calendar events loaded and no user
    const hardcodedEvents = [
        {
            id: "1",
            title: "Team Standup",
            start: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
            end: new Date(Date.now() + 3 * 60 * 60 * 1000),
            location: "",
            description: "",
        },
        {
            id: "2", 
            title: "Design Review",
            start: new Date(Date.now() + 5 * 60 * 60 * 1000), // 5 hours from now
            end: new Date(Date.now() + 6 * 60 * 60 * 1000),
            location: "",
            description: "",
        },
    ];

    // Show all events for today and tomorrow, including past ones
    const getFilteredEvents = () => {
        const now = new Date();
        const startOfToday = new Date(now);
        startOfToday.setHours(0, 0, 0, 0);
        const endOfTomorrow = new Date(now);
        endOfTomorrow.setDate(endOfTomorrow.getDate() + 1);
        endOfTomorrow.setHours(23, 59, 59, 999);
        
        return calendarEvents
            .filter(event => event.start >= startOfToday && event.start <= endOfTomorrow)
            .sort((a, b) => a.start.getTime() - b.start.getTime());
    };

    // Check if an event has passed
    const isEventPast = (eventStart: Date) => {
        return eventStart < new Date();
    };

    const filteredEvents = getFilteredEvents();
    const eventsToShow = filteredEvents.length > 0 ? filteredEvents : (user ? [] : hardcodedEvents);
    
    // Find the next upcoming event (not past)
    const nextUpcomingEvent = eventsToShow.find(event => !isEventPast(event.start));
    const nextEvent = nextUpcomingEvent || eventsToShow[0]; // Fallback to first event if all are past

    // Handle initial load animation
    useEffect(() => {
        const timer = setTimeout(() => setIsInitialLoad(false), 100);
        return () => clearTimeout(timer);
    }, []);

    // Update time every minute
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    // Close calendar dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                calendarRef.current &&
                !calendarRef.current.contains(event.target as Node)
            ) {
                setShowAllEvents(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSearch = () => {
        if (searchType === "Ask") {
            onNavigate("insights", searchQuery);
            return;
        }
        
        if (searchQuery.trim()) {
            if (searchQuery.includes(".") && !searchQuery.includes(" ")) {
                window.location.href = `https://${searchQuery}`;
            } else {
                window.location.href = `https://www.google.com/search?q=${encodeURIComponent(
                    searchQuery,
                )}`;
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

    return (
        <div
            className={`min-h-screen h-screen w-full transition-all duration-700 ease-out ${
                isDarkMode ? "bg-slate-950" : "bg-gray-50"
            }`}
            style={{
                margin: 0,
                padding: 0,
                position: "relative",
                overflow: "hidden",
                zIndex: 1,
                backgroundColor: "transparent"
            }}
        >
            {/* Floating Header Component */}
            <FloatingHeader
                isDarkMode={isDarkMode}
                onToggleDarkMode={onToggleDarkMode}
                currentPage={currentPage}
                onNavigate={onNavigate}
                isInitialLoad={isInitialLoad}
            />

            {/* Main content with staggered animations */}
            <div
                ref={mainContentRef}
                className="flex flex-col items-center justify-center min-h-screen px-6 -mt-16"
            >
                {/* Greeting with fade-in animation */}
                <div
                    className={`text-center mb-8 transition-all duration-700 ease-out ${
                        isInitialLoad
                            ? "opacity-0 translate-y-4"
                            : "opacity-100 translate-y-0"
                    }`}
                    style={{ animationDelay: "400ms" }}
                >
                    <h1
                        className={`text-xl font-light mb-6 transition-colors duration-500 ${
                            isDarkMode ? "text-slate-400" : "text-gray-600"
                        }`}
                    >
                        {getGreeting()}
                    </h1>

                    {/* Enhanced time display */}
                    <div
                        className={`text-7xl font-extralight tracking-tight mb-2 transition-all duration-500 ${
                            isDarkMode ? "text-slate-200" : "text-gray-900"
                        }`}
                        style={{
                            fontVariantNumeric: "tabular-nums",
                            textShadow: isDarkMode
                                ? "0 0 20px rgba(148, 163, 184, 0.1)"
                                : "0 0 20px rgba(0, 0, 0, 0.05)",
                        }}
                    >
                        {formatTime(currentTime)}
                    </div>

                    <div
                        className={`text-base transition-colors duration-500 ${
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

                {/* Search bar using SearchBar component */}
                <SearchBar
                    isDarkMode={isDarkMode}
                    searchQuery={searchQuery}
                    onSearchQueryChange={setSearchQuery}
                    onSearch={handleSearch}
                    placeholder="Search or enter address"
                    searchType={searchType}
                    onSearchTypeChange={handleSearchTypeChange}
                    showTypeSelector={true}
                    isInitialLoad={isInitialLoad}
                    variant="main"
                    animationDelay="600ms"
                />

                {/* Enhanced calendar section */}
                {nextEvent ? (
                    <div
                        ref={calendarRef}
                        className={`relative transition-all duration-700 ease-out ${
                            isInitialLoad
                                ? "opacity-0 translate-y-4"
                                : "opacity-100 translate-y-0"
                        }`}
                        style={{ minHeight: "40px", animationDelay: "800ms" }}
                    >
                        <div className="absolute top-0 left-1/2 transform -translate-x-1/2">
                            <div
                                className={`flex items-center px-4 py-3 cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 rounded-xl ${
                                    isDarkMode
                                        ? "hover:bg-slate-900/30"
                                        : "hover:bg-white/50"
                                }`}
                                onClick={() => setShowAllEvents(!showAllEvents)}
                                style={{ minWidth: "280px" }}
                            >
                                <Calendar
                                    size={18}
                                    className={`transition-all duration-300 ${
                                        isDarkMode
                                            ? "text-slate-400"
                                            : "text-gray-600"
                                    } ${showAllEvents ? "text-blue-500" : ""}`}
                                />
                                <span
                                    className={`font-medium ml-3 transition-colors duration-300 ${
                                        isDarkMode
                                            ? "text-slate-200"
                                            : "text-gray-800"
                                    } ${isEventPast(nextEvent.start) ? "line-through opacity-60" : ""}`}
                                >
                                    {nextEvent.title}
                                </span>
                                <span
                                    className={`text-sm ml-auto transition-colors duration-300 ${
                                        isDarkMode
                                            ? "text-slate-400"
                                            : "text-gray-600"
                                    }`}
                                >
                                    {formatEventTime(nextEvent.start)}
                                </span>
                                <ChevronDown
                                    size={16}
                                    className={`transition-all duration-300 ml-2 ${
                                        showAllEvents
                                            ? "rotate-180 text-blue-500"
                                            : ""
                                    } ${
                                        isDarkMode
                                            ? "text-slate-400"
                                            : "text-gray-400"
                                    }`}
                                />
                            </div>

                            {/* Enhanced events list */}
                            <div
                                className={`overflow-hidden transition-all duration-500 ease-out ${
                                    showAllEvents
                                        ? "max-h-96 opacity-100"
                                        : "max-h-0 opacity-0"
                                }`}
                            >
                                <div className="mt-2 space-y-1">
                                    {eventsToShow
                                        .slice(1)
                                        .map((event, index) => (
                                            <div
                                                key={event.id}
                                                className={`flex items-center px-4 py-3 rounded-lg transition-all duration-300 hover:scale-105 ${
                                                    isDarkMode
                                                        ? "hover:bg-slate-900/30"
                                                        : "hover:bg-white/50"
                                                }`}
                                                style={{
                                                    minWidth: "280px",
                                                    animationDelay: `${
                                                        (index + 1) * 100
                                                    }ms`,
                                                    transform: showAllEvents
                                                        ? "translateY(0)"
                                                        : "translateY(-10px)",
                                                    opacity: showAllEvents
                                                        ? 1
                                                        : 0,
                                                    transition: `all 0.3s ease-out ${
                                                        (index + 1) * 100
                                                    }ms`,
                                                }}
                                            >
                                                <div
                                                    style={{ width: "18px" }}
                                                ></div>
                                                <span
                                                    className={`font-medium ml-3 transition-colors duration-300 ${
                                                        isDarkMode
                                                            ? "text-slate-200"
                                                            : "text-gray-800"
                                                    } ${isEventPast(event.start) ? "line-through opacity-60" : ""}`}
                                                >
                                                    {event.title}
                                                </span>
                                                <span
                                                    className={`text-sm transition-colors duration-300 ${
                                                        isDarkMode
                                                            ? "text-slate-400"
                                                            : "text-gray-600"
                                                    }`}
                                                    style={{
                                                        marginLeft: "auto",
                                                        marginRight: "26px",
                                                    }}
                                                >
                                                    {formatEventTime(event.start)}
                                                </span>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div
                        className={`flex items-center justify-center transition-all duration-700 ease-out ${
                            isInitialLoad
                                ? "opacity-0 translate-y-4"
                                : "opacity-100 translate-y-0"
                        } ${isDarkMode ? "text-slate-500" : "text-gray-500"}`}
                        style={{ animationDelay: "800ms" }}
                    >
                        <Calendar
                            size={20}
                            className={`mr-2 opacity-50 transition-opacity duration-300 hover:opacity-70 ${error ? "text-red-400" : ""}`}
                        />
                        <p className="text-sm">
                            {error ? `Calendar error: ${error}` : "No events on your Google Calendar today"}
                        </p>
                    </div>
                )}
            </div>

            {/* Global styles */}
            <style>
                {`
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }

                html, body {
                    height: 100%;
                    margin: 0;
                    padding: 0;
                }

                ::-webkit-scrollbar {
                    width: 6px;
                }

                ::-webkit-scrollbar-track {
                    background: ${isDarkMode ? "#1e293b" : "#f1f5f9"};
                }

                ::-webkit-scrollbar-thumb {
                    background: ${isDarkMode ? "#475569" : "#cbd5e1"};
                    border-radius: 3px;
                }

                ::-webkit-scrollbar-thumb:hover {
                    background: ${isDarkMode ? "#64748b" : "#94a3b8"};
                }
                `}
            </style>
        </div>
    );
};

export default LandingPage;