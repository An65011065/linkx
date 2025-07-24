// FlowModalInjector.ts - Refactored to Analytics pattern for instant response
import React from "react";
import ReactDOM from "react-dom/client";
import FlowContainer from "../components/FlowContainer";

class FlowInjector {
    private container: HTMLDivElement | null = null;
    private root: ReactDOM.Root | null = null;
    private isInjected = false;
    private isVisible = false;

    constructor() {
        console.log("📅 FlowInjector created at:", new Date().toISOString());
    }

    private injectFlow() {
        if (this.isInjected) {
            console.log("⚠️ Flow modal already injected, skipping");
            return;
        }

        console.log("📅 Starting flow modal injection...");

        try {
            // Create container
            this.container = document.createElement("div");
            this.container.id = "lyncx-flow-root";
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
            this.renderFlow();

            this.isInjected = true;
            console.log("✅ Flow modal injected successfully");
        } catch (error) {
            console.error("❌ Failed to inject flow modal:", error);
        }
    }

    private renderFlow() {
        if (this.root) {
            this.root.render(
                React.createElement(FlowContainer, {
                    isVisible: this.isVisible,
                    onClose: () => {
                        console.log("📅 Flow modal close requested");
                        this.isVisible = false;
                        this.renderFlow();
                    },
                }),
            );
            console.log(
                "📅 Flow modal rendered with isVisible:",
                this.isVisible,
            );
        }
    }

    public show() {
        console.log("📅 Flow show() called");

        if (!this.isInjected) {
            this.injectFlow();
        }

        this.isVisible = true;
        this.renderFlow();
    }

    public hide() {
        console.log("📅 Flow hide() called");
        this.isVisible = false;
        this.renderFlow();
    }

    public destroy() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        this.container = null;
        this.root = null;
        this.isInjected = false;
        this.isVisible = false;
        console.log("📅 Flow injector destroyed");
    }
}

// Auto-initialize when module loads
console.log("📅 FlowModalInjector module loading...");
const flowInjector = new FlowInjector();
console.log("📅 FlowInjector instance created:", flowInjector);

// Set up message listener
console.log("📅 Setting up flow message listener...");

const messageListener = (message: any, sender: any, sendResponse: any) => {
    console.log("📅 Flow injector received message:", message.type);

    if (message.type === "SHOW_FLOW_MODAL") {
        console.log("📅 SHOW_FLOW_MODAL message received in injector!");
        try {
            flowInjector.show();
            sendResponse({ success: true });
            console.log("📅 Flow show() completed successfully");
        } catch (error) {
            console.error("❌ Error showing flow:", error);
            sendResponse({ success: false, error: error.message });
        }
        return true;
    }

    if (message.type === "HIDE_FLOW_MODAL") {
        console.log("📅 HIDE_FLOW_MODAL message received in injector!");
        try {
            flowInjector.hide();
            sendResponse({ success: true });
            console.log("📅 Flow hide() completed successfully");
        } catch (error) {
            console.error("❌ Error hiding flow:", error);
            sendResponse({ success: false, error: error.message });
        }
        return true;
    }

    if (message.type === "CLEANUP_FLOW") {
        flowInjector.destroy();
        sendResponse({ success: true });
        return true;
    }

    return false; // Let other listeners handle other message types
};

// Add the listener
chrome.runtime.onMessage.addListener(messageListener);
console.log("📅 Flow message listener registered");

// Test that the listener is working
setTimeout(() => {
    console.log("📅 Flow injector status check:");
    console.log("  - Instance exists:", !!flowInjector);
    console.log(
        "  - Message listener active:",
        chrome.runtime.onMessage.hasListeners(),
    );
    console.log(
        "  - Container in DOM:",
        !!document.getElementById("lyncx-flow-root"),
    );
}, 1000);

// Export for consistency
export default flowInjector;
