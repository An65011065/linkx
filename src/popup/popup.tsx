// src/popup/popup.tsx - Add debugging
import React from "react";
import ReactDOM from "react-dom/client";

// DEBUG: Add logging before imports
console.log("🔧 [DEBUG] popup.tsx starting to load");

try {
    console.log("🔧 [DEBUG] Importing PopupApp...");

    // Import with error handling
    import("./components/PopupApp")
        .then((module) => {
            console.log("🔧 [DEBUG] PopupApp imported successfully");
            const PopupApp = module.default;

            // Import styles
            import("../shared/styles/index.css")
                .then(() => {
                    console.log("🔧 [DEBUG] Styles imported successfully");

                    const rootElement = document.getElementById("root");
                    if (!rootElement) {
                        console.error("🚨 [DEBUG] Root element not found!");
                        return;
                    }

                    console.log("🔧 [DEBUG] Creating React root...");
                    const root = ReactDOM.createRoot(rootElement);

                    console.log("🔧 [DEBUG] Rendering PopupApp...");
                    root.render(
                        <React.StrictMode>
                            <PopupApp />
                        </React.StrictMode>,
                    );

                    console.log("✅ [DEBUG] PopupApp rendered successfully");
                })
                .catch((error) => {
                    console.error("🚨 [DEBUG] Failed to import styles:", error);
                });
        })
        .catch((error) => {
            console.error("🚨 [DEBUG] Failed to import PopupApp:", error);

            // Fallback: Show error in the popup
            const rootElement = document.getElementById("root");
            if (rootElement) {
                rootElement.innerHTML = `
                <div style="width: 340px; height: 330px; background: #ffebee; display: flex; align-items: center; justify-content: center; padding: 20px; box-sizing: border-box; font-family: Arial, sans-serif; text-align: center;">
                    <div>
                        <h3 style="color: #c62828; margin-bottom: 10px;">Error Loading Popup</h3>
                        <p style="color: #666; font-size: 12px;">${error.message}</p>
                        <p style="color: #666; font-size: 10px;">Check console for details</p>
                    </div>
                </div>
            `;
            }
        });
} catch (error) {
    console.error("🚨 [DEBUG] Synchronous error in popup.tsx:", error);
}
