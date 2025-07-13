// src/services/authService.ts
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import type { User } from "firebase/auth";
import { auth } from "../shared/services/firebase";

export interface AuthUser {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
}

class AuthService {
    private static instance: AuthService;
    private auth;

    private constructor() {
        this.auth = auth;
    }

    public static getInstance(): AuthService {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    }

    // Sign in by opening web auth page
    public async signInWithGoogle(): Promise<AuthUser> {
        return new Promise((resolve, reject) => {
            console.log("🔑 Opening web auth page...");

            // Your Vercel auth page
            const authUrl = `https://lyncx.ai/auth?source=extension&timestamp=${Date.now()}`;

            chrome.tabs.create(
                {
                    url: authUrl,
                    active: true,
                },
                (tab) => {
                    if (!tab?.id) {
                        reject(new Error("Failed to open auth tab"));
                        return;
                    }

                    const tabId = tab.id;
                    let resolved = false;

                    // Listen for tab updates to detect successful auth
                    const onTabUpdate = (
                        updatedTabId: number,
                        changeInfo: chrome.tabs.TabChangeInfo,
                    ) => {
                        if (updatedTabId !== tabId || resolved) return;

                        // Check if the tab URL indicates successful auth
                        if (
                            changeInfo.url &&
                            (changeInfo.url.includes("auth-success") ||
                                changeInfo.url.includes("success=true"))
                        ) {
                            resolved = true;
                            cleanup();

                            // Close the auth tab
                            chrome.tabs.remove(tabId);

                            // Wait a moment for Firebase to sync, then check auth
                            setTimeout(() => {
                                const currentUser = this.getCurrentUser();
                                if (currentUser) {
                                    console.log(
                                        "✅ Authentication successful!",
                                    );
                                    resolve(currentUser);
                                } else {
                                    // Wait a bit longer and try again
                                    setTimeout(() => {
                                        const retryUser = this.getCurrentUser();
                                        if (retryUser) {
                                            resolve(retryUser);
                                        } else {
                                            reject(
                                                new Error(
                                                    "Authentication verification failed",
                                                ),
                                            );
                                        }
                                    }, 2000);
                                }
                            }, 1000);
                        }
                    };

                    // Listen for tab being closed (user cancelled)
                    const onTabRemoved = (removedTabId: number) => {
                        if (removedTabId === tabId && !resolved) {
                            resolved = true;
                            cleanup();
                            reject(new Error("Authentication cancelled"));
                        }
                    };

                    // Clean up listeners
                    const cleanup = () => {
                        chrome.tabs.onUpdated.removeListener(onTabUpdate);
                        chrome.tabs.onRemoved.removeListener(onTabRemoved);
                    };

                    chrome.tabs.onUpdated.addListener(onTabUpdate);
                    chrome.tabs.onRemoved.addListener(onTabRemoved);

                    // Timeout after 10 minutes
                    setTimeout(() => {
                        if (!resolved) {
                            resolved = true;
                            cleanup();
                            chrome.tabs.remove(tabId);
                            reject(new Error("Authentication timeout"));
                        }
                    }, 10 * 60 * 1000);
                },
            );
        });
    }

    // Sign out
    public async signOut(): Promise<void> {
        try {
            await firebaseSignOut(this.auth);
            console.log("✅ Successfully signed out");
        } catch (error) {
            console.error("Sign out error:", error);
            throw new Error("Failed to sign out");
        }
    }

    // Get current user (only after auth state is loaded)
    public getCurrentUser(): AuthUser | null {
        const user = this.auth.currentUser;
        if (!user) return null;

        return {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
        };
    }

    // Check if Firebase Auth has finished loading
    public waitForAuthReady(): Promise<void> {
        return new Promise((resolve) => {
            console.log("⏳ Waiting for auth to be ready...");
            const unsubscribe = this.auth.onAuthStateChanged((user) => {
                console.log(
                    "🔔 Auth state changed in waitForAuthReady:",
                    user ? "User found" : "No user",
                );
                unsubscribe();
                resolve();
            });
        });
    }

    // Listen to auth state changes
    public onAuthStateChanged(
        callback: (user: AuthUser | null) => void,
    ): () => void {
        return onAuthStateChanged(this.auth, (user: User | null) => {
            if (user) {
                callback({
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                    photoURL: user.photoURL,
                });
            } else {
                callback(null);
            }
        });
    }

    // Check if user is signed in
    public isSignedIn(): boolean {
        return !!this.auth.currentUser;
    }
}

export default AuthService;
