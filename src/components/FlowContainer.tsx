import React, { useState, useEffect } from "react";
import FlowModal from "./FlowModal";

interface AuthUser {
    uid: string;
    email: string;
    displayName: string | null;
    photoURL: string | null;
    accessToken: string;
    refreshToken: string | null;
    plan: string;
    subscriptionEnd: string | null;
    createdAt: number;
}

interface FlowMessage {
    type: string;
    user?: AuthUser;
}

const FlowContainer: React.FC = () => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isCheckingAuth, setIsCheckingAuth] = useState(false);

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
                        console.log(
                            "🔄 Auth state updated:",
                            message.user.email,
                        );
                        setUser(message.user);
                    } else {
                        console.log("🔄 User signed out");
                        setUser(null);
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

            return () => {
                chrome.runtime.onMessage.removeListener(messageListener);
            };
        }
    }, []);

    const checkAuthState = async () => {
        if (isCheckingAuth) return; // Prevent duplicate checks

        setIsCheckingAuth(true);

        try {
            console.log("🔍 Checking authentication state...");

            // Check if user is already authenticated
            const result = await chrome.storage.local.get(["auth_user"]);

            if (result.auth_user) {
                console.log(
                    "✅ User already authenticated:",
                    result.auth_user.email,
                );
                setUser(result.auth_user);
                // User can use Flow features immediately
                return true;
            } else {
                console.log("❌ User not authenticated, redirecting to login");

                // Open login page in new tab
                chrome.tabs.create({
                    url: chrome.runtime.getURL("src/auth/login.html"),
                });

                // Close the current Flow modal
                setIsVisible(false);
                return false;
            }
        } catch (error) {
            console.error("❌ Error checking auth state:", error);

            // Fallback: redirect to login
            chrome.tabs.create({
                url: chrome.runtime.getURL("src/auth/login.html"),
            });

            setIsVisible(false);
            return false;
        } finally {
            setIsCheckingAuth(false);
        }
    };

    const handleShowFlow = async () => {
        console.log("📅 Flow modal requested - checking auth...");

        const isAuthenticated = await checkAuthState();

        if (isAuthenticated) {
            console.log("✅ User authenticated, showing Flow modal");
            setIsVisible(true);
        } else {
            console.log("❌ User not authenticated, redirected to login");
            // Modal visibility already set to false in checkAuthState
        }
    };

    const handleSignOut = async () => {
        console.log("🚪 Signing out...");

        try {
            if (typeof chrome !== "undefined" && chrome.runtime) {
                // Clear storage
                await chrome.storage.local.remove(["auth_user", "auth_tokens"]);

                // Revoke Chrome tokens if they exist
                try {
                    const token = await chrome.identity.getAuthToken({
                        interactive: false,
                    });
                    if (token) {
                        await chrome.identity.removeCachedAuthToken({ token });
                    }
                } catch (error) {
                    console.log("Note: Could not revoke cached token:", error);
                }

                // Update local state
                setUser(null);

                // Close Flow modal
                setIsVisible(false);

                console.log("✅ Sign out successful");
            }
        } catch (error) {
            console.error("❌ Sign out error:", error);
            // Always clear local state even if server fails
            setUser(null);
            setIsVisible(false);
        }
    };

    const handleClose = () => {
        console.log("❌ Closing Flow modal");
        setIsVisible(false);
    };

    // Don't render anything if not visible or checking auth
    if (!isVisible || isCheckingAuth) {
        return null;
    }

    // Only render FlowModal - no more LoginScreen
    return (
        <FlowModal
            isVisible={true}
            user={user}
            onClose={handleClose}
            onSignOut={handleSignOut}
        />
    );
};

export default FlowContainer;
