// FlowModalInjector.ts
import React from "react";
import ReactDOM from "react-dom/client";
import FlowModal from "../components/FlowModal";

class FlowModalInjector {
    private container: HTMLDivElement | null = null;
    private root: ReactDOM.Root | null = null;
    private isInjected = false;
    private isVisible = false;

    constructor() {
        this.init();
    }

    private init() {
        console.log("🔄 FlowModalInjector: Initializing...");

        // Wait for DOM to be ready
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", () =>
                this.setupInjector(),
            );
        } else {
            this.setupInjector();
        }

        // Listen for messages to show/hide the modal
        chrome.runtime.onMessage.addListener(
            (message, _sender, sendResponse) => {
                if (message.type === "SHOW_FLOW_MODAL") {
                    this.showModal();
                    sendResponse({ success: true });
                } else if (message.type === "HIDE_FLOW_MODAL") {
                    this.hideModal();
                    sendResponse({ success: true });
                }
            },
        );
    }

    private setupInjector() {
        if (this.isInjected) {
            console.log("⚠️ FlowModalInjector: Already injected, skipping");
            return;
        }

        try {
            // Create container
            this.container = document.createElement("div");
            this.container.id = "lyncx-flow-modal-root";
            this.container.style.cssText = `
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                width: 100% !important;
                height: 100% !important;
                z-index: 10000000 !important;
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
            reactContainer.style.cssText = `
                width: 100%;
                height: 100%;
                pointer-events: auto;
            `;
            shadowRoot.appendChild(reactContainer);

            // Append to body
            document.body.appendChild(this.container);

            // Create React root and render
            this.root = ReactDOM.createRoot(reactContainer);
            this.renderModal();

            this.isInjected = true;
            console.log("✅ FlowModalInjector: Successfully injected");
        } catch (error) {
            console.error("❌ FlowModalInjector: Failed to inject:", error);
        }
    }

    private renderModal() {
        if (!this.root) return;

        this.root.render(
            React.createElement(FlowModal, {
                isVisible: this.isVisible,
                onClose: () => this.hideModal(),
            }),
        );
    }

    private showModal() {
        console.log("📱 FlowModalInjector: Showing modal");
        this.isVisible = true;

        if (this.container) {
            this.container.style.pointerEvents = "auto";
        }

        this.renderModal();
    }

    private hideModal() {
        console.log("📱 FlowModalInjector: Hiding modal");
        this.isVisible = false;

        if (this.container) {
            this.container.style.pointerEvents = "none";
        }

        this.renderModal();
    }

    private getStyles(): string {
        return `
            /* Reset and base styles */
            * {
                box-sizing: border-box;
            }

            /* FlowModal styles are already included in the component */
            .flow-modal {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
            }

            /* Ensure proper font rendering */
            .flow-modal,
            .flow-modal * {
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
            }

            /* Ensure inputs and buttons have proper styling */
            .flow-modal input,
            .flow-modal textarea,
            .flow-modal button,
            .flow-modal select {
                font-family: inherit;
                font-size: inherit;
            }

            /* Ensure proper z-index stacking */
            .flow-modal {
                z-index: 10000000;
            }

            /* Prevent text selection on buttons */
            .flow-modal button {
                -webkit-user-select: none;
                -moz-user-select: none;
                -ms-user-select: none;
                user-select: none;
            }

            /* Ensure proper focus states */
            .flow-modal button:focus,
            .flow-modal input:focus,
            .flow-modal textarea:focus,
            .flow-modal select:focus {
                outline: none;
            }

            /* Ensure proper cursor states */
            .flow-modal button:not(:disabled) {
                cursor: pointer;
            }

            .flow-modal button:disabled {
                cursor: not-allowed;
            }

            /* Ensure proper text wrapping */
            .flow-modal {
                word-wrap: break-word;
                overflow-wrap: break-word;
            }

            /* Ensure animations work properly */
            @keyframes flowFadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            @keyframes flowSlideUp {
                from {
                    opacity: 0;
                    transform: translateY(20px) scale(0.95);
                }
                to {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }

            @keyframes flowSpin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }

            /* Scrollbar styling for the modal */
            .flow-tasks::-webkit-scrollbar {
                width: 4px;
            }

            .flow-tasks::-webkit-scrollbar-track {
                background: rgba(59, 130, 246, 0.1);
                border-radius: 2px;
            }

            .flow-tasks::-webkit-scrollbar-thumb {
                background: rgba(59, 130, 246, 0.3);
                border-radius: 2px;
            }

            .flow-tasks::-webkit-scrollbar-thumb:hover {
                background: rgba(59, 130, 246, 0.5);
            }

            /* Ensure modal is fully responsive */
            @media (max-width: 768px) {
                .flow-modal-content {
                    width: 95vw;
                    max-width: 420px;
                    margin: 0 auto;
                }

                .flow-header {
                    padding: 16px 20px;
                }

                .flow-main {
                    padding: 0;
                }

                .flow-date-nav,
                .flow-controls,
                .flow-tasks {
                    padding-left: 20px;
                    padding-right: 20px;
                }

                .flow-welcome {
                    padding: 32px 20px;
                }

                .flow-controls {
                    flex-direction: column;
                    gap: 12px;
                    align-items: stretch;
                }

                .flow-filters {
                    justify-content: center;
                }

                .flow-task-meta {
                    flex-direction: column;
                    gap: 8px;
                }

                .flow-task-actions {
                    flex-direction: column;
                    gap: 8px;
                }

                .flow-task-item {
                    padding: 10px;
                }

                .flow-add-task-form {
                    padding: 12px;
                }
            }

            /* Ensure proper contrast for accessibility */
            @media (prefers-contrast: high) {
                .flow-modal-content {
                    border: 2px solid rgba(59, 130, 246, 0.6);
                }

                .flow-task-item {
                    border: 1px solid rgba(59, 130, 246, 0.3);
                }

                .flow-task-checkbox,
                .flow-nav-btn,
                .flow-add-task-btn {
                    border: 1px solid rgba(59, 130, 246, 0.4);
                }
            }

            /* Ensure proper motion for users who prefer reduced motion */
            @media (prefers-reduced-motion: reduce) {
                .flow-modal,
                .flow-modal-content,
                .flow-task-item,
                .flow-nav-btn,
                .flow-add-task-btn,
                .flow-task-checkbox,
                .flow-close-btn,
                .flow-google-signin-btn,
                .flow-continue-btn,
                .flow-task-save-btn,
                .flow-task-cancel-btn,
                .flow-task-edit-btn,
                .flow-task-delete-btn,
                .flow-sign-out-btn,
                .flow-filter-btn {
                    animation: none !important;
                    transition: none !important;
                }
            }

            /* Dark mode support */
            @media (prefers-color-scheme: dark) {
                .flow-modal-content {
                    background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%);
                    border: 1px solid rgba(59, 130, 246, 0.3);
                }

                .flow-header {
                    background: rgba(15, 23, 42, 0.3);
                    border-bottom: 1px solid rgba(59, 130, 246, 0.2);
                }

                .flow-title {
                    color: rgba(241, 245, 249, 0.9);
                }

                .flow-date-nav {
                    background: rgba(15, 23, 42, 0.2);
                    border-bottom: 1px solid rgba(59, 130, 246, 0.2);
                }

                .flow-date-text {
                    color: rgba(241, 245, 249, 0.9);
                }

                .flow-section-title {
                    color: rgba(241, 245, 249, 0.9);
                }

                .flow-welcome-title {
                    color: rgba(241, 245, 249, 0.9);
                }

                .flow-task-item {
                    background: rgba(15, 23, 42, 0.5);
                    border: 1px solid rgba(59, 130, 246, 0.2);
                }

                .flow-task-item:hover {
                    background: rgba(15, 23, 42, 0.7);
                }

                .flow-task-title {
                    color: rgba(241, 245, 249, 0.9);
                }

                .flow-task-input,
                .flow-task-textarea {
                    background: rgba(15, 23, 42, 0.8);
                    border: 1px solid rgba(59, 130, 246, 0.3);
                    color: rgba(241, 245, 249, 0.9);
                }

                .flow-task-input:focus,
                .flow-task-textarea:focus {
                    background: rgba(15, 23, 42, 0.9);
                    border-color: rgba(59, 130, 246, 0.5);
                }

                .flow-task-input::placeholder,
                .flow-task-textarea::placeholder {
                    color: rgba(148, 163, 184, 0.6);
                }

                .flow-search {
                    background: rgba(15, 23, 42, 0.5);
                    border: 1px solid rgba(59, 130, 246, 0.3);
                }

                .flow-search:focus-within {
                    background: rgba(15, 23, 42, 0.7);
                }

                .flow-search input {
                    color: rgba(241, 245, 249, 0.9);
                }

                .flow-search input::placeholder {
                    color: rgba(148, 163, 184, 0.6);
                }

                .flow-add-task-form {
                    background: rgba(15, 23, 42, 0.6);
                    border: 1px solid rgba(59, 130, 246, 0.3);
                }

                .flow-task-select {
                    background: rgba(15, 23, 42, 0.8);
                    border: 1px solid rgba(59, 130, 246, 0.3);
                    color: rgba(241, 245, 249, 0.9);
                }

                .flow-event {
                    background: rgba(34, 197, 94, 0.2);
                    border-left: 3px solid rgba(34, 197, 94, 0.8);
                }

                .flow-controls {
                    border-bottom: 1px solid rgba(59, 130, 246, 0.2);
                }

                .flow-calendar-events {
                    border-bottom: 1px solid rgba(59, 130, 246, 0.2);
                }

                .flow-empty-state {
                    color: rgba(148, 163, 184, 0.6);
                }
            }

            /* High contrast mode adjustments */
            @media (prefers-contrast: high) {
                .flow-modal-content {
                    border: 2px solid rgba(59, 130, 246, 0.8);
                    background: linear-gradient(135deg, rgba(240, 249, 255, 0.98) 0%, rgba(224, 242, 254, 0.98) 100%);
                }

                .flow-task-item {
                    border: 1px solid rgba(59, 130, 246, 0.5);
                    background: rgba(255, 255, 255, 0.8);
                }

                .flow-task-checkbox,
                .flow-nav-btn,
                .flow-add-task-btn,
                .flow-close-btn {
                    border: 1px solid rgba(59, 130, 246, 0.6);
                }

                .flow-google-signin-btn,
                .flow-task-save-btn {
                    border: 1px solid rgba(37, 99, 235, 0.8);
                }

                .flow-task-title {
                    color: rgba(15, 23, 42, 0.95);
                    font-weight: 700;
                }

                .flow-section-title {
                    color: rgba(15, 23, 42, 0.95);
                    font-weight: 700;
                }
            }

            /* Print styles */
            @media print {
                .flow-modal {
                    display: none !important;
                }
            }

            /* Ensure proper touch targets for mobile */
            @media (pointer: coarse) {
                .flow-nav-btn,
                .flow-add-task-btn,
                .flow-close-btn,
                .flow-task-checkbox,
                .flow-task-edit-btn,
                .flow-task-delete-btn,
                .flow-sign-out-btn {
                    min-width: 44px;
                    min-height: 44px;
                }

                .flow-filter-btn {
                    min-height: 44px;
                    padding: 12px 16px;
                }

                .flow-google-signin-btn,
                .flow-continue-btn,
                .flow-task-save-btn,
                .flow-task-cancel-btn {
                    min-height: 48px;
                }

                .flow-task-input,
                .flow-task-textarea {
                    min-height: 48px;
                    padding: 14px 16px;
                    font-size: 16px; /* Prevents zoom on iOS */
                }

                .flow-search input {
                    min-height: 44px;
                    font-size: 16px; /* Prevents zoom on iOS */
                }
            }

            /* Ensure proper text scaling */
            @media (prefers-reduced-motion: no-preference) {
                .flow-modal {
                    will-change: transform, opacity;
                }
                
                .flow-task-item {
                    will-change: transform, background-color;
                }
            }

            /* RTL support */
            [dir="rtl"] .flow-modal {
                direction: rtl;
            }

            [dir="rtl"] .flow-header {
                flex-direction: row-reverse;
            }

            [dir="rtl"] .flow-task-item {
                flex-direction: row-reverse;
            }

            [dir="rtl"] .flow-task-actions {
                flex-direction: row-reverse;
            }

            [dir="rtl"] .flow-date-nav {
                flex-direction: row-reverse;
            }

            [dir="rtl"] .flow-controls {
                flex-direction: row-reverse;
            }

            [dir="rtl"] .flow-task-meta {
                flex-direction: row-reverse;
            }

            [dir="rtl"] .flow-auth-options {
                align-items: flex-end;
            }

            /* Ensure proper isolation from page styles */
            .flow-modal {
                all: initial;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 10000000;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            /* Ensure modal content is properly contained */
            .flow-modal-content {
                contain: layout style paint;
                isolation: isolate;
            }

            /* Ensure smooth scrolling */
            .flow-tasks {
                scroll-behavior: smooth;
            }

            /* Ensure proper focus management */
            .flow-modal:focus-within {
                outline: none;
            }

            /* Ensure proper layer stacking */
            .flow-modal {
                z-index: 10000000;
                position: fixed;
                isolation: isolate;
            }
        `;
    }

    public destroy() {
        console.log("🔄 FlowModalInjector: Destroying...");

        if (this.root) {
            this.root.unmount();
            this.root = null;
        }

        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }

        this.container = null;
        this.isInjected = false;
        this.isVisible = false;

        console.log("✅ FlowModalInjector: Destroyed");
    }

    // Public methods for external control
    public show() {
        this.showModal();
    }

    public hide() {
        this.hideModal();
    }

    public isModalVisible(): boolean {
        return this.isVisible;
    }

    public toggle() {
        if (this.isVisible) {
            this.hideModal();
        } else {
            this.showModal();
        }
    }
}

// Initialize the injector
const flowModalInjector = new FlowModalInjector();

// Listen for cleanup messages
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === "CLEANUP_FLOW_MODAL") {
        flowModalInjector.destroy();
        sendResponse({ success: true });
    }
});

// Export for potential external usage
export default flowModalInjector;
