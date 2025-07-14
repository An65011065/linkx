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
                    console.log("📋 Summary:", browsingContext.today?.summary);
                } else {
                    console.log("❌ No browsing context created!");
                }
            } else {
                console.log(
                    "\n♻️ USING EXISTING THREAD:",
                    this.currentThreadId,
                );
            }

            // 🔥 COMPLETE REQUEST PAYLOAD
            const requestPayload = {
                userMessage: message,
                browsingData: browsingContext, // ← SEND THE ACTUAL DATA NOW
                threadId: this.currentThreadId,
                systemContext:
                    "You are an AI assistant inside a browser extension that tracks browsing habits. The user has live browsing data from today. The visits are sorted chronologically with MOST RECENT FIRST. Pay close attention to the 'readableTime' field which shows the correct local time (like '5:54 PM'). When the user asks for recent pages, use the first entries in the list as they are the most recent. You should analyze their browsing patterns and provide insights about their digital habits. Never mention uploaded files or JSON - this is live data from their browser extension.",
                assistantType: "browsing",
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
                console.log(
                    "- Has Summary:",
                    !!requestPayload.browsingData.today?.summary,
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
                } else {
                    console.log("✅ Payload size looks good");
                }
            }

            console.log("\n🚀 SENDING REQUEST TO FIREBASE...");
            const startTime = Date.now();
            const response = (await this.chatFunction(
                requestPayload,
            )) as ChatResponse;
            const endTime = Date.now();
            console.log(`✅ RESPONSE RECEIVED (${endTime - startTime}ms)`);

            // Store thread ID for future messages
            if (response.data?.threadId) {
                this.currentThreadId = response.data.threadId;
                console.log("💾 Updated thread ID:", this.currentThreadId);
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
            const currentSession = await dataService.getCurrentSession();
            const allVisits = currentSession.tabSessions.flatMap(
                (ts) => ts.urlVisits,
            );

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
                    // CLEAN visits data - NO SUMMARY ROWS
                    allVisits: allVisits
                        .filter((visit) => {
                            // REMOVE any summary/weird rows
                            return (
                                visit.domain &&
                                visit.domain !== "SUMMARY_DATA" &&
                                typeof visit.domain === "string" &&
                                visit.domain.length > 0 &&
                                !visit.domain.includes("Total visits") &&
                                !visit.domain.includes("Summary")
                            );
                        })
                        .slice(0, 50) // Limit to 50 visits
                        .map((visit) => {
                            const visitDate = new Date(visit.startTime);
                            return {
                                domain: String(visit.domain).trim(),
                                title: String(visit.title || "")
                                    .trim()
                                    .substring(0, 100),
                                startTime: visit.startTime,
                                readableTime: visitDate.toLocaleTimeString(
                                    "en-US",
                                    {
                                        hour: "numeric",
                                        minute: "2-digit",
                                        hour12: true,
                                    },
                                ),
                                activeTimeMinutes: Math.round(
                                    visit.activeTime / (1000 * 60),
                                ),
                            };
                        }),
                    // Put summary data SEPARATELY, not mixed with visits
                    summary: {
                        totalVisits: allVisits.length,
                        totalActiveMinutes: Math.round(
                            currentSession.stats.totalTime / (1000 * 60),
                        ),
                        tabSessions: currentSession.tabSessions.length,
                        workTime: Math.round(
                            currentSession.stats.workTime / (1000 * 60),
                        ),
                        socialTime: Math.round(
                            currentSession.stats.socialTime / (1000 * 60),
                        ),
                        otherTime: Math.round(
                            currentSession.stats.otherTime / (1000 * 60),
                        ),
                    },
                },
            };

            console.log("✅ Clean context created:", {
                visits: context.today.allVisits.length,
                date: context.today.date,
                summary: context.today.summary,
            });

            return context;
        } catch (error) {
            console.error("❌ Error creating browsing context:", error);
            return null;
        }
    }
}

export default AIService;
