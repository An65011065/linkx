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

    private static downloadCanvas(canvas: HTMLCanvasElement): void {
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const link = document.createElement("a");
        link.download = `full-page-screenshot-${timestamp}.png`;
        link.href = canvas.toDataURL();
        link.click();
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
        this.downloadCanvas(canvas);

        // Reset scroll position
        await this.resetScroll(tab.id);
        console.log("Screenshot process completed successfully");
    }
}
