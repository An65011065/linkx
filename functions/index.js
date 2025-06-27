/* eslint-disable */
const { onCall } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { OpenAI } = require("openai");
const openaiApiKey = defineSecret("OPENAI_API_KEY");

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
        if (!userMessage) {
            throw new Error("No message provided");
        }

        try {
            // 1. Create a thread
            const thread = await openai.beta.threads.create();
            console.log("Thread created:", thread.id);

            // 2. Add user message to thread
            await openai.beta.threads.messages.create(thread.id, {
                role: "user",
                content: userMessage,
            });
            console.log("Message added to thread");

            // 3. Run the assistant
            const run = await openai.beta.threads.runs.create(thread.id, {
                assistant_id: "asst_oGJq9HXdbQ5VoLRuE8JdgvRQ",
            });
            console.log("Assistant run created:", run.id);

            // 4. Poll until it's done - store IDs as constants
            const THREAD_ID = thread.id;
            const RUN_ID = run.id;

            let completed = false;
            let runResult;
            while (!completed) {
                console.log(`Polling run ${RUN_ID} in thread ${THREAD_ID}`);

                // Use the constant variables
                runResult = await openai.beta.threads.runs.retrieve(
                    THREAD_ID,
                    RUN_ID,
                );

                console.log("Run status:", runResult.status);

                if (runResult.status === "completed") {
                    completed = true;
                } else if (runResult.status === "failed") {
                    throw new Error("Assistant run failed");
                } else {
                    await new Promise((resolve) => setTimeout(resolve, 1000));
                }
            }

            // 5. Get the assistant's reply
            const messages = await openai.beta.threads.messages.list(THREAD_ID);
            const assistantMessage = messages.data.find(
                (msg) => msg.role === "assistant",
            );

            const output =
                assistantMessage?.content?.[0]?.text?.value ||
                "No response from assistant";

            return { output_text: output };
        } catch (err) {
            console.error("OpenAI Assistants API error:");
            console.error("Message:", err.message);
            console.error("Stack:", err.stack);
            throw new Error("Failed to process message: " + err.message);
        }
    },
);
