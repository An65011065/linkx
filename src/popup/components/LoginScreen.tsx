// src/popup/components/LoginScreen.tsx - FINAL FIXED VERSION
import React, { useEffect, useState } from "react";
import AuthService from "../../services/authService";
import type { AuthUser } from "../../services/authService";

interface LoginScreenProps {
    onSignIn: (user: AuthUser) => void;
    error: string | null;
    loading: boolean;
}

const LoginScreen: React.FC<LoginScreenProps> = ({
    onSignIn,
    error,
    loading,
}) => {
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const [signInError, setSignInError] = useState<string | null>(null);
    const [isSigningIn, setIsSigningIn] = useState(false);

    const authService = AuthService.getInstance();

    useEffect(() => {
        // Check if user is already logged in when component mounts
        const checkAuthState = async () => {
            try {
                await authService.waitForAuthReady();
                const currentUser = authService.getCurrentUser();
                if (currentUser) {
                    console.log("User already logged in:", currentUser.email);
                    onSignIn(currentUser);
                    return;
                }
            } catch (error) {
                console.error("Error checking auth state:", error);
            } finally {
                setIsCheckingAuth(false);
            }
        };

        checkAuthState();
    }, []);

    const handleSignIn = async () => {
        setIsSigningIn(true);
        setSignInError(null);

        try {
            console.log("Starting Firebase sign-in...");
            const user = await authService.signInWithGoogle();
            console.log("Sign-in successful:", user.email);
            onSignIn(user);
        } catch (error) {
            console.error("Sign-in error:", error);
            setSignInError("Failed to sign in. Please try again.");
        } finally {
            setIsSigningIn(false);
        }
    };

    // Show loading while checking initial auth state
    if (isCheckingAuth) {
        return (
            <div
                style={{
                    width: "340px",
                    height: "330px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "Arial, sans-serif",
                    background: "#f8f9fa",
                }}
            >
                <div style={{ textAlign: "center", color: "#6a6a6a" }}>
                    <div
                        style={{
                            width: "24px",
                            height: "24px",
                            border: "2px solid #e3e3e3",
                            borderTop: "2px solid #4285f4",
                            borderRadius: "50%",
                            animation: "spin 1s linear infinite",
                            margin: "0 auto 12px",
                        }}
                    />
                    <p style={{ fontSize: "14px", margin: 0 }}>
                        Checking authentication...
                    </p>
                </div>
            </div>
        );
    }

    const displayError = signInError || error;
    const displayLoading = isSigningIn || loading;

    return (
        <div
            style={{
                width: "340px",
                height: "330px",
                padding: "40px 32px",
                fontFamily: "Arial, sans-serif",
                background: "#ffffff",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                position: "relative",
                boxSizing: "border-box",
            }}
        >
            {/* Logo */}
            <div
                style={{
                    fontSize: "32px",
                    fontWeight: "700",
                    color: "#1a1a1a",
                    marginBottom: "32px",
                }}
            >
                LyncX
            </div>

            {/* Welcome Text */}
            <h1
                style={{
                    fontSize: "20px",
                    fontWeight: "500",
                    color: "#2a2a2a",
                    margin: "0 0 8px 0",
                }}
            >
                Get started
            </h1>
            <p
                style={{
                    fontSize: "14px",
                    color: "#6a6a6a",
                    margin: "0 0 40px 0",
                    lineHeight: "1.4",
                }}
            >
                Sign in to continue to your dashboard
            </p>

            {/* Sign In Button */}
            <button
                onClick={handleSignIn}
                disabled={displayLoading}
                style={{
                    width: "100%",
                    padding: "16px 24px",
                    background: displayLoading ? "#f5f5f5" : "#4285f4",
                    border: "none",
                    borderRadius: "8px",
                    color: displayLoading ? "#999" : "#ffffff",
                    fontSize: "15px",
                    fontWeight: "500",
                    cursor: displayLoading ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "12px",
                }}
            >
                {displayLoading ? (
                    <>
                        <div
                            style={{
                                width: "16px",
                                height: "16px",
                                border: "2px solid #ddd",
                                borderTop: "2px solid #999",
                                borderRadius: "50%",
                                animation: "spin 1s linear infinite",
                            }}
                        />
                        Signing in...
                    </>
                ) : (
                    <>
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                        >
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="currentColor"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="currentColor"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                fill="currentColor"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="currentColor"
                            />
                        </svg>
                        Continue with Google
                    </>
                )}
            </button>

            {/* Error Message - COMPLETELY NEW COLORS */}
            {displayError && (
                <div
                    style={{
                        marginTop: "20px",
                        padding: "12px 16px",
                        backgroundColor: "#fff3cd",
                        border: "1px solid #ffeaa7",
                        borderRadius: "8px",
                        color: "#856404",
                        fontSize: "13px",
                        width: "100%",
                        textAlign: "center",
                        boxSizing: "border-box",
                    }}
                >
                    {displayError}
                </div>
            )}

            {/* Subtle privacy notice */}
            <div
                style={{
                    position: "absolute",
                    bottom: "20px",
                    left: "32px",
                    right: "32px",
                    fontSize: "11px",
                    color: "#8a8a8a",
                    textAlign: "center",
                }}
            >
                Secure authentication
            </div>

            {/* CSS for animations */}
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
};

export default LoginScreen;
