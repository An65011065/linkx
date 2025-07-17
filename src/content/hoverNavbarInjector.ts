// Content script to inject hover navbar
import React from "react";
import ReactDOM from "react-dom/client";
import HoverNavbar from "../components/HoverNavbar";

class HoverNavbarInjector {
    private container: HTMLDivElement | null = null;
    private root: ReactDOM.Root | null = null;
    private isInjected = false;

    constructor() {
        this.init();
    }

    private init() {
        // Wait for DOM to be ready
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
            // Create container
            this.container = document.createElement("div");
            this.container.id = "lynx-hover-navbar-root";
            this.container.style.cssText = `
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                z-index: 999999 !important;
                pointer-events: none !important;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif !important;
            `;

            // Create shadow DOM for style isolation
            const shadowRoot = this.container.attachShadow({ mode: "open" });

            // Create style element
            const style = document.createElement("style");
            style.textContent = this.getStyles();
            shadowRoot.appendChild(style);

            // Create React root container
            const reactContainer = document.createElement("div");
            shadowRoot.appendChild(reactContainer);

            // Append to body
            document.body.appendChild(this.container);

            // Create React root and render
            this.root = ReactDOM.createRoot(reactContainer);
            this.root.render(React.createElement(HoverNavbar));

            this.isInjected = true;
            console.log("🎯 Hover navbar injected successfully");
            console.log("🔍 Container element:", this.container);
            console.log("🔍 Shadow root:", shadowRoot);
            console.log("🔍 React root:", this.root);
        } catch (error) {
            console.error("❌ Failed to inject hover navbar:", error);
            console.error(
                "❌ Stack trace:",
                error instanceof Error ? error.stack : "No stack trace",
            );
            console.error("❌ Document ready state:", document.readyState);
            console.error("❌ Document body:", document.body);
        }
    }

    private getStyles(): string {
        // Detect if the page has a dark background
        const isDarkBackground = this.isDarkBackground();

        return `
    /* Minimal Illustrator-Style Navbar */
    .lynx-hover-navbar {
        position: fixed;
        top: 0;
        left: 0;
        height: 100vh;
        z-index: 999999;
        pointer-events: none;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    }

    .lynx-hover-trigger {
        position: absolute;
        top: 0;
        left: 0;
        width: 20px;
        height: 100vh;
        background: transparent;
        pointer-events: auto;
        cursor: pointer;
    }

    .lynx-navbar-container {
        position: absolute;
        top: 0;
        left: 0;
        width: 48px;
        height: 100vh;
        background: ${
            isDarkBackground
                ? "rgba(20, 20, 20, 0.95)"
                : "rgba(250, 250, 250, 0.95)"
        };
        backdrop-filter: blur(20px) saturate(180%);
        -webkit-backdrop-filter: blur(20px) saturate(180%);
        border-right: 1px solid ${
            isDarkBackground
                ? "rgba(255, 255, 255, 0.08)"
                : "rgba(0, 0, 0, 0.08)"
        };
        transform: translateX(-100%);
        transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
        pointer-events: auto;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }

    .lynx-navbar-container.visible {
        transform: translateX(0);
    }

    /* Section 1: Data Tools */
    .lynx-navbar-section-data {
        padding: 16px 0 12px 0;
        display: flex;
        flex-direction: column;
        gap: 4px;
        align-items: center;
        border-bottom: 1px solid ${
            isDarkBackground ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"
        };
    }

    /* Section 2: Quick Actions */
    .lynx-navbar-section-quick {
        flex: 1;
        padding: 12px 0;
        display: flex;
        flex-direction: column;
        gap: 4px;
        align-items: center;
        justify-content: center;
        border-bottom: 1px solid ${
            isDarkBackground ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"
        };
    }

    /* Section 3: Other Tools */
    .lynx-navbar-section-tools {
        padding: 12px 0 16px 0;
        display: flex;
        flex-direction: column;
        gap: 4px;
        align-items: center;
    }

    .lynx-nav-item {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.15s ease;
        color: ${
            isDarkBackground ? "rgba(255, 255, 255, 0.8)" : "rgba(0, 0, 0, 0.8)"
        };
        position: relative;
        background: transparent;
        border: none;
        /* Enhanced contrast for better visibility */
        filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
    }

    .lynx-nav-item:hover {
        color: ${isDarkBackground ? "#ffffff" : "#000000"};
        transform: scale(1.05);
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4));
    }

    .lynx-nav-item.active {
        color: var(--item-color, #3b82f6);
        transform: scale(1.05);
        filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.5));
    }

    .lynx-nav-item.active::after {
        content: '';
        position: absolute;
        left: -6px;
        top: 50%;
        width: 2px;
        height: 16px;
        background: var(--item-color, #3b82f6);
        border-radius: 1px;
        transform: translateY(-50%);
        box-shadow: 0 0 4px var(--item-color, #3b82f6);
    }

    /* Data section icons (slightly larger for hierarchy) */
    .lynx-navbar-section-data .lynx-nav-item {
        width: 36px;
        height: 36px;
    }

    .lynx-navbar-section-data .lynx-nav-item svg {
        min-width: 20px;
        min-height: 20px;
    }

    /* Quick actions (medium size) */
    .lynx-navbar-section-quick .lynx-nav-item svg {
        min-width: 18px;
        min-height: 18px;
    }

    /* Tools section (smaller) */
    .lynx-navbar-section-tools .lynx-nav-item svg {
        min-width: 16px;
        min-height: 16px;
    }

    .lynx-nav-item svg {
        transition: transform 0.15s ease;
        /* Ensure icons are always visible with stroke */
        stroke-width: 1.5;
    }

    .lynx-nav-item:hover svg {
        transform: scale(1.1);
    }

    /* User avatar at bottom */
    .lynx-navbar-footer {
        padding: 12px 0 16px 0;
        display: flex;
        align-items: center;
        justify-content: center;
        border-top: 1px solid ${
            isDarkBackground ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"
        };
    }

    .lynx-user-avatar {
        width: 28px;
        height: 28px;
        border-radius: 6px;
        background: linear-gradient(145deg, #3b82f6, #1d4ed8);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #ffffff;
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        transition: all 0.15s ease;
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .lynx-user-avatar:hover {
        transform: scale(1.05);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    }

    /* Hover indicator */
    .lynx-hover-navbar::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 1px;
        width: 2px;
        height: 30px;
        background: linear-gradient(to bottom, transparent, #3b82f6, transparent);
        border-radius: 1px;
        transform: translateY(-50%);
        opacity: 0;
        transition: opacity 0.3s ease;
    }

    .lynx-hover-navbar:hover::before {
        opacity: 1;
    }

    /* Section labels (subtle visual cues) */
    .lynx-navbar-section-data::before {
        content: '';
        position: absolute;
        left: 2px;
        top: 8px;
        width: 44px;
        height: 2px;
        background: linear-gradient(90deg, transparent, #3b82f6, transparent);
        opacity: 0.3;
    }

    .lynx-navbar-section-quick::before {
        content: '';
        position: absolute;
        left: 2px;
        top: 0;
        width: 44px;
        height: 1px;
        background: linear-gradient(90deg, transparent, #10b981, transparent);
        opacity: 0.3;
    }

    .lynx-navbar-section-tools::before {
        content: '';
        position: absolute;
        left: 2px;
        top: 0;
        width: 44px;
        height: 1px;
        background: linear-gradient(90deg, transparent, #8b5cf6, transparent);
        opacity: 0.3;
    }

    @media (max-width: 768px) {
        .lynx-navbar-container {
            width: 44px;
        }
        
        .lynx-navbar-section-data .lynx-nav-item {
            width: 32px;
            height: 32px;
        }
        
        .lynx-navbar-section-data .lynx-nav-item svg {
            min-width: 18px;
            min-height: 18px;
        }

        .lynx-navbar-section-quick .lynx-nav-item svg {
            min-width: 16px;
            min-height: 16px;
        }

        .lynx-navbar-section-tools .lynx-nav-item svg {
            min-width: 14px;
            min-height: 14px;
        }
        
        .lynx-user-avatar {
            width: 24px;
            height: 24px;
            font-size: 10px;
        }
    }
`;
    }

    private isDarkBackground(): boolean {
        try {
            const body = document.body;
            const html = document.documentElement;

            // Get computed styles
            const bodyStyle = window.getComputedStyle(body);
            const htmlStyle = window.getComputedStyle(html);

            // Check background colors
            const bodyBg = bodyStyle.backgroundColor;
            const htmlBg = htmlStyle.backgroundColor;

            // Function to check if color is dark
            const isColorDark = (color: string): boolean => {
                if (color === "rgba(0, 0, 0, 0)" || color === "transparent")
                    return false;

                const rgb = color.match(/\d+/g);
                if (!rgb) return false;

                const [r, g, b] = rgb.map(Number);
                const brightness = (r * 299 + g * 587 + b * 114) / 1000;
                return brightness < 128;
            };

            // Check body background first, then html
            if (bodyBg && bodyBg !== "rgba(0, 0, 0, 0)") {
                return isColorDark(bodyBg);
            }

            if (htmlBg && htmlBg !== "rgba(0, 0, 0, 0)") {
                return isColorDark(htmlBg);
            }

            // Default to light background
            return false;
        } catch (error) {
            console.log("Error detecting background color:", error);
            return false; // Default to light
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
