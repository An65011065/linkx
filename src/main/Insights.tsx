import React, { useState, useEffect, useRef } from "react";
import { Send, Download } from "lucide-react";
import DataService from "../data/dataService";
import AIService from "./services/AIService";
import { freeTrial } from "./MainTab";

interface Insight {
    id: string;
    text: string;
    type: "insight" | "nudge" | "user";
    cta?: string;
}

interface InsightsProps {
    onInputFocusChange: (focused: boolean) => void;
}

// Persistent storage for insights
let persistentInsights: Insight[] = [];
let insightsLoaded = false;

const welcomeMessages = [
    "Hey! How was your day online?",
    "Heyy! How was your day today?",
    "Hey! Curious about your online journey today?",
];

const getRandomWelcome = () => {
    return welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
};

const Insights: React.FC<InsightsProps> = ({ onInputFocusChange }) => {
    const [visibleInsights, setVisibleInsights] = useState<number>(0);
    const [insights, setInsights] = useState<Insight[]>(persistentInsights);
    const [message, setMessage] = useState("");
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // If insights are already loaded, show them all immediately
        if (insightsLoaded && persistentInsights.length > 0) {
            setInsights(persistentInsights);
            setVisibleInsights(persistentInsights.length);
            return;
        }

        // First time loading - show welcome message first
        if (!insightsLoaded) {
            const welcomeInsight: Insight = {
                id: "welcome",
                text: getRandomWelcome(),
                type: "insight",
            };

            setInsights([welcomeInsight]);
            setVisibleInsights(1);

            // Add help message after delay with animation
            setTimeout(() => {
                const helpInsight: Insight = {
                    id: "help-message",
                    text: "Let me know if I can help you with anything!",
                    type: "insight",
                };

                const newInsights = [welcomeInsight, helpInsight];
                setInsights(newInsights);
                setVisibleInsights(2);
                persistentInsights = newInsights;
                insightsLoaded = true;
            }, 1000);

            // Load data in background
            DataService.getInstance().getCurrentSession().catch(console.error);
        }
    }, []);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop =
                chatContainerRef.current.scrollHeight;
        }
    }, [visibleInsights, insights]);

    const downloadBrowsingData = async () => {
        try {
            console.log("📊 Preparing browsing data for download...");

            // Get the same data that's sent to the assistant
            const aiService = AIService.getInstance();
            const browsingContext = await aiService.getAllBrowsingData();

            if (!browsingContext) {
                console.error("No browsing data available");
                alert("No browsing data available to download");
                return;
            }

            // Create CSV content (same as Firebase function)
            const visits = browsingContext.today.allVisits || [];
            const sortedVisits = [...visits].sort(
                (a, b) => b.startTime - a.startTime,
            );

            const headers = [
                "domain",
                "title",
                "date",
                "readableTime",
                "activeTimeMinutes",
            ];

            const rows = sortedVisits.map((visit) => {
                const date = new Date(visit.startTime);
                const timeDisplay =
                    visit.readableTime ||
                    date.toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                    });

                return [
                    visit.domain || "",
                    (visit.title || "").replace(/"/g, '""'),
                    date.toISOString().split("T")[0],
                    timeDisplay,
                    visit.activeTimeMinutes || 0,
                ];
            });

            // Add summary row (5 columns to match headers)
            const summaryRow = [
                "SUMMARY_DATA",
                `Total visits: ${sortedVisits.length}, Active minutes: ${browsingContext.today.totalActiveMinutes}, Sessions: ${browsingContext.today.tabSessions}`,
                browsingContext.today.date,
                "Summary",
                browsingContext.today.totalActiveMinutes,
            ];

            const csvLines = [
                headers.join(","),
                summaryRow.map((cell) => `"${cell}"`).join(","),
                ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
            ];

            const csvContent = csvLines.join("\n");

            // Create and download file
            const blob = new Blob([csvContent], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `browsing-data-${browsingContext.today.date}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            console.log("✅ CSV downloaded successfully");

            // Show success message in chat
            const downloadInsight: Insight = {
                id: `download-${Date.now()}`,
                text: `📊 Downloaded ${sortedVisits.length} visits from ${browsingContext.today.date}`,
                type: "insight",
            };

            const updatedInsights = [...insights, downloadInsight];
            setInsights(updatedInsights);
            setVisibleInsights(updatedInsights.length);
            persistentInsights = updatedInsights;
        } catch (error) {
            console.error("❌ Error downloading browsing data:", error);
            alert("Error downloading data. Check console for details.");
        }
    };

    const handleSendMessage = async () => {
        if (!message.trim()) return;

        const newUserMessage: Insight = {
            id: `user-${Date.now()}`,
            text: message.trim(),
            type: "user",
        };

        const updatedInsights = [...insights, newUserMessage];
        setInsights(updatedInsights);
        setVisibleInsights(updatedInsights.length);
        persistentInsights = updatedInsights;
        setMessage("");

        // Check if free trial is active
        if (freeTrial) {
            const freeTrialMessage: Insight = {
                id: `freetrial-${Date.now()}`,
                text: "Hi, I would love to help but your plan does not support LyncX conversations.",
                type: "insight",
            };

            const finalInsights = [...updatedInsights, freeTrialMessage];
            setInsights(finalInsights);
            setVisibleInsights(finalInsights.length);
            persistentInsights = finalInsights;
            return;
        }

        try {
            const loadingMessage: Insight = {
                id: `ai-loading-${Date.now()}`,
                text: "",
                type: "insight",
            };
            const withLoading = [...updatedInsights, loadingMessage];
            setInsights(withLoading);
            setVisibleInsights(withLoading.length);

            const aiService = AIService.getInstance();
            const response = await aiService.generateResponse(message.trim());

            const finalInsights = [
                ...updatedInsights,
                {
                    id: `ai-${Date.now()}`,
                    text: response,
                    type: "insight" as const,
                },
            ];

            setInsights(finalInsights);
            setVisibleInsights(finalInsights.length);
            persistentInsights = finalInsights;
        } catch (error) {
            console.error("Error getting AI response:", error);
            const errorInsights = [
                ...updatedInsights,
                {
                    id: `error-${Date.now()}`,
                    text: "Sorry, I couldn't process your message at the moment.",
                    type: "insight" as const,
                },
            ];
            setInsights(errorInsights);
            setVisibleInsights(errorInsights.length);
            persistentInsights = errorInsights;
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <>
            <style>{`
                @font-face { font-family: 'Nunito-Medium'; src: url('${chrome.runtime.getURL(
                    "src/assets/fonts/Nunito-Medium.ttf",
                )}') format('truetype'); font-weight: 400; font-style: normal; }
                @font-face { font-family: 'Nunito-Bold'; src: url('${chrome.runtime.getURL(
                    "src/assets/fonts/Nunito-Bold.ttf",
                )}') format('truetype'); font-weight: 700; font-style: normal; }
                @keyframes bubbleSlideIn { 0% { opacity: 0; transform: translateY(20px) scale(0.8); } 50% { transform: translateY(-2px) scale(1.02); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
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
                            "Nunito-Medium, Helvetica Neue, Helvetica, sans-serif",
                        fontSize: "16px",
                    }}
                >
                    {insights.slice(0, visibleInsights).map((insight) => {
                        const isUser = insight.type === "user";
                        return (
                            <div
                                key={insight.id}
                                className="bubble-enter"
                                style={{
                                    width: "fit-content",
                                    maxWidth: "280px",
                                    wordWrap: "break-word",
                                    wordBreak: "break-word",
                                    marginBottom: "12px",
                                    lineHeight: "24px",
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
                                    marginLeft: isUser ? "auto" : "0",
                                    marginRight: isUser ? "0" : "auto",
                                }}
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
                    <button
                        onClick={downloadBrowsingData}
                        style={{
                            padding: "6px",
                            backgroundColor: "#6c757d",
                            border: "none",
                            borderRadius: "10px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "all 0.2s ease",
                            color: "white",
                        }}
                        title="Download browsing data CSV"
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#5a6268";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "#6c757d";
                        }}
                    >
                        <Download size={14} />
                    </button>
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
                            fontFamily: "Nunito-Medium, Arial, sans-serif",
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
