// FlowModalInjector.ts - Clean, on-demand Flow modal injection
import React from "react";
import { createRoot } from "react-dom/client";
import FlowContainer from "../components/FlowContainer";

class FlowModalInjector {
    private static instance: FlowModalInjector | null = null;
    private container: HTMLDivElement | null = null;
    private root: ReturnType<typeof createRoot> | null = null;
    private isInjected = false;

    private constructor() {
        console.log("📅 FlowModalInjector initialized");
    }

    static getInstance(): FlowModalInjector {
        if (!FlowModalInjector.instance) {
            FlowModalInjector.instance = new FlowModalInjector();
        }
        return FlowModalInjector.instance;
    }

    public showFlow(): void {
        console.log("📅 Showing Flow modal");

        if (!this.isInjected) {
            this.injectFlow();
        }

        // Flow visibility is handled by FlowContainer's internal state
        // Send message to trigger show
        if (this.container) {
            const event = new CustomEvent("lyncx-show-flow");
            this.container.dispatchEvent(event);
        }
    }

    private injectFlow(): void {
        if (this.isInjected) {
            console.log("⚠️ Flow already injected, skipping");
            return;
        }

        console.log("📅 Injecting Flow modal...");

        try {
            // Create container with ZERO footprint when invisible
            this.container = document.createElement("div");
            this.container.id = "lyncx-flow-modal";

            // IMPORTANT: No positioning until Flow is actually shown
            this.container.style.cssText = `
                position: fixed !important;
                top: 60px !important;
                right: 20px !important;
                width: auto !important;
                height: auto !important;
                z-index: 10000000 !important;
                pointer-events: none !important;
                background: none !important;
                border: none !important;
                margin: 0 !important;
                padding: 0 !important;
                box-shadow: none !important;
                backdrop-filter: none !important;
                opacity: 1 !important;
                overflow: visible !important;
            `;

            document.body.appendChild(this.container);

            // Create React root and render FlowContainer
            this.root = createRoot(this.container);
            this.root.render(React.createElement(FlowContainer));

            this.isInjected = true;
            console.log("✅ Flow modal injected successfully");
        } catch (error) {
            console.error("❌ Failed to inject Flow modal:", error);
        }
    }

    public hideFlow(): void {
        console.log("📅 Hiding Flow modal");

        if (this.container) {
            const event = new CustomEvent("lyncx-hide-flow");
            this.container.dispatchEvent(event);
        }
    }

    public destroy(): void {
        console.log("🗑️ Destroying Flow modal");

        if (this.root) {
            this.root.unmount();
            this.root = null;
        }

        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }

        this.container = null;
        this.isInjected = false;
        FlowModalInjector.instance = null;
    }
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("🔔 FlowModalInjector received message:", message.type);

    if (message.type === "SHOW_FLOW_MODAL") {
        try {
            const injector = FlowModalInjector.getInstance();
            injector.showFlow();
            sendResponse({ success: true });
        } catch (error) {
            console.error("❌ Error showing Flow modal:", error);
            sendResponse({ success: false, error: error.message });
        }
        return true;
    }

    if (message.type === "HIDE_FLOW_MODAL") {
        try {
            const injector = FlowModalInjector.getInstance();
            injector.hideFlow();
            sendResponse({ success: true });
        } catch (error) {
            console.error("❌ Error hiding Flow modal:", error);
            sendResponse({ success: false, error: error.message });
        }
        return true;
    }

    if (message.type === "CLEANUP_FLOW") {
        try {
            if (FlowModalInjector.instance) {
                FlowModalInjector.instance.destroy();
            }
            sendResponse({ success: true });
        } catch (error) {
            console.error("❌ Error cleaning up Flow modal:", error);
            sendResponse({ success: false, error: error.message });
        }
        return true;
    }

    return false;
});

// Cleanup on page unload
window.addEventListener("beforeunload", () => {
    if (FlowModalInjector.instance) {
        FlowModalInjector.instance.destroy();
    }
});

export default FlowModalInjector;
