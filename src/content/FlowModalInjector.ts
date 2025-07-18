// FlowModalInjector.ts - handles injecting the flow modal into any page
import React from "react";
import ReactDOM from "react-dom/client";
import FlowModal from "../components/FlowModal";

class FlowModalInjector {
    private container: HTMLDivElement | null = null;
    private root: ReactDOM.Root | null = null;
    private isInjected = false;

    constructor() {
        // Listen for flow requests
        chrome.runtime.onMessage.addListener(
            (message, sender, sendResponse) => {
                if (message.type === "SHOW_FLOW_MODAL") {
                    this.showFlow();
                    sendResponse({ success: true });
                }
            },
        );
    }

    private showFlow() {
        if (!this.isInjected) {
            this.injectFlow(true); // show immediately
        } else {
            this.updateFlowVisibility(true);
        }
    }

    private injectFlow(showImmediately = false) {
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
            this.renderFlow(showImmediately);

            this.isInjected = true;
            console.log("✅ Flow modal injected successfully");
        } catch (error) {
            console.error("❌ Failed to inject flow modal:", error);
        }
    }

    private updateFlowVisibility(isVisible: boolean) {
        if (this.root) {
            this.renderFlow(isVisible);
        }
    }

    private renderFlow(isVisible: boolean) {
        if (this.root) {
            this.root.render(
                React.createElement(FlowModal, {
                    isVisible,
                    onClose: () => this.updateFlowVisibility(false),
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

// Initialize the flow injector
const flowInjector = new FlowModalInjector();

// Listen for cleanup messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "CLEANUP_FLOW") {
        flowInjector.destroy();
        sendResponse({ success: true });
    }
});

export default FlowModalInjector;
