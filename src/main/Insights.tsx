import React, { useState, useEffect, useRef } from "react";
import { Send } from "lucide-react";
import DataService from "../data/dataService";
import {
    fetchYouTubeMetadata,
    isYouTubeUrl,
} from "../graph/utils/youtubeMetadata";

interface Insight {
    id: string;
    text: string;
    type: "insight" | "nudge" | "user";
    cta?: string;
    hasChart?: boolean;
    chartData?: { label: string; value: number }[];
}

const Insights: React.FC = () => {
    const [visibleInsights, setVisibleInsights] = useState<number>(0);
    const [insights, setInsights] = useState<Insight[]>([]);
    const [message, setMessage] = useState("");
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const loadInsights = async () => {
            const dataService = DataService.getInstance();
            const session = await dataService.getCurrentSession();
            const allVisits = session.tabSessions.flatMap((ts) => ts.urlVisits);

            // Calculate total tabs and active time
            const totalTabs = session.tabSessions.length;
            const totalActiveMinutes = Math.round(
                session.stats.totalTime / (1000 * 60),
            );

            // Calculate top domains by time
            const domainTimes = new Map<string, number>();
            allVisits.forEach((visit) => {
                const current = domainTimes.get(visit.domain) || 0;
                domainTimes.set(visit.domain, current + visit.activeTime);
            });

            const topDomains = Array.from(domainTimes.entries())
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5) // Get top 5 instead of 3
                .map(([domain, time]) => ({
                    label: domain,
                    value: Math.round(time / (1000 * 60)), // Convert to minutes
                }));

            // Calculate YouTube channel times
            const youtubeVisits = allVisits.filter((visit) =>
                isYouTubeUrl(visit.url),
            );
            const channelTimes = new Map<string, number>();
            for (const visit of youtubeVisits) {
                const metadata = await fetchYouTubeMetadata(visit.url);
                if (metadata) {
                    const current = channelTimes.get(metadata.author_name) || 0;
                    channelTimes.set(
                        metadata.author_name,
                        current + visit.activeTime,
                    );
                }
            }
            const topChannel = Array.from(channelTimes.entries()).sort(
                ([, a], [, b]) => b - a,
            )[0];

            // Calculate time after 10 PM
            const after10PMTime = allVisits.reduce((total, visit) => {
                const visitDate = new Date(visit.startTime);
                if (visitDate.getHours() >= 22) {
                    // 10 PM or later
                    return total + visit.activeTime;
                }
                return total;
            }, 0);
            const after10PMMinutes = Math.round(after10PMTime / (1000 * 60));

            setInsights([
                {
                    id: "1",
                    text: `You opened ${totalTabs} tabs today, and spent ${totalActiveMinutes} minutes on your browser.`,
                    type: "insight",
                },
                {
                    id: "2",
                    text: `${topDomains[0].label} took most of your time today.`,
                    type: "insight",
                    hasChart: true,
                    chartData: topDomains,
                },
                {
                    id: "3",
                    text: topChannel
                        ? `You watched ${Math.round(
                              topChannel[1] / (1000 * 60),
                          )} minutes of ${
                              topChannel[0]
                          }, consider setting a limit?`
                        : "No YouTube activity detected today.",
                    type: "nudge",
                    cta: "Set limit",
                },
                {
                    id: "4",
                    text:
                        after10PMMinutes > 0
                            ? `You spent ${after10PMMinutes} minutes after 10 PM. Consider setting a daily limit?`
                            : "No late night browsing detected today.",
                    type: "nudge",
                    cta: "Set limit",
                },
            ]);
        };

        loadInsights();
    }, []);

    useEffect(() => {
        // Start animation after component mounts and when new messages are added
        const timer = setTimeout(() => {
            const showNextInsight = () => {
                setVisibleInsights((prev) => {
                    if (prev < insights.length) {
                        setTimeout(showNextInsight, 800); // 800ms delay between each bubble
                        return prev + 1;
                    }
                    return prev;
                });
            };
            showNextInsight();
        }, 300); // Initial delay before first bubble

        return () => clearTimeout(timer);
    }, [insights.length]);

    // When new user messages are added, show them immediately
    useEffect(() => {
        if (insights.length > visibleInsights) {
            setVisibleInsights(insights.length);
        }
    }, [insights.length]);

    // Auto-scroll to bottom when new messages are added
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop =
                chatContainerRef.current.scrollHeight;
        }
    }, [visibleInsights, insights]);

    const handleSendMessage = () => {
        if (message.trim()) {
            const newUserMessage: Insight = {
                id: `user-${Date.now()}`,
                text: message.trim(),
                type: "user",
            };

            setInsights((prev) => [...prev, newUserMessage]);
            setMessage("");
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const renderMicroChart = (data?: { label: string; value: number }[]) => {
        if (!data) return null;

        return (
            <div
                style={{
                    width: "calc(100% - 24px)", // Subtract padding to stay within bubble
                    backgroundColor: "rgba(0, 0, 0, 0.05)",
                    borderRadius: "12px",
                    marginTop: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-evenly", // Changed to space-evenly for better distribution
                    padding: "12px",
                    flexWrap: "wrap", // Allow wrapping if needed
                    gap: "8px", // Reduced gap
                }}
            >
                {data.map((item, i) => (
                    <div
                        key={i}
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            minWidth: "20px", // Set minimum width
                            animation: `iconFadeIn 0.4s ease-out ${
                                i * 0.1
                            }s both`,
                        }}
                    >
                        <div
                            style={{
                                fontSize: "10px",
                                fontWeight: "600",
                                color: "rgba(0, 0, 0, 0.7)",
                                marginBottom: "4px",
                                whiteSpace: "nowrap", // Prevent text wrapping
                            }}
                        >
                            {item.value}m
                        </div>
                        <img
                            src={`https://www.google.com/s2/favicons?domain=${item.label}&sz=20`}
                            alt={item.label}
                            style={{
                                width: "20px",
                                height: "20px",
                                objectFit: "contain",
                                borderRadius: "3px",
                            }}
                        />
                    </div>
                ))}
            </div>
        );
    };

    const renderCTA = (cta: string) => (
        <button
            style={{
                marginTop: "8px",
                padding: "4px 10px", // Reduced padding for smaller height
                backgroundColor: "rgba(0, 0, 0, 0.1)",
                border: "1px solid rgba(0, 0, 0, 0.15)",
                borderRadius: "12px", // Smaller border radius
                color: "rgba(0, 0, 0, 0.7)",
                fontSize: "11px", // Slightly smaller font
                fontWeight: "500",
                cursor: "pointer",
                transition: "all 0.2s ease",
                animation: "ctaFadeIn 0.3s ease-out 0.2s both",
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.15)";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.1)";
            }}
        >
            {cta}
        </button>
    );

    const allMessages = insights.slice(0, visibleInsights);

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

                @keyframes bubbleSlideIn {
                    0% {
                        opacity: 0;
                        transform: translateY(20px) scale(0.8);
                    }
                    50% {
                        transform: translateY(-2px) scale(1.02);
                    }
                    100% {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }

                @keyframes iconFadeIn {
                    0% {
                        opacity: 0;
                        transform: scale(0.5);
                    }
                    100% {
                        opacity: 1;
                        transform: scale(1);
                    }
                }

                @keyframes ctaFadeIn {
                    0% {
                        opacity: 0;
                        transform: scale(0.8);
                    }
                    100% {
                        opacity: 1;
                        transform: scale(1);
                    }
                }

                .bubble-enter {
                    animation: bubbleSlideIn 0.5s ease-out both;
                }
            `}</style>

            <div
                style={{
                    width: "100%",
                    height: "90%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    backgroundColor: "#ffff",
                    padding: "40px 20px 20px 20px",
                    overflowX: "hidden",
                }}
            >
                {/* Chat View Box */}
                <div
                    ref={chatContainerRef}
                    style={{
                        width: "80%",
                        maxWidth: "600px",
                        height: "calc(100% - 120px)", // Leave space for input box
                        backgroundColor: "#ffffff",
                        // border: "2px solid #ddd",
                        borderRadius: "16px",
                        // boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                        overflowY: "auto",
                        padding: "20px",
                        marginBottom: "20px",
                        fontFamily:
                            "Nunito-Regular, Helvetica Neue, Helvetica, sans-serif",
                        fontSize: "16px",
                    }}
                >
                    {allMessages.map((insight) => {
                        const isUser = insight.type === "user";

                        return (
                            <div
                                key={insight.id}
                                className="bubble-enter"
                                style={{
                                    width: "fit-content",
                                    maxWidth: "280px",
                                    minWidth: "10px", // Minimum width for very short messages
                                    wordWrap: "break-word",
                                    marginBottom: "12px",
                                    lineHeight: "24px",
                                    position: "relative",
                                    padding: "12px 18px",
                                    borderRadius: "25px",
                                    alignSelf: isUser
                                        ? "flex-end"
                                        : "flex-start",
                                    backgroundColor: isUser
                                        ? "#0B93F6"
                                        : "#E5E5EA",
                                    color: isUser ? "white" : "black",
                                    textAlign: "left",
                                    display: "block",
                                    marginLeft: isUser ? "auto" : "0",
                                    marginRight: isUser ? "0" : "auto",
                                }}
                            >
                                {/* Chat bubble tails */}
                                <div
                                    style={{
                                        content: "",
                                        position: "absolute",
                                        bottom: "0",
                                        height: "25px",
                                        width: "20px",
                                        backgroundColor: isUser
                                            ? "#0B93F6"
                                            : "#E5E5EA",
                                        borderBottomLeftRadius: isUser
                                            ? "16px 14px"
                                            : "0",
                                        borderBottomRightRadius: isUser
                                            ? "0"
                                            : "16px 14px",
                                        left: isUser ? "auto" : "-7px",
                                        right: isUser ? "-7px" : "auto",
                                    }}
                                />
                                <div
                                    style={{
                                        content: "",
                                        position: "absolute",
                                        bottom: "0",
                                        height: "25px",
                                        width: "26px",
                                        backgroundColor: "white",
                                        borderBottomLeftRadius: isUser
                                            ? "10px"
                                            : "0",
                                        borderBottomRightRadius: isUser
                                            ? "0"
                                            : "10px",
                                        left: isUser ? "auto" : "-26px",
                                        right: isUser ? "-26px" : "auto",
                                    }}
                                />

                                {/* Content */}
                                <div
                                    style={{ position: "relative", zIndex: 1 }}
                                >
                                    {insight.text}
                                    {insight.hasChart &&
                                        renderMicroChart(insight.chartData)}
                                    {insight.cta && renderCTA(insight.cta)}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Message Input Box */}
                <div
                    style={{
                        width: "60%", // Smaller than chat view box
                        maxWidth: "400px",
                        display: "flex",
                        alignItems: "flex-end",
                        gap: "12px",
                        padding: "12px 16px",
                        backgroundColor: "#ffffff",
                        border: "1px solid #ddd",
                        borderRadius: "24px",
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                        transition: "all 0.2s ease",
                    }}
                >
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Why was I off-track today?"
                        style={{
                            flex: 1,
                            border: "none",
                            outline: "none",
                            resize: "none",
                            fontFamily: "Nunito-Regular, Arial, sans-serif",
                            fontSize: "14px",
                            color: "#2d3436",
                            backgroundColor: "transparent",
                            minHeight: "20px",
                            maxHeight: "80px",
                            lineHeight: "20px",
                            padding: "0",
                        }}
                        rows={1}
                        onInput={(e) => {
                            const target = e.target as HTMLTextAreaElement;
                            target.style.height = "20px";
                            target.style.height = `${Math.min(
                                target.scrollHeight,
                                80,
                            )}px`;
                        }}
                    />

                    <button
                        onClick={handleSendMessage}
                        disabled={!message.trim()}
                        style={{
                            padding: "6px",
                            backgroundColor: message.trim()
                                ? "#4285f4"
                                : "#e0e0e0",
                            border: "none",
                            borderRadius: "10px",
                            cursor: message.trim() ? "pointer" : "not-allowed",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "all 0.2s ease",
                            color: message.trim() ? "white" : "#999",
                        }}
                        onMouseEnter={(e) => {
                            if (message.trim()) {
                                e.currentTarget.style.backgroundColor =
                                    "#3367d6";
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (message.trim()) {
                                e.currentTarget.style.backgroundColor =
                                    "#4285f4";
                            }
                        }}
                    >
                        <Send size={14} />
                    </button>
                </div>
            </div>
        </>
    );
};

export default Insights;
