// Content script to inject hover navbar - EXACT NOTEPAD PATTERN
import React from "react";
import ReactDOM from "react-dom/client";
import HoverNavbar from "../components/HoverNavbar";

class HoverNavbarInjector {
    private container: HTMLDivElement | null = null;
    private root: ReactDOM.Root | null = null;
    private isInjected = false;

    constructor() {
        console.log(
            "🚀 HoverNavbarInjector initialized - exact notepad pattern",
        );
        this.init();
    }

    private init() {
        // Wait for DOM to be ready (like notepad)
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", () =>
                this.injectNavbar(),
            );
        } else {
            this.injectNavbar();
        }
    }

    private injectNavbar() {
        if (this.isInjected) {
            console.log("⚠️ Navbar already injected, skipping");
            return;
        }

        console.log("🔄 Starting navbar injection process...");

        try {
            // Create container EXACTLY like notepad
            this.container = document.createElement("div");
            this.container.id = "lynx-hover-navbar-root";
            this.container.style.cssText = `
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                z-index: 10000000 !important;
                pointer-events: none !important;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif !important;
            `;

            // Create shadow DOM for style isolation (like notepad)
            const shadowRoot = this.container.attachShadow({ mode: "open" });

            // Create React root container (like notepad)
            const reactContainer = document.createElement("div");
            reactContainer.style.pointerEvents = "auto";
            shadowRoot.appendChild(reactContainer);

            // Append to body (like notepad)
            document.body.appendChild(this.container);

            // Create React root and render (like notepad)
            this.root = ReactDOM.createRoot(reactContainer);
            this.root.render(React.createElement(HoverNavbar));

            this.isInjected = true;
            console.log(
                "✅ Hover navbar injected successfully - should be visible now",
            );
        } catch (error) {
            console.error("❌ Failed to inject hover navbar:", error);
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

// Initialize the injector
const injector = new HoverNavbarInjector();

// Listen for cleanup messages
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === "CLEANUP_NAVBAR") {
        injector.destroy();
        sendResponse({ success: true });
    }
});

export default HoverNavbarInjector;
