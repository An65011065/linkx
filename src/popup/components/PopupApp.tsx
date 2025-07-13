// src/popup/components/PopupApp.tsx
import React, { useState, useEffect } from "react";
import AuthService from "../../services/authService";
import type { AuthUser } from "../../services/authService";
import LoginScreen from "./LoginScreen";
import MainContent from "./MainContent";
import "../../shared/styles/fonts.css";

const PopupApp: React.FC = () => {
    const [isSignedIn, setIsSignedIn] = useState<boolean>(false);
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let unsubscribe: (() => void) | null = null;

        const initAuth = async () => {
            try {
                const authService = AuthService.getInstance();
                console.log("🔍 [PopupApp] Starting auth initialization...");

                // Wait for Firebase Auth to finish loading
                await authService.waitForAuthReady();
                console.log("✅ [PopupApp] Auth ready");

                // Now check if user is signed in
                const currentUser = authService.getCurrentUser();
                console.log("👤 [PopupApp] Current user:", currentUser);

                if (currentUser) {
                    setUser(currentUser);
                    setIsSignedIn(true);
                    console.log("✅ [PopupApp] User is signed in");
                } else {
                    setUser(null);
                    setIsSignedIn(false);
                    console.log("❌ [PopupApp] No user signed in");
                }

                setLoading(false);

                // Listen for auth state changes
                unsubscribe = authService.onAuthStateChanged((user) => {
                    console.log(
                        "🔄 [PopupApp] Auth state changed:",
                        user ? user.email : "null",
                    );
                    setUser(user);
                    setIsSignedIn(!!user);
                    setLoading(false);
                });
            } catch (error) {
                console.error(
                    "❌ [PopupApp] Auth initialization error:",
                    error,
                );
                setLoading(false);
                setError("Failed to initialize authentication");
            }
        };

        initAuth();

        // Cleanup function
        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, []);

    // Handle successful sign-in from LoginScreen
    const handleSignIn = (signedInUser: AuthUser) => {
        console.log("✅ [PopupApp] Sign in successful:", signedInUser.email);
        setUser(signedInUser);
        setIsSignedIn(true);
        setError(null);
    };

    const handleSignOut = async () => {
        try {
            setError(null);
            console.log("🔄 [PopupApp] Signing out...");

            const authService = AuthService.getInstance();
            await authService.signOut();

            console.log("✅ [PopupApp] Sign out successful");
            setUser(null);
            setIsSignedIn(false);
        } catch (error) {
            console.error("❌ [PopupApp] Sign out failed:", error);
            setError("Failed to sign out.");
        }
    };

    console.log(
        "🎯 [PopupApp] Render - loading:",
        loading,
        "isSignedIn:",
        isSignedIn,
        "user:",
        user ? user.email : "null",
    );

    // Loading state while checking initial auth
    if (loading) {
        return (
            <div
                style={{
                    width: "340px",
                    height: "330px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily:
                        "Nunito-Regular, -apple-system, BlinkMacSystemFont, sans-serif",
                    background: "rgba(255, 255, 255, 0.95)",
                    backdropFilter: "blur(8px)",
                    WebkitBackdropFilter: "blur(8px)",
                    borderRadius: "20px",
                    border: "1px solid rgba(255, 255, 255, 0.18)",
                    boxShadow: "0 8px 32px rgba(31, 38, 135, 0.37)",
                }}
            >
                <div style={{ textAlign: "center" }}>
                    <div
                        style={{
                            width: "32px",
                            height: "32px",
                            border: "3px solid #e9ecef",
                            borderTop: "3px solid #4285f4",
                            borderRadius: "50%",
                            animation: "spin 1s linear infinite",
                            margin: "0 auto 16px",
                        }}
                    />
                    <div
                        style={{
                            fontSize: "14px",
                            color: "#6c757d",
                            fontFamily: "Nunito-Regular",
                        }}
                    >
                        Loading...
                    </div>
                </div>
                <style>
                    {`
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    `}
                </style>
            </div>
        );
    }

    // Show login screen if not signed in
    if (!isSignedIn) {
        console.log("🔑 [PopupApp] Showing LoginScreen");
        return (
            <LoginScreen
                onSignIn={handleSignIn}
                error={error}
                loading={false} // LoginScreen handles its own loading state
            />
        );
    }

    // Show main content if signed in
    console.log("🏠 [PopupApp] Showing MainContent");
    return <MainContent user={user} onSignOut={handleSignOut} />;
};

export default PopupApp;
