// src/services/authService.ts - With Brave compatibility and Session Sync (Fixed)
import SessionSyncService from "./sessionSyncService";

export interface AuthUser {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    plan?: UserPlan;
}

export interface UserPlan {
    type: "free" | "trial" | "pro" | "plus";
    status: "active" | "canceled" | "expired";
    subscriptionStart: Date | null;
    subscriptionEnd: Date | null;
    stripeCustomerId?: string;
    lastUpdated: Date;
}

class AuthService {
    private static instance: AuthService;
    private currentUser: AuthUser | null = null;
    private authListeners: ((user: AuthUser | null) => void)[] = [];
    private readonly apiBaseUrl = "https://lyncx-server.vercel.app/api";
    private tokenRefreshTimer: NodeJS.Timeout | null = null;

    private constructor() {
        this.loadCachedUser();
        this.setupTokenRefresh();
    }

    public static getInstance(): AuthService {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    }

    // 🆕 Lazy initialization to avoid circular dependency
    private getSessionSyncService(): SessionSyncService {
        return SessionSyncService.getInstance();
    }

    // ========== BROWSER-COMPATIBLE AUTHENTICATION FLOW ==========
    public async signInWithGoogle(): Promise<AuthUser> {
        return new Promise((resolve, reject) => {
            console.log("🔑 Starting authentication flow...");
            let callbackExecuted = false;

            // Set timeout to detect if Brave fails to call the callback
            const timeout = setTimeout(() => {
                if (!callbackExecuted) {
                    console.log(
                        "⚠️ Chrome Identity API timeout (likely Brave), trying web auth fallback...",
                    );
                    this.signInWithWebAuth()
                        .then(resolve)
                        .catch((error) => {
                            console.error(
                                "❌ Web auth fallback failed:",
                                error,
                            );
                            reject(
                                new Error(
                                    "Authentication failed on this browser",
                                ),
                            );
                        });
                }
            }, 3000); // 3 second timeout

            // Try Chrome Identity API first
            chrome.identity.getAuthToken(
                {
                    interactive: true,
                    scopes: ["openid", "email", "profile"],
                },
                async (googleToken) => {
                    callbackExecuted = true;
                    clearTimeout(timeout);

                    // Check if Chrome Identity API worked
                    if (googleToken && !chrome.runtime.lastError) {
                        console.log("✅ Chrome Identity API successful");
                        try {
                            const user = await this.processGoogleToken(
                                googleToken,
                            );
                            resolve(user);
                        } catch (error) {
                            console.error(
                                "❌ Error processing Chrome token:",
                                error,
                            );
                            reject(
                                new Error("Failed to complete authentication"),
                            );
                        }
                        return;
                    }

                    // Chrome Identity API failed (likely Brave), fallback to web auth
                    console.log(
                        "⚠️ Chrome Identity API failed, trying web auth fallback...",
                    );
                    try {
                        const user = await this.signInWithWebAuth();
                        resolve(user);
                    } catch (error) {
                        console.error("❌ Web auth fallback failed:", error);
                        reject(
                            new Error("Authentication failed on this browser"),
                        );
                    }
                },
            );
        });
    }

    // Fallback web auth for browsers that don't support Chrome Identity API (like Brave)
    private async signInWithWebAuth(): Promise<AuthUser> {
        return new Promise((resolve, reject) => {
            console.log(
                "🌐 Starting web auth flow for browser compatibility...",
            );

            const authUrl = `https://lyncx.ai/auth?source=extension&redirect_uri=${encodeURIComponent(
                chrome.identity.getRedirectURL(),
            )}`;

            chrome.identity.launchWebAuthFlow(
                {
                    url: authUrl,
                    interactive: true,
                },
                async (responseUrl) => {
                    if (chrome.runtime.lastError) {
                        console.error(
                            "❌ Web auth flow error:",
                            chrome.runtime.lastError,
                        );
                        reject(
                            new Error(
                                chrome.runtime.lastError.message ||
                                    "Web authentication failed",
                            ),
                        );
                        return;
                    }

                    if (!responseUrl) {
                        reject(
                            new Error("No response URL received from web auth"),
                        );
                        return;
                    }

                    console.log(
                        "✅ Web auth flow completed, processing response...",
                    );

                    try {
                        await this.handleWebAuthResponse(responseUrl);
                        if (!this.currentUser) {
                            throw new Error("Failed to set current user");
                        }
                        console.log(
                            "✅ Web authentication successful:",
                            this.currentUser.email,
                        );
                        resolve(this.currentUser);
                    } catch (error) {
                        console.error(
                            "❌ Error processing web auth response:",
                            error,
                        );
                        reject(
                            new Error("Failed to complete web authentication"),
                        );
                    }
                },
            );
        });
    }

