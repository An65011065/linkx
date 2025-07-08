import React, { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { Bell, Clock, Lock, Plus, Timer, ArrowRight } from "lucide-react";
import { websiteBlocker } from "../../data/websiteBlocker";
import { freeTrial } from "../../main/MainTab";

interface RemindersProps {
    currentDomain: string;
    children?: ReactNode;
    onTimerSet?: (minutes: number) => void;
    onTimerClear?: () => void;
}

const Reminders: React.FC<RemindersProps> = ({
    currentDomain,
    children,
    onTimerSet,
    onTimerClear,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [showCustomBlock, setShowCustomBlock] = useState(false);
    const [showCustomTimer, setShowCustomTimer] = useState(false);
    const [customBlockHours, setCustomBlockHours] = useState("");
    const [customTimerMinutes, setCustomTimerMinutes] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"timer" | "block">("timer");
    const [activeTimers, setActiveTimers] = useState<{ [key: string]: number }>(
        {},
    );

    useEffect(() => {
        // Cleanup timers on unmount
        return () => {
            Object.values(activeTimers).forEach((timer) => clearTimeout(timer));
        };
    }, []);

    const handleTimerStart = (minutes: number) => {
        try {
            // If free trial is active, remove all existing timers first
            if (freeTrial) {
                // Get all timer keys from localStorage
                const timerKeys = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key?.startsWith("timer_")) {
                        timerKeys.push(key);
                    }
                }

                // Remove all existing timers
                timerKeys.forEach((key) => {
                    localStorage.removeItem(key);
                });

                // Clear all active timers in state
                Object.values(activeTimers).forEach((timer) =>
                    clearTimeout(timer),
                );
                setActiveTimers({});
            } else {
                // For non-trial mode, clear any existing timer for this domain
                if (activeTimers[currentDomain]) {
                    clearTimeout(activeTimers[currentDomain]);
                }
            }

            // Set up the new timer
            const timer = setTimeout(() => {
                // Show notification when timer is up
                chrome.notifications.create({
                    type: "basic",
                    iconUrl: "/src/assets/icons/icon128.png",
                    title: "Timer Complete",
                    message: `Your ${minutes} minute timer for ${currentDomain} is complete!`,
                    priority: 2,
                });

                // Remove the timer from active timers
                setActiveTimers((prev) => {
                    const newTimers = { ...prev };
                    delete newTimers[currentDomain];
                    return newTimers;
                });

                // Remove from localStorage
                localStorage.removeItem(`timer_${currentDomain}`);

                // Call the clear callback
                onTimerClear?.();
            }, minutes * 60 * 1000);

            // Store in localStorage for persistence
            const timerData = {
                endTime: Date.now() + minutes * 60 * 1000,
                minutes,
            };
            localStorage.setItem(
                `timer_${currentDomain}`,
                JSON.stringify(timerData),
            );

            // Add to active timers
            setActiveTimers((prev) => ({
                ...prev,
                [currentDomain]: timer,
            }));

            // Call the timer set callback
            onTimerSet?.(minutes);

            setIsOpen(false);
            setShowCustomTimer(false);
            setError(null);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to set timer",
            );
        }
    };

    const handleCustomTimerSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const minutes = parseInt(customTimerMinutes);
        if (isNaN(minutes) || minutes <= 0) {
            setError("Please enter a valid number of minutes");
            return;
        }
        handleTimerStart(minutes);
        setCustomTimerMinutes("");
    };

    const handleBlockClick = async (hours: number) => {
        try {
            setIsProcessing(true);
            setError(null);
            await websiteBlocker.blockWebsite(currentDomain, hours);
            setIsOpen(false);
            setShowCustomBlock(false);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to block website",
            );
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCustomBlockSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const hours = parseFloat(customBlockHours);
        if (isNaN(hours) || hours <= 0) {
            setError("Please enter a valid number of hours");
            return;
        }
        handleBlockClick(hours);
        setCustomBlockHours("");
    };

    const buttonStyle = {
        padding: "8px 12px",
        backgroundColor: "#edf2f7",
        border: "none",
        borderRadius: "4px",
        color: "#4a5568",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "4px",
        fontSize: "13px",
        transition: "all 0.2s ease",
    };

    const tabStyle = (isActive: boolean) => ({
        padding: "8px 16px",
        backgroundColor: isActive ? "#e2e8f0" : "transparent",
        border: "none",
        borderRadius: "4px",
        color: isActive ? "#2d3748" : "#718096",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "4px",
        fontSize: "13px",
        fontWeight: isActive ? 600 : 400,
    });

    return (
        <>
            <div onClick={() => setIsOpen(!isOpen)}>
                {children || (
                    <button
                        style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "50%",
                            backgroundColor: isOpen ? "#e2e8f0" : "transparent",
                            border: "none",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                        }}
                        title="Set Timer or Block"
                    >
                        <Bell
                            size={20}
                            color={isOpen ? "#4a5568" : "#718096"}
                        />
                    </button>
                )}
                {Object.keys(activeTimers).length > 0 && (
                    <div
                        style={{
                            position: "absolute",
                            top: "0",
                            right: "0",
                            width: "8px",
                            height: "8px",
                            backgroundColor: "#4299e1",
                            borderRadius: "50%",
                        }}
                    />
                )}
            </div>

            {/* FIXED: Full overlay popup */}
            {isOpen && (
                <div
                    style={{
                        position: "fixed",
                        top: "0",
                        left: "0",
                        right: "0",
                        bottom: "0",
                        backgroundColor: "rgba(0, 0, 0, 0.3)",
                        zIndex: 1000,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "24px",
                    }}
                    onClick={(e) => {
                        // Close when clicking the overlay (but not the modal content)
                        if (e.target === e.currentTarget) {
                            setIsOpen(false);
                        }
                    }}
                >
                    <div
                        style={{
                            backgroundColor: "white",
                            borderRadius: "20px",
                            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
                            padding: "24px",
                            minWidth: "300px",
                            maxWidth: "90vw",
                            maxHeight: "80vh",
                            overflowY: "auto",
                            position: "relative",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close button */}
                        <button
                            onClick={() => setIsOpen(false)}
                            style={{
                                position: "absolute",
                                top: "16px",
                                right: "16px",
                                background: "none",
                                border: "none",
                                fontSize: "24px",
                                cursor: "pointer",
                                color: "#718096",
                                width: "32px",
                                height: "32px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                borderRadius: "50%",
                                transition: "all 0.2s ease",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor =
                                    "#f7fafc";
                                e.currentTarget.style.color = "#2d3748";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor =
                                    "transparent";
                                e.currentTarget.style.color = "#718096";
                            }}
                        >
                            ×
                        </button>

                        {/* Header */}
                        <div
                            style={{
                                marginBottom: "24px",
                                paddingRight: "40px",
                            }}
                        >
                            <h3
                                style={{
                                    margin: "0",
                                    fontSize: "20px",
                                    fontFamily: "Nunito-Bold",
                                    color: "#2d3748",
                                }}
                            >
                                Set Timer or Block
                            </h3>
                            <p
                                style={{
                                    margin: "4px 0 0 0",
                                    fontSize: "14px",
                                    color: "#718096",
                                    fontFamily: "Nunito-Regular",
                                }}
                            >
                                for {currentDomain}
                            </p>
                        </div>

                        {/* Tab Switcher */}
                        <div
                            style={{
                                display: "flex",
                                gap: "8px",
                                marginBottom: "24px",
                                borderBottom: "1px solid #e2e8f0",
                                paddingBottom: "8px",
                            }}
                        >
                            <button
                                onClick={() => {
                                    setActiveTab("timer");
                                    setShowCustomBlock(false);
                                    setShowCustomTimer(false);
                                    setError(null);
                                }}
                                style={{
                                    ...tabStyle(activeTab === "timer"),
                                    flex: 1,
                                    justifyContent: "center",
                                }}
                            >
                                <Timer size={16} />
                                Timer
                            </button>
                            <button
                                onClick={() => {
                                    setActiveTab("block");
                                    setShowCustomBlock(false);
                                    setShowCustomTimer(false);
                                    setError(null);
                                }}
                                style={{
                                    ...tabStyle(activeTab === "block"),
                                    flex: 1,
                                    justifyContent: "center",
                                }}
                            >
                                <Lock size={16} />
                                Block
                            </button>
                        </div>

                        {/* Timer Options */}
                        {activeTab === "timer" && (
                            <div>
                                <div
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "repeat(3, 1fr)",
                                        gap: "8px",
                                        marginBottom: "12px",
                                    }}
                                >
                                    <button
                                        onClick={() => handleTimerStart(10)}
                                        style={{
                                            ...buttonStyle,
                                            justifyContent: "center",
                                        }}
                                    >
                                        <Clock size={16} />
                                        10m
                                    </button>
                                    <button
                                        onClick={() => handleTimerStart(30)}
                                        style={{
                                            ...buttonStyle,
                                            justifyContent: "center",
                                        }}
                                    >
                                        <Clock size={16} />
                                        30m
                                    </button>
                                    <button
                                        onClick={() =>
                                            setShowCustomTimer(!showCustomTimer)
                                        }
                                        style={{
                                            ...buttonStyle,
                                            justifyContent: "center",
                                        }}
                                    >
                                        <Plus size={16} />
                                        Custom
                                    </button>
                                </div>

                                {showCustomTimer && (
                                    <form
                                        onSubmit={handleCustomTimerSubmit}
                                        style={{ marginTop: "12px" }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                gap: "8px",
                                                alignItems: "center",
                                            }}
                                        >
                                            <input
                                                type="number"
                                                value={customTimerMinutes}
                                                onChange={(e) =>
                                                    setCustomTimerMinutes(
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="Enter minutes"
                                                style={{
                                                    flex: 1,
                                                    padding: "8px 12px",
                                                    border: "1px solid #e2e8f0",
                                                    borderRadius: "8px",
                                                    fontSize: "14px",
                                                    fontFamily:
                                                        "Nunito-Regular",
                                                    outline: "none",
                                                }}
                                            />
                                            <button
                                                type="submit"
                                                style={{
                                                    padding: "8px",
                                                    backgroundColor: "#4299e1",
                                                    color: "white",
                                                    border: "none",
                                                    borderRadius: "8px",
                                                    cursor: "pointer",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    width: "36px",
                                                    height: "36px",
                                                }}
                                            >
                                                <ArrowRight size={18} />
                                            </button>
                                        </div>
                                    </form>
                                )}

                                {activeTimers[currentDomain] && (
                                    <div
                                        style={{
                                            marginTop: "12px",
                                            padding: "12px",
                                            backgroundColor: "#ebf8ff",
                                            color: "#2b6cb0",
                                            borderRadius: "8px",
                                            fontSize: "14px",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                        }}
                                    >
                                        <span>Timer active for this site</span>
                                        <button
                                            onClick={() => {
                                                clearTimeout(
                                                    activeTimers[currentDomain],
                                                );
                                                setActiveTimers((prev) => {
                                                    const newTimers = {
                                                        ...prev,
                                                    };
                                                    delete newTimers[
                                                        currentDomain
                                                    ];
                                                    return newTimers;
                                                });
                                                // Call the clear callback
                                                onTimerClear?.();
                                            }}
                                            style={{
                                                background: "none",
                                                border: "none",
                                                color: "#2b6cb0",
                                                cursor: "pointer",
                                                padding: "0",
                                                fontSize: "14px",
                                                textDecoration: "underline",
                                            }}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Block Options */}
                        {activeTab === "block" && (
                            <div>
                                <div
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "repeat(3, 1fr)",
                                        gap: "8px",
                                        marginBottom: "12px",
                                    }}
                                >
                                    <button
                                        onClick={() => handleBlockClick(1)}
                                        disabled={isProcessing}
                                        style={{
                                            ...buttonStyle,
                                            justifyContent: "center",
                                        }}
                                    >
                                        <Lock size={16} />
                                        1h
                                    </button>
                                    <button
                                        onClick={() => handleBlockClick(2)}
                                        disabled={isProcessing}
                                        style={{
                                            ...buttonStyle,
                                            justifyContent: "center",
                                        }}
                                    >
                                        <Lock size={16} />
                                        2h
                                    </button>
                                    <button
                                        onClick={() =>
                                            setShowCustomBlock(!showCustomBlock)
                                        }
                                        disabled={isProcessing}
                                        style={{
                                            ...buttonStyle,
                                            justifyContent: "center",
                                        }}
                                    >
                                        <Plus size={16} />
                                        Custom
                                    </button>
                                </div>

                                {showCustomBlock && (
                                    <form
                                        onSubmit={handleCustomBlockSubmit}
                                        style={{ marginTop: "12px" }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                gap: "8px",
                                                alignItems: "center",
                                            }}
                                        >
                                            <input
                                                type="number"
                                                value={customBlockHours}
                                                onChange={(e) =>
                                                    setCustomBlockHours(
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="Enter hours"
                                                step="0.5"
                                                style={{
                                                    flex: 1,
                                                    padding: "8px 12px",
                                                    border: "1px solid #e2e8f0",
                                                    borderRadius: "8px",
                                                    fontSize: "14px",
                                                    fontFamily:
                                                        "Nunito-Regular",
                                                    outline: "none",
                                                }}
                                            />
                                            <button
                                                type="submit"
                                                disabled={isProcessing}
                                                style={{
                                                    padding: "8px",
                                                    backgroundColor: "#4299e1",
                                                    color: "white",
                                                    border: "none",
                                                    borderRadius: "8px",
                                                    cursor: "pointer",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    width: "36px",
                                                    height: "36px",
                                                }}
                                            >
                                                <ArrowRight size={18} />
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        )}

                        {error && (
                            <div
                                style={{
                                    marginTop: "16px",
                                    padding: "12px",
                                    backgroundColor: "#fff5f5",
                                    color: "#c53030",
                                    borderRadius: "8px",
                                    fontSize: "14px",
                                    fontFamily: "Nunito-Regular",
                                }}
                            >
                                {error}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default Reminders;
