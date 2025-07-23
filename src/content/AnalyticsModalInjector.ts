// AnalyticsModalInjector.ts - Debug version
import React from "react";
import ReactDOM from "react-dom/client";
import AnalyticsModal from "../components/AnalyticsModal";

class AnalyticsInjector {
    private container: HTMLDivElement | null = null;
    private root: ReactDOM.Root | null = null;
    private isInjected = false;
    private isVisible = false;

    constructor() {
        console.log(
            "📊 AnalyticsInjector created at:",
            new Date().toISOString(),
        );
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
            this.renderAnalytics();

            this.isInjected = true;
            console.log("✅ Analytics modal injected successfully");
        } catch (error) {
            console.error("❌ Failed to inject analytics modal:", error);
        }
    }

    private renderAnalytics() {
        if (this.root) {
            this.root.render(
                React.createElement(AnalyticsModal, {
                    isVisible: this.isVisible,
                    onClose: () => {
                        console.log("📊 Analytics modal close requested");
                        this.isVisible = false;
                        this.renderAnalytics();
                    },
                }),
            );
            console.log(
                "📊 Analytics modal rendered with isVisible:",
                this.isVisible,
            );
        }
    }

    public show() {
        console.log("📊 Analytics show() called");

        if (!this.isInjected) {
            this.injectAnalytics();
        }

        this.isVisible = true;
        this.renderAnalytics();
    }

    public destroy() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        this.container = null;
        this.root = null;
        this.isInjected = false;
        this.isVisible = false;
        console.log("📊 Analytics injector destroyed");
    }
}

// Auto-initialize when module loads
console.log("📊 AnalyticsModalInjector module loading...");
const analyticsInjector = new AnalyticsInjector();
console.log("📊 AnalyticsInjector instance created:", analyticsInjector);

// Set up message listener
console.log("📊 Setting up analytics message listener...");

const messageListener = (message: any, sender: any, sendResponse: any) => {
    console.log("📊 Analytics injector received message:", message.type);

    if (message.type === "SHOW_ANALYTICS") {
        console.log("📊 SHOW_ANALYTICS message received in injector!");
        try {
            analyticsInjector.show();
            sendResponse({ success: true });
            console.log("📊 Analytics show() completed successfully");
        } catch (error) {
            console.error("❌ Error showing analytics:", error);
            sendResponse({ success: false, error: error.message });
        }
        return true;
    }

    if (message.type === "CLEANUP_ANALYTICS") {
        analyticsInjector.destroy();
        sendResponse({ success: true });
        return true;
    }

    return false; // Let other listeners handle other message types
};

// Add the listener
chrome.runtime.onMessage.addListener(messageListener);
console.log("📊 Analytics message listener registered");

// Test that the listener is working
setTimeout(() => {
    console.log("📊 Analytics injector status check:");
    console.log("  - Instance exists:", !!analyticsInjector);
    console.log(
        "  - Message listener active:",
        chrome.runtime.onMessage.hasListeners(),
    );
    console.log(
        "  - Container in DOM:",
        !!document.getElementById("lyncx-analytics-root"),
    );
}, 1000);

// Export for consistency
export default analyticsInjector;
