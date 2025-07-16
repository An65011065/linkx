import React, { useState, useEffect } from "react";
import { Camera, FileText, Bell, MoreHorizontal, Search } from "lucide-react";
import { ScreenshotService } from "../../services/screenshotService";
import DataService from "../../data/dataService";
import AuthService from "../../services/authService";
import type { AuthUser } from "../../services/authService";
import Reminders from "./Reminders";
import NotepadView from "./NotepadView";
import CrossTabSearch from "./CrosstabSearch";
import ConsolidateTabs from "../../dashboard/components/ConsolidateTabs";
import "../../shared/styles/fonts.css";
import BookmarkButton from "./Mark";
import SummarizeView from "./SummarizeView";

interface Note {
    id?: string;
    domain: string;
    content: string;
    lastModified: number;
    createdAt: number;
}

interface MainContentProps {
    user: AuthUser | null;
    onSignOut: () => Promise<void>;
}

const MainContent: React.FC<MainContentProps> = () => {
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

    // Simplified summary states
    const [showSummary, setShowSummary] = useState(false);
    const [summaryType, setSummaryType] = useState<"page" | "selection">(
        "page",
    );

    // Context menu listener for selection summaries and check for pending summarize
    useEffect(() => {
        // Check for pending summarize text
        const checkPendingSummarize = async () => {
            const result = await chrome.storage.local.get([
                "pendingSummarizeText",
                "pendingSummarizeType",
            ]);

            if (result.pendingSummarizeText) {
                console.log("📄 Found pending text to summarize");
                setSummaryType(result.pendingSummarizeType || "selection");
                setShowSummary(true);
                // Clear the pending text
                await chrome.storage.local.remove([
                    "pendingSummarizeText",
                    "pendingSummarizeType",
                ]);
            }
        };

        // Check on mount
        checkPendingSummarize();

        // Also listen for runtime messages
        const handleMessage = (message: { action: string }) => {
            if (message.action === "summarize-selection") {
                console.log(
                    "📄 MainContent: Opening summary view for selection",
                );
                setSummaryType("selection");
                setShowSummary(true);
            }
        };

        chrome.runtime.onMessage.addListener(handleMessage);

        return () => {
            chrome.runtime.onMessage.removeListener(handleMessage);
        };
    }, []);

    // Simple summarize handler
    const handleSummarize = () => {
        setSummaryType("page");
        setShowSummary(true);
    };

    // Backend integration
    const authService = AuthService.getInstance();

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

    // Check if domain has a note (now using backend)
    useEffect(() => {
        const checkForNote = async () => {
            if (!currentDomain) return;
            try {
                const note = await handleLoadNote(currentDomain);
                setHasNote(note?.content?.trim().length ? note.content.trim().length > 0 : false);
            } catch (err) {
                console.error("Error checking for note:", err);
                setHasNote(false);
            }
        };
        if (currentDomain) {
            checkForNote();
        }
    }, [currentDomain]);

    // ✅ ADD: Periodic refresh to check for notes updated by context menu
    useEffect(() => {
        if (!currentDomain) return;

        const refreshNoteStatus = async () => {
            try {
                const note = await handleLoadNote(currentDomain);
                setHasNote(note?.content?.trim().length ? note.content.trim().length > 0 : false);
            } catch (err) {
                console.error("Error refreshing note status:", err);
            }
        };

        // Check for note updates every 5 seconds when popup is open
        const interval = setInterval(refreshNoteStatus, 5000);

        return () => clearInterval(interval);
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

    // Backend note management functions
    const handleSaveNote = async (
        domain: string,
        content: string,
    ): Promise<void> => {
        try {
            const response = await authService.makeApiCall("POST", "/notes", {
                domain,
                content,
            });
            if (response.ok) {
                console.log(`✅ Note saved for ${domain}`);
                // Update hasNote state
                setHasNote(content.trim().length > 0);
            } else {
                const errorData = await response.json();
                console.error("Failed to save note:", errorData.error);
                throw new Error(errorData.error || "Failed to save note");
            }
        } catch (err) {
            console.error("Error saving note:", err);
            throw err;
        }
    };

    const handleLoadNote = async (domain: string): Promise<Note | null> => {
        try {
            console.log(`🔍 Loading note for domain: ${domain}`);
            const response = await authService.makeApiCall(
                "GET",
                `/notes/${encodeURIComponent(domain)}`,
            );
            if (response.ok) {
                const noteData = await response.json();
                console.log(`✅ Loaded note from backend for ${domain}`);
                return {
                    id: noteData.id,
                    domain: noteData.domain,
                    content: noteData.content,
                    lastModified: new Date(noteData.lastModified).getTime(),
                    createdAt: new Date(noteData.createdAt).getTime(),
                };
            } else if (response.status === 404) {
                // No note exists for this domain yet
                console.log(`📝 No existing note for ${domain}`);
                return null;
            } else {
                throw new Error(`Failed to load note: ${response.status}`);
            }
        } catch (err) {
            console.error(`❌ Error loading note for ${domain}:`, err);
            throw err;
        }
    };

    const handleNoteUpdated = () => {
        // Refresh note status when note is updated
        setTimeout(async () => {
            try {
                const note = await handleLoadNote(currentDomain);
                setHasNote(Boolean(note?.content.trim().length > 0));
            } catch (err) {
                console.error("Error refreshing note status:", err);
            }
        }, 100);
    };

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

    // Format domain name for display
    const formatDomainName = (domain: string): string => {
        if (!domain) return "";

        // Check if it's the extension's dashboard URL or extension ID
        if (
            domain === chrome.runtime.id ||
            domain.includes("chrome-extension")
        ) {
            return "LyncX";
        }

        // Remove common extensions
        const withoutExtension = domain
            .replace(/\.(com|org|net|edu|gov|co\.uk|co\.in|io|app|dev)$/i, "")
            .replace(/^www\./, "");
        // Capitalize first letter
        return (
            withoutExtension.charAt(0).toUpperCase() + withoutExtension.slice(1)
        );
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

    const handleNotepadClose = () => {
        setShowNotepad(false);
        handleNoteUpdated();
    };

    // Show SummarizeView if summary is requested
    if (showSummary) {
        return (
            <SummarizeView
                onBack={() => setShowSummary(false)}
                initialType={summaryType}
            />
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
                    onSaveNote={handleSaveNote}
                    onLoadNote={handleLoadNote}
                    onNoteUpdated={handleNoteUpdated}
                />
            </div>
        );
    }

    return (
        <div
            style={{
                width: "340px",
                height: "330px",
                padding: "16px",
                fontFamily: "system-ui, -apple-system, sans-serif",
                background: "rgba(255, 255, 255, 0.7)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                borderRadius: "16px",
                border: "1px solid rgba(255, 255, 255, 0.18)",
                boxShadow: "0 8px 32px rgba(31, 38, 135, 0.1)",
                position: "relative",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
            }}
        >
            {/* Header with time and menu */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                }}
            >
                <div style={{ textAlign: "center", flex: 1 }}>
                    <div
                        style={{
                            fontSize: "18px",
                            fontWeight: "600",
                            color: "#2c3e50",
                        }}
                    >
                        {formatTime(domainTime)} on{" "}
                        {formatDomainName(currentDomain)}
                    </div>
                    {/* Timer display */}
                    {timeRemaining && (
                        <div
                            style={{
                                fontSize: "12px",
                                color: timeRemaining.includes("finished")
                                    ? "#28a745"
                                    : "#dc3545",
                                marginTop: "2px",
                            }}
                        >
                            {timeRemaining}
                        </div>
                    )}
                </div>
                <MoreHorizontal
                    size={18}
                    color="#6c757d"
                    style={{ cursor: "pointer" }}
                />
            </div>

            {/* Top Action Buttons Row */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(5, 1fr)",
                    gap: "8px",
                    width: "100%",
                    marginBottom: "4px",
                }}
            >
                <BookmarkButton />
                <CrossTabSearch>
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            padding: "4px",
                            borderRadius: "8px",
                            transition: "all 0.2s ease",
                            height: "100%",
                        }}
                    >
                        <Search size={20} color="#28a745" strokeWidth={2} />
                        <span
                            style={{
                                fontSize: "11px",
                                color: "#2c3e50",
                                marginTop: "4px",
                                whiteSpace: "nowrap",
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
                        justifyContent: "center",
                        height: "100%",
                    }}
                >
                    <ConsolidateTabs
                        shouldConsolidate={true}
                        className="flex flex-col items-center cursor-pointer p-1 rounded-lg transition-all duration-200 ease-in-out"
                    >
                        <span
                            style={{
                                fontSize: "11px",
                                color: "#2c3e50",
                                marginTop: "4px",
                                whiteSpace: "nowrap",
                            }}
                        >
                            Consolidate
                        </span>
                    </ConsolidateTabs>
                </div>
                <div
                    onClick={handleScreenshot}
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: isCapturing ? "not-allowed" : "pointer",
                        padding: "4px",
                        borderRadius: "8px",
                        transition: "all 0.2s ease",
                        opacity: isCapturing ? 0.6 : 1,
                        height: "100%",
                    }}
                >
                    <Camera size={20} color="#495057" strokeWidth={2} />
                    <span
                        style={{
                            fontSize: "11px",
                            color: "#2c3e50",
                            marginTop: "4px",
                            whiteSpace: "nowrap",
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
                        const timerKey = `timer_${currentDomain}`;
                        localStorage.setItem(
                            timerKey,
                            JSON.stringify({ endTime, minutes }),
                        );
                        window.dispatchEvent(
                            new CustomEvent("timerSet", {
                                detail: { domain: currentDomain, minutes },
                            }),
                        );
                    }}
                    onTimerClear={() => {
                        setActiveTimer(null);
                        setTimeRemaining("");
                        const timerKey = `timer_${currentDomain}`;
                        localStorage.removeItem(timerKey);
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
                            justifyContent: "center",
                            cursor: "pointer",
                            padding: "4px",
                            borderRadius: "8px",
                            transition: "all 0.2s ease",
                            position: "relative",
                            height: "100%",
                        }}
                    >
                        <Bell
                            fill={activeTimer ? "#dc3545" : "#ff922b"}
                            size={20}
                            color={activeTimer ? "#dc3545" : "#ff922b"}
                            strokeWidth={2}
                        />
                        {activeTimer && (
                            <div
                                style={{
                                    position: "absolute",
                                    top: "0",
                                    right: "0",
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
                                fontSize: "11px",
                                color: "#2c3e50",
                                marginTop: "4px",
                                whiteSpace: "nowrap",
                            }}
                        >
                            Timers
                        </span>
                    </div>
                </Reminders>
            </div>

            {/* Summarize and Add Tab Note Buttons */}
            <div
                style={{
                    display: "flex",
                    gap: "8px",
                }}
            >
                <button
                    onClick={handleSummarize}
                    style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        padding: "10px",
                        border: "1px solid rgba(66, 133, 244, 0.2)",
                        borderRadius: "10px",
                        cursor: "pointer",
                        fontSize: "13px",
                        color: "#2c3e50",
                        transition: "all 0.2s ease",
                        background: "transparent",
                    }}
                >
                    <div style={{ display: "flex", gap: "3px" }}>
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
                </button>
                <button
                    onClick={() => setShowNotepad(true)}
                    style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        padding: "10px",
                        border: `1px solid ${
                            hasNote
                                ? "rgba(40, 167, 69, 0.2)"
                                : "rgba(0, 0, 0, 0.1)"
                        }`,
                        borderRadius: "10px",
                        cursor: "pointer",
                        fontSize: "13px",
                        color: "#2c3e50",
                        transition: "all 0.2s ease",
                        background: "transparent",
                        position: "relative",
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
                    padding: "12px",
                    border: "1px solid rgba(66, 133, 244, 0.2)",
                    borderRadius: "12px",
                    color: "#4285f4",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    background: "transparent",
                    marginTop: "auto",
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
                    marginTop: "4px",
                }}
            >
                <span
                    style={{
                        fontSize: "16px",
                        fontWeight: "600",
                        color: "#2c3e50",
                    }}
                >
                    LyncX
                </span>
            </div>

            {/* Error Message */}
            {error && (
                <div
                    style={{
                        position: "absolute",
                        bottom: "16px",
                        left: "16px",
                        right: "16px",
                        backgroundColor: "rgba(220, 53, 69, 0.1)",
                        color: "#dc3545",
                        padding: "8px 12px",
                        borderRadius: "8px",
                        fontSize: "12px",
                        textAlign: "center",
                        zIndex: 1000,
                    }}
                >
                    {error}
                </div>
            )}
        </div>
    );
};

export default MainContent;
