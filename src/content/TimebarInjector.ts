// Content script to inject timer bar
import React from "react";
import ReactDOM from "react-dom/client";
import TimerBar from "../components/Timebar";

class TimerInjector {
    private container: HTMLDivElement | null = null;
    private root: ReactDOM.Root | null = null;
    private isInjected = false;
    private checkInterval: NodeJS.Timeout | null = null;
    private currentDomain: string;

    constructor() {
        console.log("🚀 TimerInjector initialized");
        this.currentDomain = window.location.hostname.replace(/^www\./, "");

        // Listen for timer requests from the navbar
        chrome.runtime.onMessage.addListener(
            (message, sender, sendResponse) => {
                console.log("📩 TimerInjector received message:", message);

                if (message.type === "SHOW_TIMER") {
                    console.log(
                        "⏱️ SHOW_TIMER message received, calling showTimer()",
                    );
                    this.showTimer();
                    sendResponse({ success: true });
                    return true;
                }

                return false;
            },
        );

        // Start checking for active timers immediately
        this.startTimerCheck();
    }

    private startTimerCheck() {
        console.log(
            "🔍 Starting automatic timer detection for:",
            this.currentDomain,
        );

        // Check immediately
        this.checkForActiveTimer();

        // Then check every 30 seconds
        this.checkInterval = setInterval(() => {
            this.checkForActiveTimer();
        }, 30000);
    }

    private async checkForActiveTimer() {
        try {
            const response = await chrome.runtime.sendMessage({
                action: "getActiveTimers",
            });

            if (response.timers) {
                const timerKey = `timer_${this.currentDomain}`;
                const timerData = response.timers[timerKey];

                if (timerData && timerData.endTime > Date.now()) {
                    console.log(
                        "✅ Found active timer for",
                        this.currentDomain,
                        "- auto-showing timer bar",
                    );
                    if (!this.isInjected) {
                        this.injectTimer();
                    }
                    this.updateTimerVisibility(true);
                } else {
                    console.log("❌ No active timer for", this.currentDomain);
                    // Only hide if timer was auto-shown, not manually opened
                    if (this.isInjected) {
                        this.updateTimerVisibility(false);
                    }
                }
            }
        } catch (error) {
            console.log("🔍 Error checking for timer:", error);
        }
    }

    public showTimer() {
        console.log("🎯 showTimer() called (manual)");
        console.log("🔍 isInjected:", this.isInjected);

        if (!this.isInjected) {
            console.log("💉 Timer not injected yet, calling injectTimer()");
            this.injectTimer();
        } else {
            console.log("♻️ Timer already injected, just updating visibility");
        }

        this.updateTimerVisibility(true);
    }

    public hideTimer() {
        console.log("🙈 hideTimer() called");
        this.updateTimerVisibility(false);
    }

    private injectTimer() {
        if (this.isInjected) {
            console.log("⚠️ Timer already injected, skipping");
            return;
        }

        console.log("⏱️ Starting timer injection...");

        try {
            // Create container
            this.container = document.createElement("div");
            this.container.id = "lynx-timer-root";
            this.container.style.cssText = `
                position: fixed !important;
                top: 0 !important;
                right: 0 !important;
                z-index: 9999998 !important;
                pointer-events: none !important;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif !important;
            `;

            console.log("📦 Container created:", this.container);

            // Create shadow DOM for style isolation
            const shadowRoot = this.container.attachShadow({ mode: "open" });
            console.log("🌘 Shadow root created:", shadowRoot);

            // Create React root container
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

            this.renderTimer(false);
            console.log("🎨 Initial render called with isVisible=false");

            this.isInjected = true;
            console.log(
                "✅ Timer injected successfully - isInjected set to true",
            );
        } catch (error) {
            console.error("❌ Failed to inject timer:", error);
            console.error("📚 Error stack:", error.stack);
        }
    }

    private updateTimerVisibility(isVisible: boolean) {
        console.log(
            "👁️ updateTimerVisibility called with isVisible:",
            isVisible,
        );
        console.log("🌳 root exists:", !!this.root);

        if (this.root) {
            this.renderTimer(isVisible);
        } else {
            console.error("❌ No root available for rendering");
        }
    }

    private renderTimer(isVisible: boolean) {
        console.log("🎨 renderTimer called with isVisible:", isVisible);

        if (this.root) {
            console.log("🌐 Current domain:", this.currentDomain);

            try {
                this.root.render(
                    React.createElement(TimerBar, {
                        isVisible,
                        domain: this.currentDomain,
                        onClose: () => {
                            console.log("❌ Timer close requested");
                            this.hideTimer();
                        },
                    }),
                );
                console.log("✅ Timer rendered successfully");
            } catch (error) {
                console.error("❌ Error rendering timer:", error);
                console.error("📚 Render error stack:", error.stack);
            }
        } else {
            console.error("❌ Cannot render - no root available");
        }
    }

    public destroy() {
        console.log("💥 destroy() called");

        // Clear the check interval
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
            console.log("⏹️ Timer check interval cleared");
        }

        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
            console.log("🗑️ Container removed from DOM");
        }

        this.container = null;
        this.root = null;
        this.isInjected = false;
        console.log("🧹 Timer injector cleaned up");
    }
}

// Initialize the timer injector
console.log("🚀 Initializing TimerInjector...");
const timerInjector = new TimerInjector();
console.log("✅ TimerInjector instance created:", timerInjector);

// Listen for cleanup messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "CLEANUP_TIMER") {
        console.log("🧹 CLEANUP_TIMER message received");
        timerInjector.destroy();
        sendResponse({ success: true });
        return true;
    }
    return false;
});

export default TimerInjector;
