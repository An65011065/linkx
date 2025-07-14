// src/services/pageSummariseService.ts - Enhanced with selection support
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "../shared/services/firebase";

// Interface for Firebase function request
interface ChatRequest {
    userMessage: string;
    assistantType: string;
}

// Interface for Firebase function response
interface ChatResponse {
    output_text: string;
    threadId?: string;
}

// Interface for page data
interface PageData {
    title: string;
    url: string;
    description: string;
    content: string;
    contentLength: number;
    wordCount: number;
    isSelection: boolean; // New: indicates if this is selected text
}

// Interface for extraction result
interface ExtractionResult {
    success: boolean;
    data?: PageData;
    error?: string;
}

export class PageSummariseService {
    // 🆕 Extract selected text from page
    static async extractSelectedText(): Promise<ExtractionResult> {
        try {
            console.log("Getting selected text...");

            // Get current active tab
            const [tab] = await chrome.tabs.query({
                active: true,
                currentWindow: true,
            });

            if (!tab?.id) {
                throw new Error("No active tab found");
            }

            if (!tab.url) {
                throw new Error("Tab URL is not available");
            }

            // Check if we can access this URL
            if (this.isRestrictedUrl(tab.url)) {
                throw new Error(
                    `Cannot access content of this page (${
                        new URL(tab.url).protocol
                    }). Please try a regular web page instead.`,
                );
            }

            console.log("Getting selected text from page...");

            // Inject and execute the script to get selected text
            const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: () => {
                    try {
                        const selection = window.getSelection();
                        if (!selection || selection.rangeCount === 0) {
                            throw new Error(
                                "No text selected. Please select some text and try again.",
                            );
                        }

                        const selectedText = selection.toString().trim();
                        if (selectedText.length === 0) {
                            throw new Error(
                                "No text selected. Please select some text and try again.",
                            );
                        }

                        if (selectedText.length < 10) {
                            throw new Error(
                                "Selected text is too short. Please select more text to summarize.",
                            );
                        }

                        // Get page metadata
                        const title = document.title || "";
                        const url = window.location.href;
                        const description =
                            document
                                .querySelector('meta[name="description"]')
                                ?.getAttribute("content") || "";

                        const wordCount = selectedText
                            .split(/\s+/)
                            .filter((word) => word.length > 0).length;

                        const result = {
                            title,
                            url,
                            description,
                            content: selectedText,
                            contentLength: selectedText.length,
                            wordCount,
                            isSelection: true,
                        };

                        console.log(`📄 Selected text: ${wordCount} words`);
                        return result;
                    } catch (err) {
                        throw new Error(
                            err instanceof Error
                                ? err.message
                                : "Failed to get selected text",
                        );
                    }
                },
            });

            if (!results || results.length === 0) {
                throw new Error("Failed to execute content script");
            }

            if (!results[0]?.result) {
                throw new Error("No selected text found");
            }

