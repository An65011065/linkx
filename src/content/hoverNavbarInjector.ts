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
            console.error("❌ Stack trace:", error.stack);
            console.error("❌ Document ready state:", document.readyState);
            console.error("❌ Document body:", document.body);
        }
    }

    private getStyles(): string {
        return `
            /* Glassy Hover Navbar Styles */
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
                width: 70px;
                height: 100vh;
                background: rgba(255, 255, 255, 0.08);
                backdrop-filter: blur(20px) saturate(180%);
                -webkit-backdrop-filter: blur(20px) saturate(180%);
                border: 1px solid rgba(255, 255, 255, 0.125);
                border-left: none;
                box-shadow: 
                    0 0 40px rgba(0, 0, 0, 0.1),
                    inset 0 1px 0 rgba(255, 255, 255, 0.1),
                    inset 0 -1px 0 rgba(255, 255, 255, 0.05);
                transform: translateX(-100%);
                transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
                pointer-events: auto;
                display: flex;
                flex-direction: column;
                overflow: hidden;
                border-radius: 0 24px 24px 0;
            }

            .lynx-navbar-container.visible {
                transform: translateX(0);
                width: 70px;
            }

            .lynx-navbar-container:hover {
                width: 70px;
                background: rgba(255, 255, 255, 0.12);
                box-shadow: 
                    0 0 60px rgba(0, 0, 0, 0.15),
                    inset 0 1px 0 rgba(255, 255, 255, 0.15),
                    inset 0 -1px 0 rgba(255, 255, 255, 0.08);
            }

            .lynx-navbar-items {
                flex: 1;
                padding: 20px 0;
                display: flex;
                flex-direction: column;
                gap: 12px;
                align-items: center;
                justify-content: center;
            }

            .lynx-nav-item {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 48px;
                height: 48px;
                border-radius: 16px;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
                color: rgba(255, 255, 255, 0.8);
                position: relative;
                overflow: hidden;
                background: rgba(255, 255, 255, 0.08);
                border: 1px solid rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
            }

            .lynx-nav-item:hover {
                background: rgba(255, 255, 255, 0.15);
                color: #ffffff;
                transform: translateY(-2px) scale(1.05);
                box-shadow: 
                    0 8px 25px rgba(0, 0, 0, 0.2),
                    inset 0 1px 0 rgba(255, 255, 255, 0.2);
                border-color: rgba(255, 255, 255, 0.2);
            }

            .lynx-nav-item.active {
                background: var(--item-color, #3b82f6);
                color: #ffffff;
                transform: scale(1.1);
                box-shadow: 
                    0 10px 30px rgba(0, 0, 0, 0.25),
                    inset 0 1px 0 rgba(255, 255, 255, 0.3),
                    0 0 0 2px rgba(255, 255, 255, 0.1);
                border-color: rgba(255, 255, 255, 0.3);
            }

            .lynx-nav-item.active::before {
                content: '';
                position: absolute;
                left: -1px;
                top: 50%;
                width: 3px;
                height: 20px;
                background: #ffffff;
                border-radius: 0 2px 2px 0;
                transform: translateY(-50%);
                box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
            }

            .lynx-nav-item svg {
                min-width: 22px;
                min-height: 22px;
                transition: transform 0.3s ease;
                filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
            }

            .lynx-nav-item:hover svg {
                transform: scale(1.1);
                filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15));
            }

            .lynx-navbar-footer {
                padding: 20px 0;
                display: flex;
                align-items: center;
                justify-content: center;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
            }

            .lynx-user-avatar {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: linear-gradient(145deg, #3b82f6, #1d4ed8);
                display: flex;
                align-items: center;
                justify-content: center;
                color: #ffffff;
                font-size: 16px;
                font-weight: 600;
                text-transform: uppercase;
                border: 2px solid rgba(255, 255, 255, 0.2);
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
                box-shadow: 
                    0 4px 15px rgba(0, 0, 0, 0.2),
                    inset 0 1px 0 rgba(255, 255, 255, 0.2);
                transition: all 0.3s ease;
                cursor: pointer;
            }

            .lynx-user-avatar:hover {
                transform: scale(1.1);
                box-shadow: 
                    0 6px 20px rgba(0, 0, 0, 0.25),
                    inset 0 1px 0 rgba(255, 255, 255, 0.3);
            }

            .lynx-hover-navbar::before {
                content: '';
                position: absolute;
                top: 50%;
                left: 2px;
                width: 3px;
                height: 60px;
                background: linear-gradient(to bottom, transparent, rgba(59, 130, 246, 0.8), transparent);
                border-radius: 2px;
                transform: translateY(-50%);
                opacity: 0;
                transition: opacity 0.4s ease;
                box-shadow: 0 0 20px rgba(59, 130, 246, 0.4);
            }

            .lynx-hover-navbar:hover::before {
                opacity: 1;
            }

            @media (max-width: 768px) {
                .lynx-navbar-container {
                    width: 65px;
                    border-radius: 0 20px 20px 0;
                }
                
                .lynx-navbar-container.visible {
                    width: 65px;
                }
                
                .lynx-nav-item {
                    width: 44px;
                    height: 44px;
                    border-radius: 14px;
                }
                
                .lynx-nav-item svg {
                    min-width: 20px;
                    min-height: 20px;
                }
                
                .lynx-user-avatar {
                    width: 36px;
                    height: 36px;
                    font-size: 14px;
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
