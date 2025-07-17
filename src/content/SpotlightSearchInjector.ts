// Complete SpotlightSearchInjector.ts with Cross-Tab Search
import React from "react";
import ReactDOM from "react-dom/client";
import SpotlightSearch from "../components/SpotlightSearch";

class SpotlightSearchInjector {
    private container: HTMLDivElement | null = null;
    private root: ReactDOM.Root | null = null;
    private isInjected = false;

    constructor() {
        // Listen for search requests from the navbar
        chrome.runtime.onMessage.addListener(
            (message, sender, sendResponse) => {
                if (message.type === "SHOW_SPOTLIGHT_SEARCH") {
                    this.showSearch();
                    sendResponse({ success: true });
                }
            },
        );
    }

    public showSearch() {
        if (!this.isInjected) {
            this.injectSearch();
        }
        this.updateSearchVisibility(true);
    }

    public hideSearch() {
        this.updateSearchVisibility(false);
    }

    private injectSearch() {
        if (this.isInjected) {
            console.log("⚠️ Spotlight search already injected, skipping");
            return;
        }

        console.log("🔍 Starting spotlight search injection...");

        try {
            // Create container
            this.container = document.createElement("div");
            this.container.id = "lynx-spotlight-search-root";
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

            // Create style element with complete styles
            const style = document.createElement("style");
            style.textContent = this.getStyles();
            shadowRoot.appendChild(style);

            // Create React root container
            const reactContainer = document.createElement("div");
            reactContainer.style.pointerEvents = "auto";
            shadowRoot.appendChild(reactContainer);

            // Append to body
            document.body.appendChild(this.container);

            // Create React root and render
            this.root = ReactDOM.createRoot(reactContainer);
            this.renderSearch(false);

            this.isInjected = true;
            console.log("✅ Spotlight search injected successfully");
        } catch (error) {
            console.error("❌ Failed to inject spotlight search:", error);
        }
    }

    private updateSearchVisibility(isVisible: boolean) {
        if (this.root) {
            this.renderSearch(isVisible);
        }
    }

    private renderSearch(isVisible: boolean) {
        if (this.root) {
            this.root.render(
                React.createElement(SpotlightSearch, {
                    isVisible,
                    onClose: () => this.hideSearch(),
                }),
            );
        }
    }

