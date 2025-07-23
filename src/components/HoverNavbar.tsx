import React, { useState, useEffect } from "react";
import {
    Camera,
    FileText,
    Bell,
    Search,
    Bookmark,
    Timer,
    Hash,
    BarChart3,
    Shield,
    Calendar,
    CircleDot,
} from "lucide-react";

// Proper interface for Lucide React icon props
interface LucideIconProps {
    size?: number;
    color?: string;
    strokeWidth?: number;
    absoluteStrokeWidth?: boolean;
    className?: string;
    style?: React.CSSProperties;
}

interface HoverNavbarProps {
    onClose?: () => void;
}

interface AuthUser {
    uid: string;
    email: string;
    displayName: string | null;
    photoURL: string | null;
}

interface Theme {
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

const themes: Theme[] = [
    {
        id: "mono",
        name: "Mono",
        primary: "rgb(255, 255, 255)",
        secondary: "rgb(229, 231, 235)",
        accent: "rgb(243, 244, 246)",
        background: "rgb(15, 23, 42)",
        surface: "rgb(30, 41, 59)", // Solid surface instead of rgba
        text: "rgb(248, 250, 252)",
        textSecondary: "rgb(226, 232, 240)",
    },
    {
        id: "rose",
        name: "Rose",
        primary: "rgb(225, 29, 72)",
        secondary: "rgb(244, 63, 94)",
        accent: "rgb(190, 18, 60)",
        background: "rgb(15, 23, 42)",
        surface: "rgb(30, 41, 59)", // Same dark base for consistency
        text: "rgb(248, 250, 252)", // Fixed: should be light on dark background
        textSecondary: "rgb(225, 29, 72)",
    },
    {
        id: "amber",
        name: "Amber",
        primary: "rgb(245, 158, 11)",
        secondary: "rgb(251, 191, 36)",
        accent: "rgb(217, 119, 6)",
        background: "rgb(15, 23, 42)",
        surface: "rgb(30, 41, 59)", // Same dark base for consistency
        text: "rgb(248, 250, 252)", // Fixed: should be light on dark background
        textSecondary: "rgb(245, 158, 11)",
    },
    {
        id: "pearl",
        name: "Pearl",
        primary: "rgb(71, 85, 105)",
        secondary: "rgb(100, 116, 139)",
        accent: "rgb(0, 0, 0)",
        background: "rgb(248, 250, 252)",
        surface: "rgb(226, 232, 240)", // Solid light surface
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
        surface: "rgb(245, 243, 206)", // Solid cream surface
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
        surface: "rgb(236, 253, 211)", // Solid sage surface
        text: "rgb(20, 83, 45)",
        textSecondary: "rgb(22, 101, 52)",
    },
    {
        id: "lavender",
        name: "Lavender",
        primary: "rgb(107, 33, 168)",
        secondary: "rgb(126, 34, 206)",
        accent: "rgb(88, 28, 135)",
        background: "rgb(250, 245, 255)",
        surface: "rgb(237, 220, 255)", // Solid lavender surface
        text: "rgb(88, 28, 135)",
        textSecondary: "rgb(107, 33, 168)",
    },
];

const HoverNavbar: React.FC<HoverNavbarProps> = () => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [currentTheme, setCurrentTheme] = useState<Theme>(themes[0]); // Default to mono
    const [showThemeSelector, setShowThemeSelector] = useState(false);

    // Debug theme changes
    useEffect(() => {
        console.log("🎨 Theme changed to:", currentTheme.name, currentTheme);
    }, [currentTheme]);

    useEffect(() => {
        console.log("🔍 HoverNavbar: Component mounted, setting up user...");

        const dummyUser = {
            uid: "temp-user-123",
            email: "test@lyncx.com",
            displayName: "Test User",
            photoURL: null,
        };

        setUser(dummyUser);
        console.log("✅ HoverNavbar: Dummy user set");
    }, []);

    const handleAnalytics = () => {
        if (typeof chrome !== "undefined" && chrome.runtime) {
            chrome.runtime.sendMessage({ type: "SHOW_ANALYTICS" });
        }
    };
    const handleNotepad = () => {
        if (typeof chrome !== "undefined" && chrome.runtime) {
            chrome.runtime.sendMessage({
                type: "SHOW_NOTEPAD",
                domain: window.location.hostname.replace(/^www\./, ""),
            });
        }
    };
    const handleFlow = () => {
        if (typeof chrome !== "undefined" && chrome.runtime) {
            chrome.runtime.sendMessage({ type: "SHOW_FLOW_MODAL" });
        }
    };
    const handleLimits = () => {
        if (typeof chrome !== "undefined" && chrome.runtime) {
            chrome.runtime.sendMessage({
                type: "SHOW_LIMIT_MODAL",
                domain: window.location.hostname.replace(/^www\./, ""),
            });
        }
    };
    const handleScreenshot = () => {
        if (typeof chrome !== "undefined" && chrome.runtime) {
            chrome.runtime.sendMessage({ type: "CAPTURE_SCREENSHOT" });
        }
    };
    const handleReminders = () => {};
    const handleSearch = () => {
        if (typeof chrome !== "undefined" && chrome.runtime) {
            chrome.runtime.sendMessage({ type: "SHOW_SPOTLIGHT_SEARCH" });
        }
    };
    const handleBookmark = () => {};
    const handleTimer = () => {
        if (typeof chrome !== "undefined" && chrome.runtime) {
            chrome.runtime.sendMessage({ type: "SHOW_TIMER" });
        }
    };
    const handleSummarize = () => {};

