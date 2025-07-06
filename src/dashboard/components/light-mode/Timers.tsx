import React, { useState, useEffect, useRef } from "react";
import { Timer, Plus, Circle, X, ArrowRight, Trash2 } from "lucide-react";

interface TimerItem {
    id: string;
    name: string;
    endTime: number;
    minutes: number;
}

interface TimerModalProps {
    onClose: () => void;
    onSave: (domain: string, minutes: number) => void;
}

const TimerModal: React.FC<TimerModalProps> = ({ onClose, onSave }) => {
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
        <div className="absolute inset-0 bg-white border border-gray-200 rounded-2xl shadow-2xl flex flex-col p-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <input
                    type="text"
                    placeholder="Website (e.g. youtube.com)"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-black placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors"
                />
                <input
                    type="number"
                    placeholder="Minutes"
                    value={minutes}
                    onChange={(e) => setMinutes(e.target.value)}
                    className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-black placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors"
                />

                {/* Action Buttons */}
                <button
                    onClick={handleSave}
                    disabled={!domain.trim() || !minutes.trim()}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <ArrowRight size={16} color="#374151" />
                </button>
                <button
                    onClick={onClose}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                    <X size={16} color="#374151" />
                </button>
            </div>

            {/* Help Text */}
            <div className="text-sm text-gray-600 leading-relaxed">
                <p className="mb-2">
                    Set a timer for a specific website or domain.
                </p>
                <p className="text-xs text-gray-500">
                    Examples: youtube.com, twitter.com, reddit.com/r/programming
                </p>
            </div>
        </div>
    );
};

