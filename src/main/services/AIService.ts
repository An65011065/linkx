import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "../../shared/services/firebase";
import DataService from "../../data/dataService";

interface ChatResponse {
    data: {
        output_text: string;
        threadId?: string;
    };
}

class AIService {
    private static instance: AIService;
    private chatFunction;
    private currentThreadId: string | null = null;

    private constructor() {
        const functions = getFunctions(app);
        this.chatFunction = httpsCallable(functions, "chatWithOpenAI");
    }

    public static getInstance(): AIService {
        if (!AIService.instance) {
            AIService.instance = new AIService();
        }
        return AIService.instance;
    }

    public async generateResponse(message: string): Promise<string> {
        try {
            console.log("=".repeat(80));
            console.log("🚀 NEW AI REQUEST STARTING");
            console.log("=".repeat(80));
            console.log("🔍 Current thread ID:", this.currentThreadId);
            console.log("💬 User message:", message);

            // For new conversations, attach all browsing data
            let browsingContext = null;
            if (!this.currentThreadId) {
                console.log(
                    "\n📊 PREPARING BROWSING DATA (New Conversation)...",
                );
                browsingContext = await this.getAllBrowsingData();
                if (browsingContext) {
                    console.log("\n🔥 DETAILED DATA ANALYSIS:");
                    console.log("📅 Date:", browsingContext.today?.date);
                    console.log(
                        "⏱️ Total Active Minutes:",
                        browsingContext.today?.totalActiveMinutes,
                    );
                    console.log(
                        "📊 Tab Sessions:",
                        browsingContext.today?.tabSessions,
                    );
                    console.log(
                        "📈 Total Visits:",
                        browsingContext.today?.allVisits?.length,
                    );

                    // 🔥 DETAILED STATS BREAKDOWN
                    if (browsingContext.today?.stats) {
                        console.log("\n📊 DETAILED STATS:");
                        console.log(
                            "- Work Time:",
                            Math.round(
                                browsingContext.today.stats.workTime /
                                    (1000 * 60),
                            ),
                            "minutes",
                        );
                        console.log(
                            "- Social Time:",
                            Math.round(
                                browsingContext.today.stats.socialTime /
                                    (1000 * 60),
                            ),
                            "minutes",
                        );
                        console.log(
                            "- Other Time:",
                            Math.round(
                                browsingContext.today.stats.otherTime /
                                    (1000 * 60),
                            ),
                            "minutes",
                        );
                        console.log(
                            "- Total Time:",
                            Math.round(
                                browsingContext.today.stats.totalTime /
                                    (1000 * 60),
                            ),
                            "minutes",
                        );
                        console.log(
                            "- Total URLs:",
                            browsingContext.today.stats.totalUrls,
                        );
                        console.log(
                            "- Unique Domains:",
                            browsingContext.today.stats.uniqueDomains,
                        );
                    }

                    // 🔥 VISIT DATA ANALYSIS
                    if (browsingContext.today?.allVisits) {
                        const visits = browsingContext.today.allVisits;
                        const visitsWithActiveTime = visits.filter(
                            (v) => v.activeTimeMinutes > 0,
                        );

                        console.log("\n🔍 VISIT ANALYSIS:");
                        console.log("- Total visits:", visits.length);
                        console.log(
                            "- Visits with active time:",
                            visitsWithActiveTime.length,
                        );
                        console.log(
                            "- Zero-minute visits:",
                            visits.length - visitsWithActiveTime.length,
                        );

                        // 🔥 TOP DOMAINS BY TIME (using ALL visits now)
                        const domainTimes = {};
                        visits.forEach((visit) => {
                            domainTimes[visit.domain] =
                                (domainTimes[visit.domain] || 0) +
                                visit.activeTimeMinutes;
                        });
                        const topDomains = Object.entries(domainTimes)
                            .sort(([, a], [, b]) => b - a)
                            .slice(0, 5);

                        console.log("\n🏆 TOP 5 DOMAINS BY TIME (ALL VISITS):");
                        topDomains.forEach(([domain, minutes]) => {
                            console.log(`- ${domain}: ${minutes} minutes`);
                        });

                        // 🔥 FIRST AND LAST VISITS
                        console.log("\n⏰ CHRONOLOGICAL VISIT ANALYSIS:");
                        console.log("🔸 FIRST 3 VISITS:");
                        visits.slice(0, 3).forEach((visit, i) => {
                            const time = new Date(visit.startTime);
                            console.log(
                                `${i + 1}. ${visit.domain} (${
                                    visit.activeTimeMinutes
                                }min) at ${time.getHours()}:${time
                                    .getMinutes()
                                    .toString()
                                    .padStart(2, "0")}`,
                            );
                            console.log(
                                `   Title: ${
                                    visit.title?.substring(0, 80) || "No title"
                                }`,
                            );
                            console.log(
                                `   URL: ${visit.url?.substring(0, 100)}...`,
                            );
                        });

                        console.log("\n🔸 LAST 3 VISITS:");
                        visits.slice(-3).forEach((visit, i) => {
                            const time = new Date(visit.startTime);
                            console.log(
                                `${i + 1}. ${visit.domain} (${
                                    visit.activeTimeMinutes
                                }min) at ${time.getHours()}:${time
                                    .getMinutes()
                                    .toString()
                                    .padStart(2, "0")}`,
                            );
                            console.log(
                                `   Title: ${
                                    visit.title?.substring(0, 80) || "No title"
                                }`,
                            );
                            console.log(
                                `   URL: ${visit.url?.substring(0, 100)}...`,
                            );
                        });

                        // 🔥 VISITS WITH ACTIVE TIME BREAKDOWN
                        if (visitsWithActiveTime.length > 0) {
                            console.log(
                                "\n🎯 VISITS WITH ACTIVE TIME (>0 minutes):",
                            );
                            visitsWithActiveTime.forEach((visit, i) => {
                                const time = new Date(visit.startTime);
                                console.log(
                                    `${i + 1}. ${visit.domain}: ${
                                        visit.activeTimeMinutes
                                    }min at ${time.getHours()}:${time
                                        .getMinutes()
                                        .toString()
                                        .padStart(2, "0")}`,
                                );
                                console.log(
                                    `   "${
                                        visit.title?.substring(0, 60) ||
                                        "No title"
                                    }"`,
                                );
                            });
                        }

                        // 🔥 TIME DISTRIBUTION
                        const hourlyBreakdown = {};
                        visits.forEach((visit) => {
                            const hour = new Date(visit.startTime).getHours();
                            if (!hourlyBreakdown[hour])
                                hourlyBreakdown[hour] = {
                                    count: 0,
                                    activeTime: 0,
                                };
                            hourlyBreakdown[hour].count++;
                            hourlyBreakdown[hour].activeTime +=
                                visit.activeTimeMinutes;
                        });

                        console.log("\n⏰ HOURLY BREAKDOWN:");
                        Object.entries(hourlyBreakdown)
                            .sort(([a], [b]) => parseInt(a) - parseInt(b))
                            .forEach(([hour, data]) => {
                                console.log(
                                    `${hour}:00 - ${data.count} visits, ${data.activeTime} active minutes`,
                                );
                            });
                    }
                } else {
                    console.log("❌ No browsing context created!");
                }
            } else {
                console.log(
                    "\n♻️ USING EXISTING THREAD:",
                    this.currentThreadId,
                );
            }

            // 🔥 COMPLETE REQUEST PAYLOAD LOGGING
            const requestPayload = {
                userMessage: message,
                browsingData: browsingContext,
                threadId: this.currentThreadId,
                systemContext:
                    "You are an AI assistant inside a browser extension that tracks browsing habits. The user has live browsing data from today. The visits are sorted chronologically with MOST RECENT FIRST. Pay close attention to the 'readableTime' field which shows the correct local time (like '5:54 PM'). When the user asks for recent pages, use the first entries in the list as they are the most recent. You should analyze their browsing patterns and provide insights about their digital habits. Never mention uploaded files or JSON - this is live data from their browser extension.",
            };

            console.log("\n" + "=".repeat(60));
            console.log("📦 FIREBASE FUNCTION REQUEST PAYLOAD");
            console.log("=".repeat(60));
            console.log("📝 Message:", requestPayload.userMessage);
            console.log(
                "🔗 Thread ID:",
                requestPayload.threadId || "NEW THREAD",
            );
            console.log(
                "🧠 System Context Length:",
                requestPayload.systemContext.length,
            );
            console.log(
                "📊 Browsing Data Present:",
                !!requestPayload.browsingData,
            );

            if (requestPayload.browsingData) {
                console.log("📊 Browsing Data Summary for Firebase:");
                console.log("- Date:", requestPayload.browsingData.today?.date);
                console.log(
                    "- Total Active Minutes:",
                    requestPayload.browsingData.today?.totalActiveMinutes,
                );
                console.log(
                    "- Total Visits:",
                    requestPayload.browsingData.today?.allVisits?.length,
                );
                console.log(
                    "- Tab Sessions:",
                    requestPayload.browsingData.today?.tabSessions,
                );

                // Calculate payload size estimate
                const payloadSize = JSON.stringify(requestPayload).length;
                console.log(
                    "📏 Estimated Payload Size:",
                    payloadSize,
                    "characters",
                );
                if (payloadSize > 50000) {
                    console.log(
                        "⚠️ LARGE PAYLOAD WARNING: May trigger CSV upload fallback",
                    );
                }
            }

            console.log("\n🚀 SENDING REQUEST TO FIREBASE...");
            const startTime = Date.now();
            const response = (await this.chatFunction(
                requestPayload,
            )) as ChatResponse;
            const endTime = Date.now();
            console.log(`✅ RESPONSE RECEIVED (${endTime - startTime}ms)`);

            // 🔥 DETAILED RESPONSE LOGGING
            console.log("\n" + "=".repeat(60));
            console.log("📥 FIREBASE FUNCTION RESPONSE");
            console.log("=".repeat(60));
            console.log("✅ Response Status: SUCCESS");
            console.log(
                "📝 Output Text Length:",
                response.data?.output_text?.length || 0,
            );
            console.log(
                "🔗 Thread ID Returned:",
                response.data?.threadId || "NONE",
            );

            if (response.data?.output_text) {
                console.log("\n📄 RESPONSE PREVIEW (first 300 chars):");
                console.log(
                    response.data.output_text.substring(0, 300) + "...",
                );

                // Check for suspicious patterns in response
                const suspiciousPatterns = [
                    "fibrosis",
                    "bathmatics",
                    "enfr WOR",
                    "transcription",
                    "quarry options",
                    "Alt fibrosis",
                    "pcubra",
                    "slaughter",
                    "Artik-tests",
                    "mundane",
                ];
                const foundSuspicious = suspiciousPatterns.filter((pattern) =>
                    response.data.output_text
                        .toLowerCase()
                        .includes(pattern.toLowerCase()),
                );
                if (foundSuspicious.length > 0) {
                    console.log(
                        "🚨 HALLUCINATION DETECTED! Suspicious words found:",
                    );
                    console.log(foundSuspicious);
                }
            }

            // Store thread ID for future messages
            if (response.data?.threadId) {
                this.currentThreadId = response.data.threadId;
                console.log("💾 Updated thread ID:", this.currentThreadId);
            } else {
                console.log("⚠️ No thread ID in response");
            }

            console.log("\n" + "=".repeat(80));
            console.log("✅ AI REQUEST COMPLETED SUCCESSFULLY");
            console.log("=".repeat(80));

            return (
                response.data?.output_text || "I couldn't process that message."
            );
        } catch (error) {
            console.log("\n" + "=".repeat(80));
            console.log("❌ AI REQUEST FAILED");
            console.log("=".repeat(80));
            console.error("❌ ERROR in AI response:");
            console.error("Error details:", error);
            console.error("Error message:", error.message);
            console.error("Error stack:", error.stack);
            throw error;
        }
    }

