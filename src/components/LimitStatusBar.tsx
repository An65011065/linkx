import React, { useState, useEffect } from "react";
import { Clock, AlertCircle, CheckCircle2 } from "lucide-react";

interface DailyLimit {
    domain: string;
    limit: number; // in minutes
    used: number; // in minutes
    enabled: boolean;
    lastReset: string; // ISO date string
}

interface LimitStatusBarProps {
    domain: string;
    isVisible: boolean;
    forceExpanded?: boolean;
    onOpenSettings: () => void;
}

const LimitStatusBar: React.FC<LimitStatusBarProps> = ({
    domain,
    isVisible,
    forceExpanded = false,
    onOpenSettings,
}) => {
    const [limitData, setLimitData] = useState<DailyLimit | null>(null);
    const [loading, setLoading] = useState(true);
    const [isHovered, setIsHovered] = useState(false);

    // Use forceExpanded to override hover state
    const shouldShowExpanded = isHovered || forceExpanded;

    useEffect(() => {
        if (isVisible) {
            loadLimitData();
            const interval = setInterval(loadLimitData, 60000);
            return () => clearInterval(interval);
        }
    }, [isVisible, domain]);

    // Listen for messages from background script
    useEffect(() => {
        const handleMessage = (message: {
            type: string;
            domain: string;
            showExpanded: boolean;
        }) => {
            if (
                message.type === "SHOW_LIMIT_STATUS" &&
                message.domain === domain
            ) {
                setIsHovered(message.showExpanded);
            }
        };

        chrome.runtime.onMessage.addListener(handleMessage);
        return () => chrome.runtime.onMessage.removeListener(handleMessage);
    }, [domain]);

    const loadLimitData = async () => {
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
                setLimitData(response.limit);
            } else {
                setLimitData(null);
            }
        } catch (error) {
            console.error("Error loading limit data:", error);
            setLimitData(null);
        } finally {
            setLoading(false);
        }
    };

    const getRemainingPercentage = (): number => {
        if (!limitData || limitData.limit === 0) return 0;
        return Math.max(0, 100 - (limitData.used / limitData.limit) * 100);
    };

    const getProgressPercentage = (): number => {
        if (!limitData || limitData.limit === 0) return 0;
        return Math.min(100, (limitData.used / limitData.limit) * 100);
    };

    const formatTime = (minutes: number): string => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0) {
            return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
        }
        return `${mins}m`;
    };

    const getStatusInfo = () => {
        if (!limitData || !limitData.enabled) return null;

        const percentage = getProgressPercentage();
        const remaining = Math.max(0, limitData.limit - limitData.used);

        if (percentage >= 100) {
            return {
                color: "rgba(127, 29, 29, 1)",
                backgroundColor: "rgba(254, 226, 226, 0.95)",
                borderColor: "rgba(239, 68, 68, 0.4)",
                icon: AlertCircle,
                text: "Time's up!",
                barColor: "rgba(220, 38, 38, 0.9)",
            };
        }

        if (percentage >= 80) {
            return {
                color: "rgba(146, 64, 14, 1)",
                backgroundColor: "rgba(255, 237, 213, 0.95)",
                borderColor: "rgba(251, 146, 60, 0.4)",
                icon: Clock,
                text: `${formatTime(remaining)} left`,
                barColor: "rgba(251, 146, 60, 0.9)",
            };
        }

        return {
            color: "rgba(22, 101, 52, 1)",
            backgroundColor: "rgba(236, 253, 245, 0.95)",
            borderColor: "rgba(52, 211, 153, 0.4)",
            icon: CheckCircle2,
            text: `${formatTime(remaining)} left`,
            barColor: "rgba(52, 211, 153, 0.9)",
        };
    };

    const statusInfo = getStatusInfo();

    // Don't render if no limit is set or loading or not visible
    if (
        loading ||
        !limitData ||
        !limitData.enabled ||
        !isVisible ||
        !statusInfo
    ) {
        return null;
    }

    return (
        <div
            className="limit-status-container"
            onClick={onOpenSettings}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Always visible progress bar */}
            <div className="progress-bar-container">
                <div
                    className="progress-bar"
                    style={{
                        width: `${getRemainingPercentage()}%`,
                        backgroundColor: statusInfo.barColor,
                        right: 0,
                        left: "auto",
                    }}
                />
            </div>

            {/* Expandable status content */}
            <div
                className="status-content"
                style={{
                    backgroundColor: statusInfo.backgroundColor,
                    borderColor: statusInfo.borderColor,
                    color: statusInfo.color,
                }}
            >
                <div className="status-main">
                    <div className="status-icon">
                        <statusInfo.icon size={14} />
                    </div>
                    <div className="status-info">
                        <div className="time-left">{statusInfo.text}</div>
                        <div className="progress-visual">
                            <div className="progress-track">
                                <div
                                    className="progress-fill"
                                    style={{
                                        width: `${getProgressPercentage()}%`,
                                        backgroundColor: statusInfo.barColor,
                                    }}
                                />
                            </div>
                            <div className="progress-percentage">
                                {Math.round(getProgressPercentage())}%
                            </div>
                        </div>
                    </div>
                </div>

                <div className="status-details">
                    <div className="domain-info">
                        <div className="domain-name">{domain}</div>
                        <div className="usage-fraction">
                            {formatTime(limitData.used)} /{" "}
                            {formatTime(limitData.limit)}
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .limit-status-container {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    z-index: 9999997;
                    cursor: pointer;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI",
                        system-ui, sans-serif;
                }

                .progress-bar-container {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 4px;
                    background: rgba(220, 38, 38, 0.2);
                }

                .progress-bar {
                    position: absolute;
                    height: 100%;
                    transition: width 0.3s ease;
                }

                .status-content {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 64px;
                    backdrop-filter: blur(20px) saturate(180%);
                    border-bottom: 1px solid;
                    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0 20px;
                    opacity: ${shouldShowExpanded ? "1" : "0"};
                    transform: translateY(${shouldShowExpanded ? "0" : "-8px"});
                    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
                    pointer-events: ${shouldShowExpanded ? "auto" : "none"};
                }

                .status-main {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    flex: 1;
                }

                .status-icon {
                    width: 28px;
                    height: 28px;
                    border-radius: 8px;
                    background: rgba(255, 255, 255, 0.6);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    backdrop-filter: blur(10px);
                    flex-shrink: 0;
                }

                .status-info {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    flex: 1;
                }

                .time-left {
                    font-size: 15px;
                    font-weight: 600;
                    line-height: 1;
                }

                .progress-visual {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .progress-track {
                    width: 80px;
                    height: 6px;
                    background: rgba(255, 255, 255, 0.4);
                    border-radius: 3px;
                    overflow: hidden;
                    backdrop-filter: blur(10px);
                }

                .progress-fill {
                    height: 100%;
                    border-radius: 3px;
                    transition: width 0.3s ease;
                }

                .progress-percentage {
                    font-size: 12px;
                    font-weight: 600;
                    min-width: 32px;
                    text-align: right;
                    font-variant-numeric: tabular-nums;
                }

                .status-details {
                    display: flex;
                    align-items: center;
                    flex-shrink: 0;
                }

                .domain-info {
                    text-align: right;
                }

                .domain-name {
                    font-size: 13px;
                    font-weight: 600;
                    line-height: 1;
                    margin-bottom: 4px;
                }

                .usage-fraction {
                    font-size: 11px;
                    opacity: 0.8;
                    line-height: 1;
                    font-variant-numeric: tabular-nums;
                }

                @media (max-width: 768px) {
                    .status-content {
                        padding: 0 16px;
                        gap: 12px;
                    }

                    .status-details {
                        gap: 12px;
                    }

                    .progress-track {
                        width: 48px;
                    }
                }
            `}</style>
        </div>
    );
};

export default LimitStatusBar;
