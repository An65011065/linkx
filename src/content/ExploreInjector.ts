// SearchInjector.ts - Injects the search modal into any webpage
import React from "react";
import ReactDOM from "react-dom/client";
import SearchModal from "../components/ExploreModal";

class SearchInjector {
    private container: HTMLDivElement | null = null;
    private root: ReactDOM.Root | null = null;
    private isInjected = false;

    constructor() {
        // Listen for search modal requests
        chrome.runtime.onMessage.addListener(
            (message, sender, sendResponse) => {
                if (message.type === "SHOW_SEARCH_MODAL") {
                    this.showSearchModal();
                    sendResponse({ success: true });
                }
                if (message.type === "HIDE_SEARCH_MODAL") {
                    this.hideSearchModal();
                    sendResponse({ success: true });
                }
            },
        );
    }

    private showSearchModal() {
        if (!this.isInjected) {
            this.injectSearchModal();
        } else {
            this.updateSearchModalVisibility(true);
        }
    }

    private hideSearchModal() {
        if (this.isInjected) {
            this.updateSearchModalVisibility(false);
        }
    }

    private injectSearchModal() {
        if (this.isInjected) {
            console.log("⚠️ Search modal already injected");
            return;
        }

        console.log("🔍 Injecting explore modal...");

        try {
            // Create container
            this.container = document.createElement("div");
            this.container.id = "lyncx-search-modal-root";
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
            this.renderSearchModal(true);

            this.isInjected = true;
            console.log("✅ Search modal injected successfully");
        } catch (error) {
            console.error("❌ Failed to inject search modal:", error);
        }
    }

    private updateSearchModalVisibility(isVisible: boolean) {
        if (this.root) {
            this.renderSearchModal(isVisible);
        }
    }

    private renderSearchModal(isVisible: boolean) {
        if (this.root) {
            this.root.render(
                React.createElement(SearchModal, {
                    isVisible,
                    onClose: () => this.updateSearchModalVisibility(false),
                }),
            );
        }
    }

    private async handleSearchSubmit(message: string) {
        // This method is no longer needed since the modal handles submission internally
        console.log("🔍 Search submitted:", message);
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

// Initialize the search injector
const searchInjector = new SearchInjector();

// Listen for cleanup messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "CLEANUP_SEARCH_MODAL") {
        searchInjector.destroy();
        sendResponse({ success: true });
    }
});

export default SearchInjector;
