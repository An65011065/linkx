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
    /* Themed Workflow-Based Navbar */
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
        width: 52px;
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

    /* Section 1: Capture Tools */
    .lynx-navbar-section-capture {
        padding: 16px 0 12px 0;
        display: flex;
        flex-direction: column;
        gap: 6px;
        align-items: center;
        border-bottom: 1px solid ${
            isDarkBackground ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"
        };
        position: relative;
    }

    /* Section 2: Focus Tools */
    .lynx-navbar-section-focus {
        padding: 12px 0;
        display: flex;
        flex-direction: column;
        gap: 6px;
        align-items: center;
        border-bottom: 1px solid ${
            isDarkBackground ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"
        };
        position: relative;
    }

    /* Section 3: Analyze Tools */
    .lynx-navbar-section-analyze {
        padding: 12px 0;
        display: flex;
        flex-direction: column;
        gap: 6px;
        align-items: center;
        border-bottom: 1px solid ${
            isDarkBackground ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"
        };
        position: relative;
    }

    /* Section 4: Manage Tools */
    .lynx-navbar-section-manage {
        padding: 12px 0;
        display: flex;
        flex-direction: column;
        gap: 6px;
        align-items: center;
        border-bottom: 1px solid ${
            isDarkBackground ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"
        };
        position: relative;
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

    /* Capture section icons (primary hierarchy) */
    .lynx-navbar-section-capture .lynx-nav-item {
        width: 36px;
        height: 36px;
    }

    .lynx-navbar-section-capture .lynx-nav-item svg {
        min-width: 20px;
        min-height: 20px;
    }

    /* Focus section icons (high priority) */
    .lynx-navbar-section-focus .lynx-nav-item {
        width: 34px;
        height: 34px;
    }

    .lynx-navbar-section-focus .lynx-nav-item svg {
        min-width: 18px;
        min-height: 18px;
    }

    /* Analyze section icons (medium priority) */
    .lynx-navbar-section-analyze .lynx-nav-item svg {
        min-width: 17px;
        min-height: 17px;
    }

    /* Manage section icons (secondary) */
    .lynx-navbar-section-manage .lynx-nav-item svg {
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

    /* Footer with theme selector and user avatar */
    .lynx-navbar-footer {
        padding: 12px 0 16px 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 8px;
        border-top: 1px solid ${
            isDarkBackground ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"
        };
        margin-top: auto;
    }

    .lynx-theme-selector {
        position: relative;
    }

    .lynx-theme-button {
        width: 28px;
        height: 28px;
        border-radius: 6px;
        background: ${
            isDarkBackground
                ? "rgba(255, 255, 255, 0.1)"
                : "rgba(0, 0, 0, 0.1)"
        };
        display: flex;
        align-items: center;
        justify-content: center;
        color: ${
            isDarkBackground ? "rgba(255, 255, 255, 0.8)" : "rgba(0, 0, 0, 0.8)"
        };
        cursor: pointer;
        transition: all 0.2s ease;
        border: none;
    }

    .lynx-theme-button:hover {
        transform: scale(1.05);
        background: ${
            isDarkBackground
                ? "rgba(255, 255, 255, 0.15)"
                : "rgba(0, 0, 0, 0.15)"
        };
        color: ${isDarkBackground ? "#ffffff" : "#000000"};
    }

    .lynx-theme-dropdown {
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        background: ${
            isDarkBackground
                ? "rgba(20, 20, 20, 0.95)"
                : "rgba(250, 250, 250, 0.95)"
        };
        backdrop-filter: blur(20px);
        border: 1px solid ${
            isDarkBackground
                ? "rgba(255, 255, 255, 0.1)"
                : "rgba(0, 0, 0, 0.1)"
        };
        border-radius: 8px;
        padding: 8px;
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 120px;
        margin-bottom: 8px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        z-index: 1000;
    }

    .lynx-theme-option {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 12px;
        color: ${
            isDarkBackground ? "rgba(255, 255, 255, 0.8)" : "rgba(0, 0, 0, 0.8)"
        };
    }

    .lynx-theme-option:hover {
        background: ${
            isDarkBackground
                ? "rgba(255, 255, 255, 0.1)"
                : "rgba(0, 0, 0, 0.1)"
        };
        color: ${isDarkBackground ? "#ffffff" : "#000000"};
    }

    .lynx-theme-option.active {
        background: ${
            isDarkBackground
                ? "rgba(255, 255, 255, 0.15)"
                : "rgba(0, 0, 0, 0.15)"
        };
        color: ${isDarkBackground ? "#ffffff" : "#000000"};
    }

    .lynx-theme-preview {
        width: 12px;
        height: 12px;
        border-radius: 3px;
        border: 1px solid ${
            isDarkBackground
                ? "rgba(255, 255, 255, 0.2)"
                : "rgba(0, 0, 0, 0.2)"
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

    /* Section labels (subtle visual cues for workflow organization) */
    .lynx-navbar-section-capture::before {
        content: '';
        position: absolute;
        left: 2px;
        top: 8px;
        width: 48px;
        height: 2px;
        background: linear-gradient(90deg, transparent, #3b82f6, transparent);
        opacity: 0.4;
    }

    .lynx-navbar-section-focus::before {
        content: '';
        position: absolute;
        left: 2px;
        top: 0;
        width: 48px;
        height: 1px;
        background: linear-gradient(90deg, transparent, #059669, transparent);
        opacity: 0.4;
    }

    .lynx-navbar-section-analyze::before {
        content: '';
        position: absolute;
        left: 2px;
        top: 0;
        width: 48px;
        height: 1px;
        background: linear-gradient(90deg, transparent, #8b5cf6, transparent);
        opacity: 0.4;
    }

    .lynx-navbar-section-manage::before {
        content: '';
        position: absolute;
        left: 2px;
        top: 0;
        width: 48px;
        height: 1px;
        background: linear-gradient(90deg, transparent, #f59e0b, transparent);
        opacity: 0.4;
    }

    @media (max-width: 768px) {
        .lynx-navbar-container {
            width: 48px;
        }
        
        .lynx-navbar-section-capture .lynx-nav-item {
            width: 32px;
            height: 32px;
        }
        
        .lynx-navbar-section-capture .lynx-nav-item svg {
            min-width: 18px;
            min-height: 18px;
        }

        .lynx-navbar-section-focus .lynx-nav-item {
            width: 30px;
            height: 30px;
        }

        .lynx-navbar-section-focus .lynx-nav-item svg {
            min-width: 16px;
            min-height: 16px;
        }

        .lynx-navbar-section-analyze .lynx-nav-item svg {
            min-width: 15px;
            min-height: 15px;
        }

        .lynx-navbar-section-manage .lynx-nav-item svg {
            min-width: 14px;
            min-height: 14px;
        }
        
        .lynx-user-avatar {
            width: 24px;
            height: 24px;
            font-size: 10px;
        }

        .lynx-theme-button {
            width: 24px;
            height: 24px;
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