    // Handle web auth response (for Brave compatibility)
    private async handleWebAuthResponse(responseUrl: string): Promise<void> {
        const url = new URL(responseUrl);

        // Extract data from response
        const uid = url.searchParams.get("uid");
        const email = url.searchParams.get("email");
        const displayName = url.searchParams.get("displayName");
        const photoURL = url.searchParams.get("photoURL");
        const authToken = url.searchParams.get("token");

        // Validate required fields
        if (!uid || !email) {
            throw new Error(
                "Missing required authentication data (uid or email)",
            );
        }

        if (!authToken) {
            throw new Error("No JWT token received from web auth");
        }

        // Create user object
        const user: AuthUser = {
            uid,
            email: decodeURIComponent(email),
            displayName: displayName ? decodeURIComponent(displayName) : null,
            photoURL: photoURL ? decodeURIComponent(photoURL) : null,
        };

        // Store token securely
        await this.storeAuthToken(authToken);

        // Set user and notify listeners
        await this.setCurrentUser(user);
        this.notifyPopupOfAuthChange();

        // Load user plan in background
        this.loadUserPlan().catch((error) => {
            console.error("⚠️ Failed to load user plan (non-critical):", error);
        });
    }

    // Process Google token with backend (Chrome Identity API path)
    private async processGoogleToken(googleToken: string): Promise<AuthUser> {
        try {
            console.log("🔄 Sending Google token to backend...");

            const response = await fetch(
                `${this.apiBaseUrl}/auth/google-signin`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ googleToken }),
                },
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(
                    errorData.error ||
                        `Backend auth failed: ${response.status}`,
                );
            }

            const { user, jwtToken } = await response.json();

            if (!user || !jwtToken) {
                throw new Error(
                    "Invalid response from backend - missing user or token",
                );
            }

            console.log("✅ Backend auth successful, storing JWT...");

            // Store JWT for future API calls
            await this.storeAuthToken(jwtToken);

            // Create user object with proper typing
            const authUser: AuthUser = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || null,
                photoURL: user.photoURL || null,
                plan: user.plan ? this.parseApiPlan(user.plan) : undefined,
            };

            // Set user and notify listeners
            await this.setCurrentUser(authUser);
            this.notifyPopupOfAuthChange();

            // Load fresh plan data in background if not included
            if (!user.plan) {
                this.loadUserPlan().catch((error) => {
                    console.error(
                        "⚠️ Failed to load user plan (non-critical):",
                        error,
                    );
                });
            }

            return authUser;
        } catch (error) {
            console.error("❌ Error in processGoogleToken:", error);
            throw error;
        }
    }

    private notifyPopupOfAuthChange(): void {
        console.log("🔄 Notifying popup of auth state change");
        this.authListeners.forEach((callback) => callback(this.currentUser));
    }

    // ========== PLAN MANAGEMENT (UNCHANGED) ==========
    private async loadUserPlan(): Promise<void> {
        try {
            console.log("🔄 Loading user plan from API...");
            const response = await this.apiCall("GET", "/user/profile");

            if (!response.ok) {
                if (response.status === 404) {
                    console.log(
                        "🆕 User not found, creating with trial plan...",
                    );
                    await this.createUserWithTrialPlan();
                    return;
                }
                throw new Error(
                    `Failed to load user profile: ${response.status}`,
                );
            }

            const userData = await response.json();
            console.log("📋 User profile loaded successfully");

            const plan: UserPlan = this.parseApiPlan(userData.plan);

            if (this.currentUser) {
                const updatedUser = { ...this.currentUser, plan };
                await this.setCurrentUser(updatedUser);
                console.log(`✅ Plan loaded: ${plan.type} (${plan.status})`);
            }
        } catch (error) {
            console.error("❌ Error loading user plan:", error);
        }
    }

    private async createUserWithTrialPlan(): Promise<void> {
        try {
            const response = await this.apiCall("POST", "/user/create", {
                planType: "trial",
            });

            if (!response.ok) {
                throw new Error(`Failed to create user: ${response.status}`);
            }

            const userData = await response.json();
            console.log("✅ User created with trial plan");

            if (this.currentUser) {
                const plan = this.parseApiPlan(userData.user.plan);
                const updatedUser = { ...this.currentUser, plan };
                await this.setCurrentUser(updatedUser);
            }
        } catch (error) {
            console.error("❌ Failed to create user with trial plan:", error);
            throw error;
        }
    }

    public async updateUserPlan(
        planType: "free" | "trial" | "pro" | "plus",
        subscriptionEnd?: Date | null,
        stripeCustomerId?: string,
    ): Promise<void> {
        if (!this.currentUser) {
            throw new Error("No authenticated user");
        }

        try {
            console.log(`🔄 Updating plan to ${planType}...`);

            const response = await this.apiCall("PUT", "/user/plan", {
                planType,
                subscriptionEnd: subscriptionEnd?.toISOString() || null,
                stripeCustomerId,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(
                    errorData.error ||
                        `Failed to update plan: ${response.status}`,
                );
            }

            const data = await response.json();
            console.log(`✅ Plan updated to ${planType}`);

            const plan = this.parseApiPlan(data.plan);

            if (this.currentUser) {
                const updatedUser = { ...this.currentUser, plan };
                await this.setCurrentUser(updatedUser);
            }
        } catch (error) {
            console.error("❌ Error updating user plan:", error);
            throw new Error(
                `Failed to update plan: ${
                    error instanceof Error ? error.message : "Unknown error"
                }`,
            );
        }
    }

    // ========== FEATURE ACCESS CONTROL (UNCHANGED) ==========
    public hasFeatureAccess(
        feature:
            | "unlimited_notes"
            | "advanced_insights"
            | "data_export"
            | "weekly_insights",
    ): boolean {
        if (!this.currentUser?.plan) {
            console.log(
                "⚠️ No plan data available, denying access to",
                feature,
            );
            return false;
        }

        const { type, status } = this.currentUser.plan;

        if (status !== "active") {
            console.log(
                `⚠️ Plan status is ${status}, denying access to ${feature}`,
            );
            return false;
        }

        if (this.isPlanExpired()) {
            console.log(`⚠️ Plan is expired, denying access to ${feature}`);
            return false;
        }

        switch (feature) {
            case "unlimited_notes":
            case "advanced_insights":
                return ["trial", "pro", "plus"].includes(type);
            case "data_export":
            case "weekly_insights":
                return type === "plus";
            default:
                return true;
        }
    }

    public getUserPlan(): UserPlan | null {
        return this.currentUser?.plan || null;
    }

    public isPlanExpired(): boolean {
        const plan = this.getUserPlan();
        if (!plan || plan.type === "free") return false;
        return plan.subscriptionEnd ? new Date() > plan.subscriptionEnd : false;
    }

    public getDaysRemaining(): number | null {
        const plan = this.getUserPlan();
        if (!plan || plan.type === "free" || !plan.subscriptionEnd) return null;

        const now = new Date();
        const msRemaining = plan.subscriptionEnd.getTime() - now.getTime();
        const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));
        return Math.max(0, daysRemaining);
    }

    // ========== USER MANAGEMENT (UNCHANGED) ==========
    public async signOut(): Promise<void> {
        try {
            console.log("🔄 Signing out...");

            if (this.tokenRefreshTimer) {
                clearTimeout(this.tokenRefreshTimer);
                this.tokenRefreshTimer = null;
            }

            // Revoke Google token (try, but don't fail if it doesn't work)
            try {
                const googleToken = await this.getGoogleToken();
                if (googleToken) {
                    chrome.identity.removeCachedAuthToken({
                        token: googleToken,
                    });
                    console.log("✅ Google token revoked");
                }
            } catch (error) {
                console.log("⚠️ Failed to revoke Google token:", error);
            }

            // Invalidate JWT on server
            try {
                await this.apiCall("POST", "/auth/logout");
                console.log("✅ JWT invalidated on server");
            } catch (error) {
                console.log("⚠️ Failed to invalidate JWT on server:", error);
            }

            // Clear local data
            await this.setCurrentUser(null);
            await chrome.storage.local.remove([
                "cachedUser",
                "authToken",
                "tokenExpiry",
            ]);

            console.log("✅ Successfully signed out");
        } catch (error) {
            console.error("❌ Sign out error:", error);
            throw new Error("Failed to sign out");
        }
    }

    public getCurrentUser(): AuthUser | null {
        return this.currentUser;
    }

    public async getCachedUser(): Promise<AuthUser | null> {
        try {
            const result = await chrome.storage.local.get(["cachedUser"]);
            if (result.cachedUser) {
                console.log("🔍 Cached user found:", result.cachedUser.email);
                return result.cachedUser;
            }
            return null;
        } catch (error) {
            console.error("❌ Error getting cached user:", error);
            return null;
        }
    }

    public async waitForAuthReady(): Promise<void> {
        console.log("⏳ Initializing auth state...");
        await this.loadCachedUser();

        if (this.currentUser) {
            console.log(
                "🔄 User found, forcing immediate auth state notification",
            );
            this.authListeners.forEach((callback) =>
                callback(this.currentUser),
            );

            const isValid = await this.verifyToken();
            if (isValid) {
                this.loadUserPlan().catch((error) => {
                    console.error("⚠️ Failed to load fresh plan data:", error);
                });
            } else {
                console.log("⚠️ Cached token is invalid, signing out...");
                await this.signOut();
            }
        }

        console.log("✅ Auth initialization complete");
    }

    public onAuthStateChanged(
        callback: (user: AuthUser | null) => void,
    ): () => void {
        this.authListeners.push(callback);
        callback(this.currentUser);
        return () => {
            const index = this.authListeners.indexOf(callback);
            if (index > -1) {
                this.authListeners.splice(index, 1);
            }
        };
    }

    public isSignedIn(): boolean {
        return !!this.currentUser;
    }

    public async refreshUserData(): Promise<void> {
        if (!this.currentUser) {
            throw new Error("No authenticated user");
        }
        console.log("🔄 Force refreshing user data...");
        await this.loadUserPlan();
    }

    // ========== API UTILITIES ==========
    private async apiCall(
        method: "GET" | "POST" | "PUT" | "DELETE",
        endpoint: string,
        body?: any,
    ): Promise<Response> {
        const authToken = await this.getAuthToken();
        if (!authToken) {
            throw new Error("No authentication token available");
        }

        const options: RequestInit = {
            method,
            headers: {
                Authorization: `Bearer ${authToken}`,
                "Content-Type": "application/json",
            },
        };

        if (body && method !== "GET") {
            options.body = JSON.stringify(body);
        }

        const url = `${this.apiBaseUrl}${endpoint}`;
        console.log(`🌐 API ${method} ${endpoint}`);

        const response = await fetch(url, options);

        if (response.status === 401) {
            console.log("🔑 Token expired, signing out...");
            await this.signOut();
            throw new Error("Authentication token expired");
        }

        return response;
    }

    // 🆕 Public wrapper for SessionSyncService to use
    public async makeApiCall(
        method: "GET" | "POST" | "PUT" | "DELETE",
        endpoint: string,
        body?: any,
    ): Promise<Response> {
        return this.apiCall(method, endpoint, body);
    }

    // ========== TOKEN MANAGEMENT (UNCHANGED) ==========
    private async storeAuthToken(token: string): Promise<void> {
        try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            const expiry = payload.exp
                ? payload.exp * 1000
                : Date.now() + 7 * 24 * 60 * 60 * 1000;

            await chrome.storage.local.set({
                authToken: token,
                tokenExpiry: expiry,
            });

            console.log("🔑 Auth token stored securely");
        } catch (error) {
            console.error("❌ Error storing auth token:", error);
            throw new Error("Failed to store authentication token");
        }
    }

    private async getAuthToken(): Promise<string | null> {
        try {
            const result = await chrome.storage.local.get([
                "authToken",
                "tokenExpiry",
            ]);

            if (!result.authToken) return null;

            if (result.tokenExpiry && Date.now() > result.tokenExpiry) {
                console.log("🔑 Token has expired");
                await chrome.storage.local.remove(["authToken", "tokenExpiry"]);
                return null;
            }

            return result.authToken;
        } catch (error) {
            console.error("❌ Error getting auth token:", error);
            return null;
        }
    }

    private async getGoogleToken(): Promise<string | null> {
        return new Promise((resolve) => {
            chrome.identity.getAuthToken({ interactive: false }, (token) => {
                if (chrome.runtime.lastError || !token) {
                    resolve(null);
                } else {
                    resolve(token);
                }
            });
        });
    }

    private async verifyToken(): Promise<boolean> {
        try {
            const response = await this.apiCall("GET", "/auth/verify");
            return response.ok;
        } catch (error) {
            console.log("🔑 Token verification failed:", error);
            return false;
        }
    }

    private setupTokenRefresh(): void {
        this.tokenRefreshTimer = setInterval(async () => {
            if (this.currentUser) {
                const isValid = await this.verifyToken();
                if (!isValid) {
                    console.log(
                        "🔑 Token invalid during refresh check, signing out...",
                    );
                    await this.signOut();
                }
            }
        }, 5 * 60 * 1000);
    }

    // ========== UTILITY METHODS (UNCHANGED) ==========
    private parseApiPlan(apiPlan: any): UserPlan {
        return {
            type: apiPlan.type,
            status: apiPlan.status,
            subscriptionStart: apiPlan.subscriptionStart
                ? new Date(apiPlan.subscriptionStart)
                : null,
            subscriptionEnd: apiPlan.subscriptionEnd
                ? new Date(apiPlan.subscriptionEnd)
                : null,
            stripeCustomerId: apiPlan.stripeCustomerId,
            lastUpdated: new Date(apiPlan.lastUpdated),
        };
    }

    // 🔧 Fixed setCurrentUser with lazy sync service initialization
    private async setCurrentUser(user: AuthUser | null): Promise<void> {
        const wasSignedIn = !!this.currentUser;
        const isSigningIn = !!user;

        this.currentUser = user;

        if (user) {
            await chrome.storage.local.set({ cachedUser: user });
        } else {
            await chrome.storage.local.remove(["cachedUser"]);
        }

        // 🆕 Handle session sync based on auth state (with lazy initialization)
        try {
            if (isSigningIn && !wasSignedIn) {
                // User just signed in - start session syncing
                console.log("🔄 User signed in, starting session sync...");
                await this.startSessionSyncing();
            } else if (!isSigningIn && wasSignedIn) {
                // User just signed out - stop session syncing
                console.log("🔄 User signed out, stopping session sync...");
                this.getSessionSyncService().stopPeriodicSync();
            }
        } catch (error) {
            console.error("⚠️ Session sync error (non-critical):", error);
            // Don't throw - sync failure shouldn't break auth
        }

        this.authListeners.forEach((callback) => callback(user));
    }

    // 🆕 Session sync methods with lazy initialization
    private async startSessionSyncing(): Promise<void> {
        try {
            console.log("🔄 Initializing session sync...");

            const syncService = this.getSessionSyncService();

            // Sync historical data first (one-time, privacy-safe)
            await syncService.syncHistoricalSessions(7);

            // Start periodic sync for ongoing session data
            await syncService.startPeriodicSync();

            console.log("✅ Session sync initialized successfully");
        } catch (error) {
            console.error(
                "⚠️ Failed to start session syncing (non-critical):",
                error,
            );
            // Don't throw - sync failure shouldn't break auth flow
        }
    }

    public async forceSyncCurrentSession(): Promise<void> {
        if (!this.currentUser) {
            console.warn("⚠️ Cannot sync - user not authenticated");
            return;
        }

        try {
            await this.getSessionSyncService().syncCurrentSession();
            console.log("✅ Manual sync completed");
        } catch (error) {
            console.error("❌ Manual sync failed:", error);
            throw error;
        }
    }

    public getSyncStatus(): { lastSync: number; isActive: boolean } {
        return {
            lastSync: this.getSessionSyncService().getLastSyncTime(),
            isActive: this.isSignedIn(),
        };
    }

    private async loadCachedUser(): Promise<void> {
        const cachedUser = await this.getCachedUser();
        if (cachedUser) {
            this.currentUser = cachedUser;
            console.log(
                "🔄 Loaded cached user:",
                cachedUser.email,
                `plan: ${cachedUser.plan?.type || "loading..."}`,
            );
        }
    }

    // ========== TESTING AND DEBUG (UNCHANGED) ==========
    public async testApiConnection(): Promise<void> {
        try {
            console.log("🧪 Testing API connection...");
            const response = await this.apiCall("GET", "/health");

            if (!response.ok) {
                throw new Error(`API health check failed: ${response.status}`);
            }

            const data = await response.json();
            console.log("✅ API connection test successful:", data);
        } catch (error) {
            console.error("❌ API connection test failed:", error);
            throw error;
        }
    }

    public getDebugInfo(): any {
        const syncStatus = this.getSyncStatus();

        return {
            isSignedIn: this.isSignedIn(),
            user: this.currentUser
                ? {
                      uid: this.currentUser.uid,
                      email: this.currentUser.email,
                      plan: this.currentUser.plan?.type || "no plan",
                  }
                : null,
            apiBaseUrl: this.apiBaseUrl,
            sessionSync: {
                isActive: syncStatus.isActive,
                lastSync: syncStatus.lastSync
                    ? new Date(syncStatus.lastSync).toISOString()
                    : "never",
                minutesSinceLastSync: syncStatus.lastSync
                    ? Math.round((Date.now() - syncStatus.lastSync) / 60000)
                    : null,
            },
        };
    }
}

export default AuthService;
