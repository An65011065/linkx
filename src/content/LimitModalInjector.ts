import React from "react";
import ReactDOM from "react-dom/client";
import LimitModal from "../components/LimitModal";

class LimitModalInjector {
    private container: HTMLDivElement | null = null;
    private root: ReactDOM.Root | null = null;
    private isInjected = false;
    private currentDomain = "";

    constructor() {
        console.log("🚀 LimitModalInjector initialized");
        this.currentDomain = window.location.hostname.replace(/^www\./, "");

        // Listen for limit modal requests from the navbar
        chrome.runtime.onMessage.addListener(
            (message, sender, sendResponse) => {
                console.log("📩 LimitModalInjector received message:", message);

                if (message.type === "SHOW_LIMIT_MODAL") {
                    console.log("🛡️ SHOW_LIMIT_MODAL message received");
                    this.showLimitModal(message.domain);
                    sendResponse({ success: true });
                    return true;
                }

                return false;
            },
        );
    }

    public showLimitModal(domain?: string) {
        console.log("🎯 showLimitModal() called");

        this.currentDomain =
            domain || window.location.hostname.replace(/^www\./, "");
        console.log("🌐 Current domain:", this.currentDomain);

        if (!this.isInjected) {
            console.log("💉 Modal not injected yet, calling injectModal()");
            this.injectModal(true); // show immediately
        } else {
            console.log("♻️ Modal already injected, just updating visibility");
            this.updateModalVisibility(true);
        }
    }

    public hideModal() {
        console.log("🙈 hideModal() called");
        this.updateModalVisibility(false);
    }

    private injectModal(showImmediately = false) {
        if (this.isInjected) {
            console.log("⚠️ Modal already injected, skipping");
            return;
        }

        console.log("🛡️ Starting limit modal injection...");

        try {
            // Create container - EXACTLY like notepad
            this.container = document.createElement("div");
            this.container.id = "lynx-limit-modal-root";
            this.container.style.cssText = `
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                z-index: 10000000 !important;
                pointer-events: none !important;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif !important;
            `;

            console.log("📦 Container created:", this.container);

            // Create shadow DOM for style isolation
            const shadowRoot = this.container.attachShadow({ mode: "open" });
            console.log("🌘 Shadow root created:", shadowRoot);

            // Create React root container - EXACTLY like notepad
            const reactContainer = document.createElement("div");
            reactContainer.style.pointerEvents = "auto";
            shadowRoot.appendChild(reactContainer);

            console.log("⚛️ React container created and added to shadow DOM");

            // Append to body
            document.body.appendChild(this.container);
            console.log("🏠 Container appended to document body");

            // Create React root and render
            this.root = ReactDOM.createRoot(reactContainer);
            console.log("🌳 React root created:", this.root);

            this.renderModal(showImmediately);
            console.log(
                `🎨 Initial render called with isVisible=${showImmediately}`,
            );

            this.isInjected = true;
            console.log(
                "✅ Limit modal injected successfully - isInjected set to true",
            );
        } catch (error) {
            console.error("❌ Failed to inject limit modal:", error);
            console.error(
                "📚 Error stack:",
                error instanceof Error ? error.stack : "No stack trace",
            );
        }
    }

    private updateModalVisibility(isVisible: boolean) {
        console.log(
            "👁️ updateModalVisibility called with isVisible:",
            isVisible,
        );
        console.log("🌳 root exists:", !!this.root);

        if (this.root) {
            this.renderModal(isVisible);
        } else {
            console.error("❌ No root available for rendering");
        }
    }

    private renderModal(isVisible: boolean) {
        console.log("🎨 renderModal called with isVisible:", isVisible);

        if (this.root) {
            console.log("🌐 Current domain:", this.currentDomain);

            try {
                this.root.render(
                    React.createElement(LimitModal, {
                        isVisible,
                        domain: this.currentDomain,
                        onClose: () => {
                            console.log("❌ Modal close requested");
                            this.hideModal();
                        },
                    }),
                );
                console.log("✅ Modal rendered successfully");
            } catch (error) {
                console.error("❌ Error rendering modal:", error);
                console.error(
                    "📚 Render error stack:",
                    error instanceof Error ? error.stack : "No stack trace",
                );
            }
        } else {
            console.error("❌ Cannot render - no root available");
        }
    }

    public destroy() {
        console.log("💥 destroy() called");

        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
            console.log("🗑️ Container removed from DOM");
        }

        this.container = null;
        this.root = null;
        this.isInjected = false;
        console.log("🧹 Limit modal injector cleaned up");
    }
}

// Initialize the limit modal injector
console.log("🚀 Initializing LimitModalInjector...");
const limitModalInjector = new LimitModalInjector();
console.log("✅ LimitModalInjector instance created:", limitModalInjector);

// Listen for cleanup messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "CLEANUP_LIMIT_MODAL") {
        console.log("🧹 CLEANUP_LIMIT_MODAL message received");
        limitModalInjector.destroy();
        sendResponse({ success: true });
        return true;
    }
    return false;
});

export default LimitModalInjector;
