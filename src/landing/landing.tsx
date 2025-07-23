import React, { useState, useEffect } from "react";
import {
    Search,
    Calendar,
    Moon,
    Sun,
    ArrowRight,
    CheckCircle,
    Settings,
    Target,
    ChevronDown,
    Check,
    MoreHorizontal,
    Github,
    Figma,
    Zap,
    Bot,
    FileText,
    Youtube,
    Dribbble,
    Film,
    Music,
    Smartphone,
    BookOpen,
    Twitter,
} from "lucide-react";
import DataLandingPage from "./dataLanding";
import NetworkLandingPage from "./networkLanding";
import "./landing.css";

interface QuickAction {
    id: string;
    title: string;
    url: string;
    icon: string;
    category: "work" | "creative" | "learn" | "social";
}

interface TaskItem {
    id: string;
    title: string;
    completed: boolean;
}

const LandingPage: React.FC = () => {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [focusMode, setFocusMode] = useState(false);
    const [currentPage, setCurrentPage] = useState<"main" | "data" | "network">(
        "main",
    );
    const [expandedSection, setExpandedSection] = useState<string | null>(null);
    const [tasks, setTasks] = useState<TaskItem[]>([
        { id: "1", title: "Review morning priorities", completed: false },
        { id: "2", title: "Design system updates", completed: true },
        { id: "3", title: "Team sync at 2pm", completed: false },
    ]);

    const quickActions: QuickAction[] = [
        {
            id: "1",
            title: "GitHub",
            url: "https://github.com",
            icon: "Github",
            category: "work",
        },
        {
            id: "2",
            title: "Linear",
            url: "https://linear.app",
            icon: "Target",
            category: "work",
        },
        {
            id: "3",
            title: "Figma",
            url: "https://figma.com",
            icon: "Figma",
            category: "creative",
        },
        {
            id: "4",
            title: "Claude",
            url: "https://claude.ai",
            icon: "Bot",
            category: "work",
        },
        {
            id: "5",
            title: "Vercel",
            url: "https://vercel.com",
            icon: "Zap",
            category: "work",
        },
        {
            id: "6",
            title: "Notion",
            url: "https://notion.so",
            icon: "FileText",
            category: "work",
        },
    ];

    const getGreeting = () => {
        const hour = currentTime.getHours();
        const name = "Alex"; // This would come from user settings

        if (hour < 12) return `Good morning, ${name}`;
        if (hour < 17) return `Good afternoon, ${name}`;
        return `Good evening, ${name}`;
    };

    const getMotivation = () => {
        const motivations = [
            "Ready to create something amazing?",
            "What will you build today?",
            "Time to make things happen.",
            "Focus on what matters most.",
            "Every great day starts with intention.",
        ];
        return motivations[Math.floor(Math.random() * motivations.length)];
    };

    // Update time every minute
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
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

    const toggleTask = (id: string) => {
        setTasks(
            tasks.map((task) =>
                task.id === id ? { ...task, completed: !task.completed } : task,
            ),
        );
    };

    const toggleSection = (section: string) => {
        setExpandedSection(expandedSection === section ? null : section);
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // If we're on the data page, render the DataLandingPage component
    if (currentPage === "data") {
        return (
            <DataLandingPage
                isDarkMode={isDarkMode}
                currentPage={currentPage}
                onNavigate={setCurrentPage}
            />
        );
    }

    if (currentPage === "network") {
        return (
            <NetworkLandingPage
                isDarkMode={isDarkMode}
                onBack={(page) => setCurrentPage(page)} // NEW
            />
        );
    }

    return (
        <div
            className={`min-h-screen transition-all duration-500 ${
                focusMode
                    ? isDarkMode
                        ? "bg-slate-950"
                        : "bg-stone-50"
                    : isDarkMode
                    ? "bg-slate-950"
                    : "bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100"
            }`}
        >
            {/* Header */}
            <div className="flex justify-between items-center p-6">
                {/* Page Selector */}
                <div
                    className={`flex items-center gap-1 p-1 rounded-xl backdrop-blur-sm border ${
                        isDarkMode
                            ? "bg-slate-800/40 border-slate-700/30"
                            : "bg-white/50 border-amber-200/30"
                    }`}
                >
                    <button
                        onClick={() => setCurrentPage("main")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                            isDarkMode
                                ? "bg-slate-700/60 text-slate-200"
                                : "bg-amber-100/60 text-amber-800"
                        }`}
                    >
                        Home
                    </button>
                    <button
                        onClick={() => setCurrentPage("data")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                            isDarkMode
                                ? "text-slate-400 hover:text-slate-300"
                                : "text-amber-600 hover:text-amber-700"
                        }`}
                    >
                        Data
                    </button>
                    <button
                        onClick={() => setCurrentPage("network")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                            isDarkMode
                                ? "text-slate-400 hover:text-slate-300"
                                : "text-amber-600 hover:text-amber-700"
                        }`}
                    >
                        Network
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setFocusMode(!focusMode)}
                        className={`p-2.5 rounded-xl transition-all duration-200 hover:scale-105 ${
                            focusMode
                                ? isDarkMode
                                    ? "bg-blue-500/20 text-blue-400"
                                    : "bg-blue-500/20 text-blue-600"
                                : isDarkMode
                                ? "bg-slate-800/50 text-slate-400 hover:bg-slate-800/70"
                                : "bg-white/50 text-amber-600 hover:bg-white/70"
                        } backdrop-blur-sm border ${
                            isDarkMode
                                ? "border-slate-700/30"
                                : "border-amber-200/30"
                        }`}
                    >
                        <Target size={16} />
                    </button>
                    <button
                        className={`p-2.5 rounded-xl transition-all duration-200 hover:scale-105 backdrop-blur-sm border ${
                            isDarkMode
                                ? "bg-slate-800/50 text-slate-400 hover:bg-slate-800/70 border-slate-700/30"
                                : "bg-white/50 text-amber-600 hover:bg-white/70 border-amber-200/30"
                        }`}
                    >
                        <Settings size={16} />
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
            </div>

            {/* Main Content */}
            <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
                {!focusMode ? (
                    <>
                        {/* Personal Greeting & Time */}
                        <div className="text-center mb-12 animate-in fade-in duration-800">
                            <h1
                                className={`text-3xl font-light mb-3 animate-in slide-in-from-top-4 duration-600 delay-200 ${
                                    isDarkMode
                                        ? "text-slate-200"
                                        : "text-amber-900"
                                }`}
                            >
                                {getGreeting()}
                            </h1>
                            <p
                                className={`text-base mb-8 animate-in fade-in duration-500 delay-400 ${
                                    isDarkMode
                                        ? "text-slate-400"
                                        : "text-amber-600"
                                }`}
                            >
                                {getMotivation()}
                            </p>
                            <div
                                className={`text-6xl font-extralight mb-2 tracking-tight animate-in zoom-in duration-700 delay-500 ${
                                    isDarkMode
                                        ? "text-slate-300"
                                        : "text-amber-800"
                                }`}
                                style={{ fontVariantNumeric: "tabular-nums" }}
                            >
                                {formatTime(currentTime)}
                            </div>
                        </div>

                        {/* Search */}
                        <div className="w-full max-w-2xl mb-12 animate-in slide-in-from-bottom-4 duration-600 delay-700">
                            <div
                                className={`flex items-center gap-4 px-6 py-4 rounded-2xl backdrop-blur-xl shadow-lg transition-all duration-300 border ${
                                    isDarkMode
                                        ? "bg-slate-800/50 border-slate-700/30"
                                        : "bg-white/70 border-amber-200/40"
                                } ${
                                    isSearchFocused
                                        ? "scale-[1.02] shadow-2xl"
                                        : ""
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
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
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

                        {/* Quick Actions */}
                        <div className="w-full max-w-2xl animate-in fade-in duration-600 delay-900">
                            <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-8">
                                {quickActions.map((action, index) => (
                                    <a
                                        key={action.id}
                                        href={action.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`group flex flex-col items-center gap-2 p-3 rounded-xl backdrop-blur-xl transition-all duration-200 hover:scale-105 border animate-in slide-in-from-bottom-4 ${
                                            isDarkMode
                                                ? "bg-slate-800/40 border-slate-700/30 hover:bg-slate-800/60"
                                                : "bg-white/50 border-amber-200/30 hover:bg-white/70"
                                        }`}
                                        style={{
                                            animationDuration: "400ms",
                                            animationDelay: `${
                                                1000 + index * 100
                                            }ms`,
                                        }}
                                    >
                                        <div className="w-8 h-8 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                                            {(() => {
                                                const iconMap: {
                                                    [
                                                        key: string
                                                    ]: React.ComponentType<{
                                                        size?: number;
                                                    }>;
                                                } = {
                                                    Github,
                                                    Target,
                                                    Figma,
                                                    Bot,
                                                    Zap,
                                                    FileText,
                                                    Youtube,
                                                    Dribbble,
                                                    Film,
                                                    Music,
                                                    Smartphone,
                                                    BookOpen,
                                                    Twitter,
                                                };
                                                const IconComponent =
                                                    iconMap[action.icon];
                                                return IconComponent ? (
                                                    <IconComponent size={20} />
                                                ) : null;
                                            })()}
                                        </div>
                                        <span
                                            className={`text-xs font-medium text-center ${
                                                isDarkMode
                                                    ? "text-slate-300"
                                                    : "text-amber-700"
                                            }`}
                                        >
                                            {action.title}
                                        </span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    </>
                ) : (
                    /* Focus Mode */
                    <div className="text-center max-w-md animate-in fade-in duration-700">
                        <div className="mb-8">
                            <div
                                className={`text-5xl font-light mb-4 animate-in zoom-in duration-600 delay-300 ${
                                    isDarkMode
                                        ? "text-slate-200"
                                        : "text-stone-800"
                                }`}
                                style={{ fontVariantNumeric: "tabular-nums" }}
                            >
                                {formatTime(currentTime)}
                            </div>
                            <p
                                className={`text-lg animate-in fade-in duration-500 delay-500 ${
                                    isDarkMode
                                        ? "text-slate-400"
                                        : "text-stone-500"
                                }`}
                            >
                                Deep work session in progress
                            </p>
                        </div>

                        <div
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl backdrop-blur-xl border transition-all duration-300 hover:scale-[1.02] animate-in slide-in-from-bottom-4 duration-500 delay-400 ${
                                isDarkMode
                                    ? "bg-slate-800/40 border-slate-700/30 hover:bg-slate-800/60"
                                    : "bg-white/60 border-stone-200/40 hover:bg-white/80"
                            }`}
                        >
                            <Search
                                size={16}
                                className={
                                    isDarkMode
                                        ? "text-slate-400"
                                        : "text-stone-500"
                                }
                            />
                            <input
                                type="text"
                                placeholder="Quick search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyPress={(e) =>
                                    e.key === "Enter" && handleSearch()
                                }
                                className={`flex-1 bg-transparent outline-none ${
                                    isDarkMode
                                        ? "text-slate-200"
                                        : "text-stone-800"
                                }`}
                            />
                        </div>

                        <button
                            onClick={() => setFocusMode(false)}
                            className={`mt-6 px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105 animate-in fade-in duration-500 delay-600 ${
                                isDarkMode
                                    ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
                                    : "text-stone-500 hover:text-stone-700 hover:bg-white/30"
                            }`}
                        >
                            Exit Focus Mode
                        </button>
                    </div>
                )}
            </div>

            {/* Expandable Sections - Only show on main page */}
            {!focusMode && (
                <div className="max-w-2xl mx-auto px-6 pb-12 animate-in fade-in duration-500 delay-1200">
                    <div className="flex justify-center gap-3">
                        <button
                            onClick={() => toggleSection("tasks")}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg backdrop-blur-xl transition-all duration-200 hover:scale-105 border animate-in slide-in-from-bottom-4 duration-400 delay-1300 ${
                                isDarkMode
                                    ? "bg-slate-800/40 border-slate-700/30 hover:bg-slate-800/60"
                                    : "bg-white/50 border-amber-200/30 hover:bg-white/70"
                            }`}
                        >
                            <CheckCircle
                                size={14}
                                className={
                                    isDarkMode
                                        ? "text-slate-400"
                                        : "text-amber-500"
                                }
                            />
                            <span
                                className={`text-sm font-medium ${
                                    isDarkMode
                                        ? "text-slate-300"
                                        : "text-amber-700"
                                }`}
                            >
                                {tasks.filter((t) => !t.completed).length} tasks
                            </span>
                            <ChevronDown
                                size={12}
                                className={`transition-transform duration-200 ${
                                    expandedSection === "tasks"
                                        ? "rotate-180"
                                        : ""
                                } ${
                                    isDarkMode
                                        ? "text-slate-400"
                                        : "text-amber-500"
                                }`}
                            />
                        </button>

                        <button
                            onClick={() => toggleSection("calendar")}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg backdrop-blur-xl transition-all duration-200 hover:scale-105 border animate-in slide-in-from-bottom-4 duration-400 delay-1400 ${
                                isDarkMode
                                    ? "bg-slate-800/40 border-slate-700/30 hover:bg-slate-800/60"
                                    : "bg-white/50 border-amber-200/30 hover:bg-white/70"
                            }`}
                        >
                            <Calendar
                                size={14}
                                className={
                                    isDarkMode
                                        ? "text-slate-400"
                                        : "text-amber-500"
                                }
                            />
                            <span
                                className={`text-sm font-medium ${
                                    isDarkMode
                                        ? "text-slate-300"
                                        : "text-amber-700"
                                }`}
                            >
                                Today
                            </span>
                            <ChevronDown
                                size={12}
                                className={`transition-transform duration-200 ${
                                    expandedSection === "calendar"
                                        ? "rotate-180"
                                        : ""
                                } ${
                                    isDarkMode
                                        ? "text-slate-400"
                                        : "text-amber-500"
                                }`}
                            />
                        </button>

                        <button
                            onClick={() => toggleSection("more")}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg backdrop-blur-xl transition-all duration-200 hover:scale-105 border animate-in slide-in-from-bottom-4 duration-400 delay-1500 ${
                                isDarkMode
                                    ? "bg-slate-800/40 border-slate-700/30 hover:bg-slate-800/60"
                                    : "bg-white/50 border-amber-200/30 hover:bg-white/70"
                            }`}
                        >
                            <MoreHorizontal
                                size={14}
                                className={
                                    isDarkMode
                                        ? "text-slate-400"
                                        : "text-amber-500"
                                }
                            />
                            <span
                                className={`text-sm font-medium ${
                                    isDarkMode
                                        ? "text-slate-300"
                                        : "text-amber-700"
                                }`}
                            >
                                More
                            </span>
                            <ChevronDown
                                size={12}
                                className={`transition-transform duration-200 ${
                                    expandedSection === "more"
                                        ? "rotate-180"
                                        : ""
                                } ${
                                    isDarkMode
                                        ? "text-slate-400"
                                        : "text-amber-500"
                                }`}
                            />
                        </button>
                    </div>

                    {/* Expandable Content */}
                    {expandedSection && (
                        <div className="mt-4 animate-in slide-in-from-bottom-4 duration-400">
                            <div
                                className={`backdrop-blur-xl rounded-xl p-4 border transition-all duration-300 ${
                                    isDarkMode
                                        ? "bg-slate-800/50 border-slate-700/30"
                                        : "bg-white/70 border-amber-200/40"
                                }`}
                            >
                                {expandedSection === "tasks" && (
                                    <div>
                                        <h3
                                            className={`text-lg font-semibold mb-4 ${
                                                isDarkMode
                                                    ? "text-slate-200"
                                                    : "text-amber-900"
                                            }`}
                                        >
                                            Today's Tasks
                                        </h3>
                                        <div className="space-y-3">
                                            {tasks.map((task) => (
                                                <div
                                                    key={task.id}
                                                    className={`flex items-center gap-3 p-3 rounded-lg backdrop-blur-sm transition-all duration-200 border ${
                                                        isDarkMode
                                                            ? "bg-slate-700/30 border-slate-600/30 hover:bg-slate-700/50"
                                                            : "bg-white/40 border-amber-200/30 hover:bg-white/60"
                                                    } ${
                                                        task.completed
                                                            ? "opacity-60"
                                                            : ""
                                                    }`}
                                                >
                                                    <button
                                                        onClick={() =>
                                                            toggleTask(task.id)
                                                        }
                                                        className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors duration-200 ${
                                                            task.completed
                                                                ? isDarkMode
                                                                    ? "bg-blue-600 border-blue-600"
                                                                    : "bg-amber-600 border-amber-600"
                                                                : isDarkMode
                                                                ? "border-slate-500 hover:border-slate-400"
                                                                : "border-amber-300 hover:border-amber-400"
                                                        }`}
                                                    >
                                                        {task.completed && (
                                                            <Check
                                                                size={10}
                                                                className="text-white"
                                                            />
                                                        )}
                                                    </button>
                                                    <span
                                                        className={`flex-1 ${
                                                            task.completed
                                                                ? "line-through"
                                                                : ""
                                                        } ${
                                                            isDarkMode
                                                                ? "text-slate-200"
                                                                : "text-amber-900"
                                                        }`}
                                                    >
                                                        {task.title}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {expandedSection === "calendar" && (
                                    <div>
                                        <h3
                                            className={`text-lg font-semibold mb-4 ${
                                                isDarkMode
                                                    ? "text-slate-200"
                                                    : "text-amber-900"
                                            }`}
                                        >
                                            Today's Schedule
                                        </h3>
                                        <div className="space-y-3">
                                            {[
                                                {
                                                    time: "9:00 AM",
                                                    title: "Team Standup",
                                                    color: "bg-blue-500",
                                                },
                                                {
                                                    time: "2:00 PM",
                                                    title: "Design Review",
                                                    color: "bg-green-500",
                                                },
                                                {
                                                    time: "4:30 PM",
                                                    title: "Client Call",
                                                    color: "bg-purple-500",
                                                },
                                            ].map((event, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center gap-3"
                                                >
                                                    <div
                                                        className={`w-3 h-3 rounded-full ${event.color}`}
                                                    ></div>
                                                    <div className="flex-1">
                                                        <div
                                                            className={`font-medium ${
                                                                isDarkMode
                                                                    ? "text-slate-200"
                                                                    : "text-amber-900"
                                                            }`}
                                                        >
                                                            {event.title}
                                                        </div>
                                                        <div
                                                            className={`text-sm ${
                                                                isDarkMode
                                                                    ? "text-slate-400"
                                                                    : "text-amber-600"
                                                            }`}
                                                        >
                                                            {event.time}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {expandedSection === "more" && (
                                    <div>
                                        <h3
                                            className={`text-lg font-semibold mb-4 ${
                                                isDarkMode
                                                    ? "text-slate-200"
                                                    : "text-amber-900"
                                            }`}
                                        >
                                            Quick Stats
                                        </h3>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                            <div className="text-center">
                                                <div
                                                    className={`text-2xl font-bold ${
                                                        isDarkMode
                                                            ? "text-slate-200"
                                                            : "text-amber-900"
                                                    }`}
                                                >
                                                    2h 34m
                                                </div>
                                                <div
                                                    className={`text-sm ${
                                                        isDarkMode
                                                            ? "text-slate-400"
                                                            : "text-amber-600"
                                                    }`}
                                                >
                                                    Focus time
                                                </div>
                                            </div>
                                            <div className="text-center">
                                                <div
                                                    className={`text-2xl font-bold ${
                                                        isDarkMode
                                                            ? "text-slate-200"
                                                            : "text-amber-900"
                                                    }`}
                                                >
                                                    23
                                                </div>
                                                <div
                                                    className={`text-sm ${
                                                        isDarkMode
                                                            ? "text-slate-400"
                                                            : "text-amber-600"
                                                    }`}
                                                >
                                                    Sites visited
                                                </div>
                                            </div>
                                            <div className="text-center">
                                                <div
                                                    className={`text-2xl font-bold ${
                                                        isDarkMode
                                                            ? "text-slate-200"
                                                            : "text-amber-900"
                                                    }`}
                                                >
                                                    8
                                                </div>
                                                <div
                                                    className={`text-sm ${
                                                        isDarkMode
                                                            ? "text-slate-400"
                                                            : "text-amber-600"
                                                    }`}
                                                >
                                                    Tasks done
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={() => setExpandedSection(null)}
                                    className={`mt-4 w-full flex items-center justify-center gap-2 py-2 rounded-lg transition-all duration-200 hover:scale-[1.02] ${
                                        isDarkMode
                                            ? "text-slate-400 hover:text-slate-200 hover:bg-slate-700/30"
                                            : "text-amber-600 hover:text-amber-800 hover:bg-white/30"
                                    }`}
                                >
                                    <ChevronDown
                                        size={14}
                                        className="rotate-180"
                                    />
                                    <span className="text-sm">Collapse</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

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

export default LandingPage;