            const extractedData = results[0].result as PageData;
            console.log("✅ Successfully extracted selected text");
            return {
                success: true,
                data: extractedData,
            };
        } catch (error) {
            console.error("❌ Error extracting selected text:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            };
        }
    }

    // 🔧 Enhanced page extraction with 500 word limit
    static async extractCurrentPageText(): Promise<ExtractionResult> {
        try {
            console.log("Getting current active tab...");

            const [tab] = await chrome.tabs.query({
                active: true,
                currentWindow: true,
            });

            if (!tab?.id) {
                throw new Error("No active tab found");
            }

            if (!tab.url) {
                throw new Error("Tab URL is not available");
            }

            console.log("Current tab:", tab.url);

            if (this.isRestrictedUrl(tab.url)) {
                throw new Error(
                    `Cannot access content of this page (${
                        new URL(tab.url).protocol
                    }). Please try a regular web page instead.`,
                );
            }

            if (tab.status !== "complete") {
                throw new Error("Please wait for the page to finish loading");
            }

            console.log("Injecting content script...");

            const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: () => {
                    try {
                        // 🎯 Better content selection - target main content areas
                        const mainContentSelectors = [
                            "article",
                            "[role='main']",
                            "main",
                            ".post-content",
                            ".entry-content",
                            ".article-body",
                            ".story-content",
                            ".content-body",
                        ];

                        let mainContent = "";

                        // Try to find main content area first
                        for (const selector of mainContentSelectors) {
                            const element = document.querySelector(selector);
                            if (element) {
                                const text = element.textContent || "";
                                if (text.trim().length > 200) {
                                    mainContent = text;
                                    console.log(
                                        `📄 Found main content using: ${selector}`,
                                    );
                                    break;
                                }
                            }
                        }

                        // Fallback: get paragraphs and headings (but avoid comments, nav, etc.)
                        if (!mainContent || mainContent.trim().length < 200) {
                            const contentElements = document.querySelectorAll(
                                "h1, h2, h3, h4, h5, h6, p",
                            );

                            if (contentElements.length > 0) {
                                mainContent = Array.from(contentElements)
                                    .map((el) => el.textContent?.trim() || "")
                                    .filter((text) => text.length > 30) // Filter out short snippets
                                    .join("\n");
                            }
                        }

                        // Final fallback
                        if (!mainContent || mainContent.trim().length < 200) {
                            mainContent = document.body?.textContent || "";
                        }

                        // 🆕 Truncate to 500 words max
                        const words = mainContent.trim().split(/\s+/);
                        const maxWords = 500;

                        let truncatedContent = mainContent;
                        if (words.length > maxWords) {
                            truncatedContent =
                                words.slice(0, maxWords).join(" ") +
                                "\n\n[Content truncated to 500 words for summarization]";
                            console.log(
                                `📝 Truncated from ${words.length} to ${maxWords} words`,
                            );
                        }

                        // Clean up the text
                        const cleanText = truncatedContent
                            .replace(/\s+/g, " ")
                            .replace(/\n\s*\n/g, "\n")
                            .trim();

                        // Get page metadata
                        const title = document.title || "";
                        const url = window.location.href;
                        const description =
                            document
                                .querySelector('meta[name="description"]')
                                ?.getAttribute("content") ||
                            document
                                .querySelector(
                                    'meta[property="og:description"]',
                                )
                                ?.getAttribute("content") ||
                            "";

                        const wordCount = cleanText
                            .split(/\s+/)
                            .filter((word) => word.length > 0).length;

                        const result = {
                            title,
                            url,
                            description,
                            content: cleanText,
                            contentLength: cleanText.length,
                            wordCount,
                            isSelection: false,
                        };

                        if (result.wordCount < 50) {
                            throw new Error(
                                "Not enough content to summarize (less than 50 words)",
                            );
                        }

                        console.log(
                            `📊 Extracted ${wordCount} words from page`,
                        );
                        return result;
                    } catch (err) {
                        throw new Error(
                            err instanceof Error
                                ? err.message
                                : "Failed to extract content",
                        );
                    }
                },
            });

            if (!results || results.length === 0) {
                throw new Error("Failed to execute content script");
            }

            if (!results[0]?.result) {
                throw new Error("No content extracted from the page");
            }

            const extractedData = results[0].result as PageData;
            if (
                !extractedData.content ||
                extractedData.content.trim().length === 0
            ) {
                throw new Error("No readable content found on this page");
            }

            console.log("✅ Successfully extracted page text");
            return {
                success: true,
                data: extractedData,
            };
        } catch (error) {
            console.error("❌ Error extracting page text:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            };
        }
    }

    // Check if URL is restricted
    private static isRestrictedUrl(url: string | undefined): boolean {
        if (!url) return true;

        try {
            const parsedUrl = new URL(url);
            const protocol = parsedUrl.protocol;

            return (
                protocol === "chrome:" ||
                protocol === "chrome-extension:" ||
                protocol === "about:" ||
                protocol === "edge:" ||
                protocol === "brave:" ||
                protocol === "opera:" ||
                protocol === "moz-extension:" ||
                protocol === "file:" ||
                protocol === "data:" ||
                protocol === "view-source:"
            );
        } catch {
            return true;
        }
    }

    // Enhanced summarize function
    static async summarizePage(pageData: PageData): Promise<{
        success: boolean;
        summary?: string;
        threadId?: string;
        error?: string;
    }> {
        try {
            // Prepare the content for summarization
            const contentType = pageData.isSelection
                ? "Selected Text"
                : "Page Content";
            const contentToSummarize = `
${contentType} from: ${pageData.title}
URL: ${pageData.url}
Word Count: ${pageData.wordCount}

Content to Summarize:
${pageData.content}
            `.trim();

            console.log(
                `📝 Summarizing ${contentType.toLowerCase()}: ${
                    pageData.wordCount
                } words`,
            );

            const functions = getFunctions(app);
            const chatFunction = httpsCallable<ChatRequest, ChatResponse>(
                functions,
                "chatWithOpenAI",
            );

            // 🆕 Use different assistant based on content type
            const assistantType = pageData.isSelection
                ? "asst_YxsrXIl2Ro9POndtudAi1GUk"
                : "summarise";

            const response = await chatFunction({
                userMessage: contentToSummarize,
                assistantType: assistantType,
            });

            if (response?.data?.output_text) {
                return {
                    success: true,
                    summary: response.data.output_text,
                    threadId: response.data.threadId,
                };
            } else {
                throw new Error("No response from assistant");
            }
        } catch (error) {
            console.error("❌ Error summarizing:", error);
            return {
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : "Unknown error occurred",
            };
        }
    }

    // 🆕 Summarize selected text
    static async summarizeSelection(): Promise<{
        success: boolean;
        summary?: string;
        pageData?: PageData;
        error?: string;
    }> {
        try {
            console.log("📄 Starting selected text summarization...");

            const extractResult = await this.extractSelectedText();

            if (!extractResult.success || !extractResult.data) {
                return {
                    success: false,
                    error:
                        extractResult.error ||
                        "Failed to extract selected text",
                };
            }

            console.log(
                `📝 Extracted ${extractResult.data.wordCount} words from selection`,
            );

            const summarizeResult = await this.summarizePage(
                extractResult.data,
            );

            if (!summarizeResult.success) {
                return {
                    success: false,
                    error:
                        summarizeResult.error ||
                        "Failed to summarize selection",
                };
            }

            return {
                success: true,
                summary: summarizeResult.summary,
                pageData: extractResult.data,
            };
        } catch (error) {
            console.error("❌ Error in selection summarization:", error);
            return {
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : "Unknown error occurred",
            };
        }
    }

    // Enhanced complete flow with 500 word limit
    static async extractAndSummarize(): Promise<{
        success: boolean;
        summary?: string;
        pageData?: PageData;
        error?: string;
    }> {
        try {
            console.log("📄 Starting page summarization...");

            const extractResult = await this.extractCurrentPageText();

            if (!extractResult.success || !extractResult.data) {
                return {
                    success: false,
                    error: extractResult.error || "Failed to extract page text",
                };
            }

            console.log(
                `📝 Extracted ${extractResult.data.wordCount} words from page`,
            );

            const summarizeResult = await this.summarizePage(
                extractResult.data,
            );

            if (!summarizeResult.success) {
                return {
                    success: false,
                    error: summarizeResult.error || "Failed to summarize page",
                };
            }

            return {
                success: true,
                summary: summarizeResult.summary,
                pageData: extractResult.data,
            };
        } catch (error) {
            console.error("❌ Error in extract and summarize flow:", error);
            return {
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : "Unknown error occurred",
            };
        }
    }
}