const Timers: React.FC = () => {
    const [timers, setTimers] = useState<TimerItem[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [isDeleteMode, setIsDeleteMode] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [containerHeight, setContainerHeight] = useState(0);

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

    // Track container height for responsive scaling
    useEffect(() => {
        const updateHeight = () => {
            if (containerRef.current) {
                const height = containerRef.current.offsetHeight;
                setContainerHeight(height);
            }
        };

        updateHeight();
        window.addEventListener("resize", updateHeight);
        return () => window.removeEventListener("resize", updateHeight);
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
        const endTime = Date.now() + minutes * 60 * 1000;
        const timerData = {
            endTime,
            minutes,
        };

        // Save to localStorage (same as Reminders.tsx)
        localStorage.setItem(`timer_${domain}`, JSON.stringify(timerData));

        // Show notification when timer completes (same logic as Reminders.tsx)
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
        setIsExpanded(true);
        setShowModal(true);
    };

    const handleModalClose = () => {
        setShowModal(false);
        setIsExpanded(false);
    };

    // Calculate responsive dimensions based on container height
    const getResponsiveDimensions = () => {
        const baseHeight = 100;
        const baseCardHeight = 50;
        const baseFontSize = 11;
        const baseIconSize = 16;

        const scale = Math.max(0.6, Math.min(1, containerHeight / baseHeight));

        return {
            cardHeight: Math.max(35, baseCardHeight * scale),
            fontSize: Math.max(9, baseFontSize * scale),
            iconSize: Math.max(12, baseIconSize * scale),
            gap: Math.max(4, 8 * scale),
            padding: Math.max(8, 12 * scale),
        };
    };

    const dimensions = getResponsiveDimensions();
    const placeholdersNeeded = Math.max(0, 3 - timers.length);

    return (
        <div
            ref={containerRef}
            className="bg-white rounded-2xl border border-gray-200 h-full flex flex-col relative transition-all duration-300 shadow-sm"
            style={{
                padding: `${dimensions.padding}px`,
                gap: `${dimensions.gap}px`,
            }}
        >
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Timer size={dimensions.iconSize} color="#374151" />
                    <div
                        className="font-medium text-black"
                        style={{
                            fontSize: `${Math.max(
                                12,
                                dimensions.fontSize + 3,
                            )}px`,
                        }}
                    >
                        Timers
                    </div>
                </div>

                {/* Delete mode toggle */}
                <button
                    onClick={() => setIsDeleteMode(!isDeleteMode)}
                    className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                >
                    <Trash2
                        size={Math.max(12, dimensions.iconSize - 2)}
                        color={isDeleteMode ? "#ef4444" : "#9ca3af"}
                    />
                </button>
            </div>

            {/* Timers Grid */}
            <div
                className="overflow-x-auto overflow-y-hidden"
                style={{
                    margin: `0 -${dimensions.padding}px`,
                    padding: `0 ${dimensions.padding}px`,
                }}
            >
                <div
                    className="grid gap-2"
                    style={{
                        gridTemplateColumns: `repeat(${Math.max(
                            4,
                            timers.length + 1,
                        )}, 1fr)`,
                        gap: `${dimensions.gap}px`,
                        width: timers.length > 3 ? "fit-content" : "100%",
                    }}
                >
                    {/* Add New Timer Button */}
                    <div
                        onClick={handleAddNewClick}
                        className="bg-gray-50 rounded-lg border border-gray-200 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-gray-100 hover:border-gray-300 transition-all hover:-translate-y-0.5 p-2"
                        style={{
                            height: `${dimensions.cardHeight}px`,
                            minWidth: "80px",
                        }}
                    >
                        <Plus size={dimensions.iconSize} color="#6b7280" />
                        <div
                            className="text-gray-600 font-medium text-center"
                            style={{ fontSize: `${dimensions.fontSize}px` }}
                        >
                            Add Timer
                        </div>
                    </div>

                    {/* Timer Items */}
                    {timers.map((timer) => {
                        const isExpired = timer.endTime <= Date.now();

                        return (
                            <div key={timer.id} className="relative">
                                {isDeleteMode && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteTimer(timer.id);
                                        }}
                                        className="absolute top-1 right-1 z-10 p-1 rounded-full bg-white border border-gray-200 hover:bg-red-50 hover:border-red-200 transition-colors"
                                    >
                                        <X
                                            size={Math.max(
                                                8,
                                                dimensions.iconSize - 6,
                                            )}
                                            color="#ef4444"
                                        />
                                    </button>
                                )}
                                <div
                                    className={`rounded-lg border flex flex-col items-center justify-center gap-1 p-2 transition-all ${
                                        isExpired
                                            ? "bg-green-50 border-green-200"
                                            : "bg-orange-50 border-orange-200 hover:-translate-y-0.5"
                                    }`}
                                    style={{
                                        height: `${dimensions.cardHeight}px`,
                                        minWidth: "80px",
                                        cursor: isDeleteMode
                                            ? "default"
                                            : "pointer",
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isDeleteMode && !isExpired) {
                                            e.currentTarget.style.backgroundColor =
                                                "#fed7aa40";
                                            e.currentTarget.style.boxShadow =
                                                "0 4px 12px rgba(0, 0, 0, 0.1)";
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!isDeleteMode && !isExpired) {
                                            e.currentTarget.style.backgroundColor =
                                                "#fff7ed";
                                            e.currentTarget.style.boxShadow =
                                                "none";
                                        }
                                    }}
                                >
                                    <div
                                        className={`font-medium text-center break-words leading-tight ${
                                            isExpired
                                                ? "text-green-700"
                                                : "text-orange-700"
                                        }`}
                                        style={{
                                            fontSize: `${dimensions.fontSize}px`,
                                        }}
                                    >
                                        {timer.name}
                                    </div>
                                    <div
                                        className={`text-center font-medium ${
                                            isExpired
                                                ? "text-green-600"
                                                : "text-orange-600"
                                        }`}
                                        style={{
                                            fontSize: `${Math.max(
                                                8,
                                                dimensions.fontSize - 1,
                                            )}px`,
                                        }}
                                    >
                                        {formatTimeRemaining(timer.endTime)}
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* Placeholder Timers */}
                    {Array.from({ length: placeholdersNeeded }).map(
                        (_, index) => (
                            <div
                                key={`placeholder-${index}`}
                                className="bg-gray-25 rounded-lg border border-gray-100 flex flex-col items-center justify-center gap-1 p-2"
                                style={{
                                    height: `${dimensions.cardHeight}px`,
                                    minWidth: "80px",
                                }}
                            >
                                <Circle
                                    size={dimensions.iconSize}
                                    color="#d1d5db"
                                />
                                <div
                                    className="text-gray-400 text-center"
                                    style={{
                                        fontSize: `${dimensions.fontSize}px`,
                                    }}
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
                />
            )}
        </div>
    );
};

export default Timers;
