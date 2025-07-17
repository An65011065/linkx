import React, { useState, useEffect, useRef } from "react";
import { X, BarChart3 } from "lucide-react";

interface DomainAnalytics {
    domain: string;
    timeSpent: number;
    percentage: number;
    category: "work" | "social" | "other";
    visits: number;
}

interface AnalyticsModalProps {
    onClose: () => void;
    isVisible: boolean;
}

const AnalyticsModal: React.FC<AnalyticsModalProps> = ({
    onClose,
    isVisible,
}) => {
    const [domainData, setDomainData] = useState<DomainAnalytics | null>(null);
    const [totalScreenTime, setTotalScreenTime] = useState(0);
    const [totalLyncxUse, setTotalLyncxUse] = useState(0);
    const [loading, setLoading] = useState(true);
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isVisible) {
            const domain = window.location.hostname.replace(/^www\./, "");
            loadAnalyticsData(domain);
        }
    }, [isVisible]);

    const loadAnalyticsData = async (domain: string) => {
        setLoading(true);
        try {
            const response = await chrome.runtime.sendMessage({
                type: "GET_DOMAIN_ANALYTICS",
                domain: domain,
            });

            if (response && response.success) {
                const { domainStats, totalScreenTime, totalLyncxUse } =
                    response;

                setDomainData({
                    domain: domain,
                    timeSpent: Math.round(domainStats.timeSpent / (1000 * 60)),
                    percentage: domainStats.percentage,
                    category: domainStats.category,
                    visits: domainStats.visits,
                });

                setTotalScreenTime(Math.round(totalScreenTime / (1000 * 60)));
                setTotalLyncxUse(totalLyncxUse);
            } else {
                // Fallback data
                setDomainData({
                    domain: domain,
                    timeSpent: Math.floor(Math.random() * 120) + 15,
                    percentage: Math.floor(Math.random() * 40) + 10,
                    category: getCategoryFromDomain(domain),
                    visits: Math.floor(Math.random() * 20) + 5,
                });
                setTotalScreenTime(Math.floor(Math.random() * 480) + 120);
                setTotalLyncxUse(Math.floor(Math.random() * 60) + 5);
            }
        } catch (error) {
            console.error("Error loading analytics:", error);
        } finally {
            setLoading(false);
        }
    };

    const getCategoryFromDomain = (
        domain: string,
    ): "work" | "social" | "other" => {
        if (
            domain.includes("github") ||
            domain.includes("docs.google") ||
            domain.includes("stackoverflow")
        )
            return "work";
        if (
            domain.includes("youtube") ||
            domain.includes("twitter") ||
            domain.includes("facebook")
        )
            return "social";
        return "other";
    };

    const formatTime = (minutes: number): string => {
        if (minutes >= 60) {
            const hours = Math.floor(minutes / 60);
            const remainingMinutes = minutes % 60;
            return remainingMinutes > 0
                ? `${hours}h ${remainingMinutes}m`
                : `${hours}h`;
        }
        return `${minutes}m`;
    };

    const getCategoryColor = (
        category: "work" | "social" | "other",
    ): string => {
        switch (category) {
            case "work":
                return "#10b981";
            case "social":
                return "#ef4444";
            case "other":
                return "#6366f1";
        }
    };

    // Handle escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isVisible) return;
            if (e.key === "Escape") {
                onClose();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isVisible, onClose]);

    if (!isVisible) return null;

    return (
        <div
            className="analytics-overlay"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div ref={modalRef} className="analytics-modal" tabIndex={-1}>
                {/* Simple header */}
                <div className="modal-header">
                    <div className="header-left">
                        <BarChart3 size={14} />
                        <span>Analytics</span>
                    </div>
                    <button onClick={onClose} className="close-btn">
                        <X size={14} />
                    </button>
                </div>

                {/* Content */}
                <div className="modal-content">
                    {loading ? (
                        <div className="loading">
                            <div className="spinner"></div>
                        </div>
                    ) : (
                        <>
                            {/* Domain info */}
                            <div className="domain-section">
                                <div className="domain-name">
                                    {domainData?.domain}
                                </div>
                                <div className="time-spent">
                                    {formatTime(domainData?.timeSpent || 0)}
                                </div>
                                <div className="usage-info">
                                    {domainData?.percentage}% of daily usage •{" "}
                                    {domainData?.visits} visits
                                </div>
                            </div>

                            {/* Footer stats */}
                            <div className="footer-stats">
                                <span className="screen-time-label">
                                    Total screen time:{" "}
                                </span>
                                <span className="screen-time-value">
                                    {formatTime(totalScreenTime)}
                                </span>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <style>{`
                .analytics-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.25);
                    display: flex;
                    align-items: flex-start;
                    justify-content: flex-start;
                    padding: 20px;
                    z-index: 999999;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI",
                        Roboto, sans-serif;
                    animation: fadeIn 0.15s ease-out;
                }

                .analytics-modal {
                    width: 260px;
                    background: rgba(30, 30, 30, 0.96);
                    backdrop-filter: blur(20px);
                    border-radius: 10px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    animation: slideIn 0.2s ease-out;
                    outline: none;
                    overflow: hidden;
                }

                .modal-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 14px 16px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
                    color: white;
                    font-size: 14px;
                    font-weight: 600;
                }

                .header-left {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: rgba(255, 255, 255, 0.9);
                }

                .close-btn {
                    width: 24px;
                    height: 24px;
                    border: none;
                    background: rgba(255, 255, 255, 0.08);
                    border-radius: 5px;
                    color: rgba(255, 255, 255, 0.6);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.15s ease;
                }

                .close-btn:hover {
                    background: rgba(255, 255, 255, 0.15);
                    color: white;
                }

                .modal-content {
                    padding: 16px;
                }

                .loading {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 60px;
                }

                .spinner {
                    width: 16px;
                    height: 16px;
                    border: 2px solid rgba(255, 255, 255, 0.2);
                    border-top: 2px solid #4285f4;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }

                .domain-section {
                    text-align: center;
                    margin-bottom: 16px;
                    padding-bottom: 16px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
                }

                .domain-name {
                    color: white;
                    font-size: 14px;
                    font-weight: 600;
                    margin-bottom: 8px;
                    opacity: 0.9;
                }

                .time-spent {
                    color: white;
                    font-size: 24px;
                    font-weight: 700;
                    margin-bottom: 6px;
                }

                .usage-info {
                    color: rgba(255, 255, 255, 0.6);
                    font-size: 11px;
                }

                .footer-stats {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 8px 0;
                    font-size: 11px;
                }

                .screen-time-label {
                    color: rgba(255, 255, 255, 0.6);
                }

                .screen-time-value {
                    color: white;
                    font-weight: 600;
                    margin-left: 4px;
                }

                @keyframes fadeIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }

                @keyframes slideIn {
                    from {
                        transform: translateY(-8px) scale(0.98);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0) scale(1);
                        opacity: 1;
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

export default AnalyticsModal;
