// src/services/pageSummariseService.ts
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
}

// Interface for extraction result
interface ExtractionResult {
    success: boolean;
    data?: PageData;
    error?: string;
}

export class PageSummariseService {
    // Extract text from current active tab
    static async extractCurrentPageText(): Promise<ExtractionResult> {
        try {
            console.log("Getting current active tab...");

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

            console.log("Current tab:", tab.url);

            // Check if we can access this URL
            if (this.isRestrictedUrl(tab.url)) {
                throw new Error(
                    `Cannot access content of this page (${
                        new URL(tab.url).protocol
                    }). Please try a regular web page instead.`,
                );
            }

            // Check if the page is complete
            if (tab.status !== "complete") {
                throw new Error("Please wait for the page to finish loading");
            }

            console.log("Injecting content script...");

            // Inject and execute the script
            const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: () => {
                    try {
                        const contentSelectors = [
                            "main",
                            '[role="main"]',
                            "article",
                            ".content",
                            ".main-content",
                            "#content",
                            "#main",
                            ".post-content",
                            ".entry-content",
                            ".article-body",
                            ".story-content",
                            ".page-content",
                        ];

                        let mainContent = "";

                        // Try to find main content area
                        for (const selector of contentSelectors) {
                            const element = document.querySelector(selector);
                            if (element) {
                                const text = element.textContent || "";
                                if (text.trim().length > 100) {
                                    mainContent = text;
                                    break;
                                }
                            }
                        }

                        // If no main content found, try paragraphs and headings
                        if (!mainContent || mainContent.trim().length < 100) {
                            const contentElements = document.querySelectorAll(
                                "p, h1, h2, h3, h4, h5, h6, li, blockquote",
                            );

                            if (contentElements.length > 0) {
                                mainContent = Array.from(contentElements)
                                    .map((el) => el.textContent?.trim() || "")
                                    .filter((text) => text.length > 20)
                                    .join("\n");
                            }
                        }

                        // Final fallback to body
                        if (!mainContent || mainContent.trim().length < 100) {
                            mainContent = document.body?.textContent || "";
                        }

                        // Clean up the text
                        const cleanText = mainContent
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

                        const result = {
                            title,
                            url,
                            description,
                            content: cleanText,
                            contentLength: cleanText.length,
                            wordCount: cleanText
                                .split(/\s+/)
                                .filter((word) => word.length > 0).length,
                        };

                        if (result.wordCount < 50) {
                            throw new Error(
                                "Not enough content to summarize (less than 50 words)",
                            );
                        }

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

            console.log("Successfully extracted page text");
            return {
                success: true,
                data: extractedData,
            };
        } catch (error) {
            console.error("Error extracting page text:", error);
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

            // Check for restricted protocols
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
            // If URL parsing fails, consider it restricted
            return true;
        }
    }

    // Call Firebase function to summarize page
    static async summarizePage(pageData: PageData): Promise<{
        success: boolean;
        summary?: string;
        threadId?: string;
        error?: string;
    }> {
        try {
            // Prepare the content for summarization
            const contentToSummarize = `
Page Title: ${pageData.title}
URL: ${pageData.url}
Description: ${pageData.description}
Word Count: ${pageData.wordCount}

Content:
${pageData.content}
            `.trim();

            // Use Firebase functions to call chatWithOpenAI
            const functions = getFunctions(app);
            const chatFunction = httpsCallable<ChatRequest, ChatResponse>(
                functions,
                "chatWithOpenAI",
            );

            console.log("Calling Firebase function for page summarization...");

            const response = await chatFunction({
                userMessage: contentToSummarize,
                assistantType: "summarise",
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
            console.error("Error summarizing page:", error);
            return {
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : "Unknown error occurred",
            };
        }
    }

    // Complete flow: extract and summarize
    static async extractAndSummarize(): Promise<{
        success: boolean;
        summary?: string;
        pageData?: PageData;
        error?: string;
    }> {
        try {
            console.log("Starting page text extraction...");

            // First extract the page text
            const extractResult = await this.extractCurrentPageText();

            if (!extractResult.success || !extractResult.data) {
                return {
                    success: false,
                    error: extractResult.error || "Failed to extract page text",
                };
            }

            console.log(
                `Extracted ${extractResult.data.wordCount} words from page`,
            );

            // Then summarize it
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
            console.error("Error in extract and summarize flow:", error);
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
