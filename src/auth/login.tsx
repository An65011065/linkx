// src/auth/login.tsx
import React from "react";
import { createRoot } from "react-dom/client";
import LoginPage from "./LoginPage";

// Simple auth handler for the login page
class LoginPageAuthHandler {
    async handleGoogleLogin(): Promise<void> {
        console.log("🔑 Starting Google authentication...");

        try {
            // Send message to background script to handle authentication
            const response = await chrome.runtime.sendMessage({
                type: "AUTH_LOGIN",
            });

            if (response?.success && response?.user) {
                console.log(
                    "✅ Authentication successful:",
                    response.user.email,
                );

                // Redirect directly to landing page
                window.location.href = chrome.runtime.getURL(
                    "src/landing/landing.html",
                );
            } else {
                throw new Error(response?.error || "Authentication failed");
            }
        } catch (error) {
            console.error("❌ Authentication failed:", error);

            // Show error message to user
            this.showErrorMessage(
                error instanceof Error
                    ? error.message
                    : "Authentication failed",
            );

            throw error;
        }
    }

    private showSuccessMessage(): void {
        // Replace the page content with success message
        const root = document.getElementById("root");
        if (root) {
            root.innerHTML = `
                <div style="
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-height: 50vh;
                    text-align: center;
                    color: white;
                ">
                    <div style="
                        width: 80px;
                        height: 80px;
                        background: rgba(34, 197, 94, 0.2);
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin-bottom: 24px;
                        border: 2px solid rgba(34, 197, 94, 0.5);
                    ">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="20,6 9,17 4,12"></polyline>
                        </svg>
                    </div>
                    <h2 style="font-size: 28px; font-weight: bold; margin-bottom: 12px;">
                        Welcome to LyncX!
                    </h2>
                    <p style="font-size: 18px; opacity: 0.9; margin-bottom: 16px;">
                        You're all set up and ready to go.
                    </p>
                    <p style="font-size: 14px; opacity: 0.7;">
                        This tab will close automatically...
                    </p>
                </div>
            `;
        }
    }

    private showErrorMessage(error: string): void {
        // Show error state
        const root = document.getElementById("root");
        if (root) {
            root.innerHTML = `
                <div style="
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-height: 50vh;
                    text-align: center;
                    color: white;
                ">
                    <div style="
                        width: 80px;
                        height: 80px;
                        background: rgba(239, 68, 68, 0.2);
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin-bottom: 24px;
                        border: 2px solid rgba(239, 68, 68, 0.5);
                    ">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="15" y1="9" x2="9" y2="15"></line>
                            <line x1="9" y1="9" x2="15" y2="15"></line>
                        </svg>
                    </div>
                    <h2 style="font-size: 28px; font-weight: bold; margin-bottom: 12px;">
                        Authentication Failed
                    </h2>
                    <p style="font-size: 16px; opacity: 0.9; margin-bottom: 24px; max-width: 400px;">
                        ${error}
                    </p>
                    <button onclick="window.location.reload()" style="
                        background: rgba(255, 255, 255, 0.2);
                        border: 1px solid rgba(255, 255, 255, 0.3);
                        color: white;
                        padding: 12px 24px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 16px;
                        font-weight: 500;
                        transition: all 0.2s ease;
                    " onmouseover="this.style.background='rgba(255, 255, 255, 0.3)'" onmouseout="this.style.background='rgba(255, 255, 255, 0.2)'">
                        Try Again
                    </button>
                </div>
            `;
        }
    }
}

// Initialize the login page
function initializeLoginPage() {
    console.log("🚀 Initializing LyncX login page...");

    const authHandler = new LoginPageAuthHandler();
    const container = document.getElementById("root");

    if (!container) {
        console.error("❌ Root container not found");
        return;
    }

    // Create React root and render login page
    const root = createRoot(container);

    root.render(
        <LoginPage onGoogleLogin={() => authHandler.handleGoogleLogin()} />,
    );

    console.log("✅ Login page rendered successfully");
}

// Wait for DOM to be ready
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeLoginPage);
} else {
    initializeLoginPage();
}
