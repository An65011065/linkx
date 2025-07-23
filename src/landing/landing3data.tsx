import React, { useState } from "react";
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
    TrendingUp,
    Eye,
} from "lucide-react";

interface DomainData {
    domain: string;
    time: number;
    icon: string;
    category: "productive" | "leisure";
}

interface DataLandingPageProps {
    isDarkMode: boolean;
    onBack: () => void;
}

const DataLandingPage: React.FC<DataLandingPageProps> = ({
    isDarkMode,
    onBack,
}) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    // Sample data
    const domainData: DomainData[] = [
        {
            domain: "github.com",
            time: 89,
            icon: "Github",
            category: "productive",
        },
        {
            domain: "figma.com",
            time: 67,
            icon: "Figma",
            category: "productive",
        },
        { domain: "claude.ai", time: 45, icon: "Bot", category: "productive" },
        {
            domain: "youtube.com",
            time: 34,
            icon: "Youtube",
            category: "leisure",
        },
        {
            domain: "notion.so",
            time: 28,
            icon: "FileText",
            category: "productive",
        },
        { domain: "spotify.com", time: 23, icon: "Music", category: "leisure" },
        {
            domain: "twitter.com",
            time: 19,
            icon: "Twitter",
            category: "leisure",
        },
        { domain: "vercel.com", time: 15, icon: "Zap", category: "productive" },
        {
            domain: "linear.app",
            time: 12,
            icon: "Target",
            category: "productive",
        },
        {
            domain: "dribbble.com",
            time: 11,
            icon: "Dribbble",
            category: "leisure",
        },
        { domain: "netflix.com", time: 9, icon: "Film", category: "leisure" },
        {
            domain: "medium.com",
            time: 8,
            icon: "BookOpen",
            category: "productive",
        },
    ];

    const totalTime = domainData.reduce((sum, domain) => sum + domain.time, 0);
    const productiveTime = domainData
        .filter((d) => d.category === "productive")
        .reduce((sum, domain) => sum + domain.time, 0);
    const leisureTime = domainData
        .filter((d) => d.category === "leisure")
        .reduce((sum, domain) => sum + domain.time, 0);

    const getGreeting = () => {
        const hour = new Date().getHours();
        const name = "Alex";
        if (hour < 12) return `Good morning, ${name}`;
        if (hour < 17) return `Good afternoon, ${name}`;
        return `Good evening, ${name}`;
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

    const formatTime = (minutes: number): string => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours === 0) return `${mins}m`;
        if (mins === 0) return `${hours}h`;
        return `${hours}h ${mins}m`;
    };

    // Generate 8-hour timeline
    const generateTimeline = () => {
        const timeline = [];
        const startHour = 9; // 9 AM
        for (let i = 0; i <= 8; i++) {
            const hour = (startHour + i) % 24;
            const time12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
            const ampm = hour < 12 ? "AM" : "PM";
            timeline.push({
                hour: hour,
                label: `${time12}:00 ${ampm}`,
                position: (i / 8) * 100,
            });
        }
        return timeline;
    };

    const timeline = generateTimeline();

    const iconMap: { [key: string]: React.ComponentType<{ size?: number }> } = {
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
        <div className="min-h-screen relative overflow-hidden">
            {/* Main Background */}
            <div
                className={`absolute inset-0 transition-all duration-500 ${
                    isDarkMode
                        ? "bg-slate-950"
                        : "bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100"
                }`}
            />

            {/* Header */}
            <div className="relative z-20 flex justify-between items-center p-6">
                <button
                    onClick={onBack}
                    className={`p-2.5 rounded-xl transition-all duration-200 hover:scale-105 backdrop-blur-sm border ${
                        isDarkMode
                            ? "bg-slate-800/50 text-slate-400 hover:bg-slate-800/70 border-slate-700/30"
                            : "bg-white/50 text-amber-600 hover:bg-white/70 border-amber-200/30"
                    }`}
                >
                    <ArrowLeft size={16} />
                </button>
                <button
                    className={`p-2.5 rounded-xl transition-all duration-200 hover:scale-105 backdrop-blur-sm border ${
                        isDarkMode
                            ? "bg-slate-800/50 text-slate-400 hover:bg-slate-800/70 border-slate-700/30"
                            : "bg-white/50 text-amber-600 hover:bg-white/70 border-amber-200/30"
                    }`}
                >
                    {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
                </button>
            </div>

            {/* Main Content - Top 75% */}
            <div className="relative z-10 h-[75vh] flex flex-col">
                <div className="flex-1 flex flex-col items-center justify-center px-6 max-w-6xl mx-auto w-full">
                    {/* Hero Section */}
                    <div className="text-center mb-16">
                        <h1
                            className={`text-4xl md:text-5xl font-extralight mb-4 tracking-tight ${
                                isDarkMode ? "text-slate-200" : "text-amber-900"
                            }`}
                        >
                            {getGreeting()}
                        </h1>
                        <p
                            className={`text-lg font-light mb-8 ${
                                isDarkMode ? "text-slate-400" : "text-amber-600"
                            }`}
                        >
                            Here's how you spent your digital time today
                        </p>

                        {/* Large Time Display */}
                        <div
                            className={`text-7xl md:text-8xl font-extralight mb-6 tracking-tight ${
                                isDarkMode ? "text-slate-300" : "text-amber-800"
                            }`}
                            style={{ fontVariantNumeric: "tabular-nums" }}
                        >
                            {formatTime(totalTime)}
                        </div>

                        {/* Subtitle Stats */}
                        <div className="flex items-center justify-center gap-8 mb-12">
                            <div className="text-center">
                                <div
                                    className={`text-xl font-light ${
                                        isDarkMode
                                            ? "text-emerald-400"
                                            : "text-emerald-600"
                                    }`}
                                >
                                    {Math.round(
                                        (productiveTime / totalTime) * 100,
                                    )}
                                    %
                                </div>
                                <div
                                    className={`text-xs font-medium uppercase tracking-wide ${
                                        isDarkMode
                                            ? "text-emerald-400/70"
                                            : "text-emerald-600/70"
                                    }`}
                                >
                                    Productive
                                </div>
                            </div>

                            <div
                                className={`w-px h-8 ${
                                    isDarkMode ? "bg-slate-600" : "bg-amber-300"
                                }`}
                            ></div>

                            <div className="text-center">
                                <div
                                    className={`text-xl font-light ${
                                        isDarkMode
                                            ? "text-slate-300"
                                            : "text-amber-800"
                                    }`}
                                >
                                    {domainData.length}
                                </div>
                                <div
                                    className={`text-xs font-medium uppercase tracking-wide ${
                                        isDarkMode
                                            ? "text-slate-400"
                                            : "text-amber-600"
                                    }`}
                                >
                                    Websites
                                </div>
                            </div>

                            <div
                                className={`w-px h-8 ${
                                    isDarkMode ? "bg-slate-600" : "bg-amber-300"
                                }`}
                            ></div>

                            <div className="text-center">
                                <div
                                    className={`text-xl font-light ${
                                        isDarkMode
                                            ? "text-purple-400"
                                            : "text-purple-600"
                                    }`}
                                >
                                    {Math.round(
                                        (leisureTime / totalTime) * 100,
                                    )}
                                    %
                                </div>
                                <div
                                    className={`text-xs font-medium uppercase tracking-wide ${
                                        isDarkMode
                                            ? "text-purple-400/70"
                                            : "text-purple-600/70"
                                    }`}
                                >
                                    Leisure
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="w-full max-w-2xl mb-16">
                        <div
                            className={`flex items-center gap-4 px-6 py-4 rounded-2xl backdrop-blur-xl shadow-lg transition-all duration-300 border ${
                                isDarkMode
                                    ? "bg-slate-800/50 border-slate-700/30"
                                    : "bg-white/70 border-amber-200/40"
                            } ${
                                isSearchFocused ? "scale-[1.02] shadow-2xl" : ""
                            }`}
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
                                    isDarkMode
                                        ? "text-slate-200"
                                        : "text-amber-900"
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

                    {/* Top Sites Grid - Redesigned */}
                    <div className="w-full max-w-4xl">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            {domainData.slice(0, 8).map((domain, index) => {
                                const IconComponent = iconMap[domain.icon];
                                return (
                                    <div
                                        key={domain.domain}
                                        className={`group p-4 rounded-xl backdrop-blur-xl border transition-all duration-200 hover:scale-105 cursor-pointer ${
                                            isDarkMode
                                                ? "bg-slate-800/40 border-slate-700/30 hover:bg-slate-800/60"
                                                : "bg-white/50 border-amber-200/30 hover:bg-white/70"
                                        }`}
                                    >
                                        <div className="flex items-center gap-3 mb-2">
                                            <div
                                                className={`w-8 h-8 flex items-center justify-center rounded-lg ${
                                                    domain.category ===
                                                    "productive"
                                                        ? isDarkMode
                                                            ? "bg-emerald-500/20 text-emerald-400"
                                                            : "bg-emerald-100 text-emerald-700"
                                                        : isDarkMode
                                                        ? "bg-purple-500/20 text-purple-400"
                                                        : "bg-purple-100 text-purple-700"
                                                }`}
                                            >
                                                {IconComponent && (
                                                    <IconComponent size={14} />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div
                                                    className={`text-sm font-medium truncate ${
                                                        isDarkMode
                                                            ? "text-slate-200"
                                                            : "text-amber-900"
                                                    }`}
                                                >
                                                    {domain.domain}
                                                </div>
                                            </div>
                                        </div>
                                        <div
                                            className={`text-lg font-light ${
                                                isDarkMode
                                                    ? "text-slate-300"
                                                    : "text-amber-800"
                                            }`}
                                            style={{
                                                fontVariantNumeric:
                                                    "tabular-nums",
                                            }}
                                        >
                                            {formatTime(domain.time)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom 25% - Timeline Teaser */}
            <div className="relative h-[25vh] overflow-hidden">
                {/* Fade Overlay */}
                <div
                    className={`absolute inset-0 pointer-events-none z-10 ${
                        isDarkMode
                            ? "bg-gradient-to-t from-slate-950/0 via-slate-950/60 to-slate-950"
                            : "bg-gradient-to-t from-amber-50/0 via-amber-50/60 to-amber-50"
                    }`}
                />

                {/* Timeline Content */}
                <div className="relative h-full">
                    {/* Timeline Title */}
                    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20">
                        <div
                            className={`flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-full backdrop-blur-sm ${
                                isDarkMode
                                    ? "text-slate-300 bg-slate-800/30"
                                    : "text-amber-700 bg-white/30"
                            }`}
                        >
                            <Eye size={14} />
                            Browsing Timeline
                        </div>
                    </div>

                    {/* Timeline Axis */}
                    <div className="absolute bottom-16 left-0 right-0 px-8">
                        {/* Main Timeline Line */}
                        <div
                            className={`relative h-0.5 w-full ${
                                isDarkMode ? "bg-slate-600" : "bg-amber-300"
                            }`}
                        >
                            {/* Time Markers */}
                            {timeline.map((point, index) => (
                                <div
                                    key={index}
                                    className="absolute top-0 transform -translate-x-1/2"
                                    style={{ left: `${point.position}%` }}
                                >
                                    {/* Tick Mark */}
                                    <div
                                        className={`w-0.5 h-4 -mt-2 ${
                                            isDarkMode
                                                ? "bg-slate-500"
                                                : "bg-amber-400"
                                        }`}
                                    />
                                    {/* Time Label */}
                                    <div
                                        className={`absolute top-6 left-1/2 transform -translate-x-1/2 text-xs font-medium ${
                                            isDarkMode
                                                ? "text-slate-400"
                                                : "text-amber-600"
                                        }`}
                                    >
                                        {point.label}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Click to Explore */}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                        <button
                            className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl backdrop-blur-sm border transition-all duration-200 hover:scale-105 ${
                                isDarkMode
                                    ? "text-slate-300 bg-slate-800/50 border-slate-700/30 hover:bg-slate-800/70"
                                    : "text-amber-700 bg-white/50 border-amber-200/30 hover:bg-white/70"
                            }`}
                        >
                            <TrendingUp size={14} />
                            Explore Full Timeline
                        </button>
                    </div>
                </div>
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
