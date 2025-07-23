import type {
    ColorPalette,
    GraphColorScheme,
    Theme,
} from "../types/theme.types";

// Base color palettes
export const LIGHT_PALETTE: ColorPalette = {
    primary: {
        50: "#fef7ed",
        100: "#fde8d1",
        200: "#fbcfa3",
        300: "#f7ad6a",
        400: "#f1832f",
        500: "#ec6720",
        600: "#dc4a15",
        700: "#b73614",
        800: "#922d18",
        900: "#782616",
    },

    secondary: {
        50: "#f0f9ff",
        100: "#e0f2fe",
        200: "#bae6fd",
        300: "#7dd3fc",
        400: "#38bdf8",
        500: "#0ea5e9",
        600: "#0284c7",
        700: "#0369a1",
        800: "#075985",
        900: "#0c4a6e",
    },

    neutral: {
        50: "#fafaf9",
        100: "#f5f5f4",
        200: "#e7e5e4",
        300: "#d6d3d1",
        400: "#a8a29e",
        500: "#78716c",
        600: "#57534e",
        700: "#44403c",
        800: "#292524",
        900: "#1c1917",
    },

    success: {
        50: "#f0fdf4",
        100: "#dcfce7",
        500: "#22c55e",
        600: "#16a34a",
        700: "#15803d",
    },

    warning: {
        50: "#fffbeb",
        100: "#fef3c7",
        500: "#f59e0b",
        600: "#d97706",
        700: "#b45309",
    },

    error: {
        50: "#fef2f2",
        100: "#fee2e2",
        500: "#ef4444",
        600: "#dc2626",
        700: "#b91c1c",
    },

    info: {
        50: "#eff6ff",
        100: "#dbeafe",
        500: "#3b82f6",
        600: "#2563eb",
        700: "#1d4ed8",
    },
};

export const DARK_PALETTE: ColorPalette = {
    primary: {
        50: "#1e293b",
        100: "#334155",
        200: "#475569",
        300: "#64748b",
        400: "#94a3b8",
        500: "#cbd5e1",
        600: "#e2e8f0",
        700: "#f1f5f9",
        800: "#f8fafc",
        900: "#ffffff",
    },

    secondary: {
        50: "#172554",
        100: "#1e3a8a",
        200: "#1e40af",
        300: "#1d4ed8",
        400: "#2563eb",
        500: "#3b82f6",
        600: "#60a5fa",
        700: "#93c5fd",
        800: "#bfdbfe",
        900: "#dbeafe",
    },

    neutral: {
        50: "#0f172a",
        100: "#1e293b",
        200: "#334155",
        300: "#475569",
        400: "#64748b",
        500: "#94a3b8",
        600: "#cbd5e1",
        700: "#e2e8f0",
        800: "#f1f5f9",
        900: "#f8fafc",
    },

    success: {
        50: "#064e3b",
        100: "#065f46",
        500: "#10b981",
        600: "#059669",
        700: "#047857",
    },

    warning: {
        50: "#78350f",
        100: "#92400e",
        500: "#f59e0b",
        600: "#d97706",
        700: "#b45309",
    },

    error: {
        50: "#7f1d1d",
        100: "#991b1b",
        500: "#ef4444",
        600: "#dc2626",
        700: "#b91c1c",
    },

    info: {
        50: "#1e3a8a",
        100: "#1e40af",
        500: "#3b82f6",
        600: "#2563eb",
        700: "#1d4ed8",
    },
};

// Light theme graph colors - based on your original amber/orange theme
export const LIGHT_GRAPH_COLORS: GraphColorScheme = {
    node: {
        default: "rgba(255, 183, 77, 0.9)",
        selected: "rgba(255, 183, 77, 1)",
        highlighted: "rgba(255, 164, 165, 1)",
        active: "rgba(239, 68, 68, 0.8)",
        inactive: "rgba(255, 183, 77, 0.15)",
        hovered: "rgba(255, 183, 77, 1)",
    },

    link: {
        default: "rgba(255, 183, 77, 0.8)",
        hyperlink: "rgba(255, 164, 165, 0.8)",
        highlighted: "rgba(255, 183, 77, 1)",
        active: "rgba(255, 183, 77, 1)",
        inactive: "rgba(255, 183, 77, 0.15)",
    },

    background: {
        canvas: "linear-gradient(135deg, #fef7ed 0%, #fed7aa 100%)",
        overlay: "rgba(255, 255, 255, 0.95)",
        panel: "rgba(255, 251, 235, 0.95)",
        modal: "rgba(255, 255, 255, 0.98)",
    },

    timeline: {
        axis: "rgba(255, 183, 77, 0.4)",
        ticks: "rgba(255, 183, 77, 0.4)",
        labels: "rgba(184, 134, 11, 0.8)",
        sessionSeparator: "rgba(147, 51, 234, 0.2)",
        sessionHighlight: "rgba(147, 51, 234, 0.1)",
    },

    ui: {
        border: "rgba(255, 183, 77, 0.3)",
        shadow: "rgba(0, 0, 0, 0.1)",
        selection: "rgba(255, 183, 77, 0.2)",
        focus: "rgba(255, 183, 77, 0.5)",
        disabled: "rgba(184, 134, 11, 0.3)",
    },

    text: {
        primary: "rgba(120, 53, 15, 0.9)",
        secondary: "rgba(184, 134, 11, 0.8)",
        muted: "rgba(184, 134, 11, 0.6)",
        inverse: "rgba(255, 255, 255, 0.9)",
        accent: "rgba(255, 183, 77, 1)",
    },

    effects: {
        glow: {
            selected: "rgba(255, 183, 77, 0.8)",
            active: "rgba(239, 68, 68, 0.6)",
            hover: "rgba(255, 183, 77, 0.6)",
        },
        blur: "blur(20px)",
        overlay: "rgba(0, 0, 0, 0.5)",
    },
};

