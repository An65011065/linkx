/* eslint-disable */
const { onCall } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { OpenAI } = require("openai");
const openaiApiKey = defineSecret("OPENAI_API_KEY");

// Create clean CSV (no comments, just data)
function createCleanCSV(data) {
    const visits = data.today.allVisits || [];
    // Sort visits chronologically (most recent first)
    const sortedVisits = [...visits].sort((a, b) => b.startTime - a.startTime);
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
            (visit.title || "").replace(/"/g, '""'), // Escape quotes
            date.toISOString().split("T")[0], // YYYY-MM-DD
            timeDisplay, // Human readable time
            visit.activeTimeMinutes || 0,
        ];
    });
    // Add summary as first data row (5 columns to match headers)
    const summaryRow = [
        "SUMMARY_DATA",
        `Total visits: ${sortedVisites.length}, Active minutes: ${data.today.totalActiveMinutes}, Sessions: ${data.today.tabSessions}`,
        data.today.date,
        "Summary",
        data.today.totalActiveMinutes,
    ];
    const csvLines = [
        headers.join(","),
        summaryRow.map((cell) => `"${cell}"`).join(","),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ];
    return csvLines.join("\n");
}

exports.chatWithOpenAI = onCall(
    {
        secrets: [openaiApiKey],
        region: "us-central1",
    },
    async (request) => {
        const openai = new OpenAI({
            apiKey: openaiApiKey.value(),
        });

        const userMessage = (request.data && request.data.userMessage) || "";
        const browsingData =
            (request.data && request.data.browsingData) || null;
        const pageContent = (request.data && request.data.pageContent) || null; // 🆕 NEW
        const existingThreadId =
            (request.data && request.data.threadId) || null;
        const assistantType =
            (request.data && request.data.assistantType) || "browsing";

        if (!userMessage) {
            throw new Error("No message provided");
        }

        // 🆕 UPDATED: Set assistant ID based on type
        const assistantIds = {
            browsing: "asst_oGJq9HXdbQ5VoLRuE8JdgvRQ",
            summarise: "asst_y1LZY5JHQX3YZiAXyVs1Iiif",
            page_analysis: "asst_Wed1vBDeodu3B1ATQYLeqksz",
            asst_YxsrXIl2Ro9POndtudAi1GUk: "asst_YxsrXIl2Ro9POndtudAi1GUk",
        };

        const assistantId = assistantIds[assistantType];
        if (!assistantId) {
            throw new Error(`Invalid assistant type: ${assistantType}`);
        }

        try {
            console.log("=== OPENAI REQUEST ===");
            console.log("User message:", userMessage);
            console.log("Assistant type:", assistantType);
            console.log("Browsing data received:", browsingData ? "YES" : "NO");
            console.log("Page content received:", pageContent ? "YES" : "NO"); // 🆕 NEW
            console.log("Existing thread:", existingThreadId ? "YES" : "NO");

            let threadId;
            let fileId = null;

            // Create or use existing thread
            if (existingThreadId) {
                threadId = existingThreadId;
                console.log("Using existing thread:", threadId);
            } else {
                // Create new thread
                const thread = await openai.beta.threads.create();
                threadId = thread.id;
                console.log("Created new thread:", threadId);
            }

            let messageContent = userMessage;

            // 🆕 NEW: Handle page content for page_analysis assistant
            if (
                !existingThreadId &&
                pageContent &&
                assistantType === "page_analysis"
            ) {
                console.log("Processing page content for analysis...");
                console.log("Page title:", pageContent.title);
                console.log("Page URL:", pageContent.url);
                console.log("Content length:", pageContent.content.length);
                console.log("Word count:", pageContent.wordCount);

                // Simple format like the summarise assistant - just provide the data
                messageContent = `Page Title: ${pageContent.title}
URL: ${pageContent.url}
Word Count: ${pageContent.wordCount}

Content:
${pageContent.content}

User Question: ${userMessage}`;

                console.log(
                    "Page content message length:",
                    messageContent.length,
                );
            }
            // EXISTING: Always upload CSV for new browsing conversations
            else if (
                !existingThreadId &&
                browsingData &&
                assistantType === "browsing"
            ) {
                console.log("Uploading CSV file for browsing data...");
                const csvContent = createCleanCSV(browsingData);
                const timestamp = new Date().toISOString().split("T")[0];
                const fileName = `browsing-data-${timestamp}.csv`;
                console.log("Generated CSV length:", csvContent.length);

                // Upload CSV file
                const fs = require("fs");
                const os = require("os");
                const path = require("path");
                const tempDir = os.tmpdir();
                const tempFilePath = path.join(tempDir, fileName);
                fs.writeFileSync(tempFilePath, csvContent);

                const file = await openai.files.create({
                    file: fs.createReadStream(tempFilePath),
                    purpose: "assistants",
                });

                fs.unlinkSync(tempFilePath);
                fileId = file.id;
                console.log("File uploaded:", fileId);

                messageContent = `Your browsing data has been uploaded as a CSV file for analysis.\n\nUser question: ${userMessage}`;
            }

            console.log("Final message content length:", messageContent.length);

            // Create message with optional file attachment
            const messageData = {
                role: "user",
                content: messageContent,
            };

            if (fileId) {
                messageData.attachments = [
                    {
                        file_id: fileId,
                        tools: [{ type: "code_interpreter" }],
                    },
                ];
            }

            await openai.beta.threads.messages.create(threadId, messageData);
            console.log("Message added to thread");

            // Run assistant with the correct ID
            const runConfig = {
                assistant_id: assistantId,
            };

            if (fileId) {
                runConfig.tools = [{ type: "code_interpreter" }];
                console.log("Running with code_interpreter (file uploaded)");
            } else {
                console.log("Running with default tools");
            }

            const run = await openai.beta.threads.runs.create(
                threadId,
                runConfig,
            );
            console.log("Assistant run created:", run.id);

            // Poll until completion
            let completed = false;
            let runResult;
            let attempts = 0;
            const maxAttempts = 30;

            while (!completed && attempts < maxAttempts) {
                attempts++;
                console.log(`Polling run ${run.id} (attempt ${attempts})`);
                runResult = await openai.beta.threads.runs.retrieve(
                    threadId,
                    run.id,
                );
                console.log("Run status:", runResult.status);

                if (runResult.status === "completed") {
                    completed = true;
                } else if (
                    runResult.status === "failed" ||
                    runResult.status === "cancelled"
                ) {
                    console.error("Run failed:", runResult.last_error);

                    // If file upload failed, try without code interpreter
                    if (
                        fileId &&
                        runResult.last_error?.code === "server_error"
                    ) {
                        console.log("Retrying without code interpreter...");
                        const retryRun = await openai.beta.threads.runs.create(
                            threadId,
                            {
                                assistant_id: assistantId,
                            },
                        );

                        // Continue polling the retry
                        let retryCompleted = false;
                        let retryAttempts = 0;
                        while (!retryCompleted && retryAttempts < 20) {
                            retryAttempts++;
                            const retryResult =
                                await openai.beta.threads.runs.retrieve(
                                    threadId,
                                    retryRun.id,
                                );
                            if (retryResult.status === "completed") {
                                runResult = retryResult;
                                completed = true;
                                retryCompleted = true;
                            } else if (retryResult.status === "failed") {
                                throw new Error(
                                    `Retry also failed: ${retryResult.last_error?.message}`,
                                );
                            } else {
                                await new Promise((resolve) =>
                                    setTimeout(resolve, 1000),
                                );
                            }
                        }
                        if (!retryCompleted) {
                            throw new Error("Retry run timed out");
                        }
                    } else {
                        throw new Error(
                            `Assistant run ${runResult.status}: ${
                                runResult.last_error?.message || "Unknown error"
                            }`,
                        );
                    }
                } else if (runResult.status === "expired") {
                    throw new Error("Assistant run expired");
                } else {
                    await new Promise((resolve) => setTimeout(resolve, 1000));
                }
            }

            if (!completed) {
                throw new Error("Assistant run timed out");
            }

            // Get assistant's reply
            const messages = await openai.beta.threads.messages.list(threadId);
            const assistantMessage = messages.data.find(
                (msg) =>
                    msg.role === "assistant" && msg.run_id === runResult.id,
            );

            const output =
                assistantMessage?.content?.[0]?.text?.value ||
                "No response from assistant";

            return {
                output_text: output,
                threadId: threadId,
            };
        } catch (err) {
            console.error("OpenAI API error:");
            console.error("Message:", err.message);
            console.error("Stack:", err.stack);
            throw new Error("Failed to process message: " + err.message);
        }
    },
);
