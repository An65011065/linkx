import React, { useState, useEffect, useRef } from "react";
import {
    Timer,
    Plus,
    Circle,
    X,
    ArrowRight,
    Trash2,
    AlertTriangle,
} from "lucide-react";
import { freeTrial } from "../../main/MainTab";

interface TimerItem {
    id: string;
    name: string;
    endTime: number;
    minutes: number;
}

interface TimerModalProps {
    onClose: () => void;
    onSave: (domain: string, minutes: number) => void;
    isDarkMode?: boolean;
}

const TimerModal: React.FC<TimerModalProps> = ({
    onClose,
    onSave,
    isDarkMode = false,
}) => {
    const [domain, setDomain] = useState("");
    const [minutes, setMinutes] = useState("");

    const handleSave = () => {
        if (!domain.trim() || !minutes.trim()) return;
        const minutesNum = parseInt(minutes);
        if (isNaN(minutesNum) || minutesNum <= 0) return;

        // Clean domain - remove protocol and www, keep only domain and path
        let cleanDomain = domain.trim();
        cleanDomain = cleanDomain.replace(/^https?:\/\//, "");
        cleanDomain = cleanDomain.replace(/^www\./, "");

        // If domain ends with just .com or .com/, apply to whole domain
        if (cleanDomain.match(/\.(com|org|net|edu|gov)\/?\s*$/)) {
            cleanDomain = cleanDomain.replace(/\/.*$/, "");
        }

        onSave(cleanDomain, minutesNum);
        onClose();
    };

    return (
        <div
            className={`absolute inset-0 flex flex-col p-6 ${
                isDarkMode
                    ? "bg-black/80 border border-white/20 backdrop-blur-sm"
                    : "bg-white border border-gray-200 shadow-2xl"
            } rounded-2xl`}
        >
            {/* Header */}
            <div
                className={`flex items-center gap-3 mb-6 pb-4 border-b ${
                    isDarkMode ? "border-white/10" : "border-gray-100"
                }`}
            >
                {/* Search Bar Container */}
                <div
                    className={`
                        flex-1 p-3 rounded-lg border relative flex items-center gap-2
                        ${
                            isDarkMode
                                ? "bg-white/5 border-white/20 backdrop-blur-sm"
                                : "bg-gray-50 border-gray-200"
                        }
                    `}
                >
                    <input
                        type="text"
                        placeholder="Link"
                        value={domain}
                        onChange={(e) => setDomain(e.target.value)}
                        className={`
                            w-3/5 p-0 border-none text-sm outline-none bg-transparent
                            ${
                                isDarkMode
                                    ? "text-white placeholder-white/50"
                                    : "text-gray-900 placeholder-gray-500"
                            }
                        `}
                    />
                    <div className="absolute right-10 flex gap-1 items-center">
                        <input
                            type="number"
                            placeholder="mins"
                            value={minutes}
                            onChange={(e) => setMinutes(e.target.value)}
                            className={`
                                w-16 p-0 border-none border-l pl-2 text-sm outline-none 
                                bg-transparent appearance-none
                                [&::-webkit-outer-spin-button]:appearance-none
                                [&::-webkit-inner-spin-button]:appearance-none
                                [-moz-appearance:textfield]
                                ${
                                    isDarkMode
                                        ? "border-white/20 text-white placeholder-white/50"
                                        : "border-gray-200 text-gray-900 placeholder-gray-500"
                                }
                            `}
                        />
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={!domain.trim() || !minutes.trim()}
                        className={`
                            absolute right-2 top-1/2 transform -translate-y-1/2
                            w-8 h-8 rounded-lg border-none cursor-pointer
                            transition-all duration-300 flex items-center justify-center
                            disabled:opacity-50 disabled:cursor-not-allowed
                            ${
                                isDarkMode
                                    ? "text-white hover:bg-blue-500"
                                    : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                            }
                        `}
                    >
                        <ArrowRight size={16} />
                    </button>
                </div>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="text-white hover:opacity-70 transition-opacity"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Help Text - only for light mode */}
            {!isDarkMode && (
                <div className="text-sm text-gray-600 leading-relaxed">
                    <p className="mb-2">
                        Set a timer for a specific website or domain.
                    </p>
                </div>
            )}
        </div>
    );
};

