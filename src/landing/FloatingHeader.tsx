import React, { useRef, useEffect, useState } from "react";
import { Moon, Sun, Settings } from "lucide-react";

interface FloatingHeaderProps {
    isDarkMode: boolean;
    onToggleDarkMode: () => void;
    currentPage: "main" | "data" | "network" | "maintab" | "insights";
    onNavigate: (page: "main" | "data" | "network" | "maintab" | "insights", query?: string) => void;
    isInitialLoad?: boolean;
    className?: string;
}

const FloatingHeader: React.FC<FloatingHeaderProps> = ({
    isDarkMode,
    onToggleDarkMode,
    currentPage,
    onNavigate,
    isInitialLoad = false,
    className = "",
}) => {
    const navContainerRef = useRef<HTMLDivElement>(null);
    const [indicatorStyle, setIndicatorStyle] = useState({
        width: 0,
        left: 0,
        opacity: 0,
    });

    // Update indicator position based on active button
    useEffect(() => {
        const updateIndicator = () => {
            if (!navContainerRef.current) return;

            const activeButton = navContainerRef.current.querySelector(
                `[data-page="${currentPage}"]`,
            ) as HTMLButtonElement;
            if (activeButton) {
                const containerRect =
                    navContainerRef.current.getBoundingClientRect();
                const buttonRect = activeButton.getBoundingClientRect();

                const left = buttonRect.left - containerRect.left - 4;
                const width = buttonRect.width;

                setTimeout(() => {
                    setIndicatorStyle({
                        left,
                        width,
                        opacity: 1,
                    });
                }, 10);
            }
        };

        updateIndicator();
        const handleResize = () => updateIndicator();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [currentPage]);

    return (
        <div
            className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-500 ease-out ${
                isInitialLoad
                    ? "opacity-0 translate-y-[-10px]"
                    : "opacity-100 translate-y-0"
            } ${className}`}
            style={{ animationDelay: "200ms" }}
        >
            <div
                className={`flex items-center gap-2 px-3 py-2 rounded-xl backdrop-blur-md border transition-all duration-500 hover:shadow-lg ${
                    isDarkMode
                        ? "bg-slate-900/80 border-slate-700/50 hover:bg-slate-900/90"
                        : "bg-white/80 border-gray-200/50 hover:bg-white/90"
                }`}
            >
                {/* Navigation with dynamic indicator */}
                <div
                    ref={navContainerRef}
                    className={`relative flex p-1 rounded-lg ${
                        isDarkMode ? "bg-slate-800/50" : "bg-gray-100/50"
                    }`}
                >
                    <div
                        className={`absolute top-1 bottom-1 rounded transition-all duration-300 ease-out pointer-events-none ${
                            isDarkMode ? "bg-slate-700" : "bg-white shadow-sm"
                        }`}
                        style={{
                            width: `${indicatorStyle.width}px`,
                            transform: `translateX(${indicatorStyle.left}px)`,
                            opacity: indicatorStyle.opacity,
                            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        }}
                    />

                    {[
                        { key: "main", label: "Home" },
                        { key: "data", label: "Data" },
                        { key: "network", label: "Network" },
                    ].map(({ key, label }) => (
                        <button
                            key={key}
                            data-page={key}
                            onClick={() => onNavigate(key as any)}
                            className={`relative z-10 px-3 py-1.5 rounded text-xs font-medium transition-all duration-300 whitespace-nowrap ${
                                currentPage === key
                                    ? isDarkMode
                                        ? "text-slate-200"
                                        : "text-gray-800"
                                    : isDarkMode
                                    ? "text-slate-400 hover:text-slate-300"
                                    : "text-gray-600 hover:text-gray-800"
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {/* Subtle divider */}
                <div className={`w-px h-4 ${isDarkMode ? "bg-slate-700" : "bg-gray-300"}`} />

                {/* Dark mode toggle */}
                <button
                    onClick={onToggleDarkMode}
                    className={`p-2 rounded-lg transition-all duration-300 hover:scale-105 active:scale-95 ${
                        isDarkMode
                            ? "text-slate-400 hover:bg-slate-800/50 hover:text-slate-300"
                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                    }`}
                >
                    <div className="relative">
                        <Sun
                            size={16}
                            className={`absolute transition-all duration-300 ${
                                isDarkMode
                                    ? "opacity-0 rotate-90 scale-0"
                                    : "opacity-100 rotate-0 scale-100"
                            }`}
                        />
                        <Moon
                            size={16}
                            className={`transition-all duration-300 ${
                                isDarkMode
                                    ? "opacity-100 rotate-0 scale-100"
                                    : "opacity-0 rotate-90 scale-0"
                            }`}
                        />
                    </div>
                </button>

                {/* Settings button */}
                <button
                    onClick={() => window.location.href = '/src/settings/settings.html'}
                    className={`p-2 rounded-lg transition-all duration-300 hover:scale-105 active:scale-95 ${
                        isDarkMode
                            ? "text-slate-400 hover:bg-slate-800/50 hover:text-slate-300"
                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                    }`}
                >
                    <Settings size={16} />
                </button>
            </div>
        </div>
    );
};

export default FloatingHeader;
