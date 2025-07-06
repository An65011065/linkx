import React, { useState, useEffect } from "react";
import { websiteBlocker } from "../../../data/websiteBlocker";
import type { BlockedSite } from "../../../shared/types/common.types";
import UnblockMiniGame from "../UnblockMiniGame";

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

            // Calculate hours difference
            let hoursDiff = (endMinutes - startMinutes) / 60;

            // Handle next day scenario (e.g., 23:00 to 01:00)
            if (hoursDiff <= 0) {
                hoursDiff += 24;
            }

            // Block the website for the calculated hours
            await websiteBlocker.blockWebsite(cleanDomain, hoursDiff);
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
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-5 h-full flex flex-col gap-4 relative">
                <div className="flex items-center justify-between mb-1">
                    <h2 className="text-lg font-medium text-black">
                        Locking In
                    </h2>
                    <div className="flex gap-2">
                        <button
                            onClick={handleBlockLeisure}
                            className="bg-red-100 hover:bg-red-200 border border-red-200 rounded-lg px-2 py-1 text-red-700 cursor-pointer transition-all duration-200 text-xs font-medium"
                            title="Block leisure sites for 1 hour"
                        >
                            Lock Leisure
                        </button>
                        <button
                            onClick={handleBlockWork}
                            className="bg-blue-100 hover:bg-blue-200 border border-blue-200 rounded-lg px-2 py-1 text-blue-700 cursor-pointer transition-all duration-200 text-xs font-medium"
                            title="Block work sites for 1 hour"
                        >
                            Lock Work
                        </button>
                        <button
                            onClick={() => {
                                setSelectedDomain("*");
                                setShowMiniGame(true);
                            }}
                            className="bg-red-100 hover:bg-red-200 border border-red-200 rounded-lg px-2 py-1 text-red-700 cursor-pointer transition-all duration-200 text-xs font-medium"
                            title="Delete all blocked sites"
                        >
                            Unlock All
                        </button>
                    </div>
                </div>

                <form onSubmit={handleBlock}>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 relative flex items-center gap-2">
                        <input
                            type="text"
                            value={domain}
                            onChange={(e) => setDomain(e.target.value)}
                            placeholder="Domain"
                            className="w-2/5 p-0 border-none text-sm outline-none bg-transparent text-black placeholder-gray-500"
                        />
                        <div className="absolute right-12 flex gap-1 items-center">
                            <input
                                type="time"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                className="w-20 p-0 border-none border-l border-gray-200 pl-2 text-sm outline-none bg-transparent text-black"
                            />
                            <input
                                type="time"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                className="w-20 p-0 border-none border-l border-gray-200 pl-2 text-sm outline-none bg-transparent text-black"
                            />
                        </div>
                        <button
                            type="submit"
                            className={`lock-button ${
                                isLocked ? "locked" : ""
                            } absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 text-gray-600 hover:text-blue-600 hover:bg-blue-50 border-none rounded-lg cursor-pointer transition-all duration-300 flex items-center justify-center`}
                        >
                            <svg
                                className={`lock-icon ${
                                    isLocked ? "locked" : ""
                                }`}
                                width="16"
                                height="16"
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

                <div className="flex-1 overflow-y-auto flex flex-col gap-3 -mr-2 pr-2">
                    {blockedSites.length > 0 && (
                        <>
                            <h3 className="text-sm font-medium text-gray-600 mb-2">
                                Active Locks ({blockedSites.length})
                            </h3>
                            {blockedSites.map((site) => {
                                const expired = isExpired(site.endTime);
                                const status = getBlockStatus(site);
                                return (
                                    <div
                                        key={site.domain}
                                        className={`flex justify-between items-start p-3 rounded-lg border-l-4 border ${
                                            expired
                                                ? "bg-red-50 border-red-400 border-red-100"
                                                : status === "Scheduled"
                                                ? "bg-blue-50 border-blue-400 border-blue-100"
                                                : "bg-green-50 border-green-400 border-green-100"
                                        }`}
                                    >
                                        <div className="flex-1">
                                            <div className="text-sm font-semibold text-black mb-1">
                                                {site.domain}
                                                <span
                                                    className={`ml-2 text-xs px-2 py-1 rounded font-medium text-white uppercase tracking-wide ${
                                                        expired
                                                            ? "bg-red-500"
                                                            : status ===
                                                              "Scheduled"
                                                            ? "bg-blue-500"
                                                            : "bg-green-500"
                                                    }`}
                                                >
                                                    {status}
                                                </span>
                                            </div>
                                            {site.timezone && (
                                                <div
                                                    className={`text-xs ${
                                                        expired
                                                            ? "text-gray-500"
                                                            : "text-gray-600"
                                                    } leading-relaxed`}
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
                                            className={`px-3 py-1 rounded-lg text-xs font-medium uppercase tracking-wide transition-all duration-200 ${
                                                expired
                                                    ? "bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200"
                                                    : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                                            }`}
                                        >
                                            {expired ? "Remove" : "Unlock"}
                                        </button>
                                    </div>
                                );
                            })}
                        </>
                    )}
                    {blockedSites.length === 0 && (
                        <div className="p-5 text-center text-gray-500 text-sm bg-gray-50 rounded-lg border border-gray-100">
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
