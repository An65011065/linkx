// src/hooks/useTheme.ts
import { useState, useEffect, useCallback } from "react";
import { Theme, ThemeService } from "../services/themeService";

export function useTheme() {
    const [theme, setTheme] = useState<Theme | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const themeService = ThemeService.getInstance();

    useEffect(() => {
        let mounted = true;

        const initTheme = async () => {
            try {
                const initialTheme = await themeService.init();
                if (mounted) {
                    setTheme(initialTheme);
                    setIsLoading(false);
                }
            } catch (error) {
                console.error("Failed to initialize theme:", error);
                if (mounted) {
                    // Fallback to first theme
                    setTheme(themeService.getAvailableThemes()[0]);
                    setIsLoading(false);
                }
            }
        };

        initTheme();

        // Subscribe to theme changes
        const unsubscribe = themeService.subscribe((newTheme) => {
            if (mounted) {
                setTheme(newTheme);
            }
        });

        return () => {
            mounted = false;
            unsubscribe();
        };
    }, [themeService]);

    const updateTheme = useCallback(
        async (newTheme: Theme) => {
            try {
                await themeService.setTheme(newTheme);
            } catch (error) {
                console.error("Failed to update theme:", error);
            }
        },
        [themeService],
    );

    const resetTheme = useCallback(async () => {
        try {
            await themeService.resetToDefault();
        } catch (error) {
            console.error("Failed to reset theme:", error);
        }
    }, [themeService]);

    return {
        theme: theme || themeService.getAvailableThemes()[0], // Fallback
        themes: themeService.getAvailableThemes(),
        updateTheme,
        resetTheme,
        isLoading,
        isInitialized: themeService.isInitialized(),
    };
}
