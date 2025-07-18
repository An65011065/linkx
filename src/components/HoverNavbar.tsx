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
        background: "rgba(15, 23, 42, 0.95)",
        surface: "rgba(255, 255, 255, 0.08)",
        text: "rgb(248, 250, 252)",
        textSecondary: "rgb(226, 232, 240)",
    },
    {
        id: "rose",
        name: "Rose",
        primary: "rgb(225, 29, 72)",
        secondary: "rgb(244, 63, 94)",
        accent: "rgb(190, 18, 60)",
        background: "rgba(15, 23, 42, 0.95)",
        surface: "rgba(225, 29, 72, 0.04)",
        text: "rgb(159, 18, 57)",
        textSecondary: "rgb(225, 29, 72)",
    },
    {
        id: "amber",
        name: "Amber",
        primary: "rgb(245, 158, 11)",
        secondary: "rgb(251, 191, 36)",
        accent: "rgb(217, 119, 6)",
        background: "rgba(15, 23, 42, 0.95)",
        surface: "rgba(245, 158, 11, 0.04)",
        text: "rgb(146, 64, 14)",
        textSecondary: "rgb(245, 158, 11)",
    },
    {
        id: "pearl",
        name: "Pearl",
        primary: "rgb(71, 85, 105)",
        secondary: "rgb(100, 116, 139)",
        accent: "rgb(0, 0, 0)",
        background: "rgba(248, 250, 252, 0.95)",
        surface: "rgba(71, 85, 105, 0.06)",
        text: "rgb(15, 23, 42)",
        textSecondary: "rgb(71, 85, 105)",
    },
    {
        id: "cream",
        name: "Cream",
        primary: "rgb(120, 53, 15)",
        secondary: "rgb(146, 64, 14)",
        accent: "rgb(92, 38, 4)",
        background: "rgba(254, 252, 232, 0.95)",
        surface: "rgba(120, 53, 15, 0.06)",
        text: "rgb(92, 38, 4)",
        textSecondary: "rgb(120, 53, 15)",
    },
    {
        id: "sage",
        name: "Sage",
        primary: "rgb(22, 101, 52)",
        secondary: "rgb(34, 134, 58)",
        accent: "rgb(20, 83, 45)",
        background: "rgba(247, 254, 231, 0.95)",
        surface: "rgba(22, 101, 52, 0.06)",
        text: "rgb(20, 83, 45)",
        textSecondary: "rgb(22, 101, 52)",
    },
    {
        id: "lavender",
        name: "Lavender",
        primary: "rgb(107, 33, 168)",
        secondary: "rgb(126, 34, 206)",
        accent: "rgb(88, 28, 135)",
        background: "rgba(250, 245, 255, 0.95)",
        surface: "rgba(107, 33, 168, 0.06)",
        text: "rgb(88, 28, 135)",
        textSecondary: "rgb(107, 33, 168)",
    },
];

