// Updated AIService.ts - Remove DOM access, accept page content as parameter

import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "../../shared/services/firebase";
import DataService from "../../data/dataService";

interface ChatResponse {
    data: {
        output_text: string;
        threadId?: string;
    };
}

interface PageContent {
    title: string;
    url: string;
    description: string;
    content: string;
    contentLength: number;
    wordCount: number;
    extractedAt: string;
}

class AIService {
    private static instance: AIService;
    private chatFunction;
    private currentThreadId: string | null = null;
    private generalThreadId: string | null = null; // Separate thread for general/page analysis

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

    // 🆕 UPDATED: Accept page content as parameter instead of extracting it
    public async generateGeneralResponse(
        message: string,
        pageContent: PageContent | null = null,
    ): Promise<string> {
        try {
            console.log("=".repeat(80));
            console.log("🚀 NEW GENERAL AI REQUEST STARTING");
            console.log("=".repeat(80));
            console.log("🔍 Current general thread ID:", this.generalThreadId);
            console.log("💬 User message:", message);
            console.log("📄 Page content provided:", !!pageContent);

            // Use provided page content for new conversations
            let pageContext = null;
            if (!this.generalThreadId && pageContent) {
                console.log(
                    "\n📄 USING PROVIDED PAGE CONTENT (New Conversation)...",
                );
                pageContext = pageContent;
                console.log("\n🔥 PAGE CONTENT ANALYSIS:");
                console.log("📋 Title:", pageContext.title);
                console.log("🔗 URL:", pageContext.url);
                console.log("📝 Content Length:", pageContext.content.length);
                console.log("📊 Word Count:", pageContext.wordCount);
            } else if (!this.generalThreadId && !pageContent) {
                console.log(
                    "\n⚠️ No page content provided for new conversation",
                );
            } else {
                console.log(
                    "\n♻️ USING EXISTING GENERAL THREAD:",
                    this.generalThreadId,
                );
            }

            // Prepare the request payload for page analysis
            const requestPayload = {
                userMessage: message,
                pageContent: pageContext, // ← PAGE CONTENT (not browsing data)
                threadId: this.generalThreadId,
                assistantType: "page_analysis", // Different assistant type
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
                "📄 Page Content Present:",
                !!requestPayload.pageContent,
            );

            if (requestPayload.pageContent) {
                console.log("📄 Page Content Summary for Firebase:");
                console.log("- Title:", requestPayload.pageContent.title);
                console.log("- URL:", requestPayload.pageContent.url);
                console.log(
                    "- Content Length:",
                    requestPayload.pageContent.content.length,
                );
                console.log(
                    "- Word Count:",
                    requestPayload.pageContent.wordCount,
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
                        "⚠️ LARGE PAYLOAD WARNING: Consider truncating content",
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
                this.generalThreadId = response.data.threadId;
                console.log(
                    "💾 Updated general thread ID:",
                    this.generalThreadId,
                );
            }

            console.log("\n" + "=".repeat(80));
            console.log("✅ GENERAL AI REQUEST COMPLETED SUCCESSFULLY");
            console.log("=".repeat(80));

            return (
                response.data?.output_text || "I couldn't process that message."
            );
        } catch (error) {
            console.log("\n" + "=".repeat(80));
            console.log("❌ GENERAL AI REQUEST FAILED");
            console.log("=".repeat(80));
            console.error("❌ ERROR in AI response:");
            console.error("Error details:", error);
            throw error;
        }
    }

    // ... rest of your existing methods stay the same (generateResponse, resetConversation, etc.)
    // Just remove the getCurrentPageContent() method since we don't need it anymore

    // EXISTING: Original browsing data method (for main popup) - UNCHANGED
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

    // Reset browsing conversation (when user wants to start fresh)
    public resetConversation(): void {
        this.currentThreadId = null;
        console.log("🔄 Browsing conversation reset - thread ID cleared");
    }

    // 🆕 Reset general conversation (for SearchModal)
    public resetGeneralConversation(): void {
        this.generalThreadId = null;
        console.log("🔄 General conversation reset - thread ID cleared");
    }

    // 🆕 Reset both conversations
    public resetAllConversations(): void {
        this.currentThreadId = null;
        this.generalThreadId = null;
        console.log("🔄 All conversations reset - thread IDs cleared");
    }

    // EXISTING: Get ALL browsing data (unchanged)
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