    // Reset conversation (when user wants to start fresh)
    public resetConversation(): void {
        this.currentThreadId = null;
        console.log("🔄 Conversation reset - thread ID cleared");
    }

    // Get ALL browsing data
    private async getAllBrowsingData() {
        console.log("📊 Getting browsing data from DataService...");
        const dataService = DataService.getInstance();
        try {
            console.log("📋 Fetching current session...");
            const currentSession = await dataService.getCurrentSession();
            console.log("✅ Current session retrieved:", {
                date: currentSession.date,
                tabSessionsCount: currentSession.tabSessions?.length,
                statsPresent: !!currentSession.stats,
            });

            // Include ALL data
            const allVisits = currentSession.tabSessions.flatMap(
                (ts) => ts.urlVisits,
            );
            console.log("📈 Total visits extracted:", allVisits.length);

            // Sort visits chronologically to ensure proper order
            allVisits.sort((a, b) => b.startTime - a.startTime); // Most recent first

            const context = {
                today: {
                    date: currentSession.date,
                    stats: currentSession.stats,
                    totalActiveMinutes: Math.round(
                        currentSession.stats.totalTime / (1000 * 60),
                    ),
                    tabSessions: currentSession.tabSessions.length,
                    // Include ALL visits with better time formatting
                    allVisits: allVisits.map((visit) => {
                        const visitDate = new Date(visit.startTime);
                        const timeString = visitDate.toLocaleTimeString(
                            "en-US",
                            {
                                hour: "numeric",
                                minute: "2-digit",
                                hour12: true,
                            },
                        );
                        return {
                            url: visit.url,
                            domain: visit.domain,
                            title: visit.title,
                            startTime: visit.startTime,
                            readableTime: timeString,
                            activeTimeMinutes: Math.round(
                                visit.activeTime / (1000 * 60),
                            ),
                        };
                    }),
                },
            };

            console.log("✅ Browsing context created successfully:", {
                totalVisits: context.today.allVisits.length,
                totalActiveMinutes: context.today.totalActiveMinutes,
                date: context.today.date,
                tabSessions: context.today.tabSessions,
            });

            return context;
        } catch (error) {
            console.error("❌ Error creating browsing context:", error);
            console.error("Error details:", {
                message: error.message,
                stack: error.stack,
            });
            return null;
        }
    }
}

export default AIService;
