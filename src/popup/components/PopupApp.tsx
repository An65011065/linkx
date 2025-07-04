import React, { useState, useEffect } from "react";
import {
    Camera,
    FileText,
    Bookmark,
    Bell,
    MoreHorizontal,
    Search,
    ArrowLeft,
    Copy,
    Tag,
} from "lucide-react";
import { ScreenshotService } from "../../services/screenshotService";
import { PageSummariseService } from "../../services/pageSummariseService";
import DataService from "../../data/dataService";
import Reminders from "./Reminders";
import NotepadView from "./NotepadView";
import CrossTabSearch from "./CrosstabSearch";
import "../../shared/styles/fonts.css";

const PopupApp: React.FC = () => {
    const [isCapturing, setIsCapturing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentDomain, setCurrentDomain] = useState("");
    const [domainTime, setDomainTime] = useState(0);
    const [activeTimer, setActiveTimer] = useState<{
        endTime: number;
        minutes: number;
    } | null>(null);
    const [timeRemaining, setTimeRemaining] = useState("");
    const [showNotepad, setShowNotepad] = useState(false);
    const [hasNote, setHasNote] = useState(false);

    // NEW: Page summarization states
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [showSummary, setShowSummary] = useState(false);
    const [pageSummary, setPageSummary] = useState<string | null>(null);

    useEffect(() => {
        // Get current tab's domain when component mounts
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]?.url) {
                try {
                    const url = new URL(tabs[0].url);
                    setCurrentDomain(url.hostname.replace(/^www\./, ""));
                } catch (err) {
                    console.error("Error parsing URL:", err);
                }
            }
        });
    }, []);

    useEffect(() => {
        // Calculate time spent on current domain
        const calculateDomainTime = async () => {
            if (!currentDomain) return;

            try {
                const dataService = DataService.getInstance();
                const allVisits = await dataService.getAllUrlVisits();

                // Sum up active time for all visits to the current domain
                const totalTime = allVisits
                    .filter((visit) => visit.domain === currentDomain)
                    .reduce((sum, visit) => sum + visit.activeTime, 0);

                setDomainTime(totalTime);
            } catch (error) {
                console.error("Error calculating domain time:", error);
            }
        };

        if (currentDomain) {
            calculateDomainTime();
        }
    }, [currentDomain]);

    // Check if domain has a note
    useEffect(() => {
        const checkForNote = async () => {
            if (!currentDomain) return;

            try {
                const key = `note_${currentDomain}`;
                const result = await chrome.storage.local.get(key);
                setHasNote(result[key] && result[key].trim().length > 0);
            } catch (err) {
                console.error("Error checking for note:", err);
            }
        };

        if (currentDomain) {
            checkForNote();
        }
    }, [currentDomain]);

    // Check for existing timer when domain changes
    useEffect(() => {
        if (!currentDomain) return;

        const checkForTimer = () => {
            const timerKey = `timer_${currentDomain}`;
            const storedTimer = localStorage.getItem(timerKey);

            if (storedTimer) {
                const timerData = JSON.parse(storedTimer);
                const now = Date.now();

                if (timerData.endTime > now) {
                    // Timer is still active
                    setActiveTimer(timerData);
                } else {
                    // Timer expired, clean up
                    localStorage.removeItem(timerKey);
                    setActiveTimer(null);
                }
            } else {
                setActiveTimer(null);
            }
        };

        checkForTimer();
    }, [currentDomain]);

    // Live countdown update
    useEffect(() => {
        if (!activeTimer) {
            setTimeRemaining("");
            return;
        }

        const updateTimer = () => {
            const now = Date.now();
            const remaining = activeTimer.endTime - now;

            if (remaining <= 0) {
                // Timer finished
                setTimeRemaining("Timer finished!");
                setActiveTimer(null);

                // Clean up storage
                const timerKey = `timer_${currentDomain}`;
                localStorage.removeItem(timerKey);

                // Show notification
                if (chrome.notifications) {
                    chrome.notifications.create({
                        type: "basic",
                        iconUrl: "/src/assets/icons/icon128.png",
                        title: "Timer Complete",
                        message: `Your timer for ${currentDomain} is complete!`,
                        priority: 2,
                    });
                }
                return;
            }

            // Format remaining time
            const minutes = Math.floor(remaining / (1000 * 60));
            const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

            if (minutes > 0) {
                setTimeRemaining(`${minutes}m ${seconds}s remaining`);
            } else {
                setTimeRemaining(`${seconds}s remaining`);
            }
        };

        // Update immediately
        updateTimer();

        // Update every second
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [activeTimer, currentDomain]);

    // Listen for timer updates from Reminders component
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key?.startsWith(`timer_${currentDomain}`) && e.newValue) {
                const timerData = JSON.parse(e.newValue);
                setActiveTimer(timerData);
            }
        };

        window.addEventListener("storage", handleStorageChange);

        // Also listen for custom events from the Reminders component
        const handleTimerSet = (e: CustomEvent) => {
            if (e.detail.domain === currentDomain) {
                setActiveTimer({
                    endTime: Date.now() + e.detail.minutes * 60 * 1000,
                    minutes: e.detail.minutes,
                });
            }
        };

        const handleTimerClear = (e: CustomEvent) => {
            if (e.detail.domain === currentDomain) {
                setActiveTimer(null);
                setTimeRemaining("");
            }
        };

        window.addEventListener("timerSet", handleTimerSet as EventListener);
        window.addEventListener(
            "timerClear",
            handleTimerClear as EventListener,
        );

        return () => {
            window.removeEventListener("storage", handleStorageChange);
            window.removeEventListener(
                "timerSet",
                handleTimerSet as EventListener,
            );
            window.removeEventListener(
                "timerClear",
                handleTimerClear as EventListener,
            );
        };
    }, [currentDomain]);

    // Format time in hours and minutes
    const formatTime = (milliseconds: number): string => {
        const minutes = Math.round(milliseconds / (1000 * 60));
        if (minutes >= 60) {
            const hours = Math.floor(minutes / 60);
            const remainingMinutes = minutes % 60;
            return remainingMinutes > 0
                ? `${hours}h ${remainingMinutes}m`
                : `${hours}h`;
        }
        return `${minutes}m`;
    };

    const handleScreenshot = async () => {
        try {
            setIsCapturing(true);
            setError(null);
            await ScreenshotService.captureFullPage();
        } catch (error) {
            console.error("Screenshot error:", error);
            setError(
                error instanceof Error
                    ? error.message
                    : "Failed to capture screenshot",
            );
        } finally {
            setIsCapturing(false);
        }
    };

    // NEW: Handle page summarization
    const handleSummarize = async () => {
        try {
            setIsSummarizing(true);
            setError(null);
            setPageSummary(null);

            console.log("Starting page summarization...");

            // Extract and summarize current page
            const result = await PageSummariseService.extractAndSummarize();

            if (result.success && result.summary) {
                setPageSummary(result.summary);
                setShowSummary(true);
                console.log("Page summarization successful");
            } else {
                console.error("Summarization failed:", result.error);
                setError(`Summarization failed: ${result.error}`);
            }
        } catch (error) {
            console.error("Error during summarization:", error);
            setError(
                `Error: ${
                    error instanceof Error ? error.message : "Unknown error"
                }`,
            );
        } finally {
            setIsSummarizing(false);
        }
    };

    const handleNotepadClose = () => {
        setShowNotepad(false);
        // Recheck if note exists after closing
        setTimeout(async () => {
            const key = `note_${currentDomain}`;
            const result = await chrome.storage.local.get(key);
            setHasNote(result[key] && result[key].trim().length > 0);
        }, 100);
    };

    // NEW: Show summary view
    if (showSummary && pageSummary) {
        return (
            <div
                style={{
                    width: "340px",
                    height: "330px",
                    padding: "20px",
                    fontFamily:
                        "Nunito-Regular, -apple-system, BlinkMacSystemFont, sans-serif",
                    background: "rgba(255, 255, 255, 0.95)",
                    backdropFilter: "blur(8px)",
                    WebkitBackdropFilter: "blur(8px)",
                    borderRadius: "20px",
                    border: "1px solid rgba(255, 255, 255, 0.18)",
                    boxShadow: "0 8px 32px rgba(31, 38, 135, 0.37)",
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                {/* Header */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "16px",
                        paddingBottom: "12px",
                        borderBottom: "1px solid rgba(0,0,0,0.1)",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                        }}
                    >
                        <button
                            onClick={() => setShowSummary(false)}
                            style={{
                                background: "none",
                                border: "none",
                                padding: "8px",
                                cursor: "pointer",
                                borderRadius: "8px",
                                display: "flex",
                                alignItems: "center",
                                transition: "all 0.2s ease",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor =
                                    "#f8f9fa";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor =
                                    "transparent";
                            }}
                        >
                            <ArrowLeft size={20} color="#495057" />
                        </button>
                        <div>
                            <div
                                style={{
                                    fontSize: "16px",
                                    fontFamily: "Nunito-Bold",
                                    color: "#2c3e50",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                }}
                            >
                                <Tag size={16} color="#495057" />
                                Page Summary
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(pageSummary);
                        }}
                        style={{
                            background: "none",
                            border: "none",
                            padding: "6px",
                            cursor: "pointer",
                            borderRadius: "6px",
                            display: "flex",
                            alignItems: "center",
                            transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#f8f9fa";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor =
                                "transparent";
                        }}
                        title="Copy summary"
                    >
                        <Copy size={16} color="#495057" />
                    </button>
                </div>

                {/* Summary Content */}
                <div
                    style={{
                        flex: 1,
                        overflowY: "auto",
                        padding: "12px",
                        backgroundColor: "#f8f9fa",
                        borderRadius: "12px",
                        fontSize: "14px",
                        lineHeight: "1.5",
                        color: "#2c3e50",
                        fontFamily: "Nunito-Regular",
                    }}
                >
                    {pageSummary}
                </div>
            </div>
        );
    }

    // If showing notepad, render the notepad view
    if (showNotepad) {
        return (
            <div
                style={{
                    width: "340px",
                    height: "330px",
                    padding: "20px",
                    fontFamily:
                        "Nunito-Regular, -apple-system, BlinkMacSystemFont, sans-serif",
                    background: "rgba(255, 255, 255, 0.95)",
                    backdropFilter: "blur(8px)",
                    WebkitBackdropFilter: "blur(8px)",
                    borderRadius: "20px",
                    border: "1px solid rgba(255, 255, 255, 0.18)",
                    boxShadow: "0 8px 32px rgba(31, 38, 135, 0.37)",
                    position: "relative",
                }}
            >
                <NotepadView
                    currentDomain={currentDomain}
                    onBack={handleNotepadClose}
                />
            </div>
        );
    }

    return (
        <div
            style={{
                width: "340px",
                height: "330px",
                padding: "20px",
                fontFamily:
                    "Nunito-Regular, -apple-system, BlinkMacSystemFont, sans-serif",
                background: "rgba(255, 255, 255, 0.95)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                borderRadius: "20px",
                border: "1px solid rgba(255, 255, 255, 0.18)",
                boxShadow: "0 8px 32px rgba(31, 38, 135, 0.37)",
                position: "relative",
                display: "flex",
                flexDirection: "column",
            }}
        >
            {/* Header with time and menu */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "16px",
                }}
            >
                <div
                    style={{
                        textAlign: "center",
                        flex: 1,
                    }}
                >
                    <div
                        style={{
                            fontSize: "20px",
                            fontFamily: "Nunito-Bold",
                            fontWeight: "700",
                            color: "#2c3e50",
                        }}
                    >
                        {formatTime(domainTime)} on this domain
                    </div>

                    {/* Timer display */}
                    {timeRemaining && (
                        <div
                            style={{
                                fontSize: "12px",
                                fontFamily: "Nunito-Regular",
                                color: timeRemaining.includes("finished")
                                    ? "#28a745"
                                    : "#dc3545",
                                marginTop: "2px",
                                fontWeight: "500",
                            }}
                        >
                            {timeRemaining}
                        </div>
                    )}
                </div>

                <MoreHorizontal
                    size={20}
                    color="#6c757d"
                    style={{ cursor: "pointer", marginTop: "2px" }}
                />
            </div>

            {/* Top Action Buttons Row */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-around",
                    marginBottom: "16px",
                    gap: "8px",
                }}
            >
                <CrossTabSearch>
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            cursor: "pointer",
                            padding: "6px",
                            borderRadius: "10px",
                            transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#e9ecef";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor =
                                "transparent";
                        }}
                    >
                        <Search size={24} color="#28a745" strokeWidth={2} />
                        <span
                            style={{
                                fontSize: "12px",
                                fontFamily: "Nunito-Regular",
                                color: "#2c3e50",
                                fontWeight: "500",
                                marginTop: "4px",
                            }}
                        >
                            Find
                        </span>
                    </div>
                </CrossTabSearch>

                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        cursor: "pointer",
                        padding: "6px",
                        borderRadius: "10px",
                        transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#e9ecef";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                    }}
                >
                    <Bookmark
                        fill="#4dabf7"
                        size={24}
                        color="#0475d1"
                        strokeWidth={2}
                    />
                    <span
                        style={{
                            fontSize: "12px",
                            fontFamily: "Nunito-Regular",
                            color: "#2c3e50",
                            fontWeight: "500",
                            marginTop: "4px",
                        }}
                    >
                        Bookmark
                    </span>
                </div>

                <div
                    onClick={handleScreenshot}
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        cursor: isCapturing ? "not-allowed" : "pointer",
                        padding: "6px",
                        borderRadius: "10px",
                        transition: "all 0.2s ease",
                        opacity: isCapturing ? 0.6 : 1,
                    }}
                    onMouseEnter={(e) => {
                        if (!isCapturing) {
                            e.currentTarget.style.backgroundColor = "#e9ecef";
                        }
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                    }}
                >
                    <Camera size={24} color="#495057" strokeWidth={2} />
                    <span
                        style={{
                            fontSize: "12px",
                            fontFamily: "Nunito-Regular",
                            color: "#2c3e50",
                            fontWeight: "500",
                            marginTop: "4px",
                        }}
                    >
                        Screenshot
                    </span>
                </div>

                <Reminders
                    currentDomain={currentDomain}
                    onTimerSet={(minutes: number) => {
                        const endTime = Date.now() + minutes * 60 * 1000;
                        setActiveTimer({ endTime, minutes });

                        // Store in localStorage for persistence
                        const timerKey = `timer_${currentDomain}`;
                        localStorage.setItem(
                            timerKey,
                            JSON.stringify({ endTime, minutes }),
                        );

                        // Dispatch custom event
                        window.dispatchEvent(
                            new CustomEvent("timerSet", {
                                detail: { domain: currentDomain, minutes },
                            }),
                        );
                    }}
                    onTimerClear={() => {
                        setActiveTimer(null);
                        setTimeRemaining("");

                        // Clear from localStorage
                        const timerKey = `timer_${currentDomain}`;
                        localStorage.removeItem(timerKey);

                        // Dispatch custom event
                        window.dispatchEvent(
                            new CustomEvent("timerClear", {
                                detail: { domain: currentDomain },
                            }),
                        );
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            cursor: "pointer",
                            padding: "6px",
                            borderRadius: "10px",
                            transition: "all 0.2s ease",
                            position: "relative",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#e9ecef";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor =
                                "transparent";
                        }}
                    >
                        <Bell
                            fill={activeTimer ? "#dc3545" : "#ff922b"}
                            size={24}
                            color={activeTimer ? "#dc3545" : "#ff922b"}
                            strokeWidth={2}
                        />
                        {activeTimer && (
                            <div
                                style={{
                                    position: "absolute",
                                    top: "2px",
                                    right: "2px",
                                    width: "6px",
                                    height: "6px",
                                    backgroundColor: "#dc3545",
                                    borderRadius: "50%",
                                    border: "2px solid white",
                                }}
                            />
                        )}
                        <span
                            style={{
                                fontSize: "12px",
                                fontFamily: "Nunito-Regular",
                                color: "#2c3e50",
                                fontWeight: "500",
                                marginTop: "4px",
                            }}
                        >
                            Set reminder
                        </span>
                    </div>
                </Reminders>
            </div>

            {/* Summarize and Add Tab Note Buttons */}
            <div
                style={{
                    display: "flex",
                    gap: "8px",
                    marginBottom: "16px",
                }}
            >
                <button
                    onClick={handleSummarize}
                    disabled={isSummarizing}
                    style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        padding: "12px",
                        backgroundColor: isSummarizing ? "#f8f9fa" : "white",
                        border: `2px solid ${
                            isSummarizing ? "#ccc" : "#e9ecef"
                        }`,
                        borderRadius: "12px",
                        cursor: isSummarizing ? "not-allowed" : "pointer",
                        fontSize: "14px",
                        fontFamily: "Nunito-Regular",
                        fontWeight: "500",
                        color: isSummarizing ? "#6c757d" : "#2c3e50",
                        transition: "all 0.2s ease",
                        opacity: isSummarizing ? 0.7 : 1,
                    }}
                    onMouseEnter={(e) => {
                        if (!isSummarizing) {
                            e.currentTarget.style.borderColor = "#4285f4";
                            e.currentTarget.style.backgroundColor = "#f8f9ff";
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (!isSummarizing) {
                            e.currentTarget.style.borderColor = "#e9ecef";
                            e.currentTarget.style.backgroundColor = "white";
                        }
                    }}
                >
                    {isSummarizing ? (
                        <>
                            <div
                                style={{
                                    width: "16px",
                                    height: "16px",
                                    border: "2px solid #ccc",
                                    borderTop: "2px solid #4285f4",
                                    borderRadius: "50%",
                                    animation: "spin 1s linear infinite",
                                }}
                            />
                            Summarizing...
                        </>
                    ) : (
                        <>
                            <div
                                style={{
                                    display: "flex",
                                    gap: "3px",
                                }}
                            >
                                <div
                                    style={{
                                        width: "6px",
                                        height: "6px",
                                        borderRadius: "50%",
                                        backgroundColor: "#ff6b6b",
                                    }}
                                />
                                <div
                                    style={{
                                        width: "6px",
                                        height: "6px",
                                        borderRadius: "50%",
                                        backgroundColor: "#4285f4",
                                    }}
                                />
                                <div
                                    style={{
                                        width: "6px",
                                        height: "6px",
                                        borderRadius: "50%",
                                        backgroundColor: "#9b59b6",
                                    }}
                                />
                            </div>
                            Summarize
                        </>
                    )}
                </button>

                <button
                    onClick={() => setShowNotepad(true)}
                    style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        padding: "12px",
                        backgroundColor: "white",
                        border: `2px solid ${hasNote ? "#28a745" : "#e9ecef"}`,
                        borderRadius: "12px",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontFamily: "Nunito-Regular",
                        fontWeight: "500",
                        color: "#2c3e50",
                        transition: "all 0.2s ease",
                        position: "relative",
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "#28a745";
                        e.currentTarget.style.backgroundColor = "#f8fff9";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = hasNote
                            ? "#28a745"
                            : "#e9ecef";
                        e.currentTarget.style.backgroundColor = "white";
                    }}
                >
                    <FileText size={16} color="#28a745" />
                    {hasNote ? "View note" : "Add tab note"}
                    {hasNote && (
                        <div
                            style={{
                                position: "absolute",
                                top: "6px",
                                right: "6px",
                                width: "6px",
                                height: "6px",
                                backgroundColor: "#28a745",
                                borderRadius: "50%",
                            }}
                        />
                    )}
                </button>
            </div>

            {/* Open Dashboard Button */}
            <button
                onClick={() => {
                    chrome.tabs.create({
                        url: chrome.runtime.getURL("src/main/main.html"),
                    });
                }}
                style={{
                    width: "100%",
                    padding: "16px",
                    backgroundColor: "#4285f4",
                    border: "none",
                    borderRadius: "16px",
                    color: "white",
                    fontSize: "16px",
                    fontFamily: "Nunito-Bold",
                    fontWeight: "700",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    marginBottom: "16px",
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#3367d6";
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow =
                        "0 6px 16px rgba(66, 133, 244, 0.4)";
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#4285f4";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                }}
            >
                Open dashboard
            </button>

            {/* LyncX Branding */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    marginTop: "auto",
                }}
            >
                <span
                    style={{
                        fontSize: "20px",
                        fontFamily: "Nunito-Bold",
                        fontWeight: "700",
                        color: "#2c3e50",
                    }}
                >
                    lyncX
                </span>
            </div>

            {/* Error Message */}
            {error && (
                <div
                    style={{
                        position: "absolute",
                        bottom: "16px",
                        left: "20px",
                        right: "20px",
                        backgroundColor: "#ff4444",
                        color: "white",
                        padding: "10px 14px",
                        borderRadius: "10px",
                        fontSize: "12px",
                        fontFamily: "Nunito-Regular",
                        boxShadow: "0 4px 12px rgba(255, 68, 68, 0.3)",
                        textAlign: "center",
                        zIndex: 1000,
                    }}
                >
                    {error}
                </div>
            )}

            {/* Add spinning animation for loading */}
            <style>
                {`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}
            </style>
        </div>
    );
};

export default PopupApp;
