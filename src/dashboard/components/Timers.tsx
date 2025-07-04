import React, { useState, useEffect } from "react";
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
        <div
            style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "rgba(0, 0, 0, 0.9)",
                backdropFilter: "blur(4px)",
                display: "flex",
                flexDirection: "column",
                borderRadius: "16px",
                padding: "16px",
            }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "12px",
                }}
            >
                <input
                    type="text"
                    placeholder="Website (e.g. youtube.com)"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    style={{
                        flex: 1,
                        padding: "8px 12px",
                        borderRadius: "8px",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        background: "rgba(255, 255, 255, 0.1)",
                        color: "#ffffff",
                        fontSize: "14px",
                        outline: "none",
                    }}
                />
                <input
                    type="number"
                    placeholder="Minutes"
                    value={minutes}
                    onChange={(e) => setMinutes(e.target.value)}
                    style={{
                        width: "100px",
                        padding: "8px 12px",
                        borderRadius: "8px",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        background: "rgba(255, 255, 255, 0.1)",
                        color: "#ffffff",
                        fontSize: "14px",
                        outline: "none",
                    }}
                />
                <button
                    onClick={handleSave}
                    disabled={!domain.trim() || !minutes.trim()}
                    style={{
                        background: "none",
                        border: "none",
                        color: "#ffffff",
                        cursor: "pointer",
                        display: "flex",
                        opacity: !domain.trim() || !minutes.trim() ? 0.5 : 1,
                        padding: "6px",
                    }}
                >
                    <ArrowRight size={16} />
                </button>
                <button
                    onClick={onClose}
                    style={{
                        background: "none",
                        border: "none",
                        color: "#ffffff",
                        cursor: "pointer",
                        padding: "6px",
                        display: "flex",
                        alignItems: "center",
                        height: "32px",
                        width: "32px",
                    }}
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
};

const Timers: React.FC = () => {
    const [timers, setTimers] = useState<TimerItem[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [isDeleteMode, setIsDeleteMode] = useState(false);

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

    return (
        <div
            style={{
                background: "rgba(255, 255, 255, 0.05)",
                borderRadius: "16px",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                backdropFilter: "blur(10px)",
                padding: "12px",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                position: "relative",
            }}
        >
            {/* Header */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "-4px",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                    }}
                >
                    <Timer size={16} color="#ffffff" />
                    <div
                        style={{
                            color: "#ffffff",
                            fontSize: "14px",
                            fontWeight: 600,
                            fontFamily: "system-ui, -apple-system, sans-serif",
                        }}
                    >
                        Timers
                    </div>
                </div>

                {/* Delete mode toggle */}
                <button
                    onClick={() => setIsDeleteMode(!isDeleteMode)}
                    style={{
                        background: "none",
                        border: "none",
                        padding: "4px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.2s ease",
                    }}
                >
                    <Trash2
                        size={14}
                        color={isDeleteMode ? "#e74c3c" : "#ffffff"}
                    />
                </button>
            </div>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: "8px",
                }}
            >
                {/* Add New Timer Button */}
                <div
                    onClick={() => setShowModal(true)}
                    style={{
                        height: "50px",
                        background: "rgba(255, 255, 255, 0.1)",
                        borderRadius: "8px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "2px",
                        cursor: "pointer",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        transition: "all 0.2s ease",
                        padding: "4px",
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background =
                            "rgba(255, 255, 255, 0.15)";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background =
                            "rgba(255, 255, 255, 0.1)";
                    }}
                >
                    <Plus size={16} color="#ffffff" />
                    <div
                        style={{
                            color: "#ffffff",
                            fontSize: "11px",
                            fontFamily: "system-ui, -apple-system, sans-serif",
                        }}
                    >
                        Add Timer
                    </div>
                </div>

                {/* Timer Items */}
                {timers.slice(0, 3).map((timer) => (
                    <div
                        key={timer.id}
                        style={{
                            position: "relative",
                        }}
                    >
                        {isDeleteMode && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteTimer(timer.id);
                                }}
                                style={{
                                    position: "absolute",
                                    top: "5%",
                                    right: "5%",
                                    zIndex: 2,
                                    cursor: "pointer",
                                    padding: 0,
                                    transition: "all 0.2s ease",
                                }}
                            >
                                <X size={12} color="#ffffff" />
                            </button>
                        )}
                        <div
                            style={{
                                height: "50px",
                                background: "rgba(255, 255, 255, 0.1)",
                                borderRadius: "8px",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "2px",
                                cursor: isDeleteMode ? "default" : "pointer",
                                border: "1px solid rgba(255, 255, 255, 0.2)",
                                transition: "all 0.2s ease",
                                padding: "4px",
                            }}
                        >
                            <div
                                style={{
                                    color: "#ffffff",
                                    fontSize: "11px",
                                    fontFamily:
                                        "system-ui, -apple-system, sans-serif",
                                    textAlign: "center",
                                }}
                            >
                                {timer.name}
                            </div>
                            <div
                                style={{
                                    color: "rgba(255, 255, 255, 0.5)",
                                    fontSize: "10px",
                                    fontFamily:
                                        "system-ui, -apple-system, sans-serif",
                                }}
                            >
                                {formatTimeRemaining(timer.endTime)}
                            </div>
                        </div>
                    </div>
                ))}

                {/* Placeholder Timers */}
                {[...Array(Math.max(0, 3 - timers.length))].map((_, index) => (
                    <div
                        key={index}
                        style={{
                            height: "50px",
                            background: "rgba(255, 255, 255, 0.05)",
                            borderRadius: "8px",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "2px",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                            padding: "4px",
                        }}
                    >
                        <Circle size={16} color="rgba(255, 255, 255, 0.3)" />
                        <div
                            style={{
                                color: "rgba(255, 255, 255, 0.3)",
                                fontSize: "11px",
                                fontFamily:
                                    "system-ui, -apple-system, sans-serif",
                            }}
                        >
                            Add Timer
                        </div>
                    </div>
                ))}
            </div>

            {/* Timer Modal */}
            {showModal && (
                <TimerModal
                    onClose={() => setShowModal(false)}
                    onSave={handleSaveTimer}
                />
            )}
        </div>
    );
};

export default Timers;
