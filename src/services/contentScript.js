// src/services/contentScript.js
// This script runs on web pages to extract text content when requested

console.log("LyncX content script loaded on:", window.location.hostname);

// Function to extract clean text from the page
function extractPageText() {
    console.log("Extracting page text...");

    try {
        // Clone the document to avoid modifying the original
        const docClone = document.cloneNode(true);

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
                const text = element.innerText || element.textContent || "";
                if (text.trim().length > 100) {
                    mainContent = text;
                    console.log(`Found content using selector: ${selector}`);
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
                    .map((el) => (el.innerText || el.textContent || "").trim())
                    .filter((text) => text.length > 20) // Filter out very short text
                    .join("\n");
            }

            // Final fallback to body
            if (!mainContent || mainContent.trim().length < 100) {
                mainContent =
                    docClone.body?.innerText ||
                    docClone.body?.textContent ||
                    "";
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

// Listen for messages from popup/background script
if (typeof chrome !== "undefined" && chrome.runtime) {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        console.log("Content script received message:", request);

        if (request.action === "extractPageText") {
            try {
                const pageData = extractPageText();
                console.log("Sending page data back to popup");
                sendResponse({ success: true, data: pageData });
            } catch (error) {
                console.error("Error extracting page text:", error);
                sendResponse({ success: false, error: error.message });
            }
            return true; // Keep message channel open for async response
        }

        return false; // Don't keep channel open for other messages
    });
}

// Auto-extract when page loads (for potential future use)
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
        console.log("DOM content loaded, content script ready");
    });
} else {
    console.log("Document already loaded, content script ready");
}
