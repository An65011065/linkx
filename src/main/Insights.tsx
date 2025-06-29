import React, { useState, useEffect, useRef } from "react";
import { Send } from "lucide-react";
import DataService from "../data/dataService";
import {
    fetchYouTubeMetadata,
    isYouTubeUrl,
} from "../graph/utils/youtubeMetadata";
import AIService from "./services/AIService";

interface Insight {
    id: string;
    text: string;
    type: "insight" | "nudge" | "user";
    cta?: string;
    hasChart?: boolean;
    chartData?: { label: string; value: number }[];
}

interface InsightsProps {
    onInputFocusChange: (focused: boolean) => void;
}

const Insights: React.FC<InsightsProps> = ({ onInputFocusChange }) => {
    const [visibleInsights, setVisibleInsights] = useState<number>(0);
    const [insights, setInsights] = useState<Insight[]>([]);
    const [message, setMessage] = useState("");
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setInsights([
            {
                id: "1",
                text: "Loading your browsing stats...",
                type: "insight",
            },
            {
                id: "2",
                text: "Analyzing your most visited sites...",
                type: "insight",
            },
            {
                id: "3",
                text: "Checking your YouTube activity...",
                type: "nudge",
            },
            {
                id: "4",
                text: "Looking at your late night browsing...",
                type: "nudge",
            },
        ]);

        const loadInsights = async () => {
            try {
                const dataService = DataService.getInstance();
                const session = await dataService.getCurrentSession();
                const allVisits = session.tabSessions.flatMap(
                    (ts) => ts.urlVisits,
                );
                const totalTabs = session.tabSessions.length;
                const totalActiveMinutes = Math.round(
                    session.stats.totalTime / (1000 * 60),
                );

                setInsights((prev) => [
                    {
                        id: "1",
                        text: `You opened ${totalTabs} tabs today, and spent ${totalActiveMinutes} minutes on your browser.`,
                        type: "insight",
                    },
                    ...prev.slice(1),
                ]);

                const domainTimes = new Map<string, number>();
                allVisits.forEach((visit) => {
                    const current = domainTimes.get(visit.domain) || 0;
                    domainTimes.set(visit.domain, current + visit.activeTime);
                });

                const topDomains = Array.from(domainTimes.entries())
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([domain, time]) => ({
                        label: domain,
                        value: Math.round(time / (1000 * 60)),
                    }));

                setInsights((prev) => [
                    prev[0],
                    {
                        id: "2",
                        text:
                            topDomains.length > 0
                                ? `${topDomains[0].label} took most of your time today.`
                                : "No significant site usage detected.",
                        type: "insight",
                        hasChart: topDomains.length > 0,
                        chartData:
                            topDomains.length > 0 ? topDomains : undefined,
                    },
                    ...prev.slice(2),
                ]);

                const after10PMTime = allVisits.reduce((total, visit) => {
                    const visitDate = new Date(visit.startTime);
                    return visitDate.getHours() >= 22
                        ? total + visit.activeTime
                        : total;
                }, 0);
                const after10PMMinutes = Math.round(
                    after10PMTime / (1000 * 60),
                );

                setInsights((prev) => [
                    ...prev.slice(0, 3),
                    {
                        id: "4",
                        text:
                            after10PMMinutes > 0
                                ? `You spent ${after10PMMinutes} minutes after 10 PM. Consider setting a daily limit?`
                                : "No late night browsing detected today.",
                        type: "nudge",
                        cta: after10PMMinutes > 0 ? "Set limit" : undefined,
                    },
                ]);

                const youtubeVisits = allVisits.filter((visit) =>
                    isYouTubeUrl(visit.url),
                );
                if (youtubeVisits.length > 0) {
                    const channelTimes = new Map<string, number>();
                    await Promise.allSettled(
                        youtubeVisits.map(async (visit) => {
                            try {
                                const metadata = await fetchYouTubeMetadata(
                                    visit.url,
                                );
                                if (metadata) {
                                    const current =
                                        channelTimes.get(
                                            metadata.author_name,
                                        ) || 0;
                                    channelTimes.set(
                                        metadata.author_name,
                                        current + visit.activeTime,
                                    );
                                }
                            } catch (error) {
                                console.warn(
                                    "Failed to fetch YouTube metadata for:",
                                    visit.url,
                                );
                            }
                        }),
                    );

                    const topChannel = Array.from(channelTimes.entries()).sort(
                        ([, a], [, b]) => b - a,
                    )[0];
                    setInsights((prev) => [
                        ...prev.slice(0, 2),
                        {
                            id: "3",
                            text: topChannel
                                ? `You watched ${Math.round(
                                      topChannel[1] / (1000 * 60),
                                  )} minutes of ${
                                      topChannel[0]
                                  }, consider setting a limit?`
                                : "YouTube activity detected but couldn't analyze channels.",
                            type: "nudge",
                            cta: topChannel ? "Set limit" : undefined,
                        },
                        prev[3],
                    ]);
                } else {
                    setInsights((prev) => [
                        ...prev.slice(0, 2),
                        {
                            id: "3",
                            text: "No YouTube activity detected today.",
                            type: "nudge",
                        },
                        prev[3],
                    ]);
                }
            } catch (error) {
                console.error("Error loading insights:", error);
            }
        };

        loadInsights();
    }, []);

    useEffect(() => {
        if (visibleInsights === 0 && insights.length > 0) {
            setVisibleInsights(1);
            const showNextInsight = () => {
                setVisibleInsights((prev) => {
                    if (prev < insights.length) {
                        setTimeout(showNextInsight, 800);
                        return prev + 1;
                    }
                    return prev;
                });
            };
            setTimeout(showNextInsight, 800);
        }
    }, [insights.length, visibleInsights]);

    useEffect(() => {
        if (insights.length > visibleInsights && visibleInsights > 0) {
            setVisibleInsights(insights.length);
        }
    }, [insights.length]);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop =
                chatContainerRef.current.scrollHeight;
        }
    }, [visibleInsights, insights]);

    const handleSendMessage = async () => {
        if (message.trim()) {
            const newUserMessage: Insight = {
                id: `user-${Date.now()}`,
                text: message.trim(),
                type: "user",
            };
            setInsights((prev) => [...prev, newUserMessage]);
            setMessage("");

            try {
                const loadingMessage: Insight = {
                    id: `ai-loading-${Date.now()}`,
                    text: "",
                    type: "insight",
                };
                setInsights((prev) => [...prev, loadingMessage]);

                const aiService = AIService.getInstance();
                const response = await aiService.generateResponse(
                    message.trim(),
                );

                setInsights((prev) => {
                    const filtered = prev.filter(
                        (msg) => msg.id !== loadingMessage.id,
                    );
                    return [
                        ...filtered,
                        {
                            id: `ai-${Date.now()}`,
                            text: response,
                            type: "insight",
                        },
                    ];
                });
            } catch (error) {
                console.error("Error getting AI response:", error);
                setInsights((prev) => [
                    ...prev,
                    {
                        id: `error-${Date.now()}`,
                        text: "Sorry, I couldn't process your message at the moment.",
                        type: "insight",
                    },
                ]);
            }
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
                    width: "calc(100% - 24px)",
                    backgroundColor: "rgba(0, 0, 0, 0.05)",
                    borderRadius: "12px",
                    marginTop: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-evenly",
                    padding: "12px",
                    flexWrap: "wrap",
                    gap: "8px",
                }}
            >
                {data.map((item, i) => (
                    <div
                        key={i}
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            minWidth: "20px",
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
                                whiteSpace: "nowrap",
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
                padding: "4px 10px",
                backgroundColor: "rgba(0, 0, 0, 0.1)",
                border: "1px solid rgba(0, 0, 0, 0.15)",
                borderRadius: "12px",
                color: "rgba(0, 0, 0, 0.7)",
                fontSize: "11px",
                fontWeight: "500",
                cursor: "pointer",
                transition: "all 0.2s ease",
                animation: "ctaFadeIn 0.3s ease-out 0.2s both",
            }}
            onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.15)")
            }
            onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.1)")
            }
        >
            {cta}
        </button>
    );

    const allMessages = insights.slice(0, visibleInsights);

    return (
        <>
            <style>{`
                @font-face { font-family: 'Nunito-Regular'; src: url('${chrome.runtime.getURL(
                    "src/assets/fonts/Nunito-Regular.ttf",
                )}') format('truetype'); font-weight: 400; font-style: normal; }
                @font-face { font-family: 'Nunito-Bold'; src: url('${chrome.runtime.getURL(
                    "src/assets/fonts/Nunito-Bold.ttf",
                )}') format('truetype'); font-weight: 700; font-style: normal; }
                @keyframes bubbleSlideIn { 0% { opacity: 0; transform: translateY(20px) scale(0.8); } 50% { transform: translateY(-2px) scale(1.02); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
                @keyframes iconFadeIn { 0% { opacity: 0; transform: scale(0.5); } 100% { opacity: 1; transform: scale(1); } }
                @keyframes ctaFadeIn { 0% { opacity: 0; transform: scale(0.8); } 100% { opacity: 1; transform: scale(1); } }
                @keyframes dotPulse { 0% { background-color: rgba(150, 150, 150, 0.4); } 33.333% { background-color: rgba(150, 150, 150, 1); } 66.667% { background-color: rgba(150, 150, 150, 0.4); } 100% { background-color: rgba(150, 150, 150, 0.4); } }
                @keyframes dotPulseTwo { 0% { background-color: rgba(150, 150, 150, 0.4); } 33.333% { background-color: rgba(150, 150, 150, 0.4); } 66.667% { background-color: rgba(150, 150, 150, 1); } 100% { background-color: rgba(150, 150, 150, 0.4); } }
                @keyframes dotPulseThree { 0% { background-color: rgba(150, 150, 150, 0.4); } 33.333% { background-color: rgba(150, 150, 150, 0.4); } 66.667% { background-color: rgba(150, 150, 150, 0.4); } 100% { background-color: rgba(150, 150, 150, 1); } }
                .bubble-enter { animation: bubbleSlideIn 0.5s ease-out both; }
            `}</style>
            <div
                style={{
                    width: "100%",
                    height: "90%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    backgroundColor: "transparent",
                    padding: "40px 20px 20px 20px",
                    overflowX: "hidden",
                }}
            >
                <div
                    ref={chatContainerRef}
                    style={{
                        width: "80%",
                        maxWidth: "600px",
                        height: "calc(100% - 120px)",
                        borderRadius: "16px",
                        overflowY: "auto",
                        overflowX: "hidden",
                        display: "flex",
                        flexDirection: "column",
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
                                    minWidth: "10px",
                                    wordWrap: "break-word",
                                    wordBreak: "break-word",
                                    marginBottom: "12px",
                                    lineHeight: "24px",
                                    position: "relative",
                                    padding: "12px 18px",
                                    borderRadius: "25px",
                                    alignSelf: isUser
                                        ? "flex-end"
                                        : "flex-start",
                                    backgroundColor: isUser
                                        ? "rgba(11, 147, 246, 0.1)"
                                        : "rgba(229, 229, 234, 0.1)",
                                    backdropFilter: "blur(8px)",
                                    WebkitBackdropFilter: "blur(8px)",
                                    border: isUser
                                        ? "1px solid rgba(11, 147, 246, 0.2)"
                                        : "1px solid rgba(255, 255, 255, 0.4)",
                                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.02)",
                                    color: isUser ? "#0a4174" : "#2D3436",
                                    textAlign: "left",
                                    display: "block",
                                    marginLeft: isUser ? "auto" : "0",
                                    marginRight: isUser ? "0" : "auto",
                                }}
                            >
                                <div
                                    style={{ position: "relative", zIndex: 1 }}
                                >
                                    {insight.id.includes("ai-loading") ? (
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "4px",
                                                padding: "2px 0",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: "8px",
                                                    height: "8px",
                                                    borderRadius: "50%",
                                                    backgroundColor:
                                                        "rgba(150, 150, 150, 0.4)",
                                                    animation:
                                                        "dotPulse 1s ease-in-out infinite",
                                                }}
                                            />
                                            <div
                                                style={{
                                                    width: "8px",
                                                    height: "8px",
                                                    borderRadius: "50%",
                                                    backgroundColor:
                                                        "rgba(150, 150, 150, 0.4)",
                                                    animation:
                                                        "dotPulseTwo 1s ease-in-out infinite",
                                                }}
                                            />
                                            <div
                                                style={{
                                                    width: "8px",
                                                    height: "8px",
                                                    borderRadius: "50%",
                                                    backgroundColor:
                                                        "rgba(150, 150, 150, 0.4)",
                                                    animation:
                                                        "dotPulseThree 1s ease-in-out infinite",
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        insight.text
                                    )}
                                    {insight.hasChart &&
                                        renderMicroChart(insight.chartData)}
                                    {insight.cta && renderCTA(insight.cta)}
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div
                    style={{
                        width: "60%",
                        maxWidth: "400px",
                        display: "flex",
                        alignItems: "flex-end",
                        gap: "12px",
                        padding: "12px 16px",
                        backgroundColor: "rgba(255, 255, 255, 0.9)",
                        border: "1px solid #ddd",
                        borderRadius: "24px",
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                        transition: "all 0.2s ease",
                        backdropFilter: "blur(10px)",
                    }}
                >
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        onFocus={() => onInputFocusChange(true)}
                        onBlur={() => onInputFocusChange(false)}
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
                            if (message.trim())
                                e.currentTarget.style.backgroundColor =
                                    "#3367d6";
                        }}
                        onMouseLeave={(e) => {
                            if (message.trim())
                                e.currentTarget.style.backgroundColor =
                                    "#4285f4";
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
