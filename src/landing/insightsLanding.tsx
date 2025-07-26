import React, { useState, useEffect, useRef } from "react";
import { Download, ArrowRight } from "lucide-react";
import FloatingHeader from "./FloatingHeader";
import DataService from "../data/dataService";
import AIService from "../main/services/AIService";
import { freeTrial } from "../main/MainTab";

interface InsightsLandingPageProps {
    isDarkMode: boolean;
    onToggleDarkMode: () => void;
    currentPage: "main" | "data" | "network" | "maintab" | "insights";
    onNavigate: (
        page: "main" | "data" | "network" | "maintab" | "insights",
        query?: string,
    ) => void;
    initialQuery?: string;
}

interface Insight {
    id: string;
    text: string;
    type: "insight" | "user";
}

const InsightsLandingPage: React.FC<InsightsLandingPageProps> = ({
    isDarkMode,
    onToggleDarkMode,
    currentPage,
    onNavigate,
    initialQuery = "",
}) => {
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [insights, setInsights] = useState<Insight[]>([]);
    const [message, setMessage] = useState(initialQuery);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const timer = setTimeout(() => setIsInitialLoad(false), 100);
        return () => clearTimeout(timer);
    }, []);

    // Auto-scroll to bottom when new insights are added
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop =
                chatContainerRef.current.scrollHeight;
        }
    }, [insights]);

    // Auto-submit initial query if provided
    useEffect(() => {
        if (initialQuery && initialQuery.trim() && insights.length === 0) {
            setTimeout(() => {
                handleSendMessage();
            }, 1000);
        }
    }, [initialQuery]);

    const downloadBrowsingData = async () => {
        try {
            const dataService = DataService.getInstance();
            const currentSession = await dataService.getCurrentSession();
            const browsingContext = {
                today: {
                    date: currentSession.date,
                    totalActiveMinutes: Math.round(
                        currentSession.stats.totalTime / (1000 * 60),
                    ),
                    tabSessions: currentSession.tabSessions.length,
                    allVisits: currentSession.tabSessions
                        .flatMap((ts) => ts.urlVisits)
                        .sort((a, b) => b.startTime - a.startTime),
                },
            };

            if (!browsingContext) {
                alert("No browsing data available to download");
                return;
            }

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
            const blob = new Blob([csvContent], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `browsing-data-${browsingContext.today.date}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            // Add success message to chat
            const downloadInsight: Insight = {
                id: `download-${Date.now()}`,
                text: `📊 Downloaded ${sortedVisits.length} visits from ${browsingContext.today.date}`,
                type: "insight",
            };
            setInsights((prev) => [...prev, downloadInsight]);
        } catch (error) {
            console.error("Error downloading browsing data:", error);
            alert("Error downloading data. Check console for details.");
        }
    };

    const handleSendMessage = async () => {
        if (!message.trim()) return;

        // Add user message
        const userMessage: Insight = {
            id: `user-${Date.now()}`,
            text: message.trim(),
            type: "user",
        };
        setInsights((prev) => [...prev, userMessage]);
        const currentMessage = message.trim();
        setMessage("");
        setIsLoading(true);

        // Check if free trial is active
        if (freeTrial) {
            const freeTrialMessage: Insight = {
                id: `freetrial-${Date.now()}`,
                text: "Hi, I would love to help but your plan does not support LyncX conversations.",
                type: "insight",
            };
            setInsights((prev) => [...prev, freeTrialMessage]);
            setIsLoading(false);
            return;
        }

        try {
            const aiService = AIService.getInstance();
            const response = await aiService.generateInsightsResponse(
                currentMessage,
            );

            const aiResponse: Insight = {
                id: `ai-${Date.now()}`,
                text: response,
                type: "insight",
            };
            setInsights((prev) => [...prev, aiResponse]);
        } catch (error) {
            console.error("Error getting AI response:", error);
            const errorMessage: Insight = {
                id: `error-${Date.now()}`,
                text: "Sorry, I couldn't process your message at the moment.",
                type: "insight",
            };
            setInsights((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const getButtonColor = () => ({
        base: message.trim()
            ? "bg-[#f5b049] text-black"
            : "bg-[#f5b84d] text-gray-900",
        shadow: message.trim()
            ? "0 4px 20px rgba(191, 138, 57, 0.3)"
            : "0 2px 10px rgba(207, 149, 62, 0.3)",
        hoverShadow: "hover:shadow-yellow-500/25",
    });

    const buttonColors = getButtonColor();

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
                * { margin: 0; padding: 0; box-sizing: border-box; }
                html, body { height: 100%; margin: 0; padding: 0; }
                ::-webkit-scrollbar { width: 6px; }
                ::-webkit-scrollbar-track { background: ${
                    isDarkMode ? "#1e293b" : "#f1f5f9"
                }; }
                ::-webkit-scrollbar-thumb { background: ${
                    isDarkMode ? "#475569" : "#cbd5e1"
                }; border-radius: 3px; }
                ::-webkit-scrollbar-thumb:hover { background: ${
                    isDarkMode ? "#64748b" : "#94a3b8"
                }; }
            `}</style>

            <div
                className={`min-h-screen h-screen w-full transition-all duration-700 ease-out ${
                    isDarkMode ? "bg-slate-950" : "bg-gray-50"
                }`}
            >
                <FloatingHeader
                    isDarkMode={isDarkMode}
                    onToggleDarkMode={onToggleDarkMode}
                    currentPage={currentPage}
                    onNavigate={onNavigate}
                    isInitialLoad={isInitialLoad}
                />

                {/* Chat Container */}
                <div className="w-full h-full flex flex-col items-center pt-20 pb-32 px-6">
                    <div
                        ref={chatContainerRef}
                        className="w-full max-w-2xl h-full overflow-y-auto flex flex-col gap-3 p-4"
                        style={{
                            fontFamily:
                                "Nunito-Medium, Helvetica Neue, Helvetica, sans-serif",
                            fontSize: "16px",
                        }}
                    >
                        {insights.map((insight) => {
                            const isUser = insight.type === "user";
                            return (
                                <div
                                    key={insight.id}
                                    className={`bubble-enter w-fit max-w-sm p-3 rounded-3xl ${
                                        isUser ? "ml-auto" : "mr-auto"
                                    }`}
                                    style={{
                                        backgroundColor: isUser
                                            ? "rgba(11, 147, 246, 0.1)"
                                            : "rgba(229, 229, 234, 0.1)",
                                        backdropFilter: "blur(8px)",
                                        border: isUser
                                            ? "1px solid rgba(11, 147, 246, 0.2)"
                                            : "1px solid rgba(255, 255, 255, 0.4)",
                                        color: isUser ? "#0a4174" : "#2D3436",
                                        wordWrap: "break-word",
                                        lineHeight: "1.5",
                                    }}
                                >
                                    {insight.text}
                                </div>
                            );
                        })}

                        {/* Loading indicator */}
                        {isLoading && (
                            <div
                                className="mr-auto w-fit p-3 rounded-3xl"
                                style={{
                                    backgroundColor: "rgba(229, 229, 234, 0.1)",
                                    backdropFilter: "blur(8px)",
                                    border: "1px solid rgba(255, 255, 255, 0.4)",
                                }}
                            >
                                <div className="flex items-center gap-1">
                                    {[0, 1, 2].map((i) => (
                                        <div
                                            key={i}
                                            className="w-2 h-2 rounded-full"
                                            style={{
                                                backgroundColor:
                                                    "rgba(150, 150, 150, 0.4)",
                                                animation: `${
                                                    i === 0
                                                        ? "dotPulse"
                                                        : i === 1
                                                        ? "dotPulseTwo"
                                                        : "dotPulseThree"
                                                } 1s ease-in-out infinite`,
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom Input */}
                <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 w-full max-w-2xl px-6 z-50">
                    <div
                        className={`rounded-2xl backdrop-blur-md border transition-all duration-300 ease-out ${
                            isDarkMode
                                ? "bg-slate-900/50 border-slate-700/50"
                                : "bg-white/70 border-gray-200/50"
                        } ${
                            isSearchFocused
                                ? "shadow-2xl scale-[1.02] " +
                                  (isDarkMode
                                      ? "border-slate-600/70"
                                      : "border-gray-300/70")
                                : "shadow-lg hover:shadow-xl hover:scale-[1.01]"
                        }`}
                    >
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Why was I off-track today?"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onFocus={() => setIsSearchFocused(true)}
                                onBlur={() =>
                                    setTimeout(
                                        () => setIsSearchFocused(false),
                                        150,
                                    )
                                }
                                onKeyDown={handleKeyDown}
                                className={`w-full bg-transparent outline-none px-8 py-5 text-lg transition-all duration-300 pr-20 ${
                                    isDarkMode
                                        ? "text-slate-200 placeholder-slate-500"
                                        : "text-gray-800 placeholder-gray-500"
                                }`}
                            />

                            <div className="absolute bottom-4 right-4 flex items-center gap-2">
                                <button
                                    onClick={downloadBrowsingData}
                                    className="p-2 rounded-lg transition-all duration-300 hover:scale-110 active:scale-95 bg-gray-500 hover:bg-gray-600 text-white shadow-lg"
                                    title="Download browsing data CSV"
                                >
                                    <Download size={16} />
                                </button>

                                <button
                                    onClick={handleSendMessage}
                                    disabled={!message.trim()}
                                    className={`p-2 rounded-lg transition-all duration-300 hover:scale-110 active:scale-95 hover:rotate-6 group ${buttonColors.base} shadow-lg ${buttonColors.hoverShadow}`}
                                    style={{ boxShadow: buttonColors.shadow }}
                                >
                                    <ArrowRight
                                        size={16}
                                        className="transition-transform duration-300 group-hover:translate-x-0.5"
                                    />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default InsightsLandingPage;
