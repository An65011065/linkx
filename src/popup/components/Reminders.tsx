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

interface TimerData {
    domain: string;
    minutes: number;
    startTime: number;
    endTime: number;
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
    const [activeTimers, setActiveTimers] = useState<{
        [key: string]: TimerData;
    }>({});

    // Load active timers from background script
    useEffect(() => {
        const loadActiveTimers = async () => {
            try {
                const response = await chrome.runtime.sendMessage({
                    action: "getActiveTimers",
                });

                if (response && response.timers) {
                    setActiveTimers(response.timers);
                }
            } catch (err) {
                console.error("Failed to load active timers:", err);
            }
        };

        loadActiveTimers();

        // Refresh timers every second to update countdown
        const interval = setInterval(loadActiveTimers, 1000);

        return () => clearInterval(interval);
    }, []);

    const handleTimerStart = async (minutes: number) => {
        try {
            setIsProcessing(true);
            setError(null);

            // If free trial is active, cancel existing timer first
            if (freeTrial && Object.keys(activeTimers).length > 0) {
                const existingTimerKey = Object.keys(activeTimers)[0];
                const existingTimer = activeTimers[existingTimerKey];

                await chrome.runtime.sendMessage({
                    action: "cancelTimer",
                    domain: existingTimer.domain,
                });
            }

            // Create new timer via background script
            const response = await chrome.runtime.sendMessage({
                action: "createTimer",
                domain: currentDomain,
                minutes: minutes,
            });

            if (response && response.success) {
                onTimerSet?.(minutes);
                setIsOpen(false);
                setShowCustomTimer(false);
                setCustomTimerMinutes("");
                setError(null);
            } else {
                throw new Error("Failed to create timer");
            }
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to set timer",
            );
        } finally {
            setIsProcessing(false);
        }
    };

    const handleTimerCancel = async (domain: string) => {
        try {
            setIsProcessing(true);
            const response = await chrome.runtime.sendMessage({
                action: "cancelTimer",
                domain: domain,
            });

            if (response && response.success) {
                onTimerClear?.();
                setError(null);
            } else {
                throw new Error("Failed to cancel timer");
            }
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to cancel timer",
            );
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCustomTimerSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const minutes = parseInt(customTimerMinutes);
        if (isNaN(minutes) || minutes <= 0) {
            setError("Please enter a valid number of minutes");
            return;
        }
        if (minutes > 1440) {
            // 24 hours max
            setError("Timer cannot exceed 24 hours (1440 minutes)");
            return;
        }
        handleTimerStart(minutes);
    };

    const handleBlockClick = async (hours: number) => {
        try {
            setIsProcessing(true);
            setError(null);
            await websiteBlocker.blockWebsite(currentDomain, hours);
            setIsOpen(false);
            setShowCustomBlock(false);
            setCustomBlockHours("");
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
        if (hours > 168) {
            // 1 week max
            setError("Block duration cannot exceed 168 hours (1 week)");
            return;
        }
        handleBlockClick(hours);
    };

    const formatTimeRemaining = (endTime: number) => {
        const remaining = endTime - Date.now();
        if (remaining <= 0) return "Finished";

        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor(
            (remaining % (1000 * 60 * 60)) / (1000 * 60),
        );
        const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

        if (hours > 0) {
            return `${hours}h ${minutes}m ${seconds}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds}s`;
        }
        return `${seconds}s`;
    };

    const currentDomainTimer = activeTimers[`timer_${currentDomain}`];
    const hasActiveTimer =
        !!currentDomainTimer && currentDomainTimer.endTime > Date.now();
    const totalActiveTimers = Object.keys(activeTimers).length;

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
        opacity: isProcessing ? 0.6 : 1,
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
                {totalActiveTimers > 0 && (
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

            {/* Modal Overlay */}
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
                            minWidth: "320px",
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

                        {/* Free Trial Warning */}
                        {freeTrial &&
                            totalActiveTimers >= 1 &&
                            !hasActiveTimer && (
                                <div
                                    style={{
                                        marginBottom: "16px",
                                        padding: "12px",
                                        backgroundColor: "#fff7ed",
                                        color: "#c2410c",
                                        borderRadius: "8px",
                                        fontSize: "13px",
                                        fontFamily: "Nunito-Regular",
                                        border: "1px solid #fed7aa",
                                    }}
                                >
                                    Free trial allows only 1 timer at a time.
                                    Cancel the existing timer to set a new one.
                                </div>
                            )}

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
                                        disabled={
                                            isProcessing ||
                                            (freeTrial &&
                                                totalActiveTimers >= 1 &&
                                                !hasActiveTimer)
                                        }
                                        style={{
                                            ...buttonStyle,
                                            justifyContent: "center",
                                            cursor:
                                                isProcessing ||
                                                (freeTrial &&
                                                    totalActiveTimers >= 1 &&
                                                    !hasActiveTimer)
                                                    ? "not-allowed"
                                                    : "pointer",
                                        }}
                                    >
                                        <Clock size={16} />
                                        10m
                                    </button>
                                    <button
                                        onClick={() => handleTimerStart(30)}
                                        disabled={
                                            isProcessing ||
                                            (freeTrial &&
                                                totalActiveTimers >= 1 &&
                                                !hasActiveTimer)
                                        }
                                        style={{
                                            ...buttonStyle,
                                            justifyContent: "center",
                                            cursor:
                                                isProcessing ||
                                                (freeTrial &&
                                                    totalActiveTimers >= 1 &&
                                                    !hasActiveTimer)
                                                    ? "not-allowed"
                                                    : "pointer",
                                        }}
                                    >
                                        <Clock size={16} />
                                        30m
                                    </button>
                                    <button
                                        onClick={() =>
                                            setShowCustomTimer(!showCustomTimer)
                                        }
                                        disabled={isProcessing}
                                        style={{
                                            ...buttonStyle,
                                            justifyContent: "center",
                                            backgroundColor: showCustomTimer
                                                ? "#e2e8f0"
                                                : "#edf2f7",
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
                                                min="1"
                                                max="1440"
                                                disabled={
                                                    isProcessing ||
                                                    (freeTrial &&
                                                        totalActiveTimers >=
                                                            1 &&
                                                        !hasActiveTimer)
                                                }
                                                style={{
                                                    flex: 1,
                                                    padding: "8px 12px",
                                                    border: "1px solid #e2e8f0",
                                                    borderRadius: "8px",
                                                    fontSize: "14px",
                                                    fontFamily:
                                                        "Nunito-Regular",
                                                    outline: "none",
                                                    opacity:
                                                        isProcessing ||
                                                        (freeTrial &&
                                                            totalActiveTimers >=
                                                                1 &&
                                                            !hasActiveTimer)
                                                            ? 0.6
                                                            : 1,
                                                }}
                                            />
                                            <button
                                                type="submit"
                                                disabled={
                                                    isProcessing ||
                                                    !customTimerMinutes.trim() ||
                                                    (freeTrial &&
                                                        totalActiveTimers >=
                                                            1 &&
                                                        !hasActiveTimer)
                                                }
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
                                                    opacity:
                                                        isProcessing ||
                                                        !customTimerMinutes.trim() ||
                                                        (freeTrial &&
                                                            totalActiveTimers >=
                                                                1 &&
                                                            !hasActiveTimer)
                                                            ? 0.5
                                                            : 1,
                                                }}
                                            >
                                                <ArrowRight size={18} />
                                            </button>
                                        </div>
                                    </form>
                                )}

                                {hasActiveTimer && (
                                    <div
                                        style={{
                                            marginTop: "12px",
                                            padding: "12px",
                                            backgroundColor: "#ebf8ff",
                                            color: "#2b6cb0",
                                            borderRadius: "8px",
                                            fontSize: "14px",
                                            border: "1px solid #bfdbfe",
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                marginBottom: "4px",
                                            }}
                                        >
                                            <span style={{ fontWeight: 600 }}>
                                                Timer Active
                                            </span>
                                            <button
                                                onClick={() =>
                                                    handleTimerCancel(
                                                        currentDomain,
                                                    )
                                                }
                                                disabled={isProcessing}
                                                style={{
                                                    background: "none",
                                                    border: "none",
                                                    color: "#2b6cb0",
                                                    cursor: "pointer",
                                                    padding: "0",
                                                    fontSize: "14px",
                                                    textDecoration: "underline",
                                                    opacity: isProcessing
                                                        ? 0.6
                                                        : 1,
                                                }}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                        <div
                                            style={{
                                                fontSize: "13px",
                                                opacity: 0.9,
                                            }}
                                        >
                                            {formatTimeRemaining(
                                                currentDomainTimer.endTime,
                                            )}{" "}
                                            remaining
                                        </div>
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
                                            backgroundColor: showCustomBlock
                                                ? "#e2e8f0"
                                                : "#edf2f7",
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
                                                min="0.5"
                                                max="168"
                                                disabled={isProcessing}
                                                style={{
                                                    flex: 1,
                                                    padding: "8px 12px",
                                                    border: "1px solid #e2e8f0",
                                                    borderRadius: "8px",
                                                    fontSize: "14px",
                                                    fontFamily:
                                                        "Nunito-Regular",
                                                    outline: "none",
                                                    opacity: isProcessing
                                                        ? 0.6
                                                        : 1,
                                                }}
                                            />
                                            <button
                                                type="submit"
                                                disabled={
                                                    isProcessing ||
                                                    !customBlockHours.trim()
                                                }
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
                                                    opacity:
                                                        isProcessing ||
                                                        !customBlockHours.trim()
                                                            ? 0.5
                                                            : 1,
                                                }}
                                            >
                                                <ArrowRight size={18} />
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        )}

                        {/* Error Display */}
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
                                    border: "1px solid #fed7d7",
                                }}
                            >
                                {error}
                            </div>
                        )}

                        {/* Processing Indicator */}
                        {isProcessing && (
                            <div
                                style={{
                                    marginTop: "16px",
                                    padding: "12px",
                                    backgroundColor: "#f7fafc",
                                    color: "#4a5568",
                                    borderRadius: "8px",
                                    fontSize: "14px",
                                    fontFamily: "Nunito-Regular",
                                    textAlign: "center",
                                    border: "1px solid #e2e8f0",
                                }}
                            >
                                Processing...
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default Reminders;
