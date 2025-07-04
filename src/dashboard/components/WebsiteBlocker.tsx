import React, { useState, useEffect } from "react";
import { websiteBlocker } from "../../data/websiteBlocker";
import type { BlockedSite } from "../../shared/types/common.types";
import UnblockMiniGame from "./UnblockMiniGame";

// Common leisure/social media domains
const LEISURE_DOMAINS = [
    "facebook.com",
    "instagram.com",
    "twitter.com",
    "tiktok.com",
    "reddit.com",
    "youtube.com",
    "netflix.com",
    "twitch.tv",
    "pinterest.com",
    "snapchat.com",
];

// Common work/productivity domains
const WORK_DOMAINS = [
    "github.com",
    "gitlab.com",
    "atlassian.com",
    "jira.com",
    "confluence.com",
    "slack.com",
    "notion.so",
    "trello.com",
    "asana.com",
    "linear.app",
    "figma.com",
    "miro.com",
    "docs.google.com",
    "drive.google.com",
    "calendar.google.com",
    "meet.google.com",
    "mail.google.com", // Gmail
    "outlook.com", // Microsoft Outlook
    "outlook.office.com", // Microsoft 365
    "outlook.live.com", // Microsoft Live
    "yahoo.com", // Yahoo Mail
    "mail.yahoo.com", // Yahoo Mail alternate
    "proton.me", // Proton Mail
    "zoho.com", // Zoho Mail
    "fastmail.com", // FastMail
    "mail.com", // Mail.com
    "aol.com", // AOL Mail
    "icloud.com", // Apple iCloud Mail
];

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

    const handleBlockLeisure = async () => {
        try {
            for (const domain of LEISURE_DOMAINS) {
                await websiteBlocker.blockWebsite(domain, 1); // Block for 1 hour
            }
            await loadBlockedSites();
        } catch (error) {
            console.error("Error blocking leisure sites:", error);
        }
    };

    const handleBlockWork = async () => {
        try {
            for (const domain of WORK_DOMAINS) {
                await websiteBlocker.blockWebsite(domain, 1); // Block for 1 hour
            }
            await loadBlockedSites();
        } catch (error) {
            console.error("Error blocking work sites:", error);
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
            if (selectedDomain === "*") {
                // Delete all blocked sites
                const sites = await websiteBlocker.getBlockedSites();
                for (const site of sites) {
                    await websiteBlocker.unlockWebsite(site.domain);
                }
            } else {
                // Unlock single domain
                await websiteBlocker.unlockWebsite(selectedDomain);
            }
            await loadBlockedSites();
        } catch (err) {
            console.error("Operation failed:", err);
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
        if (site.endTime <= now) {
            return "Expired";
        } else if (site.startTime <= now) {
            return "Active";
        } else if (site.scheduledStartTime) {
            return "Scheduled";
        } else {
            return "Active"; // Fallback for legacy blocks
        }
    };

    return (
        <>
            <style>{`
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
                /* Hide scrollbar for Chrome, Safari and Opera */
                ::-webkit-scrollbar {
                    display: none;
                }
                /* Hide scrollbar for IE, Edge and Firefox */
                * {
                    -ms-overflow-style: none;  /* IE and Edge */
                    scrollbar-width: none;  /* Firefox */
                }
            `}</style>
            <div
                style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    borderRadius: "16px",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    backdropFilter: "blur(10px)",
                    padding: "20px",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                    position: "relative",
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
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                        }}
                    >
                        <h2
                            style={{
                                margin: 0,
                                fontSize: "16px",
                                color: "#ffffff",
                                fontWeight: "600",
                                fontFamily:
                                    "system-ui, -apple-system, sans-serif",
                            }}
                        >
                            Locking In
                        </h2>
                    </div>
                    <div style={{ display: "flex", gap: "6px" }}>
                        <button
                            onClick={handleBlockLeisure}
                            style={{
                                background: "rgba(255, 107, 71, 0.2)",
                                border: "1px solid rgba(255, 107, 71, 0.3)",
                                borderRadius: "6px",
                                padding: "4px 8px",
                                color: "rgba(255, 255, 255, 0.9)",
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                                fontSize: "11px",
                                fontWeight: "500",
                                fontFamily:
                                    "system-ui, -apple-system, sans-serif",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background =
                                    "rgba(255, 107, 71, 0.3)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background =
                                    "rgba(255, 107, 71, 0.2)";
                            }}
                            title="Block leisure sites for 1 hour"
                        >
                            Lock Leisure
                        </button>
                        <button
                            onClick={handleBlockWork}
                            style={{
                                background: "rgba(66, 133, 244, 0.2)",
                                border: "1px solid rgba(66, 133, 244, 0.3)",
                                borderRadius: "6px",
                                padding: "4px 8px",
                                color: "rgba(255, 255, 255, 0.9)",
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                                fontSize: "11px",
                                fontWeight: "500",
                                fontFamily:
                                    "system-ui, -apple-system, sans-serif",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background =
                                    "rgba(66, 133, 244, 0.3)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background =
                                    "transparent";
                            }}
                            title="Block work sites for 1  hour"
                        >
                            Lock Work
                        </button>
                        <button
                            onClick={() => {
                                setSelectedDomain("*");
                                setShowMiniGame(true);
                            }}
                            style={{
                                background: "rgba(255, 68, 68, 0.2)",
                                border: "1px solid rgba(255, 68, 68, 0.3)",
                                borderRadius: "6px",
                                padding: "4px 8px",
                                color: "rgba(255, 255, 255, 0.9)",
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                                fontSize: "11px",
                                fontWeight: "500",
                                fontFamily:
                                    "system-ui, -apple-system, sans-serif",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background =
                                    "rgba(255, 68, 68, 0.3)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background =
                                    "rgba(255, 68, 68, 0.2)";
                            }}
                            title="Delete all blocked sites"
                        >
                            Unlock All
                        </button>
                    </div>
                </div>

                <form onSubmit={handleBlock}>
                    <div
                        style={{
                            padding: "8px 12px",
                            backgroundColor: "rgba(255, 255, 255, 0.05)",
                            borderRadius: "8px",
                            border: "1px solid rgba(255, 255, 255, 0.2)",
                            position: "relative",
                            backdropFilter: "blur(10px)",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                        }}
                    >
                        <input
                            type="text"
                            value={domain}
                            onChange={(e) => setDomain(e.target.value)}
                            placeholder="Domain"
                            style={{
                                width: "40%",
                                padding: "0",
                                border: "none",
                                fontFamily:
                                    "system-ui, -apple-system, sans-serif",
                                fontSize: "14px",
                                outline: "none",
                                backgroundColor: "transparent",
                                color: "#ffffff",
                            }}
                        />
                        <div
                            style={{
                                position: "absolute",
                                right: "50px",
                                display: "flex",
                                gap: "4px",
                                alignItems: "center",
                            }}
                        >
                            <input
                                type="time"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                style={{
                                    width: "85px",
                                    padding: "0",
                                    border: "none",
                                    borderLeft:
                                        "1px solid rgba(255, 255, 255, 0.2)",
                                    paddingLeft: "8px",
                                    fontFamily:
                                        "system-ui, -apple-system, sans-serif",
                                    fontSize: "14px",
                                    outline: "none",
                                    backgroundColor: "transparent",
                                    color: "#ffffff",
                                }}
                            />
                            <input
                                type="time"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                style={{
                                    width: "85px",
                                    padding: "0",
                                    border: "none",
                                    borderLeft:
                                        "1px solid rgba(255, 255, 255, 0.2)",
                                    paddingLeft: "8px",
                                    fontFamily:
                                        "system-ui, -apple-system, sans-serif",
                                    fontSize: "14px",
                                    outline: "none",
                                    backgroundColor: "transparent",
                                    color: "#ffffff",
                                }}
                            />
                        </div>
                        {/* Floating lock button */}
                        <button
                            type="submit"
                            className={`lock-button ${
                                isLocked ? "locked" : ""
                            }`}
                            style={{
                                position: "absolute",
                                right: "8px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                width: "36px",
                                height: "36px",

                                color: "white",
                                border: "none",
                                borderRadius: "8px",
                                cursor: "pointer",
                                transition: "all 0.3s ease",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor =
                                    "#4da3ff";
                                e.currentTarget.style.boxShadow =
                                    "0 6px 16px transparent";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor =
                                    "transparent";
                                e.currentTarget.style.boxShadow =
                                    "0 4px 12px transparent";
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
                <div
                    style={{
                        flex: 1,
                        overflowY: "auto",
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                        marginRight: "-8px",
                        paddingRight: "8px",
                        marginBottom: "16px",
                    }}
                >
                    {blockedSites.length > 0 && (
                        <>
                            <h3
                                style={{
                                    fontFamily:
                                        "system-ui, -apple-system, sans-serif",
                                    fontSize: "14px",
                                    color: "#ffffff",
                                    marginBottom: "8px",
                                    fontWeight: "500",
                                    opacity: 0.7,
                                }}
                            >
                                Active Locks ({blockedSites.length})
                            </h3>
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
                                                ? "rgba(255, 118, 117, 0.1)"
                                                : status === "Scheduled"
                                                ? "rgba(116, 185, 255, 0.1)"
                                                : "rgba(0, 184, 148, 0.1)",
                                            borderRadius: "12px",
                                            marginLeft: "5px",
                                            borderLeft: `4px solid ${
                                                expired
                                                    ? "#ff7675"
                                                    : status === "Scheduled"
                                                    ? "#74b9ff"
                                                    : "#00b894"
                                            }`,
                                            border: "1px solid rgba(255, 255, 255, 0.1)",
                                            backdropFilter: "blur(10px)",
                                        }}
                                    >
                                        <div style={{ flex: 1 }}>
                                            <div
                                                style={{
                                                    fontFamily:
                                                        "system-ui, -apple-system, sans-serif",
                                                    fontSize: "14px",
                                                    color: expired
                                                        ? "#a0a0a0"
                                                        : "#ffffff",
                                                    marginBottom: "4px",
                                                    fontWeight: "600",
                                                }}
                                            >
                                                {site.domain}
                                                <span
                                                    style={{
                                                        marginLeft: "8px",
                                                        fontSize: "12px",
                                                        padding: "2px 6px",
                                                        borderRadius: "6px",
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
                                                        fontWeight: "500",
                                                    }}
                                                >
                                                    {status}
                                                </span>
                                            </div>
                                            {site.timezone && (
                                                <div
                                                    style={{
                                                        fontFamily:
                                                            "system-ui, -apple-system, sans-serif",
                                                        fontSize: "12px",
                                                        color: expired
                                                            ? "#666666"
                                                            : "#a0a0a0",
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
                                                backgroundColor:
                                                    "rgba(255, 255, 255, 0.1)",
                                                color: expired
                                                    ? "#a0a0a0"
                                                    : "#ffffff",
                                                border: `1px solid ${
                                                    expired
                                                        ? "rgba(255, 255, 255, 0.2)"
                                                        : "rgba(255, 255, 255, 0.3)"
                                                }`,
                                                borderRadius: "8px",
                                                fontFamily:
                                                    "system-ui, -apple-system, sans-serif",
                                                fontSize: "12px",
                                                textTransform: "uppercase",
                                                letterSpacing: "0.5px",
                                                cursor: "pointer",
                                                transition: "all 0.2s",
                                                marginTop: "4px",
                                                fontWeight: "500",
                                            }}
                                            onMouseEnter={(e) => {
                                                if (!expired) {
                                                    e.currentTarget.style.backgroundColor =
                                                        "rgba(255, 255, 255, 0.2)";
                                                    e.currentTarget.style.borderColor =
                                                        "rgba(255, 255, 255, 0.5)";
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor =
                                                    "rgba(255, 255, 255, 0.1)";
                                                e.currentTarget.style.borderColor =
                                                    expired
                                                        ? "rgba(255, 255, 255, 0.2)"
                                                        : "rgba(255, 255, 255, 0.3)";
                                            }}
                                        >
                                            {expired ? "Remove" : "Unlock"}
                                        </button>
                                    </div>
                                );
                            })}
                        </>
                    )}
                    {blockedSites.length === 0 && (
                        <div
                            style={{
                                padding: "20px",
                                textAlign: "center",
                                color: "#a0a0a0",
                                fontFamily:
                                    "system-ui, -apple-system, sans-serif",
                                fontSize: "14px",
                                backgroundColor: "rgba(255, 255, 255, 0.05)",
                                borderRadius: "12px",
                                border: "1px solid rgba(255, 255, 255, 0.1)",
                                backdropFilter: "blur(10px)",
                            }}
                        >
                            No websites currently locked
                        </div>
                    )}
                </div>
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
