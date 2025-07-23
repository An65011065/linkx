import React, { useState } from "react";
import {
    Camera,
    FileText,
    Search,
    Timer,
    BarChart3,
    Shield,
    Calendar,
    CircleDot,
    MessageCircle,
    Settings,
    CreditCard,
    LogOut,
    Clipboard,
} from "lucide-react";

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

interface NavItem {
    id: string;
    icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
    label: string;
    action: () => void;
}

const themes: Theme[] = [
    {
        id: "mono",
        name: "Mono",
        primary: "rgb(255, 255, 255)",
        secondary: "rgb(229, 231, 235)",
        accent: "rgb(243, 244, 246)",
        background: "rgba(0, 0, 0, 0.95)",
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

const HoverNavbar = () => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [currentTheme, setCurrentTheme] = useState<Theme>(themes[4]); // Default to cream
    const [showThemeSelector, setShowThemeSelector] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);

    const showNavbar = () => {
        setIsVisible(true);
    };

    const hideNavbar = () => {
        if (showThemeSelector || showUserMenu) {
            return;
        }
        setIsVisible(false);
    };

    // Set dummy user for demo after component mounts
    React.useEffect(() => {
        const dummyUser = {
            uid: "temp-user-123",
            email: "john.doe@lyncx.com",
            displayName: "John Doe",
            photoURL: null,
        };
        setUser(dummyUser);
    }, []);

    const handleSettings = () => {
        // Send message to background script to open settings page
        if (typeof chrome !== "undefined" && chrome.runtime) {
            chrome.runtime.sendMessage({
                type: "OPEN_SETTINGS_PAGE",
            });
        }
        setShowUserMenu(false);
    };

    const handleViewPlans = () => {
        console.log("Open view plans");
        setShowUserMenu(false);
    };

    const handleLogout = () => {
        console.log("Logout user");
        setShowUserMenu(false);
    };

    // Fixed handlers that actually open modals
    const handleScreenshot = () => {
        if (typeof chrome !== "undefined" && chrome.runtime) {
            chrome.runtime.sendMessage({
                type: "CAPTURE_SCREENSHOT",
            });
        }
    };

    const handleAnalytics = () => {
        if (typeof chrome !== "undefined" && chrome.runtime) {
            chrome.runtime.sendMessage({
                type: "SHOW_ANALYTICS",
            });
        }
    };

    const handleFlow = () => {
        if (typeof chrome !== "undefined" && chrome.runtime) {
            chrome.runtime.sendMessage({
                type: "SHOW_FLOW_MODAL",
            });
        }
    };

    const handleSearch = () => {
        if (typeof chrome !== "undefined" && chrome.runtime) {
            chrome.runtime.sendMessage({
                type: "SHOW_SPOTLIGHT_SEARCH",
            });
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

    const handleChat = () => {
        if (typeof chrome !== "undefined" && chrome.runtime) {
            chrome.runtime.sendMessage({
                type: "SHOW_SEARCH_MODAL",
            });
        }
    };

    const handleTimer = () => {
        if (typeof chrome !== "undefined" && chrome.runtime) {
            chrome.runtime.sendMessage({
                type: "SHOW_TIMER",
            });
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

    // NEW: Handle clipboard - following your existing pattern
    const handleClipboard = () => {
        if (typeof chrome !== "undefined" && chrome.runtime) {
            chrome.runtime.sendMessage({
                type: "SHOW_CLIPBOARD_MANAGER",
                domain: window.location.hostname.replace(/^www\./, ""),
            });
        }
    };

    const dataTools: NavItem[] = [
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
        { id: "flow", icon: Calendar, label: "Flow", action: handleFlow },
    ];

    const quickActions: NavItem[] = [
        { id: "search", icon: Search, label: "Search", action: handleSearch },
        {
            id: "notepad",
            icon: FileText,
            label: "Notes",
            action: handleNotepad,
        },
        { id: "chat", icon: MessageCircle, label: "Chat", action: handleChat },
        {
            id: "clipboard",
            icon: Clipboard,
            label: "Clipboard",
            action: handleClipboard,
        }, // NEW
    ];

    const otherTools: NavItem[] = [
        { id: "timer", icon: Timer, label: "Timer", action: handleTimer },
        {
            id: "limits",
            icon: Shield,
            label: "Daily Limits",
            action: handleLimits,
        },
    ];

    const renderNavItem = (item: NavItem) => {
        const Icon = item.icon;
        return (
            <div key={item.id} className="lynx-nav-item" onClick={item.action}>
                <Icon size={22} strokeWidth={2} />
                <div className="lynx-tooltip">{item.label}</div>
            </div>
        );
    };

    const renderSection = (items: NavItem[]) => (
        <div className="lynx-navbar-section">
            <div className="section-items">{items.map(renderNavItem)}</div>
        </div>
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
                        onClick={() => {
                            setShowThemeSelector(!showThemeSelector);
                            setShowUserMenu(false);
                        }}
                    >
                        <CircleDot size={12} strokeWidth={2} />
                        <div className="lynx-tooltip">Change theme</div>
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
                    {renderSection(dataTools)}
                    <div className="lynx-navbar-separator" />
                    {renderSection(quickActions)}
                    <div className="lynx-navbar-separator" />
                    {renderSection(otherTools)}
                </div>

                {/* User Avatar */}
                <div className="lynx-navbar-footer">
                    <div
                        className="lynx-user-avatar"
                        onClick={() => {
                            setShowUserMenu(!showUserMenu);
                            setShowThemeSelector(false);
                        }}
                    >
                        {user?.displayName?.[0] || user?.email?.[0] || "U"}
                        <div className="lynx-tooltip">
                            {user?.displayName || user?.email || "User"}
                        </div>
                    </div>

                    {/* User Menu */}
                    {showUserMenu && user && (
                        <div className="user-menu">
                            <div className="user-menu-header">
                                <div className="user-avatar-large">
                                    {user.displayName?.[0] ||
                                        user.email?.[0] ||
                                        "U"}
                                </div>
                                <div className="user-info">
                                    <div className="user-name">
                                        {user.displayName || "User"}
                                    </div>
                                    <div className="user-email">
                                        {user.email}
                                    </div>
                                </div>
                            </div>

                            <div className="user-menu-separator" />

                            <div className="user-menu-items">
                                <div
                                    className="user-menu-item"
                                    onClick={handleSettings}
                                >
                                    <Settings size={16} strokeWidth={2} />
                                    <span>Settings</span>
                                </div>
                                <div
                                    className="user-menu-item"
                                    onClick={handleViewPlans}
                                >
                                    <CreditCard size={16} strokeWidth={2} />
                                    <span>View Plans</span>
                                </div>
                            </div>

                            <div className="user-menu-separator" />

                            <div className="user-menu-items">
                                <div
                                    className="user-menu-item logout"
                                    onClick={handleLogout}
                                >
                                    <LogOut size={16} strokeWidth={2} />
                                    <span>Logout</span>
                                </div>
                            </div>
                        </div>
                    )}
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
                    overflow: visible;
                    position: fixed;
                    top: 50%;
                    left: 1px;
                    transform: translateY(-50%) translateX(-60px) scale(0.96);
                    width: 48px;
                    max-height: calc(100vh - 40px);
                    background: var(--background);
                    backdrop-filter: blur(24px);
                    -webkit-backdrop-filter: blur(24px);
                    border: 1px solid rgba(0, 0, 0, 0.04);
                    border-radius: 18px;
                    
                    box-shadow: 0 12px 40px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.02);
                    opacity: 0;
                    transition: all 0.32s cubic-bezier(0.25, 0.8, 0.25, 1);
                    pointer-events: none;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 12px 0;
                }

                .lynx-navbar-container.visible {
                    opacity: 1;
                    transform: translateY(-50%) translateX(0) scale(1);
                    pointer-events: all;
                }

                .theme-controls {
                    overflow: visible;
                    position: relative;
                    z-index: 10000002;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    margin-bottom: 12px;
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
                    position: relative;
                    overflow: visible;
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
                    z-index: 10000004;
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
                    gap: 16px;
                    width: 100%;
                    align-items: center;
                    flex: 1;
                    overflow: visible;
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
                    margin: 8px 0;
                }

                .section-items {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    align-items: center;
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
                    position: relative;
                    overflow: visible;
                }

                .lynx-nav-item:hover {
                    background: var(--surface);
                    opacity: 1;
                    transform: scale(1.08);
                }

                .lynx-nav-item:active {
                    transform: scale(0.95);
                }

                .lynx-navbar-footer {
                    margin-top: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 100%;
                    position: relative;
                    overflow: visible;
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
                    position: relative;
                    cursor: pointer;
                    overflow: visible;
                }

                .lynx-user-avatar:hover {
                    background: var(--primary);
                    color: white;
                    opacity: 1;
                    transform: scale(1.05);
                }

                /* User Menu Styles */
                .user-menu {
                    position: absolute;
                    bottom: 0;
                    left: 56px;
                    background: var(--background);
                    backdrop-filter: blur(24px);
                    -webkit-backdrop-filter: blur(24px);
                    border: 1px solid rgba(0,0,0,0.04);
                    border-radius: 16px;
                    box-shadow: 0 16px 48px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.04);
                    z-index: 10000004;
                    animation: slideIn 0.24s cubic-bezier(0.25, 0.8, 0.25, 1);
                    min-width: 220px;
                    overflow: hidden;
                }

                .user-menu-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 16px;
                    background: var(--surface);
                }

                .user-avatar-large {
                    width: 40px;
                    height: 40px;
                    border-radius: 12px;
                    background: var(--primary);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    color: white;
                    font-size: 16px;
                    flex-shrink: 0;
                }

                .user-info {
                    flex: 1;
                    min-width: 0;
                }

                .user-name {
                    font-weight: 600;
                    font-size: 14px;
                    color: var(--text);
                    margin-bottom: 2px;
                    line-height: 1.2;
                }

                .user-email {
                    font-size: 12px;
                    color: var(--text-secondary);
                    opacity: 0.8;
                    line-height: 1.2;
                    word-break: break-all;
                }

                .user-menu-separator {
                    height: 1px;
                    background: var(--text-secondary);
                    opacity: 0.1;
                    margin: 0;
                }

                .user-menu-items {
                    padding: 8px;
                }

                .user-menu-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 10px 12px;
                    border-radius: 10px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    color: var(--text);
                    font-size: 14px;
                    font-weight: 500;
                }

                .user-menu-item:hover {
                    background: var(--surface);
                    transform: scale(1.02);
                }

                .user-menu-item:active {
                    transform: scale(0.98);
                }

                .user-menu-item.logout {
                    color: #ef4444;
                }

                .user-menu-item.logout:hover {
                    background: rgba(239, 68, 68, 0.1);
                }

                /* Tooltip Styles */
                .lynx-tooltip {
                    position: absolute;
                    left: 52px;
                    top: 50%;
                    transform: translateY(-50%) translateX(-8px);
                    background: var(--background);
                    color: var(--text);
                    padding: 8px 12px;
                    border-radius: 8px;
                    font-size: 12px;
                    font-weight: 500;
                    white-space: nowrap;
                    box-shadow: 0 8px 24px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.04);
                    border: 1px solid rgba(0,0,0,0.04);
                    opacity: 0;
                    visibility: hidden;
                    pointer-events: none;
                    transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
                    z-index: 10000005;
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                }

                .lynx-tooltip::before {
                    content: '';
                    position: absolute;
                    right: 100%;
                    top: 50%;
                    transform: translateY(-50%);
                    border: 6px solid transparent;
                    border-right-color: var(--background);
                    filter: drop-shadow(-1px 0 0 rgba(0,0,0,0.04));
                }

                .lynx-nav-item:hover .lynx-tooltip,
                .theme-toggle:hover .lynx-tooltip,
                .lynx-user-avatar:hover .lynx-tooltip {
                    opacity: 1;
                    visibility: visible;
                    transform: translateY(-50%) translateX(0);
                }

                @keyframes slideIn {
                    from { opacity: 0; transform: translateX(-8px) scale(0.96); }
                    to { opacity: 1; transform: translateX(0) scale(1); }
                }
            `}</style>
        </div>
    );
};

export default HoverNavbar;
