import React, { useState, useEffect } from "react";
import { Lock } from "lucide-react";
import { websiteBlocker } from "../../data/websiteBlocker";
import type { BlockedSite } from "../../shared/types/common.types";
import UnblockMiniGame from "./UnblockMiniGame";
import { freeTrial } from "../../main/MainTab";

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
    "mail.google.com",
    "outlook.com",
    "outlook.office.com",
    "outlook.live.com",
    "yahoo.com",
    "mail.yahoo.com",
    "proton.me",
    "zoho.com",
    "fastmail.com",
    "mail.com",
    "aol.com",
    "icloud.com",
];

interface WebsiteBlockerProps {
    isDarkMode?: boolean;
}

const WebsiteBlocker: React.FC<WebsiteBlockerProps> = ({
    isDarkMode = false,
}) => {
    const [domain, setDomain] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [blockedSites, setBlockedSites] = useState<BlockedSite[]>([]);
    const [showMiniGame, setShowMiniGame] = useState(false);
    const [selectedDomain, setSelectedDomain] = useState<string>("");
    const [isLocked, setIsLocked] = useState(false);
    const [isTrialMode, setIsTrialMode] = useState(freeTrial);
    const [overriddenDomains, setOverriddenDomains] = useState<Set<string>>(
        new Set(),
    );

    useEffect(() => {
        const checkTrialStatus = () => {
            setIsTrialMode(freeTrial);
        };

        // Check immediately
        checkTrialStatus();

        // Set up an interval to check frequently
        const interval = setInterval(checkTrialStatus, 100);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        loadBlockedSites();
        // Check less frequently since we're using session storage
        const interval = setInterval(loadBlockedSites, 2000); // Every 2 seconds
        const now = new Date();
        const later = new Date(now.getTime() + 60 * 60 * 1000);
        setStartTime(now.toTimeString().slice(0, 5));
        setEndTime(later.toTimeString().slice(0, 5));

        // Listen for session storage changes
        const handleStorageChange = (changes: {
            [key: string]: chrome.storage.StorageChange;
        }) => {
            const hasOverrideChange = Object.keys(changes).some((key) =>
                key.startsWith("override_"),
            );
            if (hasOverrideChange) {
                loadBlockedSites();
            }
        };

        chrome.storage.session.onChanged.addListener(handleStorageChange);

        return () => {
            clearInterval(interval);
            chrome.storage.session.onChanged.removeListener(
                handleStorageChange,
            );
        };
    }, []);

    const loadBlockedSites = async () => {
        try {
            const sites = await websiteBlocker.getBlockedSites();
            const newOverrides = new Set<string>();

            // Check override status for all sites in parallel
            await Promise.all(
                sites.map(async (site) => {
                    if (
                        await websiteBlocker.isTemporarilyOverridden(
                            site.domain,
                        )
                    ) {
                        newOverrides.add(site.domain);
                    }
                }),
            );

            setBlockedSites(sites);
            setOverriddenDomains(newOverrides);
        } catch (err) {
            console.error("Error loading blocked sites:", err);
        }
    };

    const handleBlockLeisure = async () => {
        if (freeTrial) {
            alert(
                "Free trial allows blocking only 2 websites at a time. Please block sites individually.",
            );
            return;
        }
        try {
            for (const domain of LEISURE_DOMAINS) {
                await websiteBlocker.blockWebsite(domain, 1);
            }
            await loadBlockedSites();
        } catch (error) {
            console.error("Error blocking leisure sites:", error);
        }
    };

    const handleBlockWork = async () => {
        if (freeTrial) {
            alert(
                "Free trial allows blocking only 2 websites at a time. Please block sites individually.",
            );
            return;
        }
        try {
            for (const domain of WORK_DOMAINS) {
                await websiteBlocker.blockWebsite(domain, 1);
            }
            await loadBlockedSites();
        } catch (error) {
            console.error("Error blocking work sites:", error);
        }
    };

    const handleBlock = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!domain.trim() || !startTime || !endTime) return;

        if (freeTrial && blockedSites.length >= 2) {
            alert(
                "Free trial allows blocking only 2 websites at a time. Please unlock a website before blocking a new one.",
            );
            return;
        }

        setIsLocked(true);
        try {
            const cleanDomain = domain
                .replace(/^(https?:\/\/)?(www\.)?/, "")
                .split("/")[0];

            // Check if domain is already blocked
            if (blockedSites.some((site) => site.domain === cleanDomain)) {
                alert("This website is already blocked.");
                setIsLocked(false);
                return;
            }

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

            let hoursDiff = (endMinutes - startMinutes) / 60;
            if (hoursDiff <= 0) {
                hoursDiff += 24;
            }

            await websiteBlocker.blockWebsite(cleanDomain, hoursDiff);
            await loadBlockedSites();
            setDomain("");
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
                const sites = await websiteBlocker.getBlockedSites();
                for (const site of sites) {
                    await websiteBlocker.unlockWebsite(site.domain);
                }
            } else {
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

        // Check if temporarily overridden first
        if (overriddenDomains.has(site.domain)) {
            return "Overridden";
        }

        if (site.endTime <= now) {
            return "Expired";
        } else if (site.startTime <= now) {
            return "Active";
        } else if (site.scheduledStartTime) {
            return "Scheduled";
        } else {
            return "Active";
        }
    };

    const containerClasses = `${
        isDarkMode
            ? "bg-white bg-opacity-5 border-white border-opacity-10"
            : "bg-white border-gray-200"
    } rounded-2xl border shadow-lg p-3 h-full flex flex-col gap-3 relative backdrop-blur-sm`;

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
                ::-webkit-scrollbar {
                    display: none;
                }
                * {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
            <div className={containerClasses}>
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <Lock
                            size={16}
                            className={
                                isDarkMode ? "text-white" : "text-gray-700"
                            }
                        />
                        <h2
                            className={`text-sm font-medium ${
                                isDarkMode ? "text-white" : "text-gray-900"
                            }`}
                        >
                            Locking in
                        </h2>
                    </div>
                    <div className="flex gap-2">
                        {!isTrialMode && (
                            <>
                                <button
                                    onClick={handleBlockLeisure}
                                    className={`rounded-lg px-2 py-1 cursor-pointer transition-all duration-200 text-xs font-medium ${
                                        isDarkMode
                                            ? "bg-red-500 bg-opacity-20 border-red-500 border-opacity-30 text-white text-opacity-90 hover:bg-opacity-30"
                                            : "bg-red-100 hover:bg-red-200 border-red-200 text-red-700"
                                    } border`}
                                    title="Block leisure sites for 1 hour"
                                >
                                    Lock Leisure
                                </button>
                                <button
                                    onClick={handleBlockWork}
                                    className={`rounded-lg px-2 py-1 cursor-pointer transition-all duration-200 text-xs font-medium ${
                                        isDarkMode
                                            ? "bg-blue-500 bg-opacity-20 border-blue-500 border-opacity-30 text-white text-opacity-90 hover:bg-opacity-30"
                                            : "bg-blue-100 hover:bg-blue-200 border-blue-200 text-blue-700"
                                    } border`}
                                    title="Block work sites for 1 hour"
                                >
                                    Lock Work
                                </button>
                            </>
                        )}
                        <button
                            onClick={() => {
                                setSelectedDomain("*");
                                setShowMiniGame(true);
                            }}
                            className={`rounded-lg px-2 py-1 cursor-pointer transition-all duration-200 text-xs font-medium ${
                                isDarkMode
                                    ? "bg-red-500 bg-opacity-20 border-red-500 border-opacity-30 text-white text-opacity-90 hover:bg-opacity-30"
                                    : "bg-red-100 hover:bg-red-200 border-red-200 text-red-700"
                            } border`}
                            title="Delete all blocked sites"
                        >
                            Unlock All
                        </button>
                    </div>
                </div>

                <form onSubmit={handleBlock}>
                    <div
                        className={`p-3 rounded-lg border relative flex items-center gap-2 ${
                            isDarkMode
                                ? "bg-white bg-opacity-5 border-white border-opacity-20"
                                : "bg-gray-50 border-gray-200"
                        } backdrop-blur-sm`}
                    >
                        <input
                            type="text"
                            value={domain}
                            onChange={(e) => setDomain(e.target.value)}
                            placeholder="Domain"
                            className={`w-2/5 p-0 border-none text-sm outline-none bg-transparent ${
                                isDarkMode
                                    ? "text-white placeholder-gray-400"
                                    : "text-black placeholder-gray-500"
                            }`}
                        />
                        <div className="absolute right-12 flex gap-1 items-center">
                            <input
                                type="time"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                className={`w-20 p-0 border-none pl-2 text-sm outline-none bg-transparent ${
                                    isDarkMode
                                        ? "text-white border-white border-opacity-20"
                                        : "text-black border-gray-200"
                                } border-l`}
                            />
                            <input
                                type="time"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                className={`w-20 p-0 border-none pl-2 text-sm outline-none bg-transparent ${
                                    isDarkMode
                                        ? "text-white border-white border-opacity-20"
                                        : "text-black border-gray-200"
                                } border-l`}
                            />
                        </div>
                        <button
                            type="submit"
                            className={`lock-button ${
                                isLocked ? "locked" : ""
                            } absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 border-none rounded-lg cursor-pointer transition-all duration-300 flex items-center justify-center ${
                                isDarkMode
                                    ? "text-white hover:bg-blue-500 hover:bg-opacity-30"
                                    : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                            }`}
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
                            <h3
                                className={`text-sm font-medium mb-2 ${
                                    isDarkMode
                                        ? "text-white text-opacity-70"
                                        : "text-gray-600"
                                }`}
                            >
                                Active Locks ({blockedSites.length})
                            </h3>
                            {blockedSites.map((site) => {
                                const expired = isExpired(site.endTime);
                                const status = getBlockStatus(site);
                                return (
                                    <div
                                        key={site.domain}
                                        className={`flex justify-between items-start p-3 rounded-lg border-l-4 border backdrop-blur-sm ${
                                            expired
                                                ? isDarkMode
                                                    ? "bg-red-500 bg-opacity-10 border-red-400 border-white border-opacity-10"
                                                    : "bg-red-50 border-red-400 border-red-100"
                                                : status === "Scheduled"
                                                ? isDarkMode
                                                    ? "bg-blue-500 bg-opacity-10 border-blue-400 border-white border-opacity-10"
                                                    : "bg-blue-50 border-blue-400 border-blue-100"
                                                : status === "Overridden"
                                                ? isDarkMode
                                                    ? "bg-orange-500 bg-opacity-10 border-orange-400 border-white border-opacity-10"
                                                    : "bg-orange-50 border-orange-400 border-orange-100"
                                                : isDarkMode
                                                ? "bg-green-500 bg-opacity-10 border-green-400 border-white border-opacity-10"
                                                : "bg-green-50 border-green-400 border-green-100"
                                        }`}
                                    >
                                        <div className="flex-1">
                                            <div
                                                className={`text-sm font-semibold mb-1 ${
                                                    isDarkMode
                                                        ? expired
                                                            ? "text-gray-400"
                                                            : "text-white"
                                                        : "text-black"
                                                }`}
                                            >
                                                {site.domain}
                                                <span
                                                    className={`ml-2 text-xs px-2 py-1 rounded font-medium text-white uppercase tracking-wide ${
                                                        expired
                                                            ? "bg-red-500"
                                                            : status ===
                                                              "Scheduled"
                                                            ? "bg-blue-500"
                                                            : status ===
                                                              "Overridden"
                                                            ? "bg-orange-500"
                                                            : "bg-green-500"
                                                    }`}
                                                >
                                                    {status}
                                                </span>
                                            </div>
                                            {site.timezone && (
                                                <div
                                                    className={`text-xs leading-relaxed ${
                                                        isDarkMode
                                                            ? expired
                                                                ? "text-gray-600"
                                                                : "text-gray-400"
                                                            : expired
                                                            ? "text-gray-500"
                                                            : "text-gray-600"
                                                    }`}
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
                                                isDarkMode
                                                    ? expired
                                                        ? "bg-white bg-opacity-10 text-gray-400 border-white border-opacity-20 hover:bg-opacity-20"
                                                        : "bg-white bg-opacity-10 text-white border-white border-opacity-30 hover:bg-opacity-20"
                                                    : expired
                                                    ? "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200"
                                                    : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                                            } border`}
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
                            className={`p-5 text-center text-sm rounded-lg border ${
                                isDarkMode
                                    ? "text-gray-400 bg-white bg-opacity-5 border-white border-opacity-10"
                                    : "text-gray-500 bg-gray-50 border-gray-100"
                            } backdrop-blur-sm`}
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
