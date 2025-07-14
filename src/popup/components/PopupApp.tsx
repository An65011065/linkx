// src/popup/components/PopupApp.tsx - Fixed auth state listening
import React, { useState, useEffect } from "react";
import AuthService from "../../services/authService";
import type { AuthUser } from "../../services/authService";
import LoginScreen from "./LoginScreen";
import MainContent from "./MainContent";

const PopupApp: React.FC = () => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [showDebug, setShowDebug] = useState(false);
    const [debugLog, setDebugLog] = useState<string[]>([]);

    // Load debug log from storage and add new entries
    const addDebugEntry = async (message: string) => {
        const timestamp = new Date().toLocaleTimeString();
        const entry = `${timestamp}: ${message}`;

        // Get existing log
        const result = await chrome.storage.local.get(["debugLog"]);
        const existingLog = result.debugLog || [];

        // Add new entry and keep last 10
        const newLog = [...existingLog, entry].slice(-10);

        // Save back to storage
        await chrome.storage.local.set({ debugLog: newLog });

        // Update local state
        setDebugLog(newLog);

        console.log(`🔍 [PopupApp] ${entry}`);
    };

    // Load debug log on mount
    useEffect(() => {
        const loadDebugLog = async () => {
            const result = await chrome.storage.local.get(["debugLog"]);
            setDebugLog(result.debugLog || []);
        };
        loadDebugLog();
    }, []);

    useEffect(() => {
        let unsubscribe: (() => void) | null = null;

        const initAuth = async () => {
            try {
                await addDebugEntry("Starting auth initialization");
                const authService = AuthService.getInstance();

                // CRITICAL: Set up listener FIRST, before checking cached user
                unsubscribe = authService.onAuthStateChanged(
                    async (authUser) => {
                        await addDebugEntry(
                            `🔄 Auth state changed: ${
                                authUser ? authUser.email : "null"
                            }`,
                        );
                        setUser(authUser);

                        // If we have a user, we're ready
                        if (authUser) {
                            setIsReady(true);
                            await addDebugEntry(
                                "✅ User authenticated, popup ready",
                            );
                        }
                    },
                );

                // THEN check for cached user and wait for auth ready
                await addDebugEntry("Waiting for auth to be ready...");
                await authService.waitForAuthReady();

                // Get the current user state
                const currentUser = authService.getCurrentUser();
                await addDebugEntry(
                    `Current user after auth ready: ${
                        currentUser ? currentUser.email : "null"
                    }`,
                );

                // Always set ready to true so we can show login screen if needed
                setIsReady(true);
                await addDebugEntry("✅ Auth initialization complete");
            } catch (error) {
                console.error("Auth error:", error);
                await addDebugEntry(
                    `❌ Auth error: ${
                        error instanceof Error ? error.message : "unknown"
                    }`,
                );
                setIsReady(true); // Show login screen even on error
            }
        };

        initAuth();

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, []); // Only run once when component mounts

    // Handle sign in
    const handleSignIn = async (signedInUser: AuthUser) => {
        await addDebugEntry(`✅ Manual sign in: ${signedInUser.email}`);
        setUser(signedInUser);
    };

    // Handle sign out
    const handleSignOut = async () => {
        try {
            await addDebugEntry("🔄 Starting sign out");
            const authService = AuthService.getInstance();
            await authService.signOut();
            setUser(null);
            await addDebugEntry("✅ Sign out complete");
        } catch (error) {
            console.error("Sign out error:", error);
            await addDebugEntry(
                `❌ Sign out error: ${
                    error instanceof Error ? error.message : "unknown"
                }`,
            );
        }
    };

    // Manual Firestore sync test
    const handleManualSync = async () => {
        try {
            await addDebugEntry("🔄 Manual Firestore sync triggered");
            const authService = AuthService.getInstance();
            await authService.refreshUserData();
            await addDebugEntry("✅ Manual sync completed");
        } catch (error) {
            console.error("Manual sync error:", error);
            await addDebugEntry(
                `❌ Manual sync error: ${
                    error instanceof Error ? error.message : "unknown"
                }`,
            );
        }
    };

    // Test API connection
    const handleTestConnection = async () => {
        try {
            await addDebugEntry("🧪 Testing API connection");
            const authService = AuthService.getInstance();
            await authService.testApiConnection();
            await addDebugEntry("✅ API connection test completed");
        } catch (error) {
            console.error("Connection test error:", error);
            await addDebugEntry(
                `❌ Connection test error: ${
                    error instanceof Error ? error.message : "unknown"
                }`,
            );
        }
    };

    // Clear debug log
    const clearDebugLog = async () => {
        await chrome.storage.local.remove(["debugLog"]);
        setDebugLog([]);
    };

    // Don't render anything until we know the auth state
    if (!isReady) {
        return (
            <div
                style={{
                    width: "340px",
                    height: "330px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#f8f9fa",
                    fontFamily: "Arial, sans-serif",
                    padding: "20px",
                    boxSizing: "border-box",
                }}
            >
                <div
                    style={{
                        width: "24px",
                        height: "24px",
                        border: "2px solid #e9ecef",
                        borderTop: "2px solid #4285f4",
                        borderRadius: "50%",
                        animation: "spin 1s linear infinite",
                        marginBottom: "16px",
                    }}
                />
                <div
                    style={{
                        fontSize: "14px",
                        color: "#666",
                        marginBottom: "16px",
                    }}
                >
                    Loading...
                </div>

                <style>
                    {`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}
                </style>
            </div>
        );
    }

    // Render the appropriate screen
    const mainComponent = user ? (
        <MainContent user={user} onSignOut={handleSignOut} />
    ) : (
        <LoginScreen onSignIn={handleSignIn} error={null} loading={false} />
    );

    return (
        <div style={{ position: "relative" }}>
            {mainComponent}

            {/* Debug Test Buttons - only show when debug is active */}
            {showDebug && (
                <div
                    style={{
                        position: "absolute",
                        bottom: "40px",
                        left: "5px",
                        right: "5px",
                        display: "flex",
                        gap: "5px",
                        zIndex: 1002,
                    }}
                >
                    <button
                        onClick={handleManualSync}
                        style={{
                            flex: 1,
                            background: "#4285f4",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            padding: "4px 8px",
                            fontSize: "10px",
                            cursor: "pointer",
                        }}
                        disabled={!user}
                    >
                        Sync API
                    </button>
                    <button
                        onClick={handleTestConnection}
                        style={{
                            flex: 1,
                            background: "#34a853",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            padding: "4px 8px",
                            fontSize: "10px",
                            cursor: "pointer",
                        }}
                    >
                        Test API
                    </button>
                </div>
            )}

            {/* Debug Toggle Button */}
            <button
                onClick={() => setShowDebug(!showDebug)}
                style={{
                    position: "absolute",
                    top: "5px",
                    right: "5px",
                    background: showDebug ? "#4285f4" : "rgba(0,0,0,0.7)",
                    color: "white",
                    border: "none",
                    borderRadius: "50%",
                    width: "24px",
                    height: "24px",
                    fontSize: "12px",
                    cursor: "pointer",
                    zIndex: 1001,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
                title="Toggle Debug Info"
            >
                🐛
            </button>

            {/* Debug Overlay */}
            {showDebug && (
                <div
                    style={{
                        position: "absolute",
                        top: "35px",
                        left: "5px",
                        right: "5px",
                        bottom: "50px", // Leave space for buttons
                        backgroundColor: "rgba(0, 0, 0, 0.95)",
                        color: "#00ff00",
                        padding: "10px",
                        borderRadius: "8px",
                        fontSize: "10px",
                        fontFamily: "monospace",
                        overflowY: "auto",
                        zIndex: 1000,
                        border: "1px solid #333",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "10px",
                            borderBottom: "1px solid #333",
                            paddingBottom: "5px",
                        }}
                    >
                        <strong style={{ color: "#ffff00" }}>
                            🔍 Auth Debug Log
                        </strong>
                        <button
                            onClick={clearDebugLog}
                            style={{
                                background: "#ff4444",
                                color: "white",
                                border: "none",
                                borderRadius: "3px",
                                padding: "2px 6px",
                                fontSize: "9px",
                                cursor: "pointer",
                            }}
                        >
                            Clear
                        </button>
                    </div>

                    <div style={{ marginBottom: "10px", color: "#ffff00" }}>
                        <strong>Current State:</strong>
                        <br />• Ready: {isReady.toString()}
                        <br />• User: {user ? user.email : "null"}
                        <br />• Plan:{" "}
                        {user?.plan
                            ? `${user.plan.type} (${user.plan.status})`
                            : "loading..."}
                        <br />• Component:{" "}
                        {user ? "MainContent" : "LoginScreen"}
                    </div>

                    <div style={{ color: "#00ffff", marginBottom: "5px" }}>
                        <strong>Event Log:</strong>
                    </div>

                    {debugLog.length === 0 ? (
                        <div style={{ color: "#888" }}>No events yet...</div>
                    ) : (
                        debugLog.map((entry, i) => (
                            <div
                                key={i}
                                style={{
                                    marginBottom: "2px",
                                    padding: "2px 0",
                                    borderLeft: entry.includes("✅")
                                        ? "2px solid #00ff00"
                                        : entry.includes("❌")
                                        ? "2px solid #ff4444"
                                        : entry.includes("🔄")
                                        ? "2px solid #ffff00"
                                        : "2px solid #666",
                                    paddingLeft: "5px",
                                }}
                            >
                                {entry}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default PopupApp;