    // Section 1: Data Tools (Primary actions)
    const dataTools = [
        {
            id: "screenshot",
            icon: Camera,
            label: "Screenshot",
            action: handleScreenshot,
        },
        {
            id: "analytics",
            icon: BarChart3,
            label: "Analytics",
            action: handleAnalytics,
        },
        {
            id: "flow",
            icon: Calendar,
            label: "Flow",
            action: handleFlow,
        },
    ];

    // Section 2: Quick Actions
    const quickActions = [
        {
            id: "search",
            icon: Search,
            label: "Search",
            action: handleSearch,
        },
        {
            id: "notepad",
            icon: FileText,
            label: "Notes",
            action: handleNotepad,
        },
        {
            id: "bookmark",
            icon: Bookmark,
            label: "Bookmark",
            action: handleBookmark,
        },
    ];

    // Section 3: Other Tools
    const otherTools = [
        {
            id: "reminders",
            icon: Bell,
            label: "Reminders",
            action: handleReminders,
        },
        {
            id: "timer",
            icon: Timer,
            label: "Timer",
            action: handleTimer,
        },
        {
            id: "limits",
            icon: Shield,
            label: "Daily Limits",
            action: handleLimits,
        },
        {
            id: "summarize",
            icon: Hash,
            label: "Summarize",
            action: handleSummarize,
        },
    ];

    const renderNavItem = (item: {
        id: string;
        icon: React.ComponentType<LucideIconProps>;
        label: string;
        action: () => void;
    }) => {
        const Icon = item.icon;

        return (
            <div
                key={item.id}
                className="lynx-nav-item"
                onClick={item.action}
                title={item.label}
            >
                <Icon color={currentTheme.text} size={18} strokeWidth={2} />
            </div>
        );
    };

    const renderSection = (
        items: Array<{
            id: string;
            icon: React.ComponentType<LucideIconProps>;
            label: string;
            action: () => void;
        }>,
    ) => <div className="lynx-navbar-section">{items.map(renderNavItem)}</div>;

    console.log("✅ HoverNavbar: Rendering with theme:", currentTheme.name);