const HoverNavbar: React.FC<HoverNavbarProps> = () => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [currentTheme, setCurrentTheme] = useState<Theme>(themes[5]); // Default to cream
    const [showThemeSelector, setShowThemeSelector] = useState(false);

    const showNavbar = () => {
        setIsVisible(true);
    };

    const hideNavbar = () => {
        setIsVisible(false);
        setShowThemeSelector(false);
    };

    useEffect(() => {
        console.log("🔍 HoverNavbar: Forcing navbar to show for testing...");

        // FORCE the navbar to show with a dummy user
        const dummyUser = {
            uid: "temp-user-123",
            email: "test@lyncx.com",
            displayName: "Test User",
            photoURL: null,
        };

        setUser(dummyUser);

        console.log("✅ HoverNavbar: Dummy user set, navbar should show");

        // Listen for auth state changes (if needed in the future)
        // const messageListener = (message: { type: string; user?: AuthUser | null; }) => {
        //     if (message.type === "AUTH_STATE_CHANGED") {
        //         setUser(message.user || dummyUser);
        //     }
        // };

        return () => {
            // Cleanup if needed
        };
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
    const handleScreenshot = () => {};
    const handleReminders = () => {};
    const handleSearch = () => {};
    const handleBookmark = () => {};
    const handleTimer = () => {};
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
                <Icon size={22} strokeWidth={22} />
            </div>
        );
    };

    const renderSection = (
        title: string,
        items: Array<{
            id: string;
            icon: React.ComponentType<LucideIconProps>;
            label: string;
            action: () => void;
        }>,
    ) => (
        <div className="lynx-navbar-section">
            <div className="section-title">{title}</div>
            <div className="section-items">{items.map(renderNavItem)}</div>
        </div>
    );

    console.log(
        "✅ HoverNavbar: Rendering navbar with user:",
        user?.email || "no user",
    );

    return (
        <div
            className="lynx-hover-navbar"
            style={
                {
                    "--primary": currentTheme.primary,
                    "--secondary": currentTheme.secondary,
                    "--accent": currentTheme.accent,
                    "--background": currentTheme.background,
                    "--surface": currentTheme.surface,
                    "--text": currentTheme.text,
                    "--text-secondary": currentTheme.textSecondary,
                } as React.CSSProperties
            }
        >
            <div className="lynx-hover-trigger" onMouseEnter={showNavbar} />

            <div
                className={`lynx-navbar-container ${
                    isVisible ? "visible" : ""
                }`}
                onMouseEnter={showNavbar}
                onMouseLeave={hideNavbar}
            >
                {/* Theme selector */}
                <div className="theme-controls">
                    <div
                        className="theme-toggle"
                        onClick={() => setShowThemeSelector(!showThemeSelector)}
                        title="Change theme"
                    >
                        <CircleDot size={12} strokeWidth={2} />
                    </div>
                    {showThemeSelector && (
                        <div className="theme-selector">
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
                                            setCurrentTheme(theme);
                                            setShowThemeSelector(false);
                                        }}
                                        title={theme.name}
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
                    {renderSection("", dataTools)}
                    <div className="lynx-navbar-separator" />
                    {renderSection("", quickActions)}
                    <div className="lynx-navbar-separator" />
                    {renderSection("", otherTools)}
                </div>

                {/* User Avatar */}
                <div className="lynx-navbar-footer">
                    <div
                        className="lynx-user-avatar"
                        title={user?.displayName || user?.email || "User"}
                    >
                        {user?.displayName?.[0] || user?.email?.[0] || "U"}
                    </div>
                </div>
            </div>

            <style>{`
                .lynx-hover-navbar {
                    position: fixed;
                    top: 0;
                    left: 0;
                    z-index: 10000000;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
                }

                .lynx-hover-trigger {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 20px;
                    height: 100vh;
                    background: transparent;
                    z-index: 10000001;
                }

                .lynx-navbar-container {
                    position: fixed;
                    top: 20px;
                    left: 20px;
                    width: 48px;
                    background: var(--background);
                    backdrop-filter: blur(24px);
                    -webkit-backdrop-filter: blur(24px);
                    border: 1px solid rgba(0, 0, 0, 0.04);
                    border-radius: 18px;
                    box-shadow: 0 12px 40px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.02);
                    opacity: 0;
                    transform: translateX(-60px) scale(0.96);
                    transition: all 0.32s cubic-bezier(0.25, 0.8, 0.25, 1);
                    pointer-events: none;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 12px 0;
                }
                .lynx-navbar-container.visible {
                    opacity: 1;
                    transform: translateX(0) scale(1);
                    pointer-events: all;
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
                    color: var(--text-secondary);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0.7;
                    transition: background 0.2s, opacity 0.2s, transform 0.2s;
                }
                .theme-toggle:hover {
                    background: var(--surface);
                    opacity: 1;
                    transform: scale(1.05);
                }
                .theme-selector {
                    position: absolute;
                    top: 0;
                    left: 56px;
                    background: var(--background);
                    backdrop-filter: blur(24px);
                    -webkit-backdrop-filter: blur(24px);
                    border: 1px solid rgba(0,0,0,0.04);
                    border-radius: 16px;
                    padding: 12px;
                    box-shadow: 0 16px 48px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.04);
                    z-index: 10;
                    animation: slideIn 0.24s cubic-bezier(0.25, 0.8, 0.25, 1);
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
                }
                .theme-option:hover {
                    transform: scale(1.08);
                    border-color: rgba(0,0,0,0.08);
                }
                .theme-option.active {
                    border-color: var(--primary);
                    background: var(--surface);
                }
                .theme-preview {
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.12);
                }

                .lynx-navbar-content {
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                    width: 100%;
                    align-items: center;
                    flex: 1;
                }
                .lynx-navbar-section {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 4px;
                }
                .lynx-navbar-separator {
                    width: 20px;
                    height: 1px;
                    background: var(--text-secondary);
                    opacity: 0.15;
                    align-self: center;
                    margin: 16px 0;
                }
                .section-items {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    align-items: center;
                }
                .section-title {
                    display: none;
                }
                .lynx-nav-item {
                    width: 36px;
                    height: 36px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    color: var(--text-secondary);
                    opacity: 0.7;
                    background: transparent;
                    border: none;
                    transition: background 0.2s, opacity 0.2s, transform 0.2s;
                }
                .lynx-nav-item:hover {
                    background: var(--surface);
                    opacity: 1;
                    transform: scale(1.08);
                }
                .lynx-nav-item:active {
                    transform: scale(1.5);
                }
                .lynx-navbar-footer {
                    margin-top: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 100%;
                }
                .lynx-user-avatar {
                    width: 32px;
                    height: 32px;
                    border-radius: 12px;
                    background: var(--surface);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 600;
                    color: var(--text-secondary);
                    font-size: 11px;
                    opacity: 0.7;
                    transition: background 0.2s, color 0.2s, opacity 0.2s, transform 0.2s;
                }
                .lynx-user-avatar:hover {
                    background: var(--primary);
                    color: white;
                    opacity: 1;
                    transform: scale(1.05);
                }
                @keyframes pulse {
                    0%, 100% { opacity: 0.4; }
                    50% { opacity: 1; }
                }
                @keyframes slideIn {
                    from { opacity: 0; transform: translateX(-8px) scale(0.96); }
                    to { opacity: 1; transform: translateX(0) scale(1); }
                }
                @media (prefers-color-scheme: dark) {
                    .lynx-navbar-container {
                        border: 1px solid rgba(255,255,255,0.08);
                        box-shadow: 0 12px 40px rgba(0,0,0,0.24), 0 1px 2px rgba(0,0,0,0.12);
                    }
                    .theme-selector {
                        border: 1px solid rgba(255,255,255,0.08);
                        box-shadow: 0 16px 48px rgba(0,0,0,0.32), 0 2px 8px rgba(0,0,0,0.16);
                    }
                    .theme-option:hover {
                        border-color: rgba(255,255,255,0.12);
                    }
                }
            `}</style>
        </div>
    );
};

export default HoverNavbar;
