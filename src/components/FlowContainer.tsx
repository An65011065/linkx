import React, { useState, useEffect } from "react";
import LoginScreen from "./LoginScreen";
import FlowModal from "./FlowModal";

interface AuthUser {
    id: string;
    email: string;
    name: string;
    picture?: string;
    accessToken: string;
}

interface AuthMessage {
    type: string;
    success?: boolean;
    user?: AuthUser;
    error?: string;
}

interface FlowMessage {
    type: string;
    user?: AuthUser;
}

const FlowContainer: React.FC = () => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [showLoginScreen, setShowLoginScreen] = useState(true);
    const [isVisible, setIsVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const container = document.getElementById("lyncx-flow-root");
        if (container) {
            // Instead of blocking all pointer events, we'll handle this in CSS
            // This allows the navbar hover trigger to work
            container.style.pointerEvents = isVisible ? "auto" : "none";

            // Add CSS class to handle navbar interaction
            if (isVisible) {
                container.classList.add("flow-visible");
            } else {
                container.classList.remove("flow-visible");
            }
        }
    }, [isVisible]);

    // Add CSS styles to the document head
    useEffect(() => {
        const styleId = "flow-navbar-fix";
        let existingStyle = document.getElementById(styleId);

        if (!existingStyle) {
            const style = document.createElement("style");
            style.id = styleId;
            style.textContent = `
                #lyncx-flow-root.flow-visible {
                    pointer-events: none !important;
                }
                
                #lyncx-flow-root.flow-visible > * {
                    pointer-events: auto;
                }
                
                /* Ensure navbar trigger area remains accessible */
                .lynx-hover-trigger {
                    pointer-events: auto !important;
                    z-index: 10000002 !important;
                }
                
                .lynx-navbar-container {
                    pointer-events: auto !important;
                }
            `;
            document.head.appendChild(style);
        }

        return () => {
            const style = document.getElementById(styleId);
            if (style) {
                style.remove();
            }
        };
    }, []);

    // Listen for messages from HoverNavbar and background script
    useEffect(() => {
        const messageListener = (
            message: FlowMessage,
            sender: chrome.runtime.MessageSender,
            sendResponse: (response?: any) => void,
        ) => {
            console.log("🔔 FlowContainer received message:", message.type);

            switch (message.type) {
                case "SHOW_FLOW_MODAL":
                    handleShowFlow();
                    sendResponse({ success: true });
                    break;

                case "AUTH_STATE_CHANGED":
                    if (message.user) {
                        setUser(message.user);
                        setShowLoginScreen(false);
                    } else {
                        setUser(null);
                        setShowLoginScreen(true);
                    }
                    sendResponse({ success: true });
                    break;

                case "HIDE_FLOW_MODAL":
                    setIsVisible(false);
                    sendResponse({ success: true });
                    break;

                default:
                    break;
            }
        };

        if (typeof chrome !== "undefined" && chrome.runtime) {
            chrome.runtime.onMessage.addListener(messageListener);

            // Check initial auth state
            checkInitialAuthState();

            return () => {
                chrome.runtime.onMessage.removeListener(messageListener);
            };
        }
    }, []);

    const checkInitialAuthState = async () => {
        try {
            if (typeof chrome !== "undefined" && chrome.runtime) {
                const response = await chrome.runtime.sendMessage({
                    type: "CHECK_AUTH_STATE",
                });

                if (response && response.user) {
                    setUser(response.user);
                    setShowLoginScreen(false);
                }
            }
        } catch (error) {
            console.log("🔍 No existing auth state found");
        }
    };

    const handleShowFlow = () => {
        console.log("📅 Showing Flow modal");
        setIsVisible(true);
    };

    const handleGoogleLogin = async () => {
        setIsLoading(true);

        try {
            console.log("🔐 Starting Google authentication...");

            if (typeof chrome !== "undefined" && chrome.runtime) {
                const response: AuthMessage = await chrome.runtime.sendMessage({
                    type: "GOOGLE_AUTH",
                });

                if (response.success && response.user) {
                    console.log(
                        "✅ Authentication successful:",
                        response.user.email,
                    );
                    setUser(response.user);
                    setShowLoginScreen(false);
                } else {
                    console.error("❌ Authentication failed:", response.error);
                    // You could show an error message here
                }
            } else {
                console.error("❌ Chrome runtime not available");
            }
        } catch (error) {
            console.error("❌ Authentication error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleContinueWithoutSignin = () => {
        console.log("👤 Continuing without Google Calendar sync");
        setShowLoginScreen(false);
        // User remains null, FlowModal will show without calendar features
    };

    const handleSignOut = async () => {
        console.log("🚪 Signing out...");

        try {
            if (typeof chrome !== "undefined" && chrome.runtime) {
                await chrome.runtime.sendMessage({ type: "SIGN_OUT" });
            }

            setUser(null);
            setShowLoginScreen(true);
        } catch (error) {
            console.error("❌ Sign out error:", error);
        }
    };

    const handleClose = () => {
        console.log("❌ Closing Flow modal");
        setIsVisible(false);
    };

    // Don't render anything if not visible
    if (!isVisible) {
        return null;
    }

    return (
        <>
            {showLoginScreen ? (
                <LoginScreen
                    onGoogleLogin={handleGoogleLogin}
                    onContinueWithoutSignin={handleContinueWithoutSignin}
                    isLoading={isLoading}
                />
            ) : (
                <FlowModal
                    isVisible={true}
                    user={user}
                    onClose={handleClose}
                    onSignOut={handleSignOut}
                />
            )}
        </>
    );
};

export default FlowContainer;