    return (
        <div className="lynx-hover-navbar">
            {/* Hover trigger area */}
            <div
                className="lynx-hover-trigger"
                onMouseEnter={() => setIsVisible(true)}
            />

            {/* Main navbar - always rendered but visibility controlled by CSS */}
            <div
                className={`lynx-navbar-container ${
                    isVisible ? "visible" : ""
                }`}
                onMouseEnter={() => setIsVisible(true)}
                onMouseLeave={() => setIsVisible(false)}
                style={{
                    background: currentTheme.background,
                    borderRightColor: currentTheme.surface,
                }}
            >
                {/* Theme selector */}
                <div className="theme-controls">
                    <div
                        className="theme-toggle"
                        onClick={() => {
                            console.log(
                                "🎨 Theme selector clicked, current:",
                                showThemeSelector,
                            );
                            setShowThemeSelector(!showThemeSelector);
                        }}
                        title="Change theme"
                    >
                        <CircleDot
                            color={currentTheme.text}
                            size={12}
                            strokeWidth={2}
                        />
                    </div>
                    {showThemeSelector && (
                        <div
                            className="theme-selector"
                            style={{
                                background: currentTheme.background,
                                borderColor: currentTheme.surface,
                            }}
                        >
                            <div className="theme-grid">
                                {themes.map((theme) => (
                                    <div
                                        key={theme.id}
                                        className={`theme-option ${
                                            currentTheme.id === theme.id
                                                ? "active"
                                                : ""
                                        }`}
                                        onClick={() => {
                                            console.log(
                                                "🎨 Switching to theme:",
                                                theme.name,
                                            );
                                            setCurrentTheme(theme);
                                            setShowThemeSelector(false);
                                        }}
                                        title={theme.name}
                                        style={{
                                            backgroundColor:
                                                currentTheme.id === theme.id
                                                    ? currentTheme.surface
                                                    : "transparent",
                                            borderColor:
                                                currentTheme.id === theme.id
                                                    ? currentTheme.primary
                                                    : "transparent",
                                        }}
                                    >
                                        <div
                                            className="theme-preview"
                                            style={{
                                                background: theme.primary,
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Main sections */}
                <div className="lynx-navbar-content">
                    {renderSection(dataTools)}
                    <div
                        className="lynx-navbar-separator"
                        style={{
                            background: currentTheme.textSecondary,
                            opacity: 0.3,
                        }}
                    />
                    {renderSection(quickActions)}
                    <div
                        className="lynx-navbar-separator"
                        style={{
                            background: currentTheme.textSecondary,
                            opacity: 0.3,
                        }}
                    />
                    {renderSection(otherTools)}
                </div>

                {/* User Avatar */}
                <div className="lynx-navbar-footer">
                    <div
                        className="lynx-user-avatar"
                        title={user?.displayName || user?.email || "User"}
                        style={{
                            color: currentTheme.text,
                        }}
                    >
                        {user?.displayName?.[0] || user?.email?.[0] || "U"}
                    </div>
                </div>
            </div>

            <style>{`
                * {
                    color: inherit !important;
                }

                .lynx-hover-navbar {
                    position: fixed;
                    top: 0;
                    left: 0;
                    height: 100vh;
                    z-index: 10000000;
                    pointer-events: none;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
                }

                .lynx-hover-trigger {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 20px;
                    height: 100vh;
                    background: transparent;
                    pointer-events: auto;
                    cursor: pointer;
                }

                .lynx-navbar-container {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 52px;
                    height: 100vh;
                    transform: translateX(-100%);
                    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
                    pointer-events: auto;
                    display: flex;
                    flex-direction: column;
                    overflow: visible;
                    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.3);
                    padding: 16px 0;
                    opacity: 1;
                }

                .lynx-navbar-container.visible {
                    transform: translateX(0);
                }

                .theme-controls {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    margin-bottom: 12px;
                    position: relative;
                }

                .theme-toggle {
                    width: 32px;
                    height: 32px;
                    border: none;
                    background: transparent;
                    border-radius: 12px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 1;
                    transition: background 0.2s, transform 0.2s;
                }

                .theme-toggle:hover {
                    background: rgba(255, 255, 255, 0.1);
                    transform: scale(1.05);
                }

                .theme-selector {
                    position: absolute;
                    top: 0;
                    left: 56px;
                    border: 1px solid;
                    border-radius: 16px;
                    padding: 12px;
                    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.4);
                    z-index: 10001;
                    animation: slideIn 0.24s cubic-bezier(0.25, 0.8, 0.25, 1);
                    overflow: visible;
                    white-space: nowrap;
                    opacity: 1;
                }

                .theme-grid {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                    width: 104px;
                }

                .theme-option {
                    width: 40px;
                    height: 40px;
                    border-radius: 12px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: transparent;
                    border: 2px solid transparent;
                    transition: border 0.2s, transform 0.2s;
                    opacity: 1;
                }

                .theme-option:hover {
                    transform: scale(1.08);
                    border-color: rgba(255, 255, 255, 0.12);
                }

                .theme-preview {
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
                    opacity: 1;
                }

                .lynx-navbar-content {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    width: 100%;
                    align-items: center;
                    flex: 1;
                }

                .lynx-navbar-section {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                }

                .lynx-navbar-separator {
                    width: 20px;
                    height: 1px;
                    align-self: center;
                    margin: 12px 0;
                    opacity: 1;
                }

                .lynx-nav-item {
                    width: 36px;
                    height: 36px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    background: transparent;
                    border: none;
                    transition: all 0.2s ease;
                    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
                    opacity: 1;
                }

                .lynx-nav-item:hover {
                    background: rgba(255, 255, 255, 0.1);
                    transform: scale(1.05);
                    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4));
                    opacity: 1;
                }

                .lynx-nav-item:active {
                    transform: scale(0.98);
                }

                .lynx-nav-item svg {
                    transition: transform 0.15s ease;
                    stroke-width: 1.5;
                    opacity: 1;
                }

                .lynx-nav-item:hover svg {
                    transform: scale(1.1);
                    opacity: 1;
                }

                .lynx-navbar-footer {
                    margin-top: auto;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 100%;
                    padding-top: 16px;
                }

                .lynx-user-avatar {
                    width: 32px;
                    height: 32px;
                    border-radius: 8px;
                    background: linear-gradient(145deg, #3b82f6, #1d4ed8);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 600;
                    font-size: 12px;
                    transition: all 0.2s ease;
                    cursor: pointer;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                    opacity: 1;
                }

                .lynx-user-avatar:hover {
                    transform: scale(1.05);
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
                    opacity: 1;
                }

                /* Hover indicator */
                .lynx-hover-navbar::before {
                    content: '';
                    position: absolute;
                    top: 50%;
                    left: 1px;
                    width: 2px;
                    height: 30px;
                    background: linear-gradient(to bottom, transparent, #3b82f6, transparent);
                    border-radius: 1px;
                    transform: translateY(-50%);
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }

                .lynx-hover-navbar:hover::before {
                    opacity: 1;
                }

                @keyframes slideIn {
                    from { 
                        opacity: 0; 
                        transform: translateX(-8px) scale(0.96); 
                    }
                    to { 
                        opacity: 1; 
                        transform: translateX(0) scale(1); 
                    }
                }

                @media (max-width: 768px) {
                    .lynx-navbar-container {
                        width: 48px;
                    }
                    
                    .lynx-nav-item {
                        width: 32px;
                        height: 32px;
                    }
                    
                    .lynx-user-avatar {
                        width: 28px;
                        height: 28px;
                        font-size: 10px;
                    }
                }
            `}</style>
        </div>
    );
};

export default HoverNavbar;
