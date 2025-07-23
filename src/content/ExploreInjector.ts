// ExploreInjector.ts - Injects the explore modal into any webpage and auto-shows it
import React from "react";
import ReactDOM from "react-dom/client";
import ExploreModal from "../components/ExploreModal";

class ExploreInjector {
    private container: HTMLDivElement | null = null;
    private root: ReactDOM.Root | null = null;
    private isInjected = false;

    constructor() {
        console.log("🔍 ExploreInjector: Auto-initializing modal...");

        // 🆕 AUTO-SHOW ON INITIALIZATION
        this.showExploreModal();

        // Listen for explore modal requests
        chrome.runtime.onMessage.addListener(
            (message, sender, sendResponse) => {
                if (message.type === "SHOW_EXPLORE_MODAL") {
                    this.showExploreModal();
                    sendResponse({ success: true });
                }
                if (message.type === "HIDE_EXPLORE_MODAL") {
                    this.hideExploreModal();
                    sendResponse({ success: true });
                }
            },
        );
    }

    private showExploreModal() {
        if (!this.isInjected) {
            this.injectExploreModal();
        } else {
            this.updateExploreModalVisibility(true);
        }
    }

    private hideExploreModal() {
        if (this.isInjected) {
            this.updateExploreModalVisibility(false);
        }
    }

    private injectExploreModal() {
        if (this.isInjected) {
            console.log("⚠️ Explore modal already injected");
            return;
        }

        console.log("🔍 Injecting explore modal...");

        try {
            // Create container
            this.container = document.createElement("div");
            this.container.id = "lyncx-explore-modal-root";
            this.container.style.cssText = `
                position: fixed !important;
                bottom: 0 !important;
                left: 0 !important;
                right: 0 !important;
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
            this.renderExploreModal(true); // AUTO-SHOW AS VISIBLE

            this.isInjected = true;
            console.log(
                "✅ Explore modal injected and auto-shown successfully",
            );
        } catch (error) {
            console.error("❌ Failed to inject explore modal:", error);
        }
    }

    private updateExploreModalVisibility(isVisible: boolean) {
        if (this.root) {
            this.renderExploreModal(isVisible);
        }
    }

    private renderExploreModal(isVisible: boolean) {
        if (this.root) {
            this.root.render(
                React.createElement(ExploreModal, {
                    isVisible,
                    onClose: () => this.updateExploreModalVisibility(false),
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

// Initialize the explore injector - this will auto-show the modal
const exploreInjector = new ExploreInjector();

// Listen for cleanup messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "CLEANUP_EXPLORE_MODAL") {
        exploreInjector.destroy();
        sendResponse({ success: true });
    }
});

export default ExploreInjector;
