// src/services/contentScript.js
// This script runs on web pages to extract text content when requested

export function onExecute() {
    console.log("LyncX content script loaded on:", window.location.hostname);

    // Import and initialize hover navbar
    console.log("🔄 Attempting to load hover navbar injector...");
    import("../content/hoverNavbarInjector")
        .then((module) => {
            console.log("✅ Hover navbar injector loaded successfully", module);
        })
        .catch((error) => {
            console.error("❌ Failed to load hover navbar injector:", error);
            console.error("Stack trace:", error.stack);
        });

    // Function to extract clean text from the page
    function extractPageText() {
        console.log("Extracting page text...");

        try {
            // Clone the document to avoid modifying the original
            const docClone = document.cloneNode(true) as Document;

            // Remove unwanted elements from clone
            const unwantedElements = docClone.querySelectorAll(
                "script, style, noscript, iframe, nav, header, footer, aside, .sidebar, .navigation, .menu, .ads, .advertisement",
            );
            unwantedElements.forEach((el) => el.remove());

            // Get main content areas first
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
                const element = docClone.querySelector(selector);
                if (element) {
                    const text = element.textContent || "";
                    if (text.trim().length > 100) {
                        mainContent = text;
                        console.log(
                            `Found content using selector: ${selector}`,
                        );
                        break;
                    }
                }
            }

            // If no main content found, try to get paragraphs and headings
            if (!mainContent || mainContent.trim().length < 100) {
                console.log(
                    "No main content area found, extracting from paragraphs and headings",
                );

                const contentElements = docClone.querySelectorAll(
                    "p, h1, h2, h3, h4, h5, h6, li, blockquote, div.text, div.paragraph",
                );
                if (contentElements.length > 0) {
                    mainContent = Array.from(contentElements)
                        .map((el) => (el.textContent || "").trim())
                        .filter((text) => text.length > 20) // Filter out very short text
                        .join("\n");
                }

                // Final fallback to body
                if (!mainContent || mainContent.trim().length < 100) {
                    mainContent = docClone.body?.textContent || "";
                }
            }

            // Clean up the text
            const cleanText = mainContent
                .replace(/\s+/g, " ") // Replace multiple whitespaces with single space
                .replace(/\n\s*\n/g, "\n") // Remove empty lines
                .replace(/[^\S\n]+/g, " ") // Replace other whitespace (except newlines) with single space
                .trim();

            // Get page metadata
            const title = document.title || "";
            const url = window.location.href;
            const description =
                document
                    .querySelector('meta[name="description"]')
                    ?.getAttribute("content") ||
                document
                    .querySelector('meta[property="og:description"]')
                    ?.getAttribute("content") ||
                "";

            // Calculate word count
            const wordCount = cleanText
                .split(/\s+/)
                .filter((word) => word.length > 0).length;

            const result = {
                title,
                url,
                description,
                content: cleanText,
                contentLength: cleanText.length,
                wordCount: wordCount,
            };

            console.log("Page text extraction completed:", {
                title: title.substring(0, 50) + "...",
                contentLength: result.contentLength,
                wordCount: result.wordCount,
            });

            return result;
        } catch (error) {
            console.error("Error in extractPageText:", error);
            throw error;
        }
    }

    // Function to show notification when text is added to notes
    function showNotification(message: string) {
        // Remove any existing notifications
        const existingNotification =
            document.getElementById("lyncx-notification");
        if (existingNotification) {
            existingNotification.remove();
        }

        // Create notification element
        const notification = document.createElement("div");
        notification.id = "lyncx-notification";
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 10000;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease-out;
            max-width: 300px;
            word-wrap: break-word;
        `;
        notification.textContent = message;

        // Add to page
        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.opacity = "1";
            notification.style.transform = "translateX(0)";
        }, 100);

        // Animate out and remove after 3 seconds
        setTimeout(() => {
            notification.style.opacity = "0";
            notification.style.transform = "translateX(100%)";
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Listen for messages from popup/background script
    if (typeof chrome !== "undefined" && chrome.runtime) {
        chrome.runtime.onMessage.addListener(
            (request, _sender, sendResponse) => {
                console.log("Content script received message:", request);

                if (request.action === "extractPageText") {
                    try {
                        const pageData = extractPageText();
                        console.log("Sending page data back to popup");
                        sendResponse({ success: true, data: pageData });
                    } catch (error) {
                        console.error("Error extracting page text:", error);
                        sendResponse({
                            success: false,
                            error:
                                error instanceof Error
                                    ? error.message
                                    : "Unknown error",
                        });
                    }
                    return true; // Keep message channel open for async response
                }

                if (request.action === "showNotification") {
                    showNotification(request.message);
                    sendResponse({ success: true });
                    return false;
                }

                return false; // Don't keep channel open for other messages
            },
        );
    }

    // Auto-extract when page loads (for potential future use)
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => {
            console.log("DOM content loaded, content script ready");
        });
    } else {
        console.log("Document already loaded, content script ready");
    }
}
