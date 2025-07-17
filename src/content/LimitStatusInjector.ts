import React from "react";
import ReactDOM from "react-dom/client";
import LimitStatusBar from "../components/LimitStatusBar";

class LimitStatusInjector {
    private container: HTMLDivElement | null = null;
    private root: ReactDOM.Root | null = null;
    private isInjected = false;
    private currentDomain: string;
    private checkInterval: number | null = null;
    private initialShowTimeout: number | null = null;

    constructor() {
        console.log("🚀 LimitStatusInjector initialized");
        this.currentDomain = window.location.hostname.replace(/^www\./, "");

        // Listen for status bar requests
        chrome.runtime.onMessage.addListener(
            (message, sender, sendResponse) => {
                console.log(
                    "📩 LimitStatusInjector received message:",
                    message,
                );

                if (message.type === "SHOW_LIMIT_STATUS") {
                    console.log("📊 SHOW_LIMIT_STATUS message received");
                    this.showStatusBar(true); // Show expanded initially
                    sendResponse({ success: true });
                    return true;
                }

                if (message.type === "HIDE_LIMIT_STATUS") {
                    console.log("🙈 HIDE_LIMIT_STATUS message received");
                    this.hideStatusBar();
                    sendResponse({ success: true });
                    return true;
                }

                return false;
            },
        );

        // Auto-check for active limits on this domain
        this.startLimitCheck();
    }

    private startLimitCheck() {
        console.log(
            "🔍 Starting automatic limit detection for:",
            this.currentDomain,
        );

        // Check immediately
        this.checkForActiveLimit();

        // Then check every 2 minutes
        this.checkInterval = window.setInterval(() => {
            this.checkForActiveLimit();
        }, 120000); // 2 minutes
    }

    private async checkForActiveLimit() {
        try {
            const response = await chrome.runtime.sendMessage({
                type: "GET_DAILY_LIMIT",
                domain: this.currentDomain,
            });

            if (
                response &&
                response.success &&
                response.limit &&
                response.limit.enabled
            ) {
                console.log(
                    "✅ Found active limit for",
                    this.currentDomain,
                    "- showing status bar",
                );
                if (!this.isInjected) {
                    this.injectStatusBar();
                }
                this.updateStatusBarVisibility(true);
            } else {
                console.log("❌ No active limit for", this.currentDomain);
                if (this.isInjected) {
                    this.updateStatusBarVisibility(false);
                }
            }
        } catch (error) {
            console.log("🔍 Error checking for limit:", error);
        }
    }

    public showStatusBar(showExpanded: boolean = false) {
        console.log("🎯 showStatusBar() called, showExpanded:", showExpanded);

        if (!this.isInjected) {
            console.log(
                "💉 Status bar not injected yet, calling injectStatusBar()",
            );
            this.injectStatusBar();
        }

        this.updateStatusBarVisibility(true);

        // If we should show expanded initially (like when setting a new limit)
        if (showExpanded) {
            console.log("📊 Showing expanded status bar for 2 seconds");

            // Clear any existing timeout
            if (this.initialShowTimeout) {
                clearTimeout(this.initialShowTimeout);
            }

            // Force the status bar to show expanded by triggering a temporary hover state
            this.forceExpandedView();

            // Auto-collapse after 2 seconds
            this.initialShowTimeout = window.setTimeout(() => {
                console.log("⏰ Auto-collapsing status bar");
                this.forceCollapsedView();
            }, 2000);
        }
    }

    private forceExpandedView() {
        // Send a message to the status bar component to force expanded view
        this.renderStatusBar(true, true); // visible=true, forceExpanded=true
    }

    private forceCollapsedView() {
        // Send a message to the status bar component to force collapsed view
        this.renderStatusBar(true, false); // visible=true, forceExpanded=false
    }

    public hideStatusBar() {
        console.log("🙈 hideStatusBar() called");
        this.updateStatusBarVisibility(false);
    }

