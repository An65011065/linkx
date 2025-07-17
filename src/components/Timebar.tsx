import React, { useState, useEffect } from "react";
import { Clock, X, Plus } from "lucide-react";

interface TimerBarProps {
    isVisible: boolean;
    domain: string;
    onClose: () => void;
}

const TimerBar: React.FC<TimerBarProps> = ({ isVisible, domain, onClose }) => {
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [endTime, setEndTime] = useState<number | null>(null);
    const [showCreateTimer, setShowCreateTimer] = useState(false);
    const [newTimerMinutes, setNewTimerMinutes] = useState("");

    // Load active timer for this domain
    useEffect(() => {
        if (!isVisible) return;

        const loadActiveTimer = async () => {
            try {
                console.log("🔍 Checking for active timer for domain:", domain);
                const response = await chrome.runtime.sendMessage({
                    action: "getActiveTimers",
                });

                if (response.timers) {
                    const timerKey = `timer_${domain}`;
                    const timerData = response.timers[timerKey];

                    console.log("📊 Timer data for", domain, ":", timerData);

                    if (timerData && timerData.endTime > Date.now()) {
                        console.log("✅ Found active timer, setting end time");
                        setEndTime(timerData.endTime);
                        setShowCreateTimer(false);
                    } else {
                        console.log(
                            "❌ No active timer found, showing create timer UI",
                        );
                        setEndTime(null);
                        setShowCreateTimer(true);
                    }
                }
            } catch (error) {
                console.error("Error loading timer:", error);
                setShowCreateTimer(true);
            }
        };

        loadActiveTimer();
    }, [isVisible, domain]);

    // Update timer every second
    useEffect(() => {
        if (!endTime) return;

        const updateTimer = () => {
            const now = Date.now();
            const remaining = Math.max(0, endTime - now);

            if (remaining === 0) {
                console.log("⏰ Timer completed!");
                onClose();
                return;
            }

            setTimeRemaining(remaining);
        };

        // Update immediately
        updateTimer();

        // Update every second
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [endTime, onClose]);

    const formatTime = (ms: number): string => {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;

        if (minutes > 0) {
            return `${minutes}m ${seconds}s`;
        }
        return `${seconds}s`;
    };

    const handleCancel = async () => {
        try {
            await chrome.runtime.sendMessage({
                action: "cancelTimer",
                domain: domain,
            });
            onClose();
        } catch (error) {
            console.error("Error cancelling timer:", error);
        }
    };

    const handleCreateTimer = async () => {
        const minutes = parseInt(newTimerMinutes);
        if (!minutes || minutes <= 0) return;

        try {
            console.log("🚀 Creating timer for", minutes, "minutes on", domain);
            const response = await chrome.runtime.sendMessage({
                action: "createTimer",
                domain: domain,
                minutes: minutes,
            });

            if (response.success) {
                console.log("✅ Timer created successfully");
                setEndTime(Date.now() + minutes * 60 * 1000);
                setShowCreateTimer(false);
                setNewTimerMinutes("");
            }
        } catch (error) {
            console.error("Error creating timer:", error);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleCreateTimer();
        } else if (e.key === "Escape") {
            onClose();
        }
    };

    if (!isVisible) return null;

    return (
        <div className="timer-bar-container">
            <div
                className={`timer-bar ${isCollapsed ? "collapsed" : ""}`}
                onClick={() => !showCreateTimer && setIsCollapsed(!isCollapsed)}
            >
                {/* Content */}
                <div className="timer-content">
                    <Clock
                        size={isCollapsed ? 10 : 12}
                        className="timer-icon"
                    />

                    {!isCollapsed && (
                        <>
                            {showCreateTimer ? (
                                // Timer creation UI
                                <div className="timer-create">
                                    <input
                                        type="number"
                                        placeholder="15"
                                        value={newTimerMinutes}
                                        onChange={(e) =>
                                            setNewTimerMinutes(e.target.value)
                                        }
                                        onKeyDown={handleKeyPress}
                                        className="timer-input"
                                        min="1"
                                        max="999"
                                        autoFocus
                                    />
                                    <span className="timer-unit">min</span>
                                    <button
                                        onClick={handleCreateTimer}
                                        disabled={!newTimerMinutes}
                                        className="timer-create-btn"
                                    >
                                        <Plus size={10} />
                                    </button>
                                </div>
                            ) : (
                                // Running timer UI
                                <>
                                    <span className="timer-domain">
                                        {domain.length > 15
                                            ? domain.substring(0, 15) + "..."
                                            : domain}
                                    </span>
                                    <span className="timer-time">
                                        {formatTime(timeRemaining)}
                                    </span>
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>

            <style jsx>{`
                .timer-bar-container {
                    position: fixed;
                    top: 16px;
                    right: 20px;
                    z-index: 9999998;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI",
                        Roboto, sans-serif;
                    animation: slideInRight 0.4s
                        cubic-bezier(0.25, 0.8, 0.25, 1);
                }

                .timer-bar {
                    position: relative;
                    background: linear-gradient(
                        135deg,
                        rgba(16, 185, 129, 0.95) 0%,
                        rgba(5, 150, 105, 0.95) 50%,
                        rgba(4, 120, 87, 0.95) 100%
                    );
                    backdrop-filter: blur(20px) saturate(180%);
                    -webkit-backdrop-filter: blur(20px) saturate(180%);
                    border: 1px solid rgba(16, 185, 129, 0.3);
                    border-radius: 20px;
                    box-shadow: 0 8px 32px rgba(16, 185, 129, 0.2),
                        0 2px 8px rgba(16, 185, 129, 0.15),
                        inset 0 1px 0 rgba(255, 255, 255, 0.6),
                        inset 0 -1px 0 rgba(0, 0, 0, 0.1);
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
                    overflow: hidden;
                    min-width: 180px;
                    height: 36px;
                    transform-origin: center;
                }

                .timer-bar.collapsed {
                    min-width: 24px;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                }

                .timer-bar:hover {
                    transform: scale(1.02);
                    box-shadow: 0 12px 40px rgba(16, 185, 129, 0.3),
                        0 4px 16px rgba(16, 185, 129, 0.2),
                        inset 0 1px 0 rgba(255, 255, 255, 0.7),
                        inset 0 -1px 0 rgba(0, 0, 0, 0.15);
                    border-color: rgba(16, 185, 129, 0.4);
                }

                .timer-content {
                    position: relative;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 0 12px;
                    height: 100%;
                    z-index: 1;
                }

                .timer-bar.collapsed .timer-content {
                    padding: 0;
                    justify-content: center;
                }

                .timer-icon {
                    color: rgba(255, 255, 255, 1);
                    flex-shrink: 0;
                    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
                }

                .timer-create {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    flex: 1;
                }

                .timer-input {
                    width: 40px;
                    background: transparent;
                    border: none;
                    outline: none;
                    font-size: 12px;
                    font-weight: 700;
                    color: rgba(255, 255, 255, 1);
                    text-align: center;
                    font-variant-numeric: tabular-nums;
                    -webkit-appearance: none;
                    -moz-appearance: textfield;
                }

                .timer-input::-webkit-outer-spin-button,
                .timer-input::-webkit-inner-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                }

                .timer-input::placeholder {
                    color: rgba(255, 255, 255, 0.7);
                }

                .timer-unit {
                    font-size: 11px;
                    color: rgba(255, 255, 255, 0.8);
                    font-weight: 500;
                }

                .timer-create-btn {
                    width: 18px;
                    height: 18px;
                    border: none;
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 50%;
                    color: rgba(255, 255, 255, 1);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                }

                .timer-create-btn:hover:not(:disabled) {
                    background: rgba(255, 255, 255, 0.3);
                    transform: scale(1.1);
                    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.3);
                }

                .timer-create-btn:disabled {
                    opacity: 0.4;
                    cursor: not-allowed;
                }

                .timer-domain {
                    flex: 1;
                    font-size: 11px;
                    font-weight: 600;
                    color: rgba(255, 255, 255, 0.9);
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
                }

                .timer-time {
                    font-size: 12px;
                    font-weight: 700;
                    color: rgba(255, 255, 255, 1);
                    font-variant-numeric: tabular-nums;
                    flex-shrink: 0;
                    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
                }

                .timer-close-btn {
                    width: 18px;
                    height: 18px;
                    border: none;
                    background: rgba(0, 0, 0, 0.08);
                    border-radius: 4px;
                    color: rgba(0, 0, 0, 0.7);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.15s ease;
                    flex-shrink: 0;
                    margin-left: auto;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                }

                .timer-close-btn:hover {
                    background: linear-gradient(
                        135deg,
                        rgba(239, 68, 68, 0.15) 0%,
                        rgba(239, 68, 68, 0.2) 100%
                    );
                    color: rgba(239, 68, 68, 0.9);
                    transform: scale(1.1);
                    box-shadow: 0 2px 6px rgba(239, 68, 68, 0.2);
                }

                /* Dark mode detection and styles */
                @media (prefers-color-scheme: dark) {
                    .timer-bar {
                        background: linear-gradient(
                            135deg,
                            rgba(139, 69, 19, 0.95) 0%,
                            rgba(180, 83, 9, 0.95) 50%,
                            rgba(217, 119, 6, 0.95) 100%
                        );
                        border: 1px solid rgba(217, 119, 6, 0.3);
                        box-shadow: 0 8px 32px rgba(217, 119, 6, 0.2),
                            0 2px 8px rgba(217, 119, 6, 0.15),
                            inset 0 1px 0 rgba(255, 255, 255, 0.2),
                            inset 0 -1px 0 rgba(0, 0, 0, 0.2);
                    }

                    .timer-bar:hover {
                        box-shadow: 0 12px 40px rgba(217, 119, 6, 0.3),
                            0 4px 16px rgba(217, 119, 6, 0.2),
                            inset 0 1px 0 rgba(255, 255, 255, 0.3),
                            inset 0 -1px 0 rgba(0, 0, 0, 0.25);
                        border-color: rgba(217, 119, 6, 0.4);
                    }
                }

                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }

                /* Responsive adjustments */
                @media (max-width: 768px) {
                    .timer-bar-container {
                        top: 10px;
                        right: 10px;
                    }

                    .timer-bar {
                        min-width: 160px;
                        height: 32px;
                    }

                    .timer-content {
                        padding: 0 10px;
                        gap: 6px;
                    }

                    .timer-domain {
                        max-width: 80px;
                    }
                }
            `}</style>
        </div>
    );
};

export default TimerBar;
