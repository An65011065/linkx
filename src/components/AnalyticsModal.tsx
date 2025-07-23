import React, { useState, useEffect } from "react";
import { ChevronRight, Eye, Clock, GitPullRequest } from "lucide-react";
import DataService from "../data/dataService";

interface AnalyticsData {
    readingTime: number;
    completionPercentage: number;
    timeSpentOnPage: number;
    activeTime: number;
    uniquePages: number; // Changed from pullRequests
    totalWordCount: number; // Changed from pushRequests
}

interface AnalyticsModalProps {
    isVisible: boolean;
    onClose: () => void;
}

const AnalyticsModal: React.FC<AnalyticsModalProps> = ({
    isVisible,
    onClose,
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
        readingTime: 0,
        completionPercentage: 0,
        timeSpentOnPage: 0,
        activeTime: 0,
        uniquePages: 0,
        totalWordCount: 0,
    });

    const [animatedValues, setAnimatedValues] = useState({
        completionPercentage: 0,
        readingTime: 0,
        timeSpentOnPage: 0,
        activeTime: 0,
        uniquePages: 0,
        totalWordCount: 0,
    });

    // Fetch real data from DataService
    const fetchData = async () => {
        try {
            // Get current URL and domain
            const currentUrl = window.location.href;
            const currentDomain = window.location.hostname.replace(
                /^www\./,
                "",
            );

            const dataService = DataService.getInstance();
            const session = await dataService.getCurrentSession();

            console.log("📊 Analytics Debug:", {
                currentUrl,
                currentDomain,
                totalTabSessions: session.tabSessions.length,
                totalStats: session.stats,
            });

            // Filter visits for current domain and current page
            const allVisits = session.tabSessions.flatMap((ts) => ts.urlVisits);
            const domainVisits = allVisits.filter(
                (visit) => visit.domain === currentDomain,
            );

            // Get current page visits (for reading analytics)
            const currentPageVisits = allVisits.filter(
                (visit) => visit.url === currentUrl,
            );

            console.log("📊 Analytics Breakdown:", {
                totalVisits: allVisits.length,
                domainVisits: domainVisits.length,
                currentPageVisits: currentPageVisits.length,
                currentPageSample: currentPageVisits[0],
                allWordCountsForThisPage: currentPageVisits.map(
                    (v) => v.wordCount,
                ), // Debug this
            });

            // Calculate UNIQUE pages visited on this domain
            const uniqueUrls = new Set(domainVisits.map((visit) => visit.url));
            const uniquePages = uniqueUrls.size;

            // Calculate CURRENT PAGE analytics (for reading time and completion)
            const currentPageActiveTime = currentPageVisits.reduce(
                (total, visit) => total + visit.activeTime,
                0,
            );

            // ✅ FIXED: Use most recent or highest word count, not sum
            const currentPageWordCount =
                currentPageVisits.length > 0
                    ? Math.max(
                          ...currentPageVisits.map(
                              (visit) => visit.wordCount || 0,
                          ),
                      )
                    : 0;

            console.log("📝 Word count debug:", {
                numberOfVisitsToThisPage: currentPageVisits.length,
                wordCountsPerVisit: currentPageVisits.map((v) => ({
                    id: v.id,
                    wordCount: v.wordCount,
                    startTime: new Date(v.startTime).toISOString(),
                })),
                finalWordCount: currentPageWordCount,
            });

            // Calculate DOMAIN-wide time (for domain time metric)
            const domainActiveTime = domainVisits.reduce(
                (total, visit) => total + visit.activeTime,
                0,
            );

            // Calculate DOMAIN-wide word count (for context)
            const domainWordCount = domainVisits.reduce(
                (total, visit) => total + (visit.wordCount || 0),
                0,
            );

            // Calculate estimated reading time for CURRENT PAGE
            const estimatedReadingTime =
                currentPageWordCount > 0
                    ? currentPageWordCount / 200 // 200 words per minute
                    : 0;

            // Calculate completion percentage for CURRENT PAGE
            const currentPageTimeMinutes = currentPageActiveTime / (1000 * 60);
            const completionPercentage =
                estimatedReadingTime > 0
                    ? Math.min(
                          100,
                          (currentPageTimeMinutes / estimatedReadingTime) * 100,
                      )
                    : currentPageTimeMinutes > 0
                    ? Math.min(100, currentPageTimeMinutes * 20) // Fallback: 3 min = 100%
                    : 0;

            const realData: AnalyticsData = {
                readingTime: estimatedReadingTime,
                completionPercentage: Math.round(completionPercentage),
                timeSpentOnPage: currentPageTimeMinutes, // Current page time
                activeTime: domainActiveTime / (1000 * 60), // Domain time
                uniquePages: uniquePages,
                totalWordCount: currentPageWordCount, // Current page word count
            };

            console.log("📊 Final Analytics Data:", {
                ...realData,
                debug: {
                    currentPageWordCount,
                    domainWordCount,
                    estimatedReadingTimeMinutes: estimatedReadingTime,
                    currentPageTimeMinutes,
                    domainTimeMinutes: domainActiveTime / (1000 * 60),
                },
            });

            setAnalyticsData(realData);
        } catch (error) {
            console.error("Error fetching analytics data:", error);
            // Set fallback data to show component is working
            setAnalyticsData({
                readingTime: 0,
                completionPercentage: 0,
                timeSpentOnPage: 0,
                activeTime: 0,
                uniquePages: 0,
                totalWordCount: 0,
            });
        }
    };

    // Initial fetch when modal becomes visible
    useEffect(() => {
        if (isVisible) {
            fetchData();
        }
    }, [isVisible]);

    // Set up real-time updates with interval
    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | null = null;

        if (isVisible) {
            // Update every 5 seconds when modal is visible
            interval = setInterval(() => {
                fetchData();
            }, 5000);
        }

        return () => {
            if (interval) {
                clearInterval(interval);
            }
        };
    }, [isVisible]);

    // Listen for data updates from background script
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data?.type === "ANALYTICS_DATA_UPDATED") {
                fetchData();
            }
        };

        // Listen for messages from background script
        const handleChromeMessage = (message: any) => {
            if (message.type === "ANALYTICS_DATA_UPDATED") {
                fetchData();
            }
        };

        window.addEventListener("message", handleMessage);

        // Also listen for Chrome runtime messages
        if (typeof chrome !== "undefined" && chrome.runtime) {
            chrome.runtime.onMessage.addListener(handleChromeMessage);
        }

        return () => {
            window.removeEventListener("message", handleMessage);
            if (typeof chrome !== "undefined" && chrome.runtime) {
                chrome.runtime.onMessage.removeListener(handleChromeMessage);
            }
        };
    }, []);

    // Animate values when data changes
    useEffect(() => {
        if (isVisible && analyticsData) {
            const timer = setTimeout(() => {
                setAnimatedValues({
                    completionPercentage: analyticsData.completionPercentage,
                    readingTime: analyticsData.readingTime,
                    timeSpentOnPage: analyticsData.timeSpentOnPage,
                    activeTime: analyticsData.activeTime,
                    uniquePages: analyticsData.uniquePages,
                    totalWordCount: analyticsData.totalWordCount,
                });
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [isVisible, analyticsData]);

    const formatTime = (minutes: number): string => {
        if (minutes < 1) return `${Math.round(minutes * 60)}s`;
        if (minutes < 60) return `${minutes.toFixed(1)}m`;
        const hours = Math.floor(minutes / 60);
        const mins = Math.round(minutes % 60);
        return `${hours}h ${mins}m`;
    };

    const formatWordCount = (count: number): string => {
        if (count < 1000) return `${count}`;
        if (count < 1000000) return `${(count / 1000).toFixed(1)}k`;
        return `${(count / 1000000).toFixed(1)}m`;
    };

    if (!isVisible) return null;

    return (
        <div className="analytics-widget">
            {/* Collapsed State */}
            {!isExpanded && (
                <div
                    className="widget-collapsed"
                    onClick={() => setIsExpanded(true)}
                >
                    <div className="progress-indicator">
                        <div
                            className="progress-fill"
                            style={{
                                width: `${animatedValues.completionPercentage}%`,
                                transition: "width 1s ease",
                            }}
                        />
                    </div>
                    <span className="collapsed-value">
                        {Math.round(animatedValues.completionPercentage)}%
                    </span>
                    <ChevronRight size={12} className="expand-icon" />
                </div>
            )}

            {/* Expanded State */}
            {isExpanded && (
                <div className="widget-expanded">
                    <div
                        className="widget-header"
                        onClick={() => setIsExpanded(false)}
                    >
                        <span className="widget-title">Analytics</span>
                        <div className="live-indicator">●</div>
                        <ChevronRight size={12} className="collapse-icon" />
                    </div>

                    <div className="metrics-list">
                        <div className="metric-item">
                            <Eye size={10} />
                            <div className="metric-content">
                                <span className="metric-label">
                                    Page Reading
                                </span>
                                <span className="metric-value">
                                    {Math.round(
                                        animatedValues.completionPercentage,
                                    )}
                                    % · {formatTime(animatedValues.readingTime)}{" "}
                                    est
                                </span>
                            </div>
                        </div>

                        <div className="metric-item">
                            <Clock size={10} />
                            <div className="metric-content">
                                <span className="metric-label">Page Time</span>
                                <span className="metric-value">
                                    {formatTime(animatedValues.timeSpentOnPage)}{" "}
                                    · {formatTime(animatedValues.activeTime)}{" "}
                                    domain
                                </span>
                            </div>
                        </div>

                        <div className="metric-item">
                            <GitPullRequest size={10} />
                            <div className="metric-content">
                                <span className="metric-label">
                                    Domain Pages
                                </span>
                                <span className="metric-value">
                                    {animatedValues.uniquePages} unique
                                    {animatedValues.totalWordCount > 0 &&
                                        ` · ${formatWordCount(
                                            animatedValues.totalWordCount,
                                        )} words here`}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .analytics-widget {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI",
                        system-ui, sans-serif;
                    z-index: 1000;
                    font-size: 12px;
                }

                .widget-collapsed {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: rgba(245, 245, 220, 0.9);
                    border: 1px solid rgba(139, 69, 19, 0.25);
                    border-radius: 20px;
                    padding: 6px 12px 6px 8px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
                    min-width: 80px;
                }

                .widget-collapsed:hover {
                    background: rgba(245, 245, 220, 0.95);
                    border-color: rgba(139, 69, 19, 0.35);
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
                }

                .progress-indicator {
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: rgba(139, 69, 19, 0.1);
                    position: relative;
                    overflow: hidden;
                    flex-shrink: 0;
                }

                .progress-fill {
                    position: absolute;
                    top: 0;
                    left: 0;
                    height: 100%;
                    background: rgba(139, 69, 19, 0.7);
                    transform-origin: left center;
                    border-radius: 50%;
                }

                .collapsed-value {
                    font-weight: 600;
                    color: rgba(101, 67, 33, 0.9);
                    font-variant-numeric: tabular-nums;
                    font-size: 11px;
                }

                .expand-icon {
                    color: rgba(139, 69, 19, 0.6);
                    transition: transform 0.2s ease;
                }

                .widget-collapsed:hover .expand-icon {
                    transform: translateX(1px);
                }

                .widget-expanded {
                    background: rgba(245, 245, 220, 0.95);
                    border: 1px solid rgba(139, 69, 19, 0.25);
                    border-radius: 10px;
                    overflow: hidden;
                    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
                    min-width: 160px;
                    animation: expandIn 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
                }

                .widget-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 8px 12px;
                    background: rgba(139, 69, 19, 0.08);
                    border-bottom: 1px solid rgba(139, 69, 19, 0.15);
                    cursor: pointer;
                    transition: background 0.2s ease;
                    gap: 8px;
                }

                .widget-header:hover {
                    background: rgba(139, 69, 19, 0.12);
                }

                .widget-title {
                    font-weight: 600;
                    color: rgba(101, 67, 33, 0.9);
                    font-size: 11px;
                    flex: 1;
                }

                .live-indicator {
                    color: #10b981;
                    font-size: 8px;
                    animation: pulse 2s infinite;
                }

                @keyframes pulse {
                    0%,
                    100% {
                        opacity: 1;
                    }
                    50% {
                        opacity: 0.5;
                    }
                }

                .collapse-icon {
                    color: rgba(139, 69, 19, 0.6);
                    transform: rotate(90deg);
                    transition: transform 0.2s ease;
                }

                .widget-header:hover .collapse-icon {
                    transform: rotate(90deg) translateX(1px);
                }

                .metrics-list {
                    padding: 8px;
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }

                .metric-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 5px 6px;
                    border-radius: 5px;
                    transition: background 0.2s ease;
                }

                .metric-item:hover {
                    background: rgba(139, 69, 19, 0.08);
                }

                .metric-item svg {
                    color: rgba(139, 69, 19, 0.7);
                    flex-shrink: 0;
                }

                .metric-content {
                    display: flex;
                    flex-direction: column;
                    gap: 1px;
                    flex: 1;
                }

                .metric-label {
                    font-size: 9px;
                    font-weight: 600;
                    color: rgba(139, 69, 19, 0.7);
                    text-transform: uppercase;
                    letter-spacing: 0.3px;
                    line-height: 1;
                }

                .metric-value {
                    font-weight: 500;
                    color: rgba(101, 67, 33, 0.95);
                    font-variant-numeric: tabular-nums;
                    font-size: 11px;
                    line-height: 1.2;
                }

                @keyframes expandIn {
                    from {
                        opacity: 0;
                        transform: scale(0.9) translateY(8px);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                }
            `}</style>
        </div>
    );
};

export default AnalyticsModal;