    private injectStatusBar() {
        if (this.isInjected) {
            console.log("⚠️ Status bar already injected, skipping");
            return;
        }

        console.log("📊 Starting status bar injection...");

        try {
            // Create container - exactly like notepad
            this.container = document.createElement("div");
            this.container.id = "lynx-limit-status-root";
            this.container.style.cssText = `
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                z-index: 9999997 !important;
                pointer-events: none !important;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif !important;
            `;

            console.log("📦 Container created:", this.container);

            // Create shadow DOM for style isolation
            const shadowRoot = this.container.attachShadow({ mode: "open" });
            console.log("🌘 Shadow root created:", shadowRoot);

            // Create React root container
            const reactContainer = document.createElement("div");
            reactContainer.style.cssText = `
                width: 100%;
                height: 100%;
                pointer-events: auto;
            `;
            shadowRoot.appendChild(reactContainer);

            console.log("⚛️ React container created and added to shadow DOM");

            // Append to body
            document.body.appendChild(this.container);
            console.log("🏠 Container appended to document body");

            // Create React root and render
            this.root = ReactDOM.createRoot(reactContainer);
            console.log("🌳 React root created:", this.root);

            this.renderStatusBar(false);
            console.log("🎨 Initial render called with isVisible=false");

            this.isInjected = true;
            console.log("✅ Status bar injected successfully");
        } catch (error) {
            console.error("❌ Failed to inject status bar:", error);
            console.error(
                "📚 Error stack:",
                error instanceof Error ? error.stack : "No stack trace",
            );
        }
    }

    private updateStatusBarVisibility(isVisible: boolean) {
        console.log(
            "👁️ updateStatusBarVisibility called with isVisible:",
            isVisible,
        );

        if (this.root) {
            this.renderStatusBar(isVisible);
        } else {
            console.error("❌ No root available for rendering");
        }
    }

    private renderStatusBar(isVisible: boolean, forceExpanded?: boolean) {
        console.log(
            "🎨 renderStatusBar called with isVisible:",
            isVisible,
            "forceExpanded:",
            forceExpanded,
        );

        if (this.root) {
            try {
                this.root.render(
                    React.createElement(LimitStatusBar, {
                        domain: this.currentDomain,
                        isVisible,
                        forceExpanded: forceExpanded,
                        onOpenSettings: () => {
                            console.log("⚙️ Opening limit settings");
                            chrome.runtime.sendMessage({
                                type: "SHOW_LIMIT_MODAL",
                                domain: this.currentDomain,
                            });
                        },
                    }),
                );
                console.log("✅ Status bar rendered successfully");
            } catch (error) {
                console.error("❌ Error rendering status bar:", error);
            }
        } else {
            console.error("❌ Cannot render - no root available");
        }
    }

    public destroy() {
        console.log("💥 destroy() called");

        // Clear timeouts
        if (this.initialShowTimeout) {
            clearTimeout(this.initialShowTimeout);
            this.initialShowTimeout = null;
        }

        // Clear the check interval
        if (this.checkInterval) {
            window.clearInterval(this.checkInterval);
            this.checkInterval = null;
            console.log("⏹️ Limit check interval cleared");
        }

        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
            console.log("🗑️ Container removed from DOM");
        }

        this.container = null;
        this.root = null;
        this.isInjected = false;
        console.log("🧹 Status bar injector cleaned up");
    }
}

// Initialize the status bar injector
console.log("🚀 Initializing LimitStatusInjector...");
const limitStatusInjector = new LimitStatusInjector();
console.log("✅ LimitStatusInjector instance created:", limitStatusInjector);

// Listen for cleanup messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "CLEANUP_LIMIT_STATUS") {
        console.log("🧹 CLEANUP_LIMIT_STATUS message received");
        limitStatusInjector.destroy();
        sendResponse({ success: true });
        return true;
    }
    return false;
});

export default LimitStatusInjector;
