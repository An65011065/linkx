// src/services/ThemeService.ts

export interface Theme {
    id: string;
    name: string;
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
}

export const themes: Theme[] = [
    {
        id: "mono",
        name: "Mono",
        primary: "rgb(255, 255, 255)",
        secondary: "rgb(200, 200, 200)",
        accent: "rgb(128, 128, 128)",
        background: "rgb(0, 0, 0)",
        surface: "rgb(32, 32, 32)",
        text: "rgb(255, 255, 255)",
        textSecondary: "rgb(180, 180, 180)",
    },
    {
        id: "amber",
        name: "Amber",
        primary: "rgb(245, 158, 11)",
        secondary: "rgb(251, 191, 36)",
        accent: "rgb(217, 119, 6)",
        background: "rgb(12, 10, 9)",
        surface: "rgb(28, 25, 23)",
        text: "rgb(254, 215, 170)",
        textSecondary: "rgb(245, 158, 11)",
    },
    {
        id: "pearl",
        name: "Pearl",
        primary: "rgb(71, 85, 105)",
        secondary: "rgb(100, 116, 139)",
        accent: "rgb(0, 0, 0)",
        background: "rgb(248, 250, 252)",
        surface: "rgb(226, 232, 240)",
        text: "rgb(15, 23, 42)",
        textSecondary: "rgb(71, 85, 105)",
    },
    {
        id: "cream",
        name: "Cream",
        primary: "rgb(120, 53, 15)",
        secondary: "rgb(146, 64, 14)",
        accent: "rgb(92, 38, 4)",
        background: "rgb(254, 252, 232)",
        surface: "rgb(245, 243, 206)",
        text: "rgb(92, 38, 4)",
        textSecondary: "rgb(120, 53, 15)",
    },
    {
        id: "sage",
        name: "Sage",
        primary: "rgb(22, 101, 52)",
        secondary: "rgb(34, 134, 58)",
        accent: "rgb(20, 83, 45)",
        background: "rgb(247, 254, 231)",
        surface: "rgb(236, 253, 211)",
        text: "rgb(20, 83, 45)",
        textSecondary: "rgb(22, 101, 52)",
    },
    {
        id: "rose",
        name: "Rose",
        primary: "rgb(220, 38, 127)",
        secondary: "rgb(244, 63, 94)",
        accent: "rgb(190, 18, 60)",
        background: "rgb(254, 242, 242)",
        surface: "rgb(252, 228, 236)",
        text: "rgb(136, 19, 55)",
        textSecondary: "rgb(190, 24, 93)",
    },
];

type ThemeListener = (theme: Theme) => void;

interface ThemePreferences {
    theme: Theme;
    lastUpdated: string;
}

export class ThemeService {
    private static instance: ThemeService;
    private currentTheme: Theme | null = null;
    private listeners: Set<ThemeListener> = new Set();
    private initialized = false;
    private isUpdating = false;

    // Storage keys
    private static readonly STORAGE_KEY = "userTheme";
    private static readonly PREFERENCES_KEY = "themePreferences";

    private constructor() {
        this.setupMessageListener();
    }

    static getInstance(): ThemeService {
        if (!ThemeService.instance) {
            ThemeService.instance = new ThemeService();
        }
        return ThemeService.instance;
    }

    /**
     * Initialize theme from storage
     * Call this when your app/extension starts
     */
    async init(): Promise<Theme> {
        if (this.initialized && this.currentTheme) {
            return this.currentTheme;
        }

        try {
            console.log("🎨 Initializing ThemeService...");

            // Try to get theme from chrome.storage.sync first (syncs across devices)
            const syncResult = await this.getFromStorage("sync");
            if (syncResult) {
                this.currentTheme = syncResult;
                this.initialized = true;
                console.log(
                    "✅ Theme loaded from sync storage:",
                    syncResult.name,
                );
                return this.currentTheme;
            }

            // Fallback to local storage
            const localResult = await this.getFromStorage("local");
            if (localResult) {
                this.currentTheme = localResult;
                this.initialized = true;
                console.log(
                    "✅ Theme loaded from local storage:",
                    localResult.name,
                );

                // Migrate to sync storage
                await this.saveToStorage(localResult, "sync");
                return this.currentTheme;
            }

            // No stored theme found, use default
            const defaultTheme = this.findThemeById("mono") || themes[0];
            await this.setTheme(defaultTheme, false); // Don't broadcast on init

            console.log("✅ Using default theme:", defaultTheme.name);
            return defaultTheme;
        } catch (error) {
            console.error("❌ Theme initialization failed:", error);

            // Fallback to first theme
            const fallbackTheme = themes[0];
            this.currentTheme = fallbackTheme;
            this.initialized = true;
            return fallbackTheme;
        }
    }

    /**
     * Set the current theme and sync across extension
     */
    async setTheme(theme: Theme, broadcast = true): Promise<void> {
        if (this.isUpdating) {
            console.log("⏳ Theme update already in progress, skipping...");
            return;
        }

        try {
            this.isUpdating = true;
            console.log("🎨 Setting theme:", theme.name);

            // Validate theme
            if (!this.isValidTheme(theme)) {
                throw new Error(`Invalid theme: ${theme?.id || "undefined"}`);
            }

            this.currentTheme = theme;

            // Save to storage (both sync and local for redundancy)
            await Promise.all([
                this.saveToStorage(theme, "sync"),
                this.saveToStorage(theme, "local"),
            ]);

            // Notify local listeners
            this.notifyListeners(theme);

            // Broadcast to other extension pages/tabs
            if (broadcast && typeof chrome !== "undefined" && chrome.runtime) {
                try {
                    chrome.runtime.sendMessage({
                        type: "THEME_CHANGED",
                        theme: theme,
                        timestamp: Date.now(),
                    });
                } catch (runtimeError) {
                    console.warn(
                        "⚠️ Failed to broadcast theme change:",
                        runtimeError,
                    );
                    // Don't throw - local update still worked
                }
            }

            console.log("✅ Theme updated successfully:", theme.name);
        } catch (error) {
            console.error("❌ Failed to set theme:", error);
            throw error;
        } finally {
            this.isUpdating = false;
        }
    }

