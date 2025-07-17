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
} from "lucide-react";
import type { AuthUser } from "../services/authService";

interface HoverNavbarProps {
    onClose?: () => void;
}

const HoverNavbar: React.FC<HoverNavbarProps> = () => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [activeAction, setActiveAction] = useState<string | null>(null);
    const [currentDomain, setCurrentDomain] = useState("");

    useEffect(() => {
        console.log("🔍 HoverNavbar: Checking auth state...");

        // Get auth state from background script since content scripts have limited chrome.storage access
        const getAuthState = async () => {
            try {
                const response = await chrome.runtime.sendMessage({
                    type: "GET_AUTH_STATE",
                });
                console.log("🔍 HoverNavbar: Auth state response:", response);

                if (response && response.user) {
                    console.log(
                        "✅ HoverNavbar: User is authenticated",
                        response.user,
                    );
                    setUser(response.user);
                } else {
                    console.log("❌ HoverNavbar: No authenticated user found");
                    setUser(null);
                }
            } catch (error) {
                console.error(
                    "❌ HoverNavbar: Failed to get auth state:",
                    error,
                );
                setUser(null);
            }
        };

        getAuthState();

        // Listen for auth state changes
        const messageListener = (message: {
            type: string;
            user?: AuthUser | null;
        }) => {
            if (message.type === "AUTH_STATE_CHANGED") {
                console.log(
                    "🔄 HoverNavbar: Auth state changed:",
                    message.user,
                );
                setUser(message.user || null);
            }
        };

        chrome.runtime.onMessage.addListener(messageListener);

        // Get current domain
        setCurrentDomain(window.location.hostname);

        return () => {
            chrome.runtime.onMessage.removeListener(messageListener);
        };
    }, []);

    const handleScreenshot = async () => {
        setActiveAction("screenshot");
        try {
            console.log("📸 HoverNavbar: Starting screenshot capture...");
            const response = await chrome.runtime.sendMessage({
                type: "CAPTURE_SCREENSHOT",
            });

            if (response && response.success) {
                console.log("✅ Screenshot captured successfully");
            } else {
                console.error(
                    "❌ Screenshot failed:",
                    response?.error || "Unknown error",
                );
            }
        } catch (error) {
            console.error("❌ Screenshot failed:", error);
        }
        setActiveAction(null);
    };

    const handleNotepad = () => {
        setActiveAction("notepad");
        chrome.runtime.sendMessage({
            type: "OPEN_NOTEPAD",
            domain: currentDomain,
        });
        setActiveAction(null);
    };

    const handleReminders = () => {
        setActiveAction("reminders");
        chrome.runtime.sendMessage({ type: "OPEN_REMINDERS" });
        setActiveAction(null);
    };

    const handleSearch = () => {
        setActiveAction("search");
        // Send message to show spotlight search
        chrome.runtime.sendMessage({ type: "SHOW_SPOTLIGHT_SEARCH" });
        setActiveAction(null);
    };

    const handleBookmark = () => {
        setActiveAction("bookmark");
        chrome.runtime.sendMessage({
            type: "TOGGLE_BOOKMARK",
            url: window.location.href,
        });
        setActiveAction(null);
    };

    const handleTimer = () => {
        setActiveAction("timer");
        chrome.runtime.sendMessage({ type: "OPEN_TIMER" });
        setActiveAction(null);
    };

    const handleSummarize = () => {
        setActiveAction("summarize");
        chrome.runtime.sendMessage({ type: "SUMMARIZE_PAGE" });
        setActiveAction(null);
    };

    const handleAnalytics = () => {
        setActiveAction("analytics");
        chrome.runtime.sendMessage({ type: "OPEN_ANALYTICS" });
        setActiveAction(null);
    };

    // Section 1: Data Tools (Primary actions)
    const dataTools = [
        {
            id: "screenshot",
            icon: Camera,
            label: "Screenshot",
            action: handleScreenshot,
            color: "#3b82f6",
        },
        {
            id: "analytics",
            icon: BarChart3,
            label: "Analytics",
            action: handleAnalytics,
            color: "#06b6d4",
        },
    ];

    // Section 2: Quick Actions (Current emoji set equivalent)
    const quickActions = [
        {
            id: "search",
            icon: Search,
            label: "Search",
            action: handleSearch,
            color: "#8b5cf6",
        },
        {
            id: "notepad",
            icon: FileText,
            label: "Notes",
            action: handleNotepad,
            color: "#10b981",
        },
        {
            id: "bookmark",
            icon: Bookmark,
            label: "Bookmark",
            action: handleBookmark,
            color: "#ef4444",
        },
    ];

    // Section 3: Other Tools (Secondary actions)
    const otherTools = [
        {
            id: "reminders",
            icon: Bell,
            label: "Reminders",
            action: handleReminders,
            color: "#f59e0b",
        },
        {
            id: "timer",
            icon: Timer,
            label: "Timer",
            action: handleTimer,
            color: "#06b6d4",
        },
        {
            id: "summarize",
            icon: Hash,
            label: "Summarize",
            action: handleSummarize,
            color: "#ec4899",
        },
    ];

    const renderNavItem = (item: {
        id: string;
        icon: React.ComponentType;
        label: string;
        action: () => void;
        color: string;
    }) => {
        const Icon = item.icon;
        const isActive = activeAction === item.id;

        return (
            <div
                key={item.id}
                className={`lynx-nav-item ${isActive ? "active" : ""}`}
                onClick={item.action}
                style={
                    {
                        "--item-color": item.color,
                    } as React.CSSProperties
                }
                title={item.label}
            >
                <Icon />
            </div>
        );
    };

    if (!user) {
        console.log(
            "❌ HoverNavbar: User not authenticated, navbar will not render",
        );
        return null;
    }

    console.log("✅ HoverNavbar: User authenticated, rendering navbar", user);

    return (
        <div className="lynx-hover-navbar">
            <div
                className="lynx-hover-trigger"
                onMouseEnter={() => setIsVisible(true)}
                onMouseLeave={() => setIsVisible(false)}
            />

            <div
                className={`lynx-navbar-container ${
                    isVisible ? "visible" : ""
                }`}
                onMouseEnter={() => {
                    console.log(
                        "🐁️ Navbar container entered - keeping visible",
                    );
                    setIsVisible(true);
                }}
                onMouseLeave={() => {
                    console.log("🐁️ Navbar container left - hiding");
                    setIsVisible(false);
                }}
            >
                {/* Section 1: Data Tools */}
                <div className="lynx-navbar-section-data">
                    {dataTools.map(renderNavItem)}
                </div>

                {/* Section 2: Quick Actions */}
                <div className="lynx-navbar-section-quick">
                    {quickActions.map(renderNavItem)}
                </div>

                {/* Section 3: Other Tools */}
                <div className="lynx-navbar-section-tools">
                    {otherTools.map(renderNavItem)}
                </div>

                {/* User Avatar */}
                <div className="lynx-navbar-footer">
                    <div
                        className="lynx-user-avatar"
                        title={user.displayName || user.email || "User"}
                    >
                        {user.displayName?.[0] || user.email?.[0] || "U"}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HoverNavbar;
