import React, { useState, useEffect } from "react";
import {
    Search,
    ArrowRight,
    Moon,
    Sun,
    Github,
    Figma,
    Bot,
    Youtube,
    FileText,
    Music,
    Twitter,
    Zap,
    Target,
    Dribbble,
    Film,
    Smartphone,
    BookOpen,
    ArrowLeft,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

const DataLandingPage = () => {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [currentDayIndex, setCurrentDayIndex] = useState(6); // Today is index 6 (last day)

    // Generate day brackets for the last 7 days using current time
    const dayBrackets = React.useMemo(() => {
        const brackets = [];
        const now = currentTime;
        for (let i = 6; i >= 0; i--) {
            const dayStart = new Date(now);
            dayStart.setDate(now.getDate() - i);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(dayStart);
            dayEnd.setHours(23, 59, 59, 999);

            brackets.push({
                start: dayStart.getTime(),
                end: dayEnd.getTime(),
                label:
                    i === 0
                        ? "Today"
                        : i === 1
                        ? "Yesterday"
                        : dayStart.toLocaleDateString("en-US", {
                              weekday: "long",
                              month: "short",
                              day: "numeric",
                          }),
                shortLabel:
                    i === 0
                        ? "Today"
                        : i === 1
                        ? "Yesterday"
                        : dayStart.toLocaleDateString("en-US", {
                              weekday: "short",
                          }),
            });
        }
        return brackets;
    }, [currentTime]);

    const currentDay = dayBrackets[currentDayIndex];

    // Sample data - varies by day
    const getDomainDataForDay = (dayIndex) => {
        const baseData = [
            {
                domain: "github.com",
                time: 89 - dayIndex * 10,
                icon: "Github",
                category: "productive",
            },
            {
                domain: "figma.com",
                time: 67 - dayIndex * 8,
                icon: "Figma",
                category: "productive",
            },
            {
                domain: "claude.ai",
                time: 45 - dayIndex * 5,
                icon: "Bot",
                category: "productive",
            },
            {
                domain: "youtube.com",
                time: 34 - dayIndex * 4,
                icon: "Youtube",
                category: "leisure",
            },
            {
                domain: "notion.so",
                time: 28 - dayIndex * 3,
                icon: "FileText",
                category: "productive",
            },
            {
                domain: "spotify.com",
                time: 23 - dayIndex * 2,
                icon: "Music",
                category: "leisure",
            },
            {
                domain: "twitter.com",
                time: 19 - dayIndex * 2,
                icon: "Twitter",
                category: "leisure",
            },
            {
                domain: "vercel.com",
                time: 15 - dayIndex * 1,
                icon: "Zap",
                category: "productive",
            },
            {
                domain: "linear.app",
                time: 12 - dayIndex * 1,
                icon: "Target",
                category: "productive",
            },
            {
                domain: "dribbble.com",
                time: 11 - dayIndex * 1,
                icon: "Dribbble",
                category: "leisure",
            },
            {
                domain: "netflix.com",
                time: 9 - dayIndex * 1,
                icon: "Film",
                category: "leisure",
            },
            {
                domain: "medium.com",
                time: 8,
                icon: "BookOpen",
                category: "productive",
            },
        ];
        return baseData.filter((d) => d.time > 0).slice(0, 12);
    };

    const domainData = getDomainDataForDay(6 - currentDayIndex);
    const totalTime = domainData.reduce((sum, domain) => sum + domain.time, 0);
    const productiveTime = domainData
        .filter((d) => d.category === "productive")
        .reduce((sum, domain) => sum + domain.time, 0);
    const leisureTime = domainData
        .filter((d) => d.category === "leisure")
        .reduce((sum, domain) => sum + domain.time, 0);
    const totalSites = domainData.length;

    // Update time every minute
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const getGreeting = () => {
        const name = "Alex";
        return `Hello, ${name}`;
    };

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

    const navigateDay = (direction) => {
        if (direction === "prev" && currentDayIndex > 0) {
            setCurrentDayIndex(currentDayIndex - 1);
        } else if (direction === "next" && currentDayIndex < 6) {
            setCurrentDayIndex(currentDayIndex + 1);
        }
    };

    const formatTime = (minutes) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours === 0) return `${mins}m`;
        if (mins === 0) return `${hours}h`;
        return `${hours}h ${mins}m`;
    };

    const iconMap = {
        Github,
        Figma,
        Bot,
        Youtube,
        FileText,
        Music,
        Twitter,
        Zap,
        Target,
        Dribbble,
        Film,
        BookOpen,
        Smartphone,
    };

    return (
        <div
            className={`min-h-screen transition-all duration-500 ${
                isDarkMode
                    ? "bg-slate-950"
                    : "bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100"
            }`}
        >
            {/* Header */}
            <div className="flex justify-between items-center p-6">
                <button
                    className={`p-2.5 rounded-xl transition-all duration-200 hover:scale-105 backdrop-blur-sm border ${
                        isDarkMode
                            ? "bg-slate-800/50 text-slate-400 hover:bg-slate-800/70 border-slate-700/30"
                            : "bg-white/50 text-amber-600 hover:bg-white/70 border-amber-200/30"
                    }`}
                >
                    <ArrowLeft size={16} />
                </button>
                <button
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className={`p-2.5 rounded-xl transition-all duration-200 hover:scale-105 backdrop-blur-sm border ${
                        isDarkMode
                            ? "bg-slate-800/50 text-slate-400 hover:bg-slate-800/70 border-slate-700/30"
                            : "bg-white/50 text-amber-600 hover:bg-white/70 border-amber-200/30"
                    }`}
                >
                    {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
                </button>
            </div>

            {/* Main Content */}
            <div className="flex flex-col items-center justify-start px-6">
                {/* Header with greeting and day navigation */}
                <div className="text-center mb-12 animate-in fade-in duration-800 w-full max-w-4xl">
                    <h1
                        className={`text-3xl font-light mb-3 animate-in slide-in-from-top-4 duration-600 delay-200 ${
                            isDarkMode ? "text-slate-200" : "text-amber-900"
                        }`}
                    >
                        {getGreeting()}
                    </h1>
                    <p
                        className={`text-base mb-8 animate-in fade-in duration-500 delay-400 ${
                            isDarkMode ? "text-slate-400" : "text-amber-600"
                        }`}
                    >
                        Your digital activity overview
                    </p>

                    {/* Day Navigation */}
                    <div className="flex items-center justify-center gap-4 mb-8 animate-in slide-in-from-top-4 duration-600 delay-500">
                        <button
                            onClick={() => navigateDay("prev")}
                            disabled={currentDayIndex === 0}
                            className={`p-3 rounded-xl transition-all duration-200 hover:scale-105 backdrop-blur-sm border ${
                                currentDayIndex === 0
                                    ? isDarkMode
                                        ? "bg-slate-800/30 text-slate-600 border-slate-700/20 cursor-not-allowed"
                                        : "bg-white/30 text-amber-400 border-amber-200/20 cursor-not-allowed"
                                    : isDarkMode
                                    ? "bg-slate-800/50 text-slate-400 hover:bg-slate-800/70 border-slate-700/30 hover:text-slate-200"
                                    : "bg-white/50 text-amber-600 hover:bg-white/70 border-amber-200/30 hover:text-amber-800"
                            }`}
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <div
                            className={`px-6 py-3 rounded-xl backdrop-blur-xl border transition-all duration-300 ${
                                isDarkMode
                                    ? "bg-slate-800/50 border-slate-700/30 text-slate-200"
                                    : "bg-white/70 border-amber-200/40 text-amber-900"
                            }`}
                        >
                            <div
                                className={`text-lg font-medium ${
                                    isDarkMode
                                        ? "text-slate-200"
                                        : "text-amber-900"
                                }`}
                            >
                                {currentDay.label}
                            </div>
                            <div
                                className={`text-xs font-medium ${
                                    isDarkMode
                                        ? "text-slate-400"
                                        : "text-amber-600"
                                }`}
                            >
                                {currentDayIndex === 6
                                    ? "Current day"
                                    : `${6 - currentDayIndex} day${
                                          6 - currentDayIndex !== 1 ? "s" : ""
                                      } ago`}
                            </div>
                        </div>
                        <button
                            onClick={() => navigateDay("next")}
                            disabled={currentDayIndex === 6}
                            className={`p-3 rounded-xl transition-all duration-200 hover:scale-105 backdrop-blur-sm border ${
                                currentDayIndex === 6
                                    ? isDarkMode
                                        ? "bg-slate-800/30 text-slate-600 border-slate-700/20 cursor-not-allowed"
                                        : "bg-white/30 text-amber-400 border-amber-200/20 cursor-not-allowed"
                                    : isDarkMode
                                    ? "bg-slate-800/50 text-slate-400 hover:bg-slate-800/70 border-slate-700/30 hover:text-slate-200"
                                    : "bg-white/50 text-amber-600 hover:bg-white/70 border-amber-200/30 hover:text-amber-800"
                            }`}
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    {/* Total Time Display */}
                    <div
                        className={`text-6xl font-extralight mb-2 tracking-tight animate-in zoom-in duration-700 delay-600 ${
                            isDarkMode ? "text-slate-300" : "text-amber-800"
                        }`}
                        style={{ fontVariantNumeric: "tabular-nums" }}
                    >
                        {formatTime(totalTime)}
                    </div>
                    <div
                        className={`text-lg font-light animate-in fade-in duration-500 delay-700 ${
                            isDarkMode ? "text-slate-400" : "text-amber-600"
                        }`}
                    >
                        across {totalSites} websites
                    </div>
                </div>

                {/* Search */}
                <div className="w-full max-w-2xl mb-12 animate-in slide-in-from-bottom-4 duration-600 delay-800">
                    <div
                        className={`flex items-center gap-4 px-6 py-4 rounded-2xl backdrop-blur-xl shadow-lg transition-all duration-300 border ${
                            isDarkMode
                                ? "bg-slate-800/50 border-slate-700/30"
                                : "bg-white/70 border-amber-200/40"
                        } ${isSearchFocused ? "scale-[1.02] shadow-2xl" : ""}`}
                    >
                        <Search
                            size={18}
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
                            type="text"
                            placeholder="Search or enter address"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => setIsSearchFocused(true)}
                            onBlur={() => setIsSearchFocused(false)}
                            onKeyPress={(e) =>
                                e.key === "Enter" && handleSearch()
                            }
                            className={`flex-1 bg-transparent outline-none text-lg ${
                                isDarkMode ? "text-slate-200" : "text-amber-900"
                            }`}
                        />
                        {searchQuery && (
                            <button
                                onClick={handleSearch}
                                className={`transition-all duration-200 hover:scale-110 ${
                                    isDarkMode
                                        ? "text-slate-300"
                                        : "text-amber-600"
                                }`}
                            >
                                <ArrowRight size={18} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Productive vs Leisure Stats */}
                <div className="flex items-center gap-12 mb-12 animate-in fade-in duration-600 delay-900">
                    <div className="text-center">
                        <div
                            className={`text-3xl font-light mb-2 animate-in zoom-in duration-500 delay-1000 ${
                                isDarkMode
                                    ? "text-emerald-400"
                                    : "text-emerald-600"
                            }`}
                            style={{ fontVariantNumeric: "tabular-nums" }}
                        >
                            {formatTime(productiveTime)}
                        </div>
                        <div
                            className={`text-sm font-medium uppercase tracking-wide animate-in fade-in duration-400 delay-1100 ${
                                isDarkMode
                                    ? "text-emerald-400/70"
                                    : "text-emerald-600/70"
                            }`}
                        >
                            Productive
                        </div>
                    </div>

                    <div
                        className={`w-px h-16 animate-in slide-in-from-top-4 duration-400 delay-1000 ${
                            isDarkMode ? "bg-slate-600" : "bg-amber-300"
                        }`}
                    ></div>

                    <div className="text-center">
                        <div
                            className={`text-3xl font-light mb-2 animate-in zoom-in duration-500 delay-1200 ${
                                isDarkMode
                                    ? "text-purple-400"
                                    : "text-purple-600"
                            }`}
                            style={{ fontVariantNumeric: "tabular-nums" }}
                        >
                            {formatTime(leisureTime)}
                        </div>
                        <div
                            className={`text-sm font-medium uppercase tracking-wide animate-in fade-in duration-400 delay-1300 ${
                                isDarkMode
                                    ? "text-purple-400/70"
                                    : "text-purple-600/70"
                            }`}
                        >
                            Leisure
                        </div>
                    </div>
                </div>

                {/* Domain Grid */}
                <div className="w-full max-w-4xl mb-12 animate-in fade-in duration-600 delay-1400">
                    <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-4">
                        {domainData.map((domain, index) => {
                            const IconComponent = iconMap[domain.icon];
                            return (
                                <div
                                    key={domain.domain}
                                    className="group flex flex-col items-center gap-2 animate-in slide-in-from-bottom-4"
                                    style={{
                                        animationDuration: "400ms",
                                        animationDelay: `${
                                            1500 + index * 50
                                        }ms`,
                                    }}
                                >
                                    <div
                                        className={`w-12 h-12 flex items-center justify-center transition-all duration-200 hover:scale-110 rounded-xl backdrop-blur-sm border group-hover:shadow-lg ${
                                            domain.category === "productive"
                                                ? isDarkMode
                                                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                                    : "bg-emerald-100/80 text-emerald-700 border-emerald-200/50"
                                                : isDarkMode
                                                ? "bg-purple-500/20 text-purple-400 border-purple-500/30"
                                                : "bg-purple-100/80 text-purple-700 border-purple-200/50"
                                        }`}
                                    >
                                        {IconComponent && (
                                            <IconComponent size={18} />
                                        )}
                                    </div>
                                    <div className="text-center">
                                        <div
                                            className={`text-xs font-medium ${
                                                isDarkMode
                                                    ? "text-slate-300"
                                                    : "text-amber-700"
                                            }`}
                                            style={{
                                                fontVariantNumeric:
                                                    "tabular-nums",
                                            }}
                                        >
                                            {formatTime(domain.time)}
                                        </div>
                                        <div
                                            className={`text-xs truncate max-w-16 ${
                                                isDarkMode
                                                    ? "text-slate-500"
                                                    : "text-amber-500"
                                            }`}
                                        >
                                            {domain.domain.split(".")[0]}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Bottom Stats */}
                <div className="w-full max-w-4xl animate-in fade-in duration-600 delay-1800">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div
                            className={`text-center p-6 rounded-xl backdrop-blur-xl border transition-all duration-200 hover:scale-105 animate-in slide-in-from-bottom-4 duration-400 delay-1900 ${
                                isDarkMode
                                    ? "bg-slate-800/40 border-slate-700/30"
                                    : "bg-white/50 border-amber-200/30"
                            }`}
                        >
                            <div
                                className={`text-2xl font-light mb-2 ${
                                    isDarkMode
                                        ? "text-slate-200"
                                        : "text-amber-900"
                                }`}
                                style={{ fontVariantNumeric: "tabular-nums" }}
                            >
                                {Math.round(
                                    (productiveTime / totalTime) * 100,
                                ) || 0}
                                %
                            </div>
                            <div
                                className={`text-xs font-medium ${
                                    isDarkMode
                                        ? "text-slate-400"
                                        : "text-amber-600"
                                }`}
                            >
                                Productive time
                            </div>
                        </div>

                        <div
                            className={`text-center p-6 rounded-xl backdrop-blur-xl border transition-all duration-200 hover:scale-105 animate-in slide-in-from-bottom-4 duration-400 delay-2000 ${
                                isDarkMode
                                    ? "bg-slate-800/40 border-slate-700/30"
                                    : "bg-white/50 border-amber-200/30"
                            }`}
                        >
                            <div
                                className={`text-2xl font-light mb-2 ${
                                    isDarkMode
                                        ? "text-emerald-400"
                                        : "text-emerald-600"
                                }`}
                                style={{ fontVariantNumeric: "tabular-nums" }}
                            >
                                {Math.max(...domainData.map((d) => d.time))}m
                            </div>
                            <div
                                className={`text-xs font-medium ${
                                    isDarkMode
                                        ? "text-slate-400"
                                        : "text-amber-600"
                                }`}
                            >
                                Longest session
                            </div>
                        </div>

                        <div
                            className={`text-center p-6 rounded-xl backdrop-blur-xl border transition-all duration-200 hover:scale-105 animate-in slide-in-from-bottom-4 duration-400 delay-2100 ${
                                isDarkMode
                                    ? "bg-slate-800/40 border-slate-700/30"
                                    : "bg-white/50 border-amber-200/30"
                            }`}
                        >
                            <div
                                className={`text-2xl font-light mb-2 ${
                                    isDarkMode
                                        ? "text-purple-400"
                                        : "text-purple-600"
                                }`}
                            >
                                {
                                    domainData.filter(
                                        (d) => d.category === "productive",
                                    ).length
                                }
                            </div>
                            <div
                                className={`text-xs font-medium ${
                                    isDarkMode
                                        ? "text-slate-400"
                                        : "text-amber-600"
                                }`}
                            >
                                Work sites
                            </div>
                        </div>

                        <div
                            className={`text-center p-6 rounded-xl backdrop-blur-xl border transition-all duration-200 hover:scale-105 animate-in slide-in-from-bottom-4 duration-400 delay-2200 ${
                                isDarkMode
                                    ? "bg-slate-800/40 border-slate-700/30"
                                    : "bg-white/50 border-amber-200/30"
                            }`}
                        >
                            <div
                                className={`text-2xl font-light mb-2 ${
                                    isDarkMode
                                        ? "text-blue-400"
                                        : "text-blue-600"
                                }`}
                            >
                                {
                                    domainData.filter(
                                        (d) => d.category === "leisure",
                                    ).length
                                }
                            </div>
                            <div
                                className={`text-xs font-medium ${
                                    isDarkMode
                                        ? "text-slate-400"
                                        : "text-amber-600"
                                }`}
                            >
                                Leisure sites
                            </div>
                        </div>
                    </div>
                </div>

                <div className="h-12"></div>
            </div>

            <style>{`
                input::placeholder {
                    color: ${
                        isDarkMode
                            ? "rgba(148, 163, 184, 0.5)"
                            : "rgba(217, 119, 6, 0.5)"
                    };
                    font-weight: 400;
                }
            `}</style>
        </div>
    );
};

export default DataLandingPage;
