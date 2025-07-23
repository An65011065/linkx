// Theme mode type
export type ThemeMode = "light" | "dark" | "system";

// Color palette structure
export interface ColorPalette {
    // Primary colors
    primary: {
        50: string;
        100: string;
        200: string;
        300: string;
        400: string;
        500: string;
        600: string;
        700: string;
        800: string;
        900: string;
    };

    // Secondary colors
    secondary: {
        50: string;
        100: string;
        200: string;
        300: string;
        400: string;
        500: string;
        600: string;
        700: string;
        800: string;
        900: string;
    };

    // Neutral/Gray colors
    neutral: {
        50: string;
        100: string;
        200: string;
        300: string;
        400: string;
        500: string;
        600: string;
        700: string;
        800: string;
        900: string;
    };

    // Status colors
    success: {
        50: string;
        100: string;
        500: string;
        600: string;
        700: string;
    };

    warning: {
        50: string;
        100: string;
        500: string;
        600: string;
        700: string;
    };

    error: {
        50: string;
        100: string;
        500: string;
        600: string;
        700: string;
    };

    info: {
        50: string;
        100: string;
        500: string;
        600: string;
        700: string;
    };
}

// Graph-specific color scheme
export interface GraphColorScheme {
    // Node colors
    node: {
        default: string;
        selected: string;
        highlighted: string;
        active: string;
        inactive: string;
        hovered: string;
    };

    // Link colors
    link: {
        default: string;
        hyperlink: string;
        highlighted: string;
        active: string;
        inactive: string;
    };

    // Background colors
    background: {
        canvas: string;
        overlay: string;
        panel: string;
        modal: string;
    };

    // Timeline colors
    timeline: {
        axis: string;
        ticks: string;
        labels: string;
        sessionSeparator: string;
        sessionHighlight: string;
    };

    // UI element colors
    ui: {
        border: string;
        shadow: string;
        selection: string;
        focus: string;
        disabled: string;
    };

    // Text colors
    text: {
        primary: string;
        secondary: string;
        muted: string;
        inverse: string;
        accent: string;
    };

    // Effect colors
    effects: {
        glow: {
            selected: string;
            active: string;
            hover: string;
        };
        blur: string;
        overlay: string;
    };
}

// Typography configuration
export interface Typography {
    fontFamily: {
        primary: string;
        secondary: string;
        mono: string;
    };

    fontSize: {
        xs: string;
        sm: string;
        base: string;
        lg: string;
        xl: string;
        "2xl": string;
        "3xl": string;
    };

    fontWeight: {
        normal: number;
        medium: number;
        semibold: number;
        bold: number;
    };

    lineHeight: {
        tight: number;
        normal: number;
        relaxed: number;
    };

    letterSpacing: {
        tight: string;
        normal: string;
        wide: string;
    };
}

// Spacing and sizing
export interface Spacing {
    spacing: {
        0: string;
        1: string;
        2: string;
        3: string;
        4: string;
        5: string;
        6: string;
        8: string;
        10: string;
        12: string;
        16: string;
        20: string;
        24: string;
        32: string;
        40: string;
        48: string;
        56: string;
        64: string;
    };

    borderRadius: {
        none: string;
        sm: string;
        base: string;
        md: string;
        lg: string;
        xl: string;
        "2xl": string;
        full: string;
    };

    borderWidth: {
        0: string;
        1: string;
        2: string;
        4: string;
        8: string;
    };
}

// Animation and transitions
export interface Animations {
    duration: {
        fast: string;
        normal: string;
        slow: string;
    };

    easing: {
        linear: string;
        ease: string;
        easeIn: string;
        easeOut: string;
        easeInOut: string;
        bounce: string;
        elastic: string;
    };

    transitions: {
        default: string;
        colors: string;
        opacity: string;
        transform: string;
        all: string;
    };
}

// Shadow definitions
export interface Shadows {
    sm: string;
    base: string;
    md: string;
    lg: string;
    xl: string;
    "2xl": string;
    inner: string;
    none: string;
}

// Complete theme configuration
export interface Theme {
    mode: ThemeMode;
    colors: ColorPalette;
    graphColors: GraphColorScheme;
    typography: Typography;
    spacing: Spacing;
    animations: Animations;
    shadows: Shadows;
}

// Theme context value
export interface ThemeContextValue {
    theme: Theme;
    mode: ThemeMode;
    isDarkMode: boolean;
    toggleTheme: () => void;
    setTheme: (mode: ThemeMode) => void;
}

// Theme provider props
export interface ThemeProviderProps {
    children: React.ReactNode;
    defaultMode?: ThemeMode;
    storageKey?: string;
}

// CSS custom properties map
export interface CSSCustomProperties {
    [key: `--${string}`]: string;
}

// Theme customization options
export interface ThemeCustomization {
    colors?: Partial<ColorPalette>;
    graphColors?: Partial<GraphColorScheme>;
    typography?: Partial<Typography>;
    spacing?: Partial<Spacing>;
    animations?: Partial<Animations>;
    shadows?: Partial<Shadows>;
}

// Preset theme options
export type ThemePreset =
    | "default"
    | "minimal"
    | "vibrant"
    | "corporate"
    | "academic"
    | "high-contrast";

// Theme utility functions type
export interface ThemeUtils {
    getColor: (path: string) => string;
    getGraphColor: (path: string) => string;
    getCSSProperties: () => CSSCustomProperties;
    createCustomTheme: (customization: ThemeCustomization) => Theme;
    applyPreset: (preset: ThemePreset) => Theme;
}
