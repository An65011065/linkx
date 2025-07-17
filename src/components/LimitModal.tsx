import React, { useState, useEffect } from "react";
import { X, Clock, Zap } from "lucide-react";

interface DailyLimit {
    domain: string;
    limit: number; // in minutes
    used: number; // in minutes
    enabled: boolean;
    lastReset: string; // ISO date string
}

interface LimitModalProps {
    isVisible: boolean;
    domain: string;
    onClose: () => void;
}

const LimitModal: React.FC<LimitModalProps> = ({
    isVisible,
    domain,
    onClose,
}) => {
    const [currentLimit, setCurrentLimit] = useState<DailyLimit | null>(null);
    const [minutes, setMinutes] = useState(60);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [view, setView] = useState<"set" | "active">("set");
    const [allLimits, setAllLimits] = useState<DailyLimit[]>([]);

    const MAX_MINUTES = 6 * 60; // 6 hours max

    useEffect(() => {
        if (isVisible) {
            loadCurrentLimit();
            loadAllLimits();
        }
    }, [isVisible, domain]);

    const loadCurrentLimit = async () => {
        setLoading(true);
        try {
            const cleanDomain = domain
                .replace(/^https?:\/\//, "")
                .replace(/^www\./, "")
                .split("/")[0];

            const response = await chrome.runtime.sendMessage({
                type: "GET_DAILY_LIMIT",
                domain: cleanDomain,
            });

            if (response.success && response.limit) {
                setCurrentLimit(response.limit);
                setMinutes(response.limit.limit);
            } else {
                setCurrentLimit(null);
                setMinutes(60); // Reset to default
            }
        } catch (error) {
            console.error("Error loading limit:", error);
            setCurrentLimit(null);
            setMinutes(60); // Reset to default
        } finally {
            setLoading(false);
        }
    };

    const loadAllLimits = async () => {
        try {
            // Get all limits from storage
            const data = await chrome.storage.sync.get("daily_limits");
            const limits =
                (data.daily_limits as Record<string, DailyLimit>) || {};

            // Convert object to array and filter out disabled limits
            const activeLimits = Object.values(limits)
                .filter((limit): limit is DailyLimit => limit?.enabled === true)
                .map((limit) => ({
                    ...limit,
                    // Ensure used time is reset if it's a new day
                    used:
                        limit.lastReset ===
                        new Date().toISOString().split("T")[0]
                            ? limit.used
                            : 0,
                }));

            setAllLimits(activeLimits);
        } catch (error) {
            console.error("Error loading all limits:", error);
        }
    };

    const handleSave = async () => {
        if (
            currentLimit &&
            currentLimit.limit === minutes &&
            currentLimit.enabled
        ) {
            onClose();
            return;
        }

        setSaving(true);
        try {
            // Clean the domain for consistent handling
            const cleanDomain = domain
                .replace(/^https?:\/\//, "")
                .replace(/^www\./, "")
                .split("/")[0];

            const response = await chrome.runtime.sendMessage({
                type: "SET_DAILY_LIMIT",
                domain: cleanDomain,
                limit: minutes,
                enabled: minutes > 0,
            });

            if (response.success) {
                // Refresh the current limit
                await loadCurrentLimit();
                // Refresh all limits
                await loadAllLimits();

                // Find the tab with the matching domain and show expanded status bar
                const tabs = await chrome.tabs.query({});
                const matchingTab = tabs.find((tab) => {
                    if (!tab.url) return false;
                    try {
                        const tabDomain = new URL(tab.url).hostname.replace(
                            /^www\./,
                            "",
                        );
                        return tabDomain === cleanDomain;
                    } catch {
                        return false;
                    }
                });

                if (matchingTab?.id) {
                    // Send message to show expanded status bar
                    await chrome.tabs.sendMessage(matchingTab.id, {
                        type: "SHOW_LIMIT_STATUS",
                        domain: cleanDomain,
                        showExpanded: true,
                    });
                }

                onClose();
            } else {
                throw new Error(response.error || "Failed to save limit");
            }
        } catch (error) {
            console.error("Error saving limit:", error);
            // Keep the modal open if there's an error
        } finally {
            setSaving(false);
        }
    };

    const removeLimit = async (domainToRemove: string) => {
        try {
            const cleanDomain = domainToRemove
                .replace(/^https?:\/\//, "")
                .replace(/^www\./, "")
                .split("/")[0];

            const response = await chrome.runtime.sendMessage({
                type: "REMOVE_DAILY_LIMIT",
                domain: cleanDomain,
            });

            if (response.success) {
                // Update UI
                setAllLimits((prev) =>
                    prev.filter((limit) => limit.domain !== cleanDomain),
                );

                // If we're removing the current domain's limit, reset the form
                if (
                    cleanDomain ===
                    domain
                        .replace(/^https?:\/\//, "")
                        .replace(/^www\./, "")
                        .split("/")[0]
                ) {
                    setCurrentLimit(null);
                    setMinutes(60);
                }
            } else {
                throw new Error(response.error || "Failed to remove limit");
            }
        } catch (error) {
            console.error("Error removing limit:", error);
        }
    };

    const formatTime = (totalMinutes: number): string => {
        if (totalMinutes === 0) return "0";

        const hours = Math.floor(totalMinutes / 60);
        const mins = Math.round(totalMinutes % 60);

        // If rounding minutes results in 60, adjust hours
        if (mins === 60) {
            return formatTime(Math.floor(totalMinutes + 0.5));
        }

        if (hours === 0) return `${mins}m`;
        if (mins === 0) return `${hours}h`;

        return `${hours}h ${mins}m`;
    };

    const getTimeUnit = (totalMinutes: number): string => {
        if (totalMinutes === 0) return "off";

        const hours = Math.floor(totalMinutes / 60);
        const mins = Math.round(totalMinutes % 60);

        return "";
    };

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setMinutes(parseInt(e.target.value));
    };

    const getSliderBackground = () => {
        const percentage = (minutes / MAX_MINUTES) * 100;
        return `linear-gradient(to right, rgba(255, 183, 77, 0.8) 0%, rgba(255, 183, 77, 0.8) ${percentage}%, rgba(255, 183, 77, 0.2) ${percentage}%, rgba(255, 183, 77, 0.2) 100%)`;
    };

    const getProgressPercentage = (limit: DailyLimit): number => {
        if (!limit || limit.limit === 0) return 0;
        return Math.min(100, (limit.used / limit.limit) * 100);
    };

    const getTimeRemaining = (limit: DailyLimit): number => {
        return Math.max(0, limit.limit - limit.used);
    };

    const getStatusColor = (percentage: number): string => {
        if (percentage >= 100) return "rgba(220, 38, 38, 0.9)";
        if (percentage >= 80) return "rgba(251, 146, 60, 0.9)";
        return "rgba(52, 211, 153, 0.9)";
    };

    if (!isVisible) return null;

    return (
        <div
            className="limit-modal"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
        >
            <button onClick={onClose} className="close-btn">
                <X size={16} />
            </button>

            {loading ? (
                <div className="loading-state">
                    <div className="spinner" />
                    <p>Loading your limits...</p>
                </div>
            ) : (
                <>
                    <div className="view-toggle">
                        <button
                            onClick={() => setView("set")}
                            className={`toggle-btn ${
                                view === "set" ? "active" : ""
                            }`}
                        >
                            Set Limit
                        </button>
                        <button
                            onClick={() => setView("active")}
                            className={`toggle-btn ${
                                view === "active" ? "active" : ""
                            }`}
                        >
                            Active Limits
                        </button>
                    </div>

                    {view === "set" ? (
                        <>
                            <div className="modal-header">
                                <div className="header-icon">
                                    <Clock size={18} />
                                </div>
                                <h1 className="modal-title">
                                    Daily Focus Time
                                </h1>
                                <p className="modal-subtitle">
                                    Set a healthy limit for {domain}
                                </p>
                            </div>

                            <div className="value-section">
                                <div className="value-display">
                                    <span className="value-number">
                                        {formatTime(minutes)}
                                    </span>
                                    <span className="value-unit">
                                        {getTimeUnit(minutes)}
                                    </span>
                                </div>

                                {minutes > 0 && (
                                    <div className="value-description">
                                        You'll get a gentle reminder when you
                                        reach this limit
                                    </div>
                                )}
                            </div>

                            <div className="slider-section">
                                <div className="slider-container">
                                    <input
                                        type="range"
                                        min="0"
                                        max={MAX_MINUTES}
                                        step="15"
                                        value={minutes}
                                        onChange={handleSliderChange}
                                        onClick={(e) => e.stopPropagation()}
                                        className="time-slider"
                                        style={{
                                            background: getSliderBackground(),
                                        }}
                                    />
                                    <div className="slider-labels">
                                        <span className="slider-label">
                                            Off
                                        </span>
                                        <span className="slider-label">
                                            6 hours
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="action-section">
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="save-button"
                                >
                                    {saving ? (
                                        <>
                                            <div className="button-spinner" />
                                            <span>Saving...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Zap size={14} />
                                            <span>Set Limit</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="modal-header">
                                <div className="header-icon">
                                    <Clock size={18} />
                                </div>
                                <h1 className="modal-title">Active Limits</h1>
                                <p className="modal-subtitle">
                                    Manage your daily focus limits
                                </p>
                            </div>

                            <div className="active-limits-section">
                                {allLimits.length === 0 ? (
                                    <div className="empty-state">
                                        <p>No active limits set</p>
                                    </div>
                                ) : (
                                    <div className="limits-list">
                                        {allLimits.map((limit) => {
                                            const percentage =
                                                getProgressPercentage(limit);
                                            const remaining =
                                                getTimeRemaining(limit);
                                            const statusColor =
                                                getStatusColor(percentage);

                                            return (
                                                <div
                                                    key={limit.domain}
                                                    className="limit-item"
                                                >
                                                    <div className="limit-info">
                                                        <div className="limit-domain">
                                                            {limit.domain}
                                                        </div>
                                                        <div className="limit-time">
                                                            {formatTime(
                                                                remaining,
                                                            )}{" "}
                                                            left
                                                        </div>
                                                    </div>

                                                    <div className="limit-progress">
                                                        <div className="progress-container">
                                                            <div
                                                                className="progress-bar"
                                                                style={{
                                                                    width: `${percentage}%`,
                                                                    backgroundColor:
                                                                        statusColor,
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="progress-text">
                                                            {Math.round(
                                                                percentage,
                                                            )}
                                                            %
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={() =>
                                                            removeLimit(
                                                                limit.domain,
                                                            )
                                                        }
                                                        className="remove-limit-btn"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </>
            )}

            <style>{`
                .limit-modal {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 320px;
                    height: 400px;
                    background: rgba(255, 251, 235, 0.95);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 183, 77, 0.3);
                    border-radius: 16px;
                    padding: 24px;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1),
                        0 0 0 1px rgba(255, 251, 235, 0.8);
                    animation: slideUp 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI",
                        system-ui, sans-serif;
                    z-index: 10000000;
                    display: flex;
                    flex-direction: column;
                }

                .close-btn {
                    position: absolute;
                    top: 16px;
                    right: 16px;
                    background: rgba(184, 134, 11, 0.1);
                    border: none;
                    border-radius: 8px;
                    width: 32px;
                    height: 32px;
                    cursor: pointer;
                    color: rgba(184, 134, 11, 0.8);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                }

                .close-btn:hover {
                    background: rgba(184, 134, 11, 0.2);
                    color: rgba(184, 134, 11, 1);
                    transform: scale(1.05);
                }

                .loading-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 16px;
                    padding: 40px 0;
                }

                .loading-state p {
                    color: rgba(184, 134, 11, 0.8);
                    font-size: 14px;
                    margin: 0;
                }

                .view-toggle {
                    display: flex;
                    background: rgba(255, 183, 77, 0.1);
                    border-radius: 8px;
                    padding: 4px;
                    margin-bottom: 24px;
                    border: 1px solid rgba(255, 183, 77, 0.2);
                }

                .toggle-btn {
                    flex: 1;
                    padding: 8px 16px;
                    background: none;
                    border: none;
                    border-radius: 6px;
                    font-size: 13px;
                    font-weight: 600;
                    color: rgba(184, 134, 11, 0.7);
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .toggle-btn.active {
                    background: rgba(255, 183, 77, 0.2);
                    color: rgba(120, 53, 15, 0.9);
                }

                .toggle-btn:hover:not(.active) {
                    background: rgba(255, 183, 77, 0.1);
                    color: rgba(184, 134, 11, 0.9);
                }

                .modal-header {
                    text-align: center;
                    margin-bottom: 32px;
                }

                .header-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    background: rgba(255, 183, 77, 0.2);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 16px;
                    color: rgba(184, 134, 11, 0.9);
                }

                .modal-title {
                    margin: 0 0 8px 0;
                    font-size: 20px;
                    font-weight: 600;
                    color: rgba(120, 53, 15, 0.9);
                    line-height: 1.2;
                }

                .modal-subtitle {
                    margin: 0;
                    font-size: 14px;
                    color: rgba(184, 134, 11, 0.7);
                    line-height: 1.4;
                }

                .value-section {
                    text-align: center;
                    margin-bottom: 32px;
                }

                .value-display {
                    display: inline-flex;
                    align-items: baseline;
                    gap: 6px;
                    background: rgba(255, 183, 77, 0.15);
                    padding: 16px 24px;
                    border-radius: 12px;
                    margin-bottom: 12px;
                    border: 1px solid rgba(255, 183, 77, 0.3);
                }

                .value-number {
                    font-size: 28px;
                    font-weight: 700;
                    color: rgba(120, 53, 15, 0.9);
                    line-height: 1;
                    font-variant-numeric: tabular-nums;
                }

                .value-unit {
                    font-size: 14px;
                    font-weight: 600;
                    color: rgba(184, 134, 11, 0.8);
                    opacity: 0.8;
                }

                .value-description {
                    font-size: 12px;
                    color: rgba(184, 134, 11, 0.6);
                    font-style: italic;
                }

                .slider-section {
                    margin-bottom: 32px;
                }

                .slider-container {
                    padding: 0 8px;
                }

                .time-slider {
                    -webkit-appearance: none;
                    width: 100%;
                    height: 8px;
                    border-radius: 4px;
                    outline: none;
                    cursor: pointer;
                    margin-bottom: 12px;
                    transition: all 0.2s ease;
                }

                .time-slider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    background: rgba(255, 183, 77, 0.9);
                    cursor: pointer;
                    border: 3px solid rgba(255, 251, 235, 0.9);
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
                    transition: all 0.2s ease;
                }

                .time-slider::-webkit-slider-thumb:hover {
                    transform: scale(1.1);
                    background: rgba(255, 183, 77, 1);
                }

                .time-slider::-moz-range-thumb {
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    background: rgba(255, 183, 77, 0.9);
                    cursor: pointer;
                    border: 3px solid rgba(255, 251, 235, 0.9);
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
                    transition: all 0.2s ease;
                }

                .time-slider::-moz-range-thumb:hover {
                    transform: scale(1.1);
                    background: rgba(255, 183, 77, 1);
                }

                .slider-labels {
                    display: flex;
                    justify-content: space-between;
                    font-size: 12px;
                    color: rgba(184, 134, 11, 0.6);
                    font-weight: 500;
                }

                .action-section {
                    text-align: center;
                }

                .save-button {
                    background: linear-gradient(
                        135deg,
                        rgba(255, 183, 77, 0.9),
                        rgba(245, 158, 11, 0.9)
                    );
                    border: none;
                    border-radius: 12px;
                    color: rgba(120, 53, 15, 0.9);
                    font-size: 14px;
                    font-weight: 600;
                    padding: 14px 32px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    justify-content: center;
                    min-width: 120px;
                    margin: 0 auto;
                    box-shadow: 0 4px 12px rgba(255, 183, 77, 0.3);
                }

                .save-button:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(255, 183, 77, 0.4);
                }

                .save-button:active:not(:disabled) {
                    transform: translateY(0);
                }

                .save-button:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                    transform: none;
                }

                .active-limits-section {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    overflow-y: auto;
                }

                .empty-state {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex: 1;
                    color: rgba(184, 134, 11, 0.6);
                    font-size: 14px;
                    font-style: italic;
                }

                .limits-list {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .limit-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px;
                    background: rgba(255, 183, 77, 0.08);
                    border-radius: 8px;
                    border: 1px solid rgba(255, 183, 77, 0.2);
                    transition: all 0.2s ease;
                }

                .limit-item:hover {
                    background: rgba(255, 183, 77, 0.12);
                    border-color: rgba(255, 183, 77, 0.3);
                }

                .limit-info {
                    flex: 1;
                    min-width: 0;
                }

                .limit-domain {
                    font-size: 13px;
                    font-weight: 600;
                    color: rgba(120, 53, 15, 0.9);
                    margin-bottom: 2px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .limit-time {
                    font-size: 11px;
                    color: rgba(184, 134, 11, 0.7);
                    font-weight: 500;
                }

                .limit-progress {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    flex-shrink: 0;
                }

                .progress-container {
                    width: 60px;
                    height: 4px;
                    background: rgba(255, 183, 77, 0.2);
                    border-radius: 2px;
                    overflow: hidden;
                }

                .progress-bar {
                    height: 100%;
                    border-radius: 2px;
                    transition: width 0.3s ease;
                }

                .progress-text {
                    font-size: 11px;
                    font-weight: 600;
                    color: rgba(120, 53, 15, 0.8);
                    min-width: 30px;
                    text-align: right;
                    font-variant-numeric: tabular-nums;
                }

                .remove-limit-btn {
                    width: 24px;
                    height: 24px;
                    border: none;
                    background: rgba(220, 38, 38, 0.1);
                    border-radius: 6px;
                    color: rgba(220, 38, 38, 0.8);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                    flex-shrink: 0;
                }

                .remove-limit-btn:hover {
                    background: rgba(220, 38, 38, 0.2);
                    color: rgba(220, 38, 38, 1);
                    transform: scale(1.05);
                }

                .spinner,
                .button-spinner {
                    width: 16px;
                    height: 16px;
                    border: 2px solid rgba(255, 183, 77, 0.3);
                    border-top: 2px solid rgba(255, 183, 77, 0.8);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }

                .button-spinner {
                    width: 14px;
                    height: 14px;
                }

                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translate(-50%, -50%) translateY(20px)
                            scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: translate(-50%, -50%) translateY(0) scale(1);
                    }
                }

                @keyframes spin {
                    from {
                        transform: rotate(0deg);
                    }
                    to {
                        transform: rotate(360deg);
                    }
                }
            `}</style>
        </div>
    );
};

export default LimitModal;
