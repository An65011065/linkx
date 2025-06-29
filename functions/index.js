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
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
            });

        return [
            visit.domain || "",
            (visit.title || "").replace(/"/g, '""'), // Escape quotes
            date.toISOString().split("T")[0], // YYYY-MM-DD
            timeDisplay, // Human readable time
            visit.activeTimeMinutes || 0,
        ];
    });

    // Add summary as first data row
    const summaryRow = [
        "SUMMARY_DATA",
        `Total visits: ${sortedVisits.length}, Active minutes: ${data.today.totalActiveMinutes}, Sessions: ${data.today.tabSessions}`,
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

// Create text summary with all visits (no URLs)
function createCompactDataSummary(data) {
    const visits = data.today.allVisits || [];

    // Sort visits chronologically (most recent first)
    const sortedVisits = [...visits].sort((a, b) => b.startTime - a.startTime);

    // Get top domains by time (include ALL visits now)
    const domainTimes = {};
    sortedVisits.forEach((visit) => {
        domainTimes[visit.domain] =
            (domainTimes[visit.domain] || 0) + visit.activeTimeMinutes;
    });

    const topDomains = Object.entries(domainTimes)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([domain, minutes]) => `${domain}: ${minutes}min`);

    // Include ALL visits with domain + title only
    const allVisitsCompact = sortedVisits
        .map((visit) => {
            // Use readable time if available, otherwise format timestamp
            const timeDisplay =
                visit.readableTime ||
                (() => {
                    const date = new Date(visit.startTime);
                    return date.toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                    });
                })();

            return `${visit.domain} (${
                visit.activeTimeMinutes
            }min) at ${timeDisplay} - ${
                visit.title?.substring(0, 80) || "No title"
            }`;
        })
        .join("\n");

    // Count visits with active time for stats
    const visitsWithActiveTime = sortedVisits.filter(
        (visit) => visit.activeTimeMinutes > 0,
    );

    const summary = `BROWSING DATA for ${data.today.date}:

STATS:
- Total visits: ${sortedVisits.length} (${
        visitsWithActiveTime.length
    } with active time)
- Total active time: ${data.today.totalActiveMinutes} minutes  
- Tab sessions: ${data.today.tabSessions}
- Work: ${Math.round(
        data.today.stats.workTime / (1000 * 60),
    )}min, Social: ${Math.round(
        data.today.stats.socialTime / (1000 * 60),
    )}min, Other: ${Math.round(data.today.stats.otherTime / (1000 * 60))}min

TOP DOMAINS BY TIME:
${topDomains.join("\n")}

ALL VISITS (MOST RECENT FIRST - chronological order):
${allVisitsCompact}`;

    return summary;
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
        const existingThreadId =
            (request.data && request.data.threadId) || null;
        const systemContext =
            (request.data && request.data.systemContext) || "";

        if (!userMessage) {
            throw new Error("No message provided");
        }

        try {
            console.log("=== OPENAI REQUEST ===");
            console.log("User message:", userMessage);
            console.log("Browsing data received:", browsingData ? "YES" : "NO");
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

            if (!existingThreadId && browsingData) {
                // First message - decide between text summary or CSV upload
                let fullContext = "";

                if (systemContext) {
                    fullContext += systemContext + "\n\n";
                }

                // Try compact text summary first
                const textSummary = createCompactDataSummary(browsingData);
                console.log(
                    "Generated text summary length:",
                    textSummary.length,
                );

                // If text is too large (>20KB), fall back to CSV upload
                if (textSummary.length > 20000) {
                    console.log(
                        "Text summary too large, uploading CSV file...",
                    );

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
                    fullContext +=
                        "Your browsing data has been uploaded as a CSV file for analysis.\n\n";
                } else {
                    console.log("Using text summary (fits in message)");
                    fullContext += textSummary + "\n\n";
                }

                messageContent = fullContext + "User question: " + userMessage;
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

            // Run assistant - only use code_interpreter if we uploaded a file
            const runConfig = {
                assistant_id: "asst_oGJq9HXdbQ5VoLRuE8JdgvRQ",
            };

            if (fileId) {
                runConfig.tools = [{ type: "code_interpreter" }];
                console.log("Running with code_interpreter (file uploaded)");
            } else {
                console.log("Running with default tools (text summary)");
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
                                assistant_id: "asst_oGJq9HXdbQ5VoLRuE8JdgvRQ",
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
