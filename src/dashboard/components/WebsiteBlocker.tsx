import React, { useState, useEffect, useRef } from "react";
import { Lock, ChevronDown, Plus, X, ArrowRight } from "lucide-react";
import { websiteBlocker } from "../../data/websiteBlocker";
import type { BlockedSite } from "../../shared/types/common.types";
import { freeTrial } from "../../main/MainTab";

interface Preset {
    id: string;
    name: string;
    domains: string[];
}

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
    const [isLocked, setIsLocked] = useState(false);
    const [isTrialMode, setIsTrialMode] = useState(freeTrial);
    const [overriddenDomains, setOverriddenDomains] = useState<Set<string>>(
        new Set(),
    );

    // Preset states
    const [presets, setPresets] = useState<Preset[]>([]);
    const [showPresetDropdown, setShowPresetDropdown] = useState(false);
    const [showCreatePreset, setShowCreatePreset] = useState(false);
    const [newPresetName, setNewPresetName] = useState("");
    const [newPresetDomain, setNewPresetDomain] = useState("");
    const [newPresetDomains, setNewPresetDomains] = useState<string[]>([]);

    // Refs for click outside handling
    const presetDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const checkTrialStatus = () => {
            setIsTrialMode(freeTrial);
        };

        checkTrialStatus();
        const interval = setInterval(checkTrialStatus, 100);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        loadBlockedSites();
        loadPresets();
        const interval = setInterval(loadBlockedSites, 2000);
        const now = new Date();
        const later = new Date(now.getTime() + 60 * 60 * 1000);
        setStartTime(now.toTimeString().slice(0, 5));
        setEndTime(later.toTimeString().slice(0, 5));

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

    // Handle click outside for preset dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                presetDropdownRef.current &&
                !presetDropdownRef.current.contains(event.target as Node)
            ) {
                setShowPresetDropdown(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const loadBlockedSites = async () => {
        try {
            const sites = await websiteBlocker.getBlockedSites();
            const newOverrides = new Set<string>();

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

    const loadPresets = async () => {
        try {
            const result = await chrome.storage.local.get("website_presets");
            const savedPresets = result.website_presets || [];
            setPresets(savedPresets);
        } catch (err) {
            console.error("Error loading presets:", err);
        }
    };

    const savePresets = async (updatedPresets: Preset[]) => {
        try {
            await chrome.storage.local.set({ website_presets: updatedPresets });
            setPresets(updatedPresets);
        } catch (err) {
            console.error("Error saving presets:", err);
        }
    };

    const handleAddPresetDomain = () => {
        if (!newPresetDomain.trim()) return;

        const cleanDomain = newPresetDomain
            .replace(/^(https?:\/\/)?(www\.)?/, "")
            .split("/")[0];

        if (!newPresetDomains.includes(cleanDomain)) {
            setNewPresetDomains([...newPresetDomains, cleanDomain]);
        }
        setNewPresetDomain("");
    };

    const handleRemovePresetDomain = (domainToRemove: string) => {
        setNewPresetDomains(
            newPresetDomains.filter((domain) => domain !== domainToRemove),
        );
    };

    const handleSavePreset = async () => {
        if (!newPresetName.trim() || newPresetDomains.length === 0) return;

        const newPreset: Preset = {
            id: Date.now().toString(),
            name: newPresetName.trim(),
            domains: newPresetDomains,
        };

        const updatedPresets = [...presets, newPreset];
        await savePresets(updatedPresets);

        setNewPresetName("");
        setNewPresetDomains([]);
        setNewPresetDomain("");
        setShowCreatePreset(false);
        setShowPresetDropdown(false);
    };

    const handleUsePreset = async (preset: Preset) => {
        if (freeTrial && blockedSites.length + preset.domains.length > 2) {
            alert(
                "Free trial allows blocking only 2 websites at a time. This preset would exceed the limit.",
            );
            return;
        }

        try {
            const startMinutes =
                parseInt(startTime.split(":")[0]) * 60 +
                parseInt(startTime.split(":")[1]);
            const endMinutes =
                parseInt(endTime.split(":")[0]) * 60 +
                parseInt(endTime.split(":")[1]);

            let hoursDiff = (endMinutes - startMinutes) / 60;
            if (hoursDiff <= 0) {
                hoursDiff += 24;
            }

            for (const domain of preset.domains) {
                if (blockedSites.some((site) => site.domain === domain)) {
                    continue;
                }

                await websiteBlocker.blockWebsite(domain, hoursDiff);
            }

            await loadBlockedSites();
            setShowPresetDropdown(false);
        } catch (error) {
            console.error("Error applying preset:", error);
            alert(
                "Error applying preset. Some websites may already be blocked.",
            );
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

    const handleUnlockAll = async () => {
        try {
            const sites = await websiteBlocker.getBlockedSites();
            for (const site of sites) {
                await websiteBlocker.unlockWebsite(site.domain);
            }
            await loadBlockedSites();
        } catch (err) {
            console.error("Unlock all failed:", err);
        }
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

    return (
        <>
            <style>{`
                @keyframes lockRotate {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(10deg); }
                }
                
                @keyframes dropdownSlideIn {
                    0% { 
                        opacity: 0;
                        transform: translateY(-10px) scale(0.95);
                    }
                    100% { 
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
                
                @keyframes dropdownSlideOut {
                    0% { 
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                    100% { 
                        opacity: 0;
                        transform: translateY(-10px) scale(0.95);
                    }
                }
                
                .dropdown-enter {
                    animation: dropdownSlideIn 0.2s ease-out forwards;
                }
                
                .dropdown-exit {
                    animation: dropdownSlideOut 0.15s ease-in forwards;
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

            <div
                className={`rounded-2xl p-4 h-full flex flex-col gap-4 ${
                    isDarkMode
                        ? "bg-white bg-opacity-5 border-white border-opacity-10 shadow-lg backdrop-blur-sm"
                        : "bg-white border-gray-200 shadow-lg backdrop-blur-sm"
                } border`}
            >
                {/* Header */}
                <div className="flex items-center justify-between">
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
                        {/* Presets Dropdown */}
                        <div className="relative" ref={presetDropdownRef}>
                            <button
                                onClick={() =>
                                    setShowPresetDropdown(!showPresetDropdown)
                                }
                                className={`px-3 py-1 text-xs font-medium rounded-md flex items-center gap-1 transition-all duration-200 ${
                                    isDarkMode
                                        ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                                        : "bg-green-100 text-green-700 hover:bg-green-200"
                                } ${showPresetDropdown ? "scale-95" : ""}`}
                            >
                                Presets
                                <ChevronDown
                                    size={12}
                                    className={`transition-transform duration-200 ${
                                        showPresetDropdown ? "rotate-180" : ""
                                    }`}
                                />
                            </button>

                            {showPresetDropdown && (
                                <div
                                    className={`absolute top-full left-0 right-0 mt-1 rounded-lg shadow-lg z-50 ${
                                        isDarkMode
                                            ? "bg-gray-900 bg-opacity-100 border-white border-opacity-20"
                                            : "bg-white border-gray-200"
                                    } border backdrop-blur-sm dropdown-enter`}
                                    style={{
                                        left: "0",
                                        right: "calc(-100% - 0.3rem)",
                                    }}
                                >
                                    <button
                                        onClick={() => {
                                            setShowCreatePreset(true);
                                            setShowPresetDropdown(false);
                                        }}
                                        className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 transition-colors rounded-md ${
                                            isDarkMode
                                                ? "text-white hover:bg-white hover:bg-opacity-10"
                                                : "text-gray-700 hover:bg-gray-100"
                                        }`}
                                    >
                                        <Plus size={12} />
                                        New Preset
                                    </button>
                                    {presets.map((preset) => (
                                        <button
                                            key={preset.id}
                                            onClick={() =>
                                                handleUsePreset(preset)
                                            }
                                            className={`w-full text-left px-3 py-2 text-xs transition-colors rounded-md ${
                                                isDarkMode
                                                    ? "text-white hover:bg-white hover:bg-opacity-10"
                                                    : "text-gray-700 hover:bg-gray-100"
                                            }`}
                                        >
                                            {preset.name} (
                                            {preset.domains.length})
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleUnlockAll}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                                isDarkMode
                                    ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                                    : "bg-red-100 text-red-700 hover:bg-red-200"
                            }`}
                        >
                            Unlock All
                        </button>
                    </div>
                </div>

                {/* Create Preset Form */}
                {showCreatePreset && (
                    <div
                        className={`space-y-3 ${
                            isDarkMode
                                ? "bg-white bg-opacity-5 border-white border-opacity-20"
                                : "bg-gray-50 border-gray-200"
                        } rounded-lg p-3 border backdrop-blur-sm`}
                    >
                        <input
                            type="text"
                            value={newPresetName}
                            onChange={(e) => setNewPresetName(e.target.value)}
                            placeholder="Preset name"
                            className={`w-full px-3 py-2 text-sm rounded-md bg-transparent border ${
                                isDarkMode
                                    ? "border-white border-opacity-20 text-white placeholder-gray-400"
                                    : "border-gray-300 text-black placeholder-gray-500"
                            } focus:outline-none focus:ring-1 focus:ring-blue-500`}
                        />

                        <div className="relative">
                            <input
                                type="text"
                                value={newPresetDomain}
                                onChange={(e) =>
                                    setNewPresetDomain(e.target.value)
                                }
                                onKeyPress={(e) =>
                                    e.key === "Enter" && handleAddPresetDomain()
                                }
                                placeholder="Add a website"
                                className={`w-full px-3 py-2 pr-10 text-sm rounded-md bg-transparent border ${
                                    isDarkMode
                                        ? "border-white border-opacity-20 text-white placeholder-gray-400"
                                        : "border-gray-300 text-black placeholder-gray-500"
                                } focus:outline-none focus:ring-1 focus:ring-blue-500`}
                            />
                            <button
                                onClick={handleAddPresetDomain}
                                className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded transition-colors ${
                                    isDarkMode
                                        ? "text-white hover:bg-white hover:bg-opacity-10"
                                        : "text-gray-600 hover:bg-gray-100"
                                }`}
                            >
                                <Plus size={14} />
                            </button>
                        </div>

                        {newPresetDomains.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                                {newPresetDomains.map((domain, index) => (
                                    <span
                                        key={index}
                                        className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded ${
                                            isDarkMode
                                                ? "bg-white bg-opacity-10 text-white"
                                                : "bg-gray-200 text-gray-700"
                                        }`}
                                    >
                                        {domain}
                                        <button
                                            onClick={() =>
                                                handleRemovePresetDomain(domain)
                                            }
                                            className={`hover:text-red-500 transition-colors`}
                                        >
                                            <X size={10} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}

                        <div className="flex gap-2">
                            <button
                                onClick={handleSavePreset}
                                disabled={
                                    !newPresetName.trim() ||
                                    newPresetDomains.length === 0
                                }
                                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                                    !newPresetName.trim() ||
                                    newPresetDomains.length === 0
                                        ? isDarkMode
                                            ? "bg-gray-600/20 text-gray-500 cursor-not-allowed border border-gray-600/20"
                                            : "bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-200"
                                        : isDarkMode
                                        ? "bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30"
                                        : "bg-green-100 text-green-700 hover:bg-green-200 border border-green-200"
                                }`}
                            >
                                Save
                            </button>
                            <button
                                onClick={() => {
                                    setShowCreatePreset(false);
                                    setNewPresetName("");
                                    setNewPresetDomains([]);
                                    setNewPresetDomain("");
                                }}
                                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                                    isDarkMode
                                        ? "bg-gray-500/20 text-gray-400 hover:bg-gray-500/30 border border-gray-500/30"
                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
                                }`}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {/* Main Input - Hide when creating preset */}
                {!showCreatePreset && (
                    <form onSubmit={handleBlock}>
                        <div
                            className={`flex items-center gap-2 p-3 rounded-lg border ${
                                isDarkMode
                                    ? "bg-white bg-opacity-5 border-white border-opacity-20 backdrop-blur-sm"
                                    : "bg-gray-50 border-gray-200 backdrop-blur-sm"
                            }`}
                        >
                            <input
                                type="text"
                                value={domain}
                                onChange={(e) => setDomain(e.target.value)}
                                placeholder="Domain"
                                className={`flex-1 bg-transparent text-sm outline-none ${
                                    isDarkMode
                                        ? "text-white placeholder-gray-400"
                                        : "text-black placeholder-gray-500"
                                }`}
                            />
                            <input
                                type="time"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                className={`w-20 bg-transparent text-sm outline-none text-center ${
                                    isDarkMode ? "text-white" : "text-black"
                                }`}
                            />
                            <input
                                type="time"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                className={`w-20 bg-transparent text-sm outline-none text-center ${
                                    isDarkMode ? "text-white" : "text-black"
                                }`}
                            />
                            <button
                                type="submit"
                                className={`lock-button ${
                                    isLocked ? "locked" : ""
                                } p-2 rounded-lg transition-all ${
                                    isDarkMode
                                        ? "text-white hover:bg-blue-500/30"
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
                )}

                {/* Blocked Sites List - Hide when creating preset */}
                {!showCreatePreset && (
                    <div className="flex-1 overflow-y-auto space-y-2">
                        {blockedSites.length > 0 ? (
                            <>
                                <h3
                                    className={`text-sm font-medium ${
                                        isDarkMode
                                            ? "text-white/70"
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
                                            className={`flex justify-between items-center p-3 rounded-lg border-l-4 ${
                                                expired
                                                    ? isDarkMode
                                                        ? "bg-red-500/10 border-red-400"
                                                        : "bg-red-50 border-red-400"
                                                    : status === "Scheduled"
                                                    ? isDarkMode
                                                        ? "bg-blue-500/10 border-blue-400"
                                                        : "bg-blue-50 border-blue-400"
                                                    : status === "Overridden"
                                                    ? isDarkMode
                                                        ? "bg-orange-500/10 border-orange-400"
                                                        : "bg-orange-50 border-orange-400"
                                                    : isDarkMode
                                                    ? "bg-green-500/10 border-green-400"
                                                    : "bg-green-50 border-green-400"
                                            } backdrop-blur-sm`}
                                        >
                                            <div className="flex-1">
                                                <div
                                                    className={`text-sm font-medium ${
                                                        isDarkMode
                                                            ? expired
                                                                ? "text-gray-400"
                                                                : "text-white"
                                                            : "text-black"
                                                    }`}
                                                >
                                                    {site.domain}
                                                    <span
                                                        className={`ml-2 text-xs px-2 py-0.5 rounded font-medium text-white uppercase ${
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
                                                        className={`text-xs mt-1 ${
                                                            isDarkMode
                                                                ? expired
                                                                    ? "text-gray-600"
                                                                    : "text-gray-400"
                                                                : expired
                                                                ? "text-gray-500"
                                                                : "text-gray-600"
                                                        }`}
                                                    >
                                                        {formatScheduledTime(
                                                            site,
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                onClick={() =>
                                                    handleUnblock(site.domain)
                                                }
                                                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                                                    isDarkMode
                                                        ? "bg-white/10 text-white hover:bg-white/20"
                                                        : "bg-white text-gray-700 hover:bg-gray-50"
                                                }`}
                                            >
                                                {expired ? "Remove" : "Unlock"}
                                            </button>
                                        </div>
                                    );
                                })}
                            </>
                        ) : (
                            <div
                                className={`p-8 text-center text-sm rounded-lg ${
                                    isDarkMode
                                        ? "text-gray-400 bg-white bg-opacity-5 border border-white border-opacity-10"
                                        : "text-gray-500 bg-gray-50 border border-gray-100"
                                } backdrop-blur-sm`}
                            >
                                No websites currently locked
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
};

export default WebsiteBlocker;