    private getStyles(): string {
        return `
            /* Reset and base styles */
            * {
                box-sizing: border-box;
                margin: 0;
                padding: 0;
            }
            
            /* Spotlight Search Styles */
            .spotlight-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.4);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 999999;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }

            .spotlight-container {
                width: 35%;
                height: 40%;
                background: rgba(60, 60, 60, 0.8);
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
                border-radius: 12px;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
                overflow: hidden;
                border: 1px solid rgba(255, 255, 255, 0.1);
                display: flex;
                flex-direction: column;
            }

            .spotlight-search-header {
                display: flex;
                align-items: center;
                padding: 16px 20px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                flex-shrink: 0;
            }

            .spotlight-search-icon {
                width: 18px;
                height: 18px;
                color: rgba(255, 255, 255, 0.7);
                margin-right: 12px;
                flex-shrink: 0;
            }

            .spotlight-search-input {
                flex: 1;
                background: transparent;
                border: none;
                outline: none;
                color: white;
                font-size: 16px;
                font-weight: 400;
                caret-color: white;
            }

            .spotlight-search-input::placeholder {
                color: rgba(255, 255, 255, 0.5);
            }

            .spotlight-commands {
                flex: 1;
                overflow-y: auto;
                padding: 8px 0;
                min-height: 0;
            }

            .spotlight-command-item {
                display: flex;
                align-items: center;
                padding: 12px 20px;
                cursor: pointer;
                transition: background-color 0.1s ease;
                border-radius: 8px;
                margin: 0 8px;
            }

            .spotlight-command-item:hover {
                background: rgba(255, 255, 255, 0.1);
            }

            .spotlight-command-item.selected {
                background: rgba(0, 122, 255, 0.8);
            }

            .spotlight-command-icon {
                width: 18px;
                height: 18px;
                color: white;
                margin-right: 14px;
                flex-shrink: 0;
            }

            .spotlight-command-content {
                flex: 1;
                min-width: 0;
            }

            .spotlight-command-title {
                color: white;
                font-size: 15px;
                font-weight: 400;
                line-height: 1.3;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                display: flex;
                align-items: center;
            }

            .spotlight-command-subtitle {
                color: rgba(255, 255, 255, 0.7);
                font-size: 13px;
                line-height: 1.2;
                margin-top: 3px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .spotlight-separator {
                height: 1px;
                background: rgba(255, 255, 255, 0.1);
                margin: 0 20px;
            }

            .spotlight-loading {
                padding: 30px 20px;
                text-align: center;
                color: rgba(255, 255, 255, 0.7);
                font-size: 15px;
            }

            .spotlight-no-results {
                padding: 30px 20px;
                text-align: center;
                color: rgba(255, 255, 255, 0.7);
                font-size: 15px;
            }

            .spotlight-footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 20px;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
                background: rgba(255, 255, 255, 0.05);
                flex-shrink: 0;
            }

            .spotlight-footer span {
                color: rgba(255, 255, 255, 0.6);
                font-size: 12px;
                font-weight: 400;
            }

            /* Tab-specific styles */
            .spotlight-tab-favicon {
                width: 18px;
                height: 18px;
                margin-right: 14px;
                flex-shrink: 0;
                position: relative;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .spotlight-tab-favicon img {
                width: 16px;
                height: 16px;
                border-radius: 2px;
                display: block;
            }

            .spotlight-tab-fallback-icon {
                width: 16px;
                height: 16px;
                color: rgba(255, 255, 255, 0.7);
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                display: none;
            }

            .spotlight-tab-favicon img[style*="display: none"] + .spotlight-tab-fallback-icon {
                display: block;
            }

            .spotlight-match-count {
                background: rgba(0, 122, 255, 0.8);
                color: white;
                padding: 2px 6px;
                border-radius: 8px;
                font-size: 11px;
                font-weight: 500;
                margin-left: 8px;
                flex-shrink: 0;
            }

            .spotlight-tab-context {
                background: rgba(255, 255, 255, 0.1);
                border-radius: 4px;
                padding: 4px 6px;
                margin-top: 4px;
                font-size: 11px;
                color: rgba(255, 255, 255, 0.8);
                line-height: 1.3;
                border-left: 2px solid rgba(0, 122, 255, 0.8);
            }

            .spotlight-tab-context mark {
                background-color: rgba(255, 235, 59, 0.8);
                padding: 1px 2px;
                border-radius: 2px;
                color: rgba(0, 0, 0, 0.8);
            }

            .spotlight-command-arrow {
                width: 14px;
                height: 14px;
                color: rgba(255, 255, 255, 0.5);
                flex-shrink: 0;
                margin-left: 8px;
            }

            /* Scrollbar styling */
            .spotlight-commands::-webkit-scrollbar {
                width: 6px;
            }

            .spotlight-commands::-webkit-scrollbar-track {
                background: transparent;
            }

            .spotlight-commands::-webkit-scrollbar-thumb {
                background: rgba(255, 255, 255, 0.2);
                border-radius: 3px;
            }

            .spotlight-commands::-webkit-scrollbar-thumb:hover {
                background: rgba(255, 255, 255, 0.3);
            }

            /* Responsive adjustments */
            @media (max-width: 768px) {
                .spotlight-container {
                    width: 80%;
                    max-height: 60%;
                }
            }

            @media (max-width: 480px) {
                .spotlight-container {
                    width: 90%;
                    max-height: 70%;
                }
            }
        `;
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
const searchInjector = new SpotlightSearchInjector();

// Listen for cleanup messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "CLEANUP_SEARCH") {
        searchInjector.destroy();
        sendResponse({ success: true });
    }
});

export default SpotlightSearchInjector;