interface TimersProps {
    isDarkMode?: boolean;
}

const Timers: React.FC<TimersProps> = ({ isDarkMode = false }) => {
    const [timers, setTimers] = useState<TimerItem[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [isDeleteMode, setIsDeleteMode] = useState(false);
    const [isTrialMode, setIsTrialMode] = useState(freeTrial);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        const checkTrialStatus = () => {
            setIsTrialMode(freeTrial);
        };

        // Check immediately
        checkTrialStatus();

        // Set up an interval to check frequently
        const interval = setInterval(checkTrialStatus, 100);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        // Load all timers from localStorage
        const loadTimers = () => {
            const activeTimers: TimerItem[] = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key?.startsWith("timer_")) {
                    const domain = key.replace("timer_", "");
                    const timerData = JSON.parse(
                        localStorage.getItem(key) || "{}",
                    );
                    if (timerData.endTime > Date.now()) {
                        activeTimers.push({
                            id: domain,
                            name: domain,
                            endTime: timerData.endTime,
                            minutes: timerData.minutes,
                        });
                    } else {
                        // Clean up expired timer
                        localStorage.removeItem(key);
                    }
                }
            }
            setTimers(activeTimers);
        };

        // Load initially
        loadTimers();

        // Set up interval to refresh timers and clean up expired ones
        const interval = setInterval(loadTimers, 1000);

        // Listen for timer updates from popup
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key?.startsWith("timer_")) {
                loadTimers();
            }
        };

        window.addEventListener("storage", handleStorageChange);

        return () => {
            clearInterval(interval);
            window.removeEventListener("storage", handleStorageChange);
        };
    }, []);

    // Handle expansion animation
    useEffect(() => {
        if (containerRef.current) {
            if (isExpanded) {
                const parentHeight =
                    containerRef.current.parentElement?.offsetHeight || 0;
                containerRef.current.style.height = `${parentHeight * 2}px`;
                containerRef.current.style.zIndex = "100";
            } else {
                containerRef.current.style.height = "100%";
                containerRef.current.style.zIndex = "1";
            }
        }
    }, [isExpanded]);

    const handleSaveTimer = (domain: string, minutes: number) => {
        if (isTrialMode && timers.length >= 1) {
            alert(
                "Free trial allows only 1 timer at a time. Please remove the existing timer first.",
            );
            return;
        }

        const endTime = Date.now() + minutes * 60 * 1000;
        const timerData = {
            endTime,
            minutes,
        };

        // Save to localStorage
        localStorage.setItem(`timer_${domain}`, JSON.stringify(timerData));

        // Show notification when timer completes
        setTimeout(() => {
            // Check if timer still exists (wasn't cancelled)
            const currentTimer = localStorage.getItem(`timer_${domain}`);
            if (currentTimer) {
                const data = JSON.parse(currentTimer);
                if (data.endTime <= Date.now()) {
                    // Timer completed naturally
                    if ("chrome" in window && chrome.notifications) {
                        chrome.notifications.create({
                            type: "basic",
                            iconUrl: "/src/assets/icons/icon128.png",
                            title: "Timer Complete",
                            message: `Your ${minutes} minute timer for ${domain} is complete!`,
                            priority: 2,
                        });
                    }
                    localStorage.removeItem(`timer_${domain}`);
                }
            }
        }, minutes * 60 * 1000);

        setShowModal(false);
    };

    const handleDeleteTimer = (domain: string) => {
        localStorage.removeItem(`timer_${domain}`);
        // Trigger a reload by dispatching a storage event
        window.dispatchEvent(
            new StorageEvent("storage", {
                key: `timer_${domain}`,
                newValue: null,
                oldValue: "deleted",
            }),
        );
    };

    const formatTimeRemaining = (endTime: number) => {
        const remaining = endTime - Date.now();
        if (remaining <= 0) return "Finished";

        const minutes = Math.floor(remaining / (1000 * 60));
        const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

        if (minutes > 0) {
            return `${minutes}m ${seconds}s`;
        }
        return `${seconds}s`;
    };

    const handleAddNewClick = () => {
        if (isTrialMode && timers.length >= 1) {
            alert(
                "Free trial allows only 1 timer at a time. Please remove the existing timer first.",
            );
            return;
        }
        setIsExpanded(true);
        setShowModal(true);
    };

    const handleModalClose = () => {
        setShowModal(false);
        setIsExpanded(false);
    };

    const placeholdersNeeded = Math.max(0, 3 - timers.length);
    const hasHiddenTimers = isTrialMode && timers.length > 1;

    return (
        <div
            ref={containerRef}
            className={`
                h-full flex flex-col relative transition-all duration-300 p-3 gap-2
                ${
                    isDarkMode
                        ? "bg-white/5 border border-white/10 backdrop-blur-sm"
                        : "bg-white border border-gray-200 shadow-sm"
                }
                rounded-2xl
            `}
        >
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Timer
                        size={16}
                        className={isDarkMode ? "text-white" : "text-gray-700"}
                    />
                    <div
                        className={`
                            text-sm font-medium
                            ${isDarkMode ? "text-white" : "text-gray-900"}
                        `}
                    >
                        Timers
                    </div>
                </div>

                {/* Delete mode toggle */}
                <button
                    onClick={() => setIsDeleteMode(!isDeleteMode)}
                    className={`
                        p-1 rounded-lg transition-colors
                        ${
                            isDarkMode
                                ? "hover:bg-white/10"
                                : "hover:bg-gray-100"
                        }
                    `}
                >
                    <Trash2
                        size={14}
                        className={
                            isDeleteMode
                                ? "text-red-500"
                                : isDarkMode
                                ? "text-white/50"
                                : "text-gray-400"
                        }
                    />
                </button>
            </div>

            {/* Warning Message for Free Trial */}

            {/* Timers Grid */}
            <div className="overflow-x-auto overflow-y-hidden -mx-3 px-3">
                <div
                    className="grid gap-1"
                    style={{
                        gridTemplateColumns: `repeat(${Math.max(
                            4,
                            timers.length + 1,
                        )}, 1fr)`,
                        width: timers.length > 3 ? "fit-content" : "100%",
                    }}
                >
                    {/* Add New Timer Button */}
                    <div
                        onClick={handleAddNewClick}
                        className={`
                            h-12 min-w-20 p-2 rounded-lg border cursor-pointer
                            flex flex-col items-center justify-center gap-1
                            transition-all
                            ${
                                isDarkMode
                                    ? "bg-white/10 border-white/20 hover:bg-white/20"
                                    : "bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300"
                            }
                            ${
                                isTrialMode && timers.length >= 1
                                    ? "opacity-50 cursor-not-allowed"
                                    : ""
                            }
                        `}
                    >
                        <Plus
                            size={16}
                            className={
                                isDarkMode ? "text-white/70" : "text-gray-600"
                            }
                        />
                        <div
                            className={`
                                text-xs font-medium text-center
                                ${
                                    isDarkMode
                                        ? "text-white/70"
                                        : "text-gray-600"
                                }
                            `}
                        >
                            Add Timer
                        </div>
                    </div>

                    {/* Timer Items - only show first timer in trial mode */}
                    {(isTrialMode ? timers.slice(0, 1) : timers).map(
                        (timer) => {
                            const isExpired = timer.endTime <= Date.now();
                            return (
                                <div key={timer.id} className="relative">
                                    {isDeleteMode && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteTimer(timer.id);
                                            }}
                                            className={`
                                            absolute top-1 right-1 z-10 p-1 rounded-full border
                                            transition-colors
                                            ${
                                                isDarkMode
                                                    ? "bg-black/80 border-white/20 hover:bg-black/90"
                                                    : "bg-white border-gray-200 hover:bg-red-50 hover:border-red-200"
                                            }
                                        `}
                                        >
                                            <X
                                                size={8}
                                                className="text-white"
                                            />
                                        </button>
                                    )}
                                    <div
                                        className={`
                                        h-12 min-w-20 p-2 rounded-lg border
                                        flex flex-col items-center justify-center gap-1
                                        transition-all
                                        ${
                                            !isDeleteMode
                                                ? "cursor-pointer"
                                                : "cursor-default"
                                        }
                                        ${
                                            isDarkMode
                                                ? "border-white/20"
                                                : isExpired
                                                ? "bg-green-50 border-green-200"
                                                : "bg-orange-50 border-orange-200"
                                        }
                                    `}
                                        style={
                                            isDarkMode
                                                ? {
                                                      background: isExpired
                                                          ? "rgba(34, 197, 94, 0.2)"
                                                          : "rgba(249, 115, 22, 0.2)",
                                                  }
                                                : {}
                                        }
                                        onMouseEnter={(e) => {
                                            if (!isDeleteMode) {
                                                if (isDarkMode) {
                                                    e.currentTarget.style.background =
                                                        isExpired
                                                            ? "rgba(34, 197, 94, 0.3)"
                                                            : "rgba(249, 115, 22, 0.3)";
                                                } else if (!isExpired) {
                                                    e.currentTarget.style.backgroundColor =
                                                        "#fed7aa40";
                                                    e.currentTarget.style.boxShadow =
                                                        "0 4px 12px rgba(0, 0, 0, 0.1)";
                                                }
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!isDeleteMode) {
                                                if (isDarkMode) {
                                                    e.currentTarget.style.background =
                                                        isExpired
                                                            ? "rgba(34, 197, 94, 0.2)"
                                                            : "rgba(249, 115, 22, 0.2)";
                                                } else if (!isExpired) {
                                                    e.currentTarget.style.backgroundColor =
                                                        "#fff7ed";
                                                    e.currentTarget.style.boxShadow =
                                                        "none";
                                                }
                                            }
                                        }}
                                    >
                                        <div
                                            className={`
                                            text-xs font-medium text-center break-words leading-tight
                                            ${
                                                isDarkMode
                                                    ? "text-white"
                                                    : isExpired
                                                    ? "text-green-700"
                                                    : "text-orange-700"
                                            }
                                        `}
                                        >
                                            {timer.name}
                                        </div>
                                        <div
                                            className={`
                                            text-xs text-center font-medium
                                            ${
                                                isDarkMode
                                                    ? "text-white/50"
                                                    : isExpired
                                                    ? "text-green-600"
                                                    : "text-orange-600"
                                            }
                                        `}
                                        >
                                            {formatTimeRemaining(timer.endTime)}
                                        </div>
                                    </div>
                                </div>
                            );
                        },
                    )}

                    {/* Placeholder Timers */}
                    {Array.from({ length: placeholdersNeeded }).map(
                        (_, index) => (
                            <div
                                key={`placeholder-${index}`}
                                className={`
                                h-12 min-w-20 p-2 rounded-lg border
                                flex flex-col items-center justify-center gap-1
                                ${
                                    isDarkMode
                                        ? "bg-white/5 border-white/10"
                                        : "bg-gray-25 border-gray-100"
                                }
                            `}
                            >
                                <Circle
                                    size={16}
                                    className={
                                        isDarkMode
                                            ? "text-white/30"
                                            : "text-gray-300"
                                    }
                                />
                                <div
                                    className={`
                                    text-xs text-center
                                    ${
                                        isDarkMode
                                            ? "text-white/30"
                                            : "text-gray-400"
                                    }
                                `}
                                >
                                    Add Timer
                                </div>
                            </div>
                        ),
                    )}
                </div>
            </div>

            {/* Timer Modal */}
            {showModal && (
                <TimerModal
                    onClose={handleModalClose}
                    onSave={handleSaveTimer}
                    isDarkMode={isDarkMode}
                />
            )}
        </div>
    );
};

export default Timers;
