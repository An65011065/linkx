import React, { useState, useEffect } from "react"; // Adjust path as needed
import ThemeAwareSphereIcon from "./ThemeAwareSphereIcon";

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
import { useTheme } from "../hooks/useTheme";

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
    alwaysVisible?: boolean;
}

interface AuthUser {
    uid: string;
    email: string;
    displayName: string | null;
    photoURL: string | null;
    plan?: {
        type: string;
        status: string;
    };
}

const HoverNavbar: React.FC<HoverNavbarProps> = ({
    onClose,
    alwaysVisible = false,
}) => {
    // Use global theme instead of local state
    const { theme: currentTheme } = useTheme();

    const [user, setUser] = useState<AuthUser | null>(null);
    const [isVisible, setIsVisible] = useState(alwaysVisible);
    const [hoveredItem, setHoveredItem] = useState<string | null>(null);
    const [showProfileSelector, setShowProfileSelector] = useState(false);

    // Debug theme changes
    useEffect(() => {
        console.log(
            "🎨 HoverNavbar theme changed to:",
            currentTheme?.name,
            currentTheme,
        );
    }, [currentTheme]);

    useEffect(() => {
        console.log("🔍 HoverNavbar: Component mounted, setting up user...");

        const dummyUser = {
            uid: "temp-user-123",
            email: "test@lyncx.com",
            displayName: "Test User",
            photoURL: null,
            plan: {
                type: "Pro",
                status: "active",
            },
        };

        setUser(dummyUser);
        console.log("✅ HoverNavbar: Dummy user set");
    }, []);

    const handleAnalytics = () => {
        console.log("🔍 Analytics button clicked - starting debug trace");
        console.log(
            "🔍 Chrome runtime available:",
            typeof chrome !== "undefined" && !!chrome.runtime,
        );

        if (typeof chrome !== "undefined" && chrome.runtime) {
            console.log("🔍 Sending SHOW_ANALYTICS message...");

            chrome.runtime.sendMessage(
                { type: "SHOW_ANALYTICS" },
                (response) => {
                    console.log("📊 Analytics response received:", response);
                    console.log(
                        "📊 Chrome runtime error:",
                        chrome.runtime.lastError,
                    );

                    if (response) {
                        if (response.success) {
                            console.log(
                                "✅ Analytics modal should be showing now",
                            );
                        } else {
                            console.error(
                                "❌ Analytics failed:",
                                response.error,
                            );
                        }
                    } else {
                        console.error(
                            "❌ No response received from analytics injector",
                        );
                    }
                },
            );

            console.log("🔍 Message sent, waiting for response...");
        } else {
            console.error("❌ Chrome runtime not available");
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

    const handleSearch = () => {
        if (typeof chrome !== "undefined" && chrome.runtime) {
            chrome.runtime.sendMessage({ type: "SHOW_SPOTLIGHT_SEARCH" });
        }
    };
    const handleBookmark = () => {};

    const handleExplore = () => {
        if (typeof chrome !== "undefined" && chrome.runtime) {
            chrome.runtime.sendMessage({ type: "SHOW_EXPLORE_MODAL" });
        }
    };

    const handleTimer = () => {
        if (typeof chrome !== "undefined" && chrome.runtime) {
            chrome.runtime.sendMessage({ type: "SHOW_TIMER" });
        }
    };
    const handleSettings = () => {
        if (typeof chrome !== "undefined" && chrome.runtime) {
            chrome.runtime.sendMessage({ type: "OPEN_SETTINGS_PAGE" });
        }
    };
    const handleUpgradePlan = () => {
        if (typeof chrome !== "undefined" && chrome.runtime) {
            chrome.runtime.sendMessage({ type: "SHOW_UPGRADE_PLAN" });
        }
    };
    const handleLearnMore = () => {
        if (typeof chrome !== "undefined" && chrome.runtime) {
            chrome.runtime.sendMessage({ type: "SHOW_LEARN_MORE" });
        }
    };

    // Theme change handler using ThemeService
    const handleThemeChange = async (theme: any) => {
        console.log("🎨 Theme change requested:", theme.name);
        await updateTheme(theme);
        setShowThemeSelector(false);
    };

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
            id: "explore",
            icon: ThemeAwareSphereIcon,
            label: "Explore",
            action: handleExplore,
        },
        {
            id: "notepad",
            icon: FileText,
            label: "Notes",
            action: handleNotepad,
        },
    ];

    // Section 3: Other Tools
    const otherTools = [
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
    ];

    const renderNavItem = (item: NavItem) => {
        const Icon = item.icon;

        return (
            <div
                key={item.id}
                className="lynx-nav-item"
                onClick={item.action}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
            >
                {item.isCustomIcon ? (
                    // Theme-aware custom icon - no manual theme props needed
                    <Icon size={18} />
                ) : (
                    // Standard Lucide icon
                    <Icon
                        color={currentTheme?.text}
                        size={18}
                        strokeWidth={2}
                    />
                )}
                {hoveredItem === item.id && (
                    <div
                        className="nav-tooltip"
                        style={{
                            backgroundColor: currentTheme?.background,
                            color: currentTheme?.text,
                            borderColor: currentTheme?.surface,
                        }}
                    >
                        {item.label}
                    </div>
                )}
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

    console.log("✅ HoverNavbar: Rendering with theme:", currentTheme?.name);

    return (
        <div
            className="lynx-hover-navbar"
            onClick={(e) => {
                // Close selectors when clicking outside
                if (e.target === e.currentTarget) {
                    setShowProfileSelector(false);
                }
            }}
        >
            {/* Hover trigger area - only show if not always visible */}
            {!alwaysVisible && (
                <div
                    className="lynx-hover-trigger"
                    onMouseEnter={() => setIsVisible(true)}
                    onMouseLeave={() => {
                        // Don't hide if selectors are open
                        if (!showProfileSelector) {
                            setIsVisible(false);
                        }
                    }}
                />
            )}

            {/* Main navbar - always rendered but visibility controlled by CSS */}
            <div
                className={`lynx-navbar-container ${
                    isVisible || showProfileSelector || alwaysVisible
                        ? "visible"
                        : ""
                }`}
                onMouseEnter={() => !alwaysVisible && setIsVisible(true)}
                onMouseLeave={() => {
                    // Don't hide if selectors are open or if always visible
                    if (!alwaysVisible && !showProfileSelector) {
                        setIsVisible(false);
                    }
                }}
                style={{
                    background: currentTheme?.background,
                    borderRightColor: currentTheme?.surface,
                }}
            >
                {/* Main sections */}
                <div className="lynx-navbar-content">
                    {renderSection(dataTools)}
                    <div
                        className="lynx-navbar-separator"
                        style={{
                            background: currentTheme?.textSecondary,
                            opacity: 0.3,
                        }}
                    />
                    {renderSection(quickActions)}
                    <div
                        className="lynx-navbar-separator"
                        style={{
                            background: currentTheme?.textSecondary,
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
                        onClick={() =>
                            setShowProfileSelector(!showProfileSelector)
                        }
                        style={{
                            color: currentTheme?.text,
                        }}
                    >
                        {user?.displayName?.[0] || user?.email?.[0] || "U"}
                    </div>

                    {/* Profile Selector */}
                    {showProfileSelector && (
                        <div
                            className="profile-selector"
                            style={{
                                background: currentTheme?.background,
                                borderColor: currentTheme?.surface,
                            }}
                        >
                            {/* Email and Plan Section */}
                            <div className="profile-info-section">
                                <div
                                    className="profile-email"
                                    style={{ color: currentTheme?.text }}
                                >
                                    {user?.email}
                                </div>
                                <div
                                    className="profile-plan"
                                    style={{
                                        color: currentTheme?.textSecondary,
                                    }}
                                >
                                    {user?.plan?.type || "Free"} Plan
                                </div>
                            </div>

                            {/* Separator */}
                            <div
                                className="profile-separator"
                                style={{
                                    backgroundColor: currentTheme?.surface,
                                }}
                            />

                            {/* Actions Section */}
                            <div className="profile-actions-section">
                                <div
                                    className="profile-action"
                                    onClick={() => {
                                        setShowProfileSelector(false);
                                        handleLearnMore();
                                    }}
                                    style={{ color: currentTheme?.text }}
                                >
                                    Learn More
                                </div>
                                <div
                                    className="profile-action"
                                    onClick={() => {
                                        setShowProfileSelector(false);
                                        handleSettings();
                                    }}
                                    style={{ color: currentTheme?.text }}
                                >
                                    Settings
                                </div>
                                <div
                                    className="profile-action upgrade"
                                    onClick={() => {
                                        setShowProfileSelector(false);
                                        handleUpgradePlan();
                                    }}
                                    style={{ color: currentTheme?.primary }}
                                >
                                    Upgrade Plan
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
                    top: 50%;
                    left: 0;
                    width: 52px;
                    height: auto;
                    max-height: 80vh;
                    transform: translateX(-100%) translateY(-50%);
                    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
                    pointer-events: auto;
                    display: flex;
                    flex-direction: column;
                    overflow: visible;
                    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.3);
                    padding: 16px 0;
                    opacity: 1;
                    border-radius: 0 12px 12px 0;
                }

                .lynx-navbar-container.visible {
                    transform: translateX(0) translateY(-50%);
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
                    position: relative;
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

                .nav-tooltip {
                    position: absolute !important;
                    left: 50px !important;
                    top: 50% !important;
                    transform: translateY(-50%) !important;
                    padding: 6px 10px !important;
                    border-radius: 6px !important;
                    font-size: 12px !important;
                    font-weight: 500 !important;
                    white-space: nowrap !important;
                    z-index: 10002 !important;
                    animation: tooltipSlide 0.15s ease-out !important;
                    pointer-events: none !important;
                    border: 0.25px solid !important;              
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif !important;
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
                    position: relative;
                }

                .lynx-user-avatar:hover {
                    transform: scale(1.05);
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
                    opacity: 1;
                }

                .profile-selector {
                    position: absolute;
                    bottom: 0;
                    left: 56px;
                    min-width: 200px;
                    border: 1px solid;
                    border-radius: 12px;
                    padding: 0;
                    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.4);
                    z-index: 10001;
                    animation: slideIn 0.24s cubic-bezier(0.25, 0.8, 0.25, 1);
                    overflow: hidden;
                }

                .profile-info-section {
                    padding: 12px 16px;
                }

                .profile-email {
                    font-size: 14px;
                    font-weight: 500;
                    margin-bottom: 2px;
                    word-break: break-all;
                }

                .profile-plan {
                    font-size: 12px;
                    opacity: 0.8;
                }

                .profile-separator {
                    height: 1px;
                    width: 100%;
                }

                .profile-actions-section {
                    padding: 4px 0;
                }

                .profile-action {
                    padding: 10px 16px;
                    font-size: 14px;
                    cursor: pointer;
                    transition: background 0.2s ease;
                    font-weight: 500;
                }

                .profile-action:hover {
                    background: rgba(255, 255, 255, 0.05);
                }

                .profile-action.upgrade {
                    font-weight: 600;
                }

                .profile-action:onClick {
                    background: rgba(255, 255, 255, 0.1);
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

                @keyframes tooltipSlide {
                    from {
                        opacity: 0;
                        transform: translateY(-50%) translateX(-4px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(-50%) translateX(0);
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