// Dark theme graph colors - based on your original dark mode colors
export const DARK_GRAPH_COLORS: GraphColorScheme = {
    node: {
        default: "rgba(156, 163, 175, 0.9)",
        selected: "rgba(59, 130, 246, 0.9)",
        highlighted: "rgba(255, 164, 165, 1)",
        active: "rgba(239, 68, 68, 0.8)",
        inactive: "rgba(156, 163, 175, 0.15)",
        hovered: "rgba(156, 163, 175, 1)",
    },

    link: {
        default: "rgba(156, 163, 175, 0.8)",
        hyperlink: "rgba(255, 164, 165, 0.8)",
        highlighted: "rgba(156, 163, 175, 1)",
        active: "rgba(156, 163, 175, 1)",
        inactive: "rgba(156, 163, 175, 0.15)",
    },

    background: {
        canvas: "linear-gradient(135deg, #1f2937 0%, #374151 100%)",
        overlay: "rgba(31, 41, 55, 0.95)",
        panel: "rgba(31, 41, 55, 0.95)",
        modal: "rgba(17, 24, 39, 0.98)",
    },

    timeline: {
        axis: "rgba(75, 85, 99, 0.4)",
        ticks: "rgba(75, 85, 99, 0.4)",
        labels: "rgba(156, 163, 175, 0.8)",
        sessionSeparator: "rgba(99, 102, 241, 0.2)",
        sessionHighlight: "rgba(99, 102, 241, 0.1)",
    },

    ui: {
        border: "rgba(75, 85, 99, 0.5)",
        shadow: "rgba(0, 0, 0, 0.3)",
        selection: "rgba(59, 130, 246, 0.2)",
        focus: "rgba(59, 130, 246, 0.5)",
        disabled: "rgba(75, 85, 99, 0.3)",
    },

    text: {
        primary: "rgba(243, 244, 246, 0.9)",
        secondary: "rgba(156, 163, 175, 0.8)",
        muted: "rgba(156, 163, 175, 0.6)",
        inverse: "rgba(17, 24, 39, 0.9)",
        accent: "rgba(59, 130, 246, 1)",
    },

    effects: {
        glow: {
            selected: "rgba(59, 130, 246, 0.8)",
            active: "rgba(239, 68, 68, 0.6)",
            hover: "rgba(156, 163, 175, 0.6)",
        },
        blur: "blur(20px)",
        overlay: "rgba(0, 0, 0, 0.7)",
    },
};

// Typography configuration
export const TYPOGRAPHY = {
    fontFamily: {
        primary:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
        secondary:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
        mono: "'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace",
    },

    fontSize: {
        xs: "0.75rem", // 12px
        sm: "0.875rem", // 14px
        base: "1rem", // 16px
        lg: "1.125rem", // 18px
        xl: "1.25rem", // 20px
        "2xl": "1.5rem", // 24px
        "3xl": "1.875rem", // 30px
    },

    fontWeight: {
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
    },

    lineHeight: {
        tight: 1.25,
        normal: 1.5,
        relaxed: 1.75,
    },

    letterSpacing: {
        tight: "-0.025em",
        normal: "0em",
        wide: "0.025em",
    },
};

// Animation configurations
export const ANIMATIONS = {
    duration: {
        fast: "150ms",
        normal: "300ms",
        slow: "600ms",
    },

    easing: {
        linear: "linear",
        ease: "ease",
        easeIn: "ease-in",
        easeOut: "ease-out",
        easeInOut: "ease-in-out",
        bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        elastic: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
    },

    transitions: {
        default: "all 0.2s ease",
        colors: "color 0.2s ease, background-color 0.2s ease",
        opacity: "opacity 0.3s ease",
        transform: "transform 0.3s ease",
        filter: "filter 0.2s ease",
    },
};

// Shadow definitions
export const SHADOWS = {
    sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    base: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    inner: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)",
    none: "none",
};

// Create complete themes
export const LIGHT_THEME: Theme = {
    mode: "light",
    colors: LIGHT_PALETTE,
    graphColors: LIGHT_GRAPH_COLORS,
    typography: TYPOGRAPHY,
    spacing: { spacing: {}, borderRadius: {}, borderWidth: {} }, // Minimal since we use inline styles
    animations: ANIMATIONS,
    shadows: SHADOWS,
};

export const DARK_THEME: Theme = {
    mode: "dark",
    colors: DARK_PALETTE,
    graphColors: DARK_GRAPH_COLORS,
    typography: TYPOGRAPHY,
    spacing: { spacing: {}, borderRadius: {}, borderWidth: {} }, // Minimal since we use inline styles
    animations: ANIMATIONS,
    shadows: SHADOWS,
};

// Theme utilities
export const getTheme = (isDarkMode: boolean): Theme => {
    return isDarkMode ? DARK_THEME : LIGHT_THEME;
};

export const getGraphColors = (isDarkMode: boolean): GraphColorScheme => {
    return isDarkMode ? DARK_GRAPH_COLORS : LIGHT_GRAPH_COLORS;
};
