interface PageDimensions {
    totalHeight: number;
    viewportHeight: number;
    viewportWidth: number;
}

export class ScreenshotService {
    private static isRestrictedUrl(url: string | undefined): boolean {
        if (!url) return true;
        return (
            url.startsWith("chrome://") ||
            url.startsWith("chrome-extension://") ||
            url.startsWith("about:") ||
            url.startsWith("edge://") ||
            url.startsWith("brave://") ||
            url.startsWith("opera://")
        );
    }

    private static async getPageDimensions(
        tabId: number,
    ): Promise<PageDimensions> {
        const [{ result }] = (await chrome.scripting.executeScript({
            target: { tabId },
            func: () => {
                window.scrollTo(0, 0); // Scroll to top first
                return {
                    totalHeight: Math.max(
                        document.documentElement.scrollHeight,
                        document.body.scrollHeight,
                    ),
                    viewportHeight: window.innerHeight,
                    viewportWidth: window.innerWidth,
                };
            },
        })) as { result: PageDimensions }[];

        return result;
    }

    private static async scrollToPosition(
        tabId: number,
        step: number,
        viewportHeight: number,
    ): Promise<void> {
        await chrome.scripting.executeScript({
            target: { tabId },
            func: (step, viewportHeight) => {
                window.scrollTo(0, step * viewportHeight);
                return new Promise((resolve) => setTimeout(resolve, 150)); // Wait for scroll to complete
            },
            args: [step, viewportHeight],
        });

        // Additional wait for any lazy-loaded content and animations
        await new Promise((resolve) => setTimeout(resolve, 150));
    }

    private static async captureAndDrawOnCanvas(
        ctx: CanvasRenderingContext2D,
        windowId: number,
        step: number,
        viewportHeight: number,
        viewportWidth: number,
    ): Promise<void> {
        const dataUrl = await chrome.tabs.captureVisibleTab(windowId, {
            format: "png",
        });

        const img = new Image();
        await new Promise<void>((resolve, reject) => {
            img.onload = () => {
                ctx.drawImage(
                    img,
                    0,
                    step * viewportHeight,
                    viewportWidth,
                    viewportHeight,
                );
                resolve();
            };
            img.onerror = () =>
                reject(new Error("Failed to load screenshot image"));
            img.src = dataUrl;
        });
    }

    private static async resetScroll(tabId: number): Promise<void> {
        await chrome.scripting.executeScript({
            target: { tabId },
            func: () => window.scrollTo(0, 0),
        });
    }

    private static toCamelCase(str: string): string {
        return str
            .replace(/[^a-zA-Z0-9 ]/g, "") // Remove special characters
            .split(" ")
            .map((word, index) => {
                if (index === 0) {
                    return word.toLowerCase();
                }
                return (
                    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                );
            })
            .join("");
    }

    private static getDomainFromUrl(url: string): string {
        try {
            const domain = new URL(url).hostname;
            return domain.replace("www.", "");
        } catch {
            return "unknown-domain";
        }
    }

    private static async downloadCanvas(
        canvas: HTMLCanvasElement,
        tabTitle: string,
        url: string,
        tabId: number,
    ): Promise<void> {
        try {
            console.log("Preparing download...");

            const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
            const camelCaseTitle = this.toCamelCase(tabTitle || "untitled");
            const domain = this.getDomainFromUrl(url);
            const filename = `${camelCaseTitle}-${domain}-${timestamp}.png`;

            // Convert canvas to data URL
            const dataUrl = canvas.toDataURL("image/png");

            console.log("Canvas converted to data URL, filename:", filename);

            // Method 1: Try Chrome downloads API first
            try {
                console.log("Attempting Chrome downloads API...");
                const downloadId = await chrome.downloads.download({
                    url: dataUrl,
                    filename: filename,
                    saveAs: false, // Don't show save dialog, use default download folder
                });
                console.log(
                    "Chrome downloads API succeeded with ID:",
                    downloadId,
                );
                return;
            } catch (apiError) {
                console.log("Chrome downloads API failed:", apiError);
            }

            // Method 2: Inject download script into the current tab
            console.log("Attempting tab injection download...");
            await chrome.scripting.executeScript({
                target: { tabId },
                func: (dataUrl: string, filename: string) => {
                    console.log(
                        "Injected script running, creating download link...",
                    );

                    // Create and trigger download
                    const link = document.createElement("a");
                    link.download = filename;
                    link.href = dataUrl;
                    link.style.display = "none";

                    // Add to DOM, click, and remove
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);

                    console.log("Download link clicked for:", filename);

                    // Also show a brief confirmation
                    const notification = document.createElement("div");
                    notification.style.cssText = `
                        position: fixed;
                        top: 20px;
                        right: 20px;
                        background: #4CAF50;
                        color: white;
                        padding: 12px 20px;
                        border-radius: 8px;
                        z-index: 999999;
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                        font-size: 14px;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                    `;
                    notification.textContent = "Screenshot downloaded!";

                    document.body.appendChild(notification);
                    setTimeout(() => {
                        if (notification.parentElement) {
                            notification.remove();
                        }
                    }, 3000);
                },
                args: [dataUrl, filename],
            });

            console.log("Tab injection download completed");
        } catch (error) {
            console.error("All download methods failed:", error);

            // Method 3: Final fallback - try to open in new tab
            try {
                console.log("Attempting final fallback - new tab...");
                const dataUrl = canvas.toDataURL("image/png");
                await chrome.tabs.create({
                    url: dataUrl,
                    active: false,
                });
                console.log(
                    "Screenshot opened in new tab - right-click to save",
                );
            } catch (finalError) {
                console.error("Final fallback also failed:", finalError);
                throw new Error(
                    "Unable to download screenshot. Please check browser permissions.",
                );
            }
        }
    }

    public static async captureFullPage(): Promise<void> {
        console.log("Starting screenshot capture...");

        // Get the current active tab
        const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true,
        });
        if (!tab?.id || !tab.windowId) {
            throw new Error("No active tab found");
        }

        // Check if we can access this URL
        if (this.isRestrictedUrl(tab.url)) {
            throw new Error(
                "Cannot capture screenshots of browser pages. Please try on a regular webpage.",
            );
        }

        console.log("Active tab found:", tab.id);

        // Get page dimensions
        console.log("Getting page dimensions...");
        const { totalHeight, viewportHeight, viewportWidth } =
            await this.getPageDimensions(tab.id);
        console.log("Page dimensions:", {
            totalHeight,
            viewportHeight,
            viewportWidth,
        });

        // Create canvas
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
            throw new Error("Failed to get canvas context");
        }

        canvas.width = viewportWidth;
        canvas.height = totalHeight;
        console.log("Canvas created with dimensions:", {
            width: canvas.width,
            height: canvas.height,
        });

        // Take screenshots
        const totalSteps = Math.ceil(totalHeight / viewportHeight);
        console.log("Will take", totalSteps, "screenshots");

        for (let step = 0; step < totalSteps; step++) {
            console.log(`Taking screenshot ${step + 1}/${totalSteps}`);

            await this.scrollToPosition(tab.id, step, viewportHeight);
            await this.captureAndDrawOnCanvas(
                ctx,
                tab.windowId,
                step,
                viewportHeight,
                viewportWidth,
            );
        }

        console.log("All screenshots captured, creating download...");
        await this.downloadCanvas(
            canvas,
            tab.title || "untitled",
            tab.url || "",
            tab.id,
        );

        // Reset scroll position
        await this.resetScroll(tab.id);
        console.log("Screenshot process completed successfully");
    }
}