    /**
     * Get current theme (synchronous after init)
     */
    getCurrentTheme(): Theme {
        if (!this.initialized) {
            console.warn(
                "⚠️ ThemeService not initialized, returning default theme",
            );
            return themes[0];
        }
        return this.currentTheme || themes[0];
    }

    /**
     * Get all available themes
     */
    getAvailableThemes(): Theme[] {
        return [...themes];
    }

    /**
     * Find theme by ID
     */
    findThemeById(id: string): Theme | null {
        return themes.find((theme) => theme.id === id) || null;
    }

    /**
     * Subscribe to theme changes
     * Returns unsubscribe function
     */
    subscribe(listener: ThemeListener): () => void {
        this.listeners.add(listener);

        // Immediately call with current theme if available
        if (this.currentTheme) {
            try {
                listener(this.currentTheme);
            } catch (error) {
                console.error("❌ Theme listener failed on subscribe:", error);
            }
        }

        // Return unsubscribe function
        return () => {
            this.listeners.delete(listener);
        };
    }

    /**
     * Reset to default theme
     */
    async resetToDefault(): Promise<void> {
        const defaultTheme = this.findThemeById("mono") || themes[0];
        await this.setTheme(defaultTheme);
    }

    /**
     * Export current theme preferences
     */
    exportPreferences(): ThemePreferences | null {
        if (!this.currentTheme) return null;

        return {
            theme: this.currentTheme,
            lastUpdated: new Date().toISOString(),
        };
    }

    /**
     * Import theme preferences
     */
    async importPreferences(preferences: ThemePreferences): Promise<void> {
        if (!preferences?.theme || !this.isValidTheme(preferences.theme)) {
            throw new Error("Invalid theme preferences");
        }

        await this.setTheme(preferences.theme);
    }

    /**
     * Check if ThemeService is initialized
     */
    isInitialized(): boolean {
        return this.initialized;
    }

    // ========== PRIVATE METHODS ==========

    private async getFromStorage(
        storageType: "sync" | "local",
    ): Promise<Theme | null> {
        try {
            if (typeof chrome === "undefined" || !chrome.storage) {
                return null;
            }

            const storage =
                storageType === "sync"
                    ? chrome.storage.sync
                    : chrome.storage.local;
            const result = await storage.get([ThemeService.STORAGE_KEY]);

            const storedTheme = result[ThemeService.STORAGE_KEY];
            if (storedTheme && this.isValidTheme(storedTheme)) {
                return storedTheme;
            }

            return null;
        } catch (error) {
            console.error(
                `❌ Failed to read from ${storageType} storage:`,
                error,
            );
            return null;
        }
    }

    private async saveToStorage(
        theme: Theme,
        storageType: "sync" | "local",
    ): Promise<void> {
        try {
            if (typeof chrome === "undefined" || !chrome.storage) {
                throw new Error("Chrome storage not available");
            }

            const storage =
                storageType === "sync"
                    ? chrome.storage.sync
                    : chrome.storage.local;
            await storage.set({
                [ThemeService.STORAGE_KEY]: theme,
            });
        } catch (error) {
            console.error(
                `❌ Failed to save to ${storageType} storage:`,
                error,
            );
            throw error;
        }
    }

    private setupMessageListener(): void {
        if (typeof chrome === "undefined" || !chrome.runtime) {
            return;
        }

        try {
            chrome.runtime.onMessage.addListener(
                (message, sender, sendResponse) => {
                    if (message.type === "THEME_CHANGED" && message.theme) {
                        // Avoid infinite loops by checking if this is our own message
                        if (
                            !this.isUpdating &&
                            this.isValidTheme(message.theme)
                        ) {
                            console.log(
                                "📨 Received theme change message:",
                                message.theme.name,
                            );
                            this.currentTheme = message.theme;
                            this.notifyListeners(message.theme);
                        }
                    }
                },
            );
        } catch (error) {
            console.error("❌ Failed to setup message listener:", error);
        }
    }

    private notifyListeners(theme: Theme): void {
        this.listeners.forEach((listener) => {
            try {
                listener(theme);
            } catch (error) {
                console.error("❌ Theme listener failed:", error);
            }
        });
    }

    private isValidTheme(theme: any): theme is Theme {
        return (
            theme &&
            typeof theme === "object" &&
            typeof theme.id === "string" &&
            typeof theme.name === "string" &&
            typeof theme.primary === "string" &&
            typeof theme.background === "string" &&
            typeof theme.text === "string"
        );
    }

    /**
     * Cleanup method (call when extension is being disabled/unloaded)
     */
    destroy(): void {
        this.listeners.clear();
        this.currentTheme = null;
        this.initialized = false;
        console.log("🎨 ThemeService destroyed");
    }
}

// Export singleton instance
export const themeService = ThemeService.getInstance();

// Export default for easy importing
export default ThemeService;
