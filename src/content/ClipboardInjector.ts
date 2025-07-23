import React from "react";
import ReactDOM from "react-dom/client";
import ClipboardModal from "../components/ClipboardModal";

interface ClipboardItem {
    id: string;
    text: string;
    timestamp: number;
    source: string;
}

class ClipboardInjector {
    private container: HTMLDivElement | null = null;
    private root: ReactDOM.Root | null = null;
    private isInjected = false;
    private clipboardItems: ClipboardItem[] = [];

    // Shift detection
    private shiftPressed = false;
    private shiftCount = 0;
    private shiftTimeout: NodeJS.Timeout | null = null;

    // Continuous text building
    private continuousText: string = "";
    private lastCopyTime: number = 0;
    private CONTINUOUS_THRESHOLD = 2000; // 2 seconds to consider as continuous

    constructor() {
        this.initializeShiftDetection();
        this.loadClipboardItems();

        // Auto-initialize the clipboard immediately
        this.injectClipboard();

        // Listen for clipboard requests from the navbar
        chrome.runtime.onMessage.addListener(
            (message, sender, sendResponse) => {
                if (message.type === "SHOW_CLIPBOARD_MANAGER") {
                    this.showClipboard();
                    sendResponse({ success: true });
                }
            },
        );
    }

    private async loadClipboardItems() {
        try {
            const result = await chrome.storage.local.get([
                "globalClipboardItems",
            ]);
            this.clipboardItems = result.globalClipboardItems || [];
        } catch (error) {
            console.error("Failed to load clipboard items:", error);
        }
    }

    public showClipboard() {
        // Always ensure injected first
        if (!this.isInjected) {
            this.injectClipboard();
        }
        this.updateClipboardVisibility(true);
    }

    public hideClipboard() {
        this.updateClipboardVisibility(false);
    }

    private injectClipboard() {
        if (this.isInjected) {
            console.log("⚠️ Clipboard modal already injected, skipping");
            return;
        }

        console.log("📋 Starting clipboard modal injection...");

        try {
            // Create container with pointer-events: none by default
            this.container = document.createElement("div");
            this.container.id = "lyncx-clipboard-root";
            this.container.style.cssText = `
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                bottom: 0 !important;
                z-index: 9999999 !important;
                pointer-events: none !important;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif !important;
            `;

            // Create shadow DOM for style isolation
            const shadowRoot = this.container.attachShadow({ mode: "open" });

            // Create React root container
            const reactContainer = document.createElement("div");
            reactContainer.style.pointerEvents = "none";
            shadowRoot.appendChild(reactContainer);

            // Append to body
            document.body.appendChild(this.container);

            // Create React root and render
            this.root = ReactDOM.createRoot(reactContainer);
            this.renderClipboard(false);

            this.isInjected = true;
            console.log("✅ Clipboard modal injected successfully");
        } catch (error) {
            console.error("❌ Failed to inject clipboard modal:", error);
        }
    }

    private updateClipboardVisibility(isVisible: boolean) {
        if (this.root) {
            this.renderClipboard(isVisible);

            // Update pointer events based on visibility - only the modal should capture clicks
            if (this.container) {
                this.container.style.pointerEvents = "none"; // Container never captures
                const shadowRoot = this.container.shadowRoot;
                if (shadowRoot) {
                    const reactContainer =
                        shadowRoot.firstElementChild as HTMLElement;
                    if (reactContainer) {
                        reactContainer.style.pointerEvents = "none"; // React container never captures
                    }
                }
            }
        }
    }

    private renderClipboard(isVisible: boolean) {
        if (this.root) {
            this.root.render(
                React.createElement(ClipboardModal, {
                    isVisible,
                    items: this.clipboardItems,
                    onClose: () => this.hideClipboard(),
                    onDeleteItem: (id: string) => this.deleteItem(id),
                    onClearAll: () => this.clearAll(),
                    onRefresh: () => this.loadClipboardItems(),
                }),
            );
        }
    }

    private async deleteItem(id: string) {
        try {
            const updatedItems = this.clipboardItems.filter(
                (item) => item.id !== id,
            );
            this.clipboardItems = updatedItems;
            await chrome.storage.local.set({
                globalClipboardItems: updatedItems,
            });
            this.updateClipboardVisibility(true);
        } catch (error) {
            console.error("Failed to delete clipboard item:", error);
        }
    }

    private async clearAll() {
        try {
            this.clipboardItems = [];
            this.continuousText = ""; // Also clear continuous text
            await chrome.storage.local.set({ globalClipboardItems: [] });
            this.showNotification("Clipboard cleared");
            this.updateClipboardVisibility(true);
        } catch (error) {
            console.error("Failed to clear clipboard:", error);
        }
    }

