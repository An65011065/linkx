// NotepadInjector.ts - handles injecting the notepad modal into any page
import React from "react";
import ReactDOM from "react-dom/client";
import NotepadModal from "../components/NotepadModal";

class NotepadInjector {
    private container: HTMLDivElement | null = null;
    private root: ReactDOM.Root | null = null;
    private isInjected = false;
    private currentDomain = "";

    constructor() {
        // Listen for notepad requests from the navbar
        chrome.runtime.onMessage.addListener(
            (message, sender, sendResponse) => {
                if (message.type === "SHOW_NOTEPAD") {
                    this.showNotepad(message.domain);
                    sendResponse({ success: true });
                }
            },
        );
    }

    public showNotepad(domain?: string) {
        this.currentDomain =
            domain || window.location.hostname.replace(/^www\./, "");

        if (!this.isInjected) {
            this.injectNotepad();
        }
        this.updateNotepadVisibility(true);
    }

    public hideNotepad() {
        this.updateNotepadVisibility(false);
    }

    private injectNotepad() {
        if (this.isInjected) {
            console.log("⚠️ Notepad modal already injected, skipping");
            return;
        }

        console.log("📝 Starting notepad modal injection...");

        try {
            // Create container
            this.container = document.createElement("div");
            this.container.id = "lyncx-notepad-root";
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

            // Create React root container
            const reactContainer = document.createElement("div");
            reactContainer.style.pointerEvents = "auto";
            shadowRoot.appendChild(reactContainer);

            // Append to body
            document.body.appendChild(this.container);

            // Create React root and render
            this.root = ReactDOM.createRoot(reactContainer);
            this.renderNotepad(false);

            this.isInjected = true;
            console.log("✅ Notepad modal injected successfully");
        } catch (error) {
            console.error("❌ Failed to inject notepad modal:", error);
        }
    }

    private updateNotepadVisibility(isVisible: boolean) {
        if (this.root) {
            this.renderNotepad(isVisible);
        }
    }

    private renderNotepad(isVisible: boolean) {
        if (this.root) {
            this.root.render(
                React.createElement(NotepadModal, {
                    isVisible,
                    domain: this.currentDomain,
                    onClose: () => this.hideNotepad(),
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

// Initialize the notepad injector
const notepadInjector = new NotepadInjector();

// Listen for cleanup messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "CLEANUP_NOTEPAD") {
        notepadInjector.destroy();
        sendResponse({ success: true });
    }
});

export default NotepadInjector;
