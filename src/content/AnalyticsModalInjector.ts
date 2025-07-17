// AnalyticsInjector.ts - handles injecting the analytics modal into any page
import React from "react";
import ReactDOM from "react-dom/client";
import AnalyticsModal from "../components/AnalyticsModal";

class AnalyticsInjector {
    private container: HTMLDivElement | null = null;
    private root: ReactDOM.Root | null = null;
    private isInjected = false;

    constructor() {
        // Listen for analytics requests from the navbar
        chrome.runtime.onMessage.addListener(
            (message, sender, sendResponse) => {
                if (message.type === "SHOW_ANALYTICS") {
                    this.showAnalytics();
                    sendResponse({ success: true });
                }
            },
        );
    }

    public showAnalytics() {
        if (!this.isInjected) {
            this.injectAnalytics();
        }
        this.updateAnalyticsVisibility(true);
    }

    public hideAnalytics() {
        this.updateAnalyticsVisibility(false);
    }

    private injectAnalytics() {
        if (this.isInjected) {
            console.log("⚠️ Analytics modal already injected, skipping");
            return;
        }

        console.log("📊 Starting analytics modal injection...");

        try {
            // Create container
            this.container = document.createElement("div");
            this.container.id = "lyncx-analytics-root";
            this.container.style.cssText = `
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                z-index: 9999999 !important;
                pointer-events: none !important;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif !important;
            `;

            // Create shadow DOM for style isolation
            const shadowRoot = this.container.attachShadow({ mode: "open" });

            // Create React root container
            const reactContainer = document.createElement("div");
            reactContainer.style.pointerEvents = "auto";
            shadowRoot.appendChild(reactContainer);

            // Append to body
            document.body.appendChild(this.container);

            // Create React root and render
            this.root = ReactDOM.createRoot(reactContainer);
            this.renderAnalytics(false);

            this.isInjected = true;
            console.log("✅ Analytics modal injected successfully");
        } catch (error) {
            console.error("❌ Failed to inject analytics modal:", error);
        }
    }

    private updateAnalyticsVisibility(isVisible: boolean) {
        if (this.root) {
            this.renderAnalytics(isVisible);
        }
    }

    private renderAnalytics(isVisible: boolean) {
        if (this.root) {
            this.root.render(
                React.createElement(AnalyticsModal, {
                    isVisible,
                    onClose: () => this.hideAnalytics(),
                }),
            );
        }
    }

    public destroy() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        this.container = null;
        this.root = null;
        this.isInjected = false;
    }
}

// Initialize the analytics injector
const analyticsInjector = new AnalyticsInjector();

// Listen for cleanup messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "CLEANUP_ANALYTICS") {
        analyticsInjector.destroy();
        sendResponse({ success: true });
    }
});

export default AnalyticsInjector;
