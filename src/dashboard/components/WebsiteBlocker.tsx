import React, { useState, useEffect } from "react";
import { websiteBlocker } from "../../data/websiteBlocker";
import type { BlockedSite } from "../../shared/types/common.types";
import UnblockMiniGame from "./UnblockMiniGame";

const WebsiteBlocker: React.FC = () => {
    const [domain, setDomain] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [blockedSites, setBlockedSites] = useState<BlockedSite[]>([]);
    const [showMiniGame, setShowMiniGame] = useState(false);
    const [selectedDomain, setSelectedDomain] = useState<string>("");
    const [isLocked, setIsLocked] = useState(false);
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    useEffect(() => {
        loadBlockedSites();
        const interval = setInterval(loadBlockedSites, 60000);

        // Set default values
        const now = new Date();
        const later = new Date(now.getTime() + 60 * 60 * 1000);

        setStartTime(now.toTimeString().slice(0, 5));
        setEndTime(later.toTimeString().slice(0, 5));

        return () => clearInterval(interval);
    }, []);

    const loadBlockedSites = async () => {
        try {
            const sites = await websiteBlocker.getBlockedSites();
            setBlockedSites(sites);
        } catch (err) {
            console.error("Error loading blocked sites:", err);
        }
    };

    const handleBlock = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!domain.trim() || !startTime || !endTime) return;

        setIsLocked(true); // Start animation

        try {
            const cleanDomain = domain
                .replace(/^(https?:\/\/)?(www\.)?/, "")
                .split("/")[0];

            // Validate time range
            const startMinutes =
                parseInt(startTime.split(":")[0]) * 60 +
                parseInt(startTime.split(":")[1]);
            const endMinutes =
                parseInt(endTime.split(":")[0]) * 60 +
                parseInt(endTime.split(":")[1]);

            if (startMinutes === endMinutes) {
                alert("Start and end times cannot be the same");
                setIsLocked(false);
                return;
            }

            const today = new Date().toISOString().split("T")[0];

            await websiteBlocker.blockWebsite(
                cleanDomain,
                startTime,
                endTime,
                timezone,
                today,
            );
            await loadBlockedSites();
            setDomain("");

            // Reset lock state after successful block
            setTimeout(() => {
                setIsLocked(false);
            }, 1000);
        } catch (err) {
            console.error("Block failed:", err);
            alert(
                `Failed to block website: ${
                    err instanceof Error ? err.message : "Unknown error"
                }`,
            );
            setIsLocked(false);
        }
    };

    const handleUnblock = async (domain: string) => {
        try {
            await websiteBlocker.unlockWebsite(domain);
            await loadBlockedSites();
        } catch (err) {
            console.error("Unlock failed:", err);
        }
    };

    const handleUnblockClick = (domain: string) => {
        setSelectedDomain(domain);
        setShowMiniGame(true);
    };

    const handleMiniGameSuccess = async () => {
        try {
            await websiteBlocker.unlockWebsite(selectedDomain);
            await loadBlockedSites();
        } catch (err) {
            console.error("Unlock failed:", err);
        } finally {
            setShowMiniGame(false);
            setSelectedDomain("");
        }
    };

    const handleMiniGameCancel = () => {
        setShowMiniGame(false);
        setSelectedDomain("");
    };

    const formatScheduledTime = (site: BlockedSite): string => {
        if (!site.timezone) return "Unknown timezone";

        const startFormatted = new Date(site.startTime).toLocaleString(
            "en-US",
            {
                weekday: "short",
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
                timeZone: site.timezone,
            },
        );

        const endFormatted = new Date(site.endTime).toLocaleString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
            timeZone: site.timezone,
        });

        return `${startFormatted} - ${endFormatted}`;
    };

    const isExpired = (endTime: number): boolean => {
        return endTime - Date.now() <= 0;
    };

    const getBlockStatus = (site: BlockedSite): string => {
        const now = Date.now();

        if (site.scheduledStartTime && site.scheduledStartTime > now) {
            return "Scheduled";
        } else if (site.endTime <= now) {
            return "Expired";
        } else {
            return "Active";
        }
    };

    return (
        <>
            <style>{`
                @font-face {
                    font-family: 'Nunito-Regular';
                    src: url('${chrome.runtime.getURL(
                        "src/assets/fonts/Nunito-Regular.ttf",
                    )}') format('truetype');
                    font-weight: 400;
                    font-style: normal;
                }
                @font-face {
                    font-family: 'Nunito-Bold';
                    src: url('${chrome.runtime.getURL(
                        "src/assets/fonts/Nunito-Bold.ttf",
                    )}') format('truetype');
                    font-weight: 700;
                    font-style: normal;
                }

                @keyframes lockRotate {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(10deg); }
                }

                .lock-button {
                    transition: all 0.3s ease;
                }

                .lock-button:hover {
                    transform: scale(1.1);
                }

                .lock-button.locked {
                    animation: lockRotate 0.3s ease;
                }

                .lock-icon {
                    transition: all 0.3s ease;
                }

                .lock-icon.locked {
                    transform: scale(0.9);
                }

                input[type="time"]::-webkit-calendar-picker-indicator {
                    background: none;
                    display: none;
                }
            `}</style>
            <div
                style={{
                    margin: "0 24px",
                    width: "calc(50% - 48px)",
                    minWidth: "400px",
                    position: "relative",
                    top: "-35px",
                }}
            >
                <h2
                    style={{
                        fontFamily: "Nunito-Bold, Arial, sans-serif",
                        fontSize: "24px",
                        color: "#2d3436",
                        marginBottom: "24px",
                    }}
                >
                    Locking In
                </h2>

                <form onSubmit={handleBlock} style={{ marginBottom: "16px" }}>
                    <div
                        style={{
                            padding: "16px",
                            backgroundColor: "#f8f9fa",
                            borderRadius: "8px",
                            borderLeft: "4px solid #d63031",
                            position: "relative",
                        }}
                    >
                        <div
                            style={{
                                position: "relative",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                            }}
                        >
                            <input
                                type="text"
                                value={domain}
                                onChange={(e) => setDomain(e.target.value)}
                                placeholder="Enter domain to block..."
                                style={{
                                    width: "100%",
                                    padding: "12px",
                                    paddingRight: "180px", // Reduced space for time inputs
                                    border: "1px solid #ddd",
                                    borderRadius: "6px",
                                    fontFamily:
                                        "Nunito-Regular, Arial, sans-serif",
                                    fontSize: "14px",
                                    outline: "none",
                                    boxSizing: "border-box",
                                }}
                            />
                            <div
                                style={{
                                    position: "absolute",
                                    right: "12px",
                                    display: "flex",
                                    gap: "4px", // Reduced gap between time inputs
                                    alignItems: "center",
                                }}
                            >
                                <input
                                    type="time"
                                    value={startTime}
                                    onChange={(e) =>
                                        setStartTime(e.target.value)
                                    }
                                    style={{
                                        width: "85px", // Reduced width
                                        padding: "8px",
                                        border: "none",
                                        borderLeft: "1px solid #ddd",
                                        fontFamily:
                                            "Nunito-Regular, Arial, sans-serif",
                                        fontSize: "14px",
                                        outline: "none",
                                        backgroundColor: "transparent",
                                    }}
                                />
                                <input
                                    type="time"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                    style={{
                                        width: "85px", // Reduced width
                                        padding: "8px",
                                        border: "none",
                                        borderLeft: "1px solid #ddd",
                                        fontFamily:
                                            "Nunito-Regular, Arial, sans-serif",
                                        fontSize: "14px",
                                        outline: "none",
                                        backgroundColor: "transparent",
                                    }}
                                />
                            </div>
                        </div>

                        {/* Floating lock button */}
                        <button
                            type="submit"
                            className={`lock-button ${
                                isLocked ? "locked" : ""
                            }`}
                            style={{
                                position: "absolute",
                                right: "-20px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                width: "42px",
                                height: "36px",
                                backgroundColor: "#d63031",
                                color: "white",
                                border: "none",
                                borderRadius: "6px",
                                cursor: "pointer",
                                transition: "all 0.3s ease",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                boxShadow: "0 2px 8px rgba(214, 48, 49, 0.2)",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor =
                                    "#b32e2f";
                                e.currentTarget.style.boxShadow =
                                    "0 4px 12px rgba(214, 48, 49, 0.3)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor =
                                    "#d63031";
                                e.currentTarget.style.boxShadow =
                                    "0 2px 8px rgba(214, 48, 49, 0.2)";
                            }}
                        >
                            <svg
                                className={`lock-icon ${
                                    isLocked ? "locked" : ""
                                }`}
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                {isLocked ? (
                                    <>
                                        <rect
                                            x="3"
                                            y="11"
                                            width="18"
                                            height="11"
                                            rx="2"
                                            ry="2"
                                        />
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                    </>
                                ) : (
                                    <>
                                        <rect
                                            x="3"
                                            y="11"
                                            width="18"
                                            height="11"
                                            rx="2"
                                            ry="2"
                                        />
                                        <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                                    </>
                                )}
                            </svg>
                        </button>
                    </div>
                </form>

                {/* Blocked sites list */}
                {blockedSites.length > 0 && (
                    <>
                        <h3
                            style={{
                                fontFamily: "Nunito-Bold, Arial, sans-serif",
                                fontSize: "16px",
                                color: "#2d3436",
                                marginBottom: "8px",
                            }}
                        >
                            Active Locks ({blockedSites.length})
                        </h3>
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "8px",
                                maxHeight: "400px",
                                overflowY: "auto",
                            }}
                        >
                            {blockedSites.map((site) => {
                                const expired = isExpired(site.endTime);
                                const status = getBlockStatus(site);

                                return (
                                    <div
                                        key={site.domain}
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "flex-start",
                                            padding: "12px",
                                            backgroundColor: expired
                                                ? "#fff5f5"
                                                : status === "Scheduled"
                                                ? "#f0f8ff"
                                                : "#f8f9fa",
                                            borderRadius: "8px",
                                            marginLeft: "5px",
                                            borderLeft: `4px solid ${
                                                expired
                                                    ? "#ff7675"
                                                    : status === "Scheduled"
                                                    ? "#74b9ff"
                                                    : "#00b894"
                                            }`,
                                        }}
                                    >
                                        <div style={{ flex: 1 }}>
                                            <div
                                                style={{
                                                    fontFamily:
                                                        "Nunito-Bold, Arial, sans-serif",
                                                    fontSize: "16px",
                                                    color: expired
                                                        ? "#a0a0a0"
                                                        : "#2d3436",
                                                    marginBottom: "4px",
                                                }}
                                            >
                                                {site.domain}
                                                <span
                                                    style={{
                                                        marginLeft: "8px",
                                                        fontSize: "12px",
                                                        padding: "2px 6px",
                                                        borderRadius: "4px",
                                                        backgroundColor: expired
                                                            ? "#ff7675"
                                                            : status ===
                                                              "Scheduled"
                                                            ? "#74b9ff"
                                                            : "#00b894",
                                                        color: "white",
                                                        textTransform:
                                                            "uppercase",
                                                        letterSpacing: "0.5px",
                                                    }}
                                                >
                                                    {status}
                                                </span>
                                            </div>

                                            {site.timezone && (
                                                <div
                                                    style={{
                                                        fontFamily:
                                                            "Nunito-Regular, Arial, sans-serif",
                                                        fontSize: "12px",
                                                        color: expired
                                                            ? "#a0a0a0"
                                                            : "#9b9b9b",
                                                        lineHeight: "1.3",
                                                    }}
                                                >
                                                    {formatScheduledTime(site)}
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            onClick={() =>
                                                expired
                                                    ? handleUnblock(site.domain)
                                                    : handleUnblockClick(
                                                          site.domain,
                                                      )
                                            }
                                            style={{
                                                padding: "6px 12px",
                                                backgroundColor: "transparent",
                                                color: expired
                                                    ? "#a0a0a0"
                                                    : "#636e72",
                                                border: `1px solid ${
                                                    expired ? "#e0e0e0" : "#ddd"
                                                }`,
                                                borderRadius: "6px",
                                                fontFamily:
                                                    "Nunito-Regular, Arial, sans-serif",
                                                fontSize: "12px",
                                                textTransform: "uppercase",
                                                letterSpacing: "0.5px",
                                                cursor: "pointer",
                                                transition: "all 0.2s",
                                                marginTop: "4px",
                                            }}
                                            onMouseEnter={(e) => {
                                                if (!expired) {
                                                    e.currentTarget.style.backgroundColor =
                                                        "#f0f0f0";
                                                    e.currentTarget.style.color =
                                                        "#2d3436";
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor =
                                                    "transparent";
                                                e.currentTarget.style.color =
                                                    expired
                                                        ? "#a0a0a0"
                                                        : "#636e72";
                                            }}
                                        >
                                            {expired ? "Remove" : "Unlock"}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}

                {blockedSites.length === 0 && (
                    <div
                        style={{
                            padding: "20px",
                            textAlign: "center",
                            color: "#636e72",
                            fontFamily: "Nunito-Regular, Arial, sans-serif",
                            fontSize: "14px",
                            backgroundColor: "#f8f9fa",
                            borderRadius: "8px",
                        }}
                    >
                        No websites currently locked
                    </div>
                )}
            </div>

            {showMiniGame && (
                <UnblockMiniGame
                    onSuccess={handleMiniGameSuccess}
                    onCancel={handleMiniGameCancel}
                />
            )}
        </>
    );
};

export default WebsiteBlocker;