    // Enhanced Shift+Shift detection
    private initializeShiftDetection() {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Shift" && !this.shiftPressed) {
                this.shiftPressed = true;
                this.shiftCount++;

                if (this.shiftTimeout) {
                    clearTimeout(this.shiftTimeout);
                }

                this.shiftTimeout = setTimeout(() => {
                    this.shiftCount = 0;
                }, 400); // Reduced timeout for better responsiveness

                if (this.shiftCount === 2) {
                    this.handleDoubleShift();
                    this.shiftCount = 0;
                }
            }
        };

        const handleKeyUp = (event: KeyboardEvent) => {
            if (event.key === "Shift") {
                this.shiftPressed = false;
            }
        };

        document.addEventListener("keydown", handleKeyDown, true);
        document.addEventListener("keyup", handleKeyUp, true);
    }

    private async handleDoubleShift() {
        const activeElement = document.activeElement;

        if (this.isInputElement(activeElement)) {
            await this.pasteToInput(activeElement);
        } else {
            await this.copySelection();
        }
    }

    private isInputElement(
        element: Element | null,
    ): element is HTMLInputElement | HTMLTextAreaElement {
        if (!element) return false;
        return (
            element.tagName === "INPUT" ||
            element.tagName === "TEXTAREA" ||
            element.getAttribute("contenteditable") === "true"
        );
    }

    private async copySelection() {
        const selection = window.getSelection();
        const selectedText = selection?.toString().trim();

        if (selectedText && selectedText.length > 0) {
            const now = Date.now();
            const isContinuous =
                now - this.lastCopyTime < this.CONTINUOUS_THRESHOLD;

            if (isContinuous && this.continuousText) {
                // Add to continuous text with a space
                this.continuousText += " " + selectedText;
                this.showNotification(
                    `Building text... (${this.continuousText.length} chars)`,
                );
            } else {
                // Start new continuous text or replace it
                this.continuousText = selectedText;
                this.showNotification(
                    `Text copied: "${selectedText.slice(0, 30)}${
                        selectedText.length > 30 ? "..." : ""
                    }"`,
                );
            }

            this.lastCopyTime = now;

            // Save to clipboard items (always save the current continuous text)
            await this.addToClipboard(this.continuousText);
        }
    }

    private async pasteToInput(
        element: HTMLInputElement | HTMLTextAreaElement,
    ) {
        // Paste ALL clipboard items, not just the latest one
        let textToPaste = "";

        if (this.clipboardItems.length > 0) {
            // Combine all clipboard items with double line breaks
            textToPaste = this.clipboardItems
                .map((item) => item.text)
                .join("\n\n");
        }

        if (!textToPaste) return;

        if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
            const currentValue = element.value;
            const cursorPos = element.selectionStart || 0;

            const newValue =
                currentValue.slice(0, cursorPos) +
                textToPaste +
                currentValue.slice(cursorPos);
            element.value = newValue;

            const newCursorPos = cursorPos + textToPaste.length;
            element.setSelectionRange(newCursorPos, newCursorPos);

            element.dispatchEvent(new Event("input", { bubbles: true }));
        } else if (element.getAttribute("contenteditable") === "true") {
            document.execCommand("insertText", false, textToPaste);
        }

        const itemCount = this.clipboardItems.length;
        this.showNotification(
            `Pasted ${itemCount} clip${itemCount === 1 ? "" : "s"} (${
                textToPaste.length
            } chars)`,
        );

        // Don't clear continuous text after pasting - keep building
    }

    private async addToClipboard(text: string) {
        // Always update the first item with the continuous text
        const newItem: ClipboardItem = {
            id: Date.now().toString(),
            text: text,
            timestamp: Date.now(),
            source: window.location.hostname.replace(/^www\./, ""),
        };

        // Replace the first item if it's from the same session, otherwise add new
        const isFromSameSession =
            this.clipboardItems.length > 0 &&
            Date.now() - this.clipboardItems[0].timestamp <
                this.CONTINUOUS_THRESHOLD;

        if (isFromSameSession) {
            // Update the existing item
            this.clipboardItems[0] = newItem;
        } else {
            // Add as new item
            this.clipboardItems = [newItem, ...this.clipboardItems].slice(
                0,
                50,
            );
        }

        try {
            await chrome.storage.local.set({
                globalClipboardItems: this.clipboardItems,
            });
        } catch (error) {
            console.error("Failed to save clipboard items:", error);
        }
    }

    private showNotification(message: string) {
        const existing = document.getElementById("clipboard-notification");
        if (existing) existing.remove();

        const notification = document.createElement("div");
        notification.id = "clipboard-notification";
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(120, 53, 15, 0.95);
            color: white;
            padding: 8px 12px;
            border-radius: 6px;
            z-index: 10000010;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            font-size: 12px;
            font-weight: 500;
            max-width: 280px;
            word-wrap: break-word;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            animation: slideInRight 0.2s ease-out;
            pointer-events: none;
        `;

        // Add animation styles
        const style = document.createElement("style");
        style.id = "clipboard-notification-styles";
        if (!document.getElementById("clipboard-notification-styles")) {
            style.textContent = `
                @keyframes slideInRight {
                    from {
                        opacity: 0;
                        transform: translateX(100%);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                @keyframes slideOutRight {
                    from {
                        opacity: 1;
                        transform: translateX(0);
                    }
                    to {
                        opacity: 0;
                        transform: translateX(100%);
                    }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = "slideOutRight 0.2s ease-out";
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 200);
            }
        }, 2000);
    }

    public destroy() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        if (this.shiftTimeout) {
            clearTimeout(this.shiftTimeout);
        }
        this.container = null;
        this.root = null;
        this.isInjected = false;
        this.continuousText = "";
    }
}

// Auto-execute clipboard injector when this file is imported
const clipboardInjector = new ClipboardInjector();
console.log("✅ Clipboard injector auto-initialized and ready for Shift+Shift");

// Export for external access
export { clipboardInjector };

// Listen for cleanup messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "CLEANUP_CLIPBOARD") {
        clipboardInjector.destroy();
        sendResponse({ success: true });
    }
});

export default ClipboardInjector;
