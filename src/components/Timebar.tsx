import React, { useState, useEffect } from "react";
import { Clock, X, Plus, ChevronDown } from "lucide-react";

interface TimerBarProps {
    isVisible: boolean;
    domain: string;
    onClose: () => void;
}

const TimerBar: React.FC<TimerBarProps> = ({ isVisible, domain, onClose }) => {
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [endTime, setEndTime] = useState<number | null>(null);
    const [showCreateTimer, setShowCreateTimer] = useState(false);
    const [newTimerMinutes, setNewTimerMinutes] = useState("");
    const [isGlobalTimer, setIsGlobalTimer] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);

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
                    // Check for global timer first
                    const globalTimerData = response.timers["timer_global"];
                    const domainTimerData = response.timers[`timer_${domain}`];

                    let activeTimer = null;
                    if (
                        globalTimerData &&
                        globalTimerData.endTime > Date.now()
                    ) {
                        activeTimer = globalTimerData;
                        setIsGlobalTimer(true);
                        console.log("✅ Found active global timer");
                    } else if (
                        domainTimerData &&
                        domainTimerData.endTime > Date.now()
                    ) {
                        activeTimer = domainTimerData;
                        setIsGlobalTimer(false);
                        console.log("✅ Found active domain timer");
                    }

                    if (activeTimer) {
                        setEndTime(activeTimer.endTime);
                        setShowCreateTimer(false);
                    } else {
                        console.log(
                            "❌ No active timer found, showing create timer UI",
                        );
                        setEndTime(null);
                        setShowCreateTimer(true);
                        // Force focus on the timer input after a brief delay
                        setTimeout(() => {
                            const timerInput = document.querySelector(
                                ".timer-input",
                            ) as HTMLInputElement;
                            if (timerInput) {
                                timerInput.focus();
                                timerInput.select();
                            }
                        }, 200);
                    }
                }
            } catch (error) {
                console.error("Error loading timer:", error);
                setShowCreateTimer(true);
                // Force focus on the timer input after a brief delay
                setTimeout(() => {
                    const timerInput = document.querySelector(
                        ".timer-input",
                    ) as HTMLInputElement;
                    if (timerInput) {
                        timerInput.focus();
                        timerInput.select();
                    }
                }, 200);
            }
        };

        loadActiveTimer();
    }, [isVisible, domain]);

    // Additional focus effect when showCreateTimer becomes true
    useEffect(() => {
        if (showCreateTimer) {
            setTimeout(() => {
                const timerInput = document.querySelector(
                    ".timer-input",
                ) as HTMLInputElement;
                if (timerInput) {
                    timerInput.focus();
                    timerInput.select();
                }
            }, 100);
        }
    }, [showCreateTimer]);

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
            const timerKey = isGlobalTimer ? "timer_global" : `timer_${domain}`;
            await chrome.runtime.sendMessage({
                action: "cancelTimer",
                domain: isGlobalTimer ? "global" : domain,
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
            const targetDomain = isGlobalTimer ? "global" : domain;
            console.log(
                `🚀 Creating ${isGlobalTimer ? "global" : "domain"} timer for`,
                minutes,
                "minutes",
            );

            const response = await chrome.runtime.sendMessage({
                action: "createTimer",
                domain: targetDomain,
                minutes: minutes,
                isGlobal: isGlobalTimer,
            });

            if (response.success) {
                console.log("✅ Timer created successfully");
                setEndTime(Date.now() + minutes * 60 * 1000);
                setShowCreateTimer(false);
                setNewTimerMinutes("");
                setShowDropdown(false);
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

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as Element;
            if (!target.closest(".timer-bar")) {
                setShowDropdown(false);
            }
        };

        if (showDropdown) {
            document.addEventListener("mousedown", handleClickOutside);
            return () =>
                document.removeEventListener("mousedown", handleClickOutside);
        }
    }, [showDropdown]);

    if (!isVisible) return null;

    // Get timer stage based on time remaining
    const getTimerStage = () => {
        if (showCreateTimer) return "create";

        const totalMinutes = Math.floor(timeRemaining / (1000 * 60));
        if (totalMinutes > 10) return "good"; // Green stage
        if (totalMinutes > 5) return "warning"; // Yellow stage
        return "urgent"; // Red stage
    };

    const timerStage = getTimerStage();

    return (
        <div className="timer-bar-container">
            <div className={`timer-bar stage-${timerStage}`}>
                {/* Content */}
                <div className="timer-content">
                    <Clock size={12} className="timer-icon" />

                    {showCreateTimer ? (
                        // Timer creation UI
                        <div className="timer-create">
                            <div className="timer-scope-dropdown">
                                <button
                                    className="scope-dropdown-btn"
                                    onClick={() =>
                                        setShowDropdown(!showDropdown)
                                    }
                                >
                                    <span className="scope-label">
                                        {isGlobalTimer
                                            ? "Global"
                                            : domain.length > 12
                                            ? domain.substring(0, 12) + "..."
                                            : domain}
                                    </span>
                                    <ChevronDown
                                        size={10}
                                        className={
                                            showDropdown ? "rotated" : ""
                                        }
                                    />
                                </button>

                                {showDropdown && (
                                    <div className="scope-dropdown-menu">
                                        <button
                                            className={`scope-option ${
                                                !isGlobalTimer ? "active" : ""
                                            }`}
                                            onClick={() => {
                                                setIsGlobalTimer(false);
                                                setShowDropdown(false);
                                            }}
                                        >
                                            <span className="option-label">
                                                {domain}
                                            </span>
                                            <span className="option-desc">
                                                This website only
                                            </span>
                                        </button>
                                        <button
                                            className={`scope-option ${
                                                isGlobalTimer ? "active" : ""
                                            }`}
                                            onClick={() => {
                                                setIsGlobalTimer(true);
                                                setShowDropdown(false);
                                            }}
                                        >
                                            <span className="option-label">
                                                Global
                                            </span>
                                            <span className="option-desc">
                                                All websites
                                            </span>
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="timer-input-section">
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
                                    tabIndex={9999}
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
                        </div>
                    ) : (
                        // Running timer UI
                        <>
                            <span className="timer-domain">
                                {isGlobalTimer
                                    ? "Global Timer"
                                    : domain.length > 15
                                    ? domain.substring(0, 15) + "..."
                                    : domain}
                            </span>
                            <span className="timer-time">
                                {formatTime(timeRemaining)}
                            </span>
                            <button
                                onClick={handleCancel}
                                className="timer-close-btn"
                                title="Cancel timer"
                            >
                                <X size={10} />
                            </button>
                        </>
                    )}
                </div>
            </div>

            <style jsx>{`
                * {
                    color: inherit !important;
                }

                .timer-bar-container {
                    position: fixed;
                    top: 16px;
                    right: 20px;
                    z-index: 10000000; /* Higher than other inputs */
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI",
                        system-ui, sans-serif;
                    animation: slideInRight 0.4s
                        cubic-bezier(0.25, 0.8, 0.25, 1);
                }

                .timer-bar {
                    position: relative;
                    backdrop-filter: blur(20px);
                    border-radius: 12px;
                    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
                    overflow: visible;
                    min-width: 200px;
                    height: 36px;
                }

                /* Create Timer Stage */
                .timer-bar.stage-create {
                    background: rgba(255, 251, 235, 0.98);
                    border: 1px solid rgba(205, 133, 63, 0.35);
                    box-shadow: 0 8px 16px rgba(160, 82, 45, 0.15);
                }

                .timer-bar.stage-create:hover {
                    background: rgba(255, 251, 235, 1);
                    border-color: rgba(205, 133, 63, 0.5);
                    box-shadow: 0 12px 24px rgba(160, 82, 45, 0.2);
                }

                /* Good Timer Stage (>10 minutes) */
                .timer-bar.stage-good {
                    background: rgba(206, 232, 188, 0.95);
                    border: 1px solid rgba(206, 232, 188, 0.4);
                    box-shadow: 0 8px 16px rgba(206, 232, 188, 0.15);
                }

                .timer-bar.stage-good:hover {
                    background: rgba(206, 232, 188, 1);
                    border-color: rgba(206, 232, 188, 0.6);
                    box-shadow: 0 12px 24px rgba(206, 232, 188, 0.25);
                }

                /* Warning Timer Stage (5-10 minutes) */
                .timer-bar.stage-warning {
                    background: rgba(225, 227, 184, 0.95);
                    border: 1px solid rgba(225, 227, 184, 0.4);
                    box-shadow: 0 8px 16px rgba(225, 227, 184, 0.15);
                }

                .timer-bar.stage-warning:hover {
                    background: rgba(225, 227, 184, 1);
                    border-color: rgba(225, 227, 184, 0.6);
                    box-shadow: 0 12px 24px rgba(225, 227, 184, 0.25);
                }

                /* Urgent Timer Stage (<5 minutes) */
                .timer-bar.stage-urgent {
                    background: rgba(232, 192, 188, 0.95);
                    border: 1px solid rgba(232, 192, 188, 0.4);
                    box-shadow: 0 8px 16px rgba(232, 192, 188, 0.15);
                    animation: urgentPulse 2s ease-in-out infinite;
                }

                .timer-bar.stage-urgent:hover {
                    background: rgba(232, 192, 188, 1);
                    border-color: rgba(232, 192, 188, 0.6);
                    box-shadow: 0 12px 24px rgba(232, 192, 188, 0.25);
                }

                @keyframes urgentPulse {
                    0%,
                    100% {
                        box-shadow: 0 8px 16px rgba(232, 192, 188, 0.15);
                    }
                    50% {
                        box-shadow: 0 8px 16px rgba(232, 192, 188, 0.3);
                    }
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

                .timer-icon {
                    flex-shrink: 0;
                    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
                }

                .stage-create .timer-icon {
                    color: rgba(160, 82, 45, 0.85);
                }

                .stage-good .timer-icon,
                .stage-warning .timer-icon,
                .stage-urgent .timer-icon {
                    color: rgba(101, 67, 33, 0.9);
                }

                .timer-create {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    flex: 1;
                }

                .timer-scope-dropdown {
                    position: relative;
                }

                .scope-dropdown-btn {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    padding: 4px 6px;
                    background: rgba(218, 165, 32, 0.15);
                    border: 1px solid rgba(205, 133, 63, 0.25);
                    border-radius: 6px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    font-size: 10px;
                    font-weight: 600;
                    color: rgba(101, 67, 33, 0.9);
                    min-width: 80px;
                }

                .scope-dropdown-btn:hover {
                    background: rgba(218, 165, 32, 0.25);
                    border-color: rgba(205, 133, 63, 0.4);
                }

                .scope-label {
                    flex: 1;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    text-align: left;
                }

                .rotated {
                    transform: rotate(180deg);
                }

                .scope-dropdown-menu {
                    position: absolute;
                    top: 100%;
                    left: 0;
                    right: 0;
                    background: rgba(255, 251, 235, 0.98);
                    border: 1px solid rgba(205, 133, 63, 0.35);
                    border-radius: 8px;
                    box-shadow: 0 8px 24px rgba(160, 82, 45, 0.2);
                    backdrop-filter: blur(20px);
                    z-index: 10000001;
                    margin-top: 4px;
                    overflow: hidden;
                    animation: dropdownSlide 0.2s ease-out;
                }

                @keyframes dropdownSlide {
                    from {
                        opacity: 0;
                        transform: translateY(-4px) scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }

                .scope-option {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    width: 100%;
                    padding: 8px 10px;
                    border: none;
                    background: transparent;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    text-align: left;
                    border-bottom: 1px solid rgba(205, 133, 63, 0.1);
                }

                .scope-option:last-child {
                    border-bottom: none;
                }

                .scope-option:hover {
                    background: rgba(218, 165, 32, 0.1);
                }

                .scope-option.active {
                    background: rgba(218, 165, 32, 0.2);
                }

                .option-label {
                    font-size: 11px;
                    font-weight: 600;
                    color: rgba(101, 67, 33, 0.95);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    width: 100%;
                }

                .option-desc {
                    font-size: 9px;
                    font-weight: 500;
                    color: rgba(160, 82, 45, 0.7);
                    margin-top: 1px;
                }

                .timer-input-section {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }

                .timer-input {
                    width: 40px;
                    background: transparent;
                    border: none;
                    outline: none;
                    font-size: 12px;
                    font-weight: 700;
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

                .stage-create .timer-input {
                    color: rgba(101, 67, 33, 0.95);
                }

                .stage-create .timer-input::placeholder {
                    color: rgba(160, 82, 45, 0.5);
                }

                .timer-unit {
                    font-size: 11px;
                    font-weight: 500;
                }

                .stage-create .timer-unit {
                    color: rgba(160, 82, 45, 0.7);
                }

                .timer-create-btn {
                    width: 18px;
                    height: 18px;
                    border: none;
                    border-radius: 50%;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }

                .stage-create .timer-create-btn {
                    background: rgba(218, 165, 32, 0.2);
                    color: rgba(160, 82, 45, 0.85);
                }

                .stage-create .timer-create-btn:hover:not(:disabled) {
                    background: rgba(218, 165, 32, 0.3);
                    transform: scale(1.1);
                    box-shadow: 0 3px 8px rgba(160, 82, 45, 0.2);
                }

                .timer-create-btn:disabled {
                    opacity: 0.4;
                    cursor: not-allowed;
                }

                .timer-domain {
                    flex: 1;
                    font-size: 11px;
                    font-weight: 600;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
                }

                .stage-good .timer-domain,
                .stage-warning .timer-domain,
                .stage-urgent .timer-domain {
                    color: rgba(101, 67, 33, 0.85);
                }

                .timer-time {
                    font-size: 12px;
                    font-weight: 700;
                    font-variant-numeric: tabular-nums;
                    flex-shrink: 0;
                    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
                }

                .stage-good .timer-time,
                .stage-warning .timer-time,
                .stage-urgent .timer-time {
                    color: rgba(101, 67, 33, 0.95);
                }

                .timer-close-btn {
                    width: 18px;
                    height: 18px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.15s ease;
                    flex-shrink: 0;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                }

                .stage-good .timer-close-btn,
                .stage-warning .timer-close-btn,
                .stage-urgent .timer-close-btn {
                    background: rgba(101, 67, 33, 0.1);
                    color: rgba(101, 67, 33, 0.7);
                }

                .stage-good .timer-close-btn:hover,
                .stage-warning .timer-close-btn:hover,
                .stage-urgent .timer-close-btn:hover {
                    background: rgba(239, 68, 68, 0.2);
                    color: rgba(239, 68, 68, 0.9);
                    transform: scale(1.1);
                    box-shadow: 0 2px 6px rgba(239, 68, 68, 0.2);
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
                        min-width: 180px;
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
