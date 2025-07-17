interface PageDimensions {
    totalHeight: number;
    viewportHeight: number;
    viewportWidth: number;
}

interface ScreenshotData {
    dataUrl: string;
    step: number;
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
                return new Promise((resolve) => setTimeout(resolve, 150));
            },
            args: [step, viewportHeight],
        });

        // Additional wait for any lazy-loaded content and animations
        await new Promise((resolve) => setTimeout(resolve, 150));
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

        // Collect all screenshot data
        const screenshots: ScreenshotData[] = [];
        const totalSteps = Math.ceil(totalHeight / viewportHeight);
        console.log("Will take", totalSteps, "screenshots");

        for (let step = 0; step < totalSteps; step++) {
            console.log(`Taking screenshot ${step + 1}/${totalSteps}`);

            await this.scrollToPosition(tab.id, step, viewportHeight);

            // Capture the visible tab
            const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
                format: "png",
            });

            screenshots.push({
                dataUrl,
                step,
                viewportHeight,
                viewportWidth,
            });
        }

        console.log("All screenshots captured, processing canvas...");

        // Create filename
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const camelCaseTitle = this.toCamelCase(tab.title || "untitled");
        const domain = this.getDomainFromUrl(tab.url || "");
        const filename = `${camelCaseTitle}-${domain}-${timestamp}.png`;

        // Inject script to create canvas and download
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: (
                screenshots: ScreenshotData[],
                totalHeight: number,
                filename: string,
            ) => {
                console.log("Creating canvas and combining screenshots...");

                // Create canvas in the page context where document exists
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");
                if (!ctx) {
                    throw new Error("Failed to get canvas context");
                }

                canvas.width = screenshots[0].viewportWidth;
                canvas.height = totalHeight;

                let loadedCount = 0;
                const totalScreenshots = screenshots.length;

                return new Promise<void>((resolve, reject) => {
                    screenshots.forEach((screenshot, index) => {
                        const img = new Image();
                        img.onload = () => {
                            // Draw the image at the correct vertical position
                            ctx.drawImage(
                                img,
                                0,
                                screenshot.step * screenshot.viewportHeight,
                                screenshot.viewportWidth,
                                screenshot.viewportHeight,
                            );

                            loadedCount++;
                            if (loadedCount === totalScreenshots) {
                                // All images loaded, now download
                                console.log(
                                    "All images loaded, creating download...",
                                );

                                try {
                                    const finalDataUrl =
                                        canvas.toDataURL("image/png");

                                    // Create and trigger download
                                    const link = document.createElement("a");
                                    link.download = filename;
                                    link.href = finalDataUrl;
                                    link.style.display = "none";

                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);

                                    console.log(
                                        "Download triggered for:",
                                        filename,
                                    );

                                    // Show success notification
                                    const notification =
                                        document.createElement("div");
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
                                    notification.textContent =
                                        "Screenshot downloaded!";

                                    document.body.appendChild(notification);
                                    setTimeout(() => {
                                        if (notification.parentElement) {
                                            notification.remove();
                                        }
                                    }, 3000);

                                    resolve();
                                } catch (error) {
                                    reject(error);
                                }
                            }
                        };
                        img.onerror = () =>
                            reject(
                                new Error(`Failed to load screenshot ${index}`),
                            );
                        img.src = screenshot.dataUrl;
                    });
                });
            },
            args: [screenshots, totalHeight, filename],
        });

        // Reset scroll position
        await this.resetScroll(tab.id);
        console.log("Screenshot process completed successfully");
    }
}
