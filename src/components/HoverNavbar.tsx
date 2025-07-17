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
        console.log("🔍 HoverNavbar: Forcing navbar to show for testing...");

        // FORCE the navbar to show with a dummy user
        const dummyUser = {
            uid: "temp-user-123",
            email: "test@lyncx.com",
            displayName: "Test User",
            photoURL: null,
        };

        setUser(dummyUser);
        setCurrentDomain(window.location.hostname);

        console.log("✅ HoverNavbar: Dummy user set, navbar should show");

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
                setUser(message.user || dummyUser); // Use dummy user as fallback
            }
        };

        chrome.runtime.onMessage.addListener(messageListener);

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
            type: "SHOW_NOTEPAD",
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
        chrome.runtime.sendMessage({ type: "SHOW_TIMER" });
        setActiveAction(null);
    };

    const handleLimits = () => {
        setActiveAction("limits");
        chrome.runtime.sendMessage({ type: "SHOW_LIMIT_MODAL" });
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

    const handleFlow = () => {
        setActiveAction("flow");
        chrome.runtime.sendMessage({ type: "SHOW_FLOW_MODAL" });
        setActiveAction(null);
    };

    // Section 1: Data Tools (Primary actions) - REMOVED EMAIL
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
        {
            id: "flow",
            icon: Calendar,
            label: "Flow",
            action: handleFlow,
            color: "#059669", // Nice teal color for Flow
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
            id: "limits",
            icon: Shield,
            label: "Daily Limits",
            action: handleLimits,
            color: "#8b5cf6",
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

    // Always render the navbar - no auth check
    console.log(
        "✅ HoverNavbar: Rendering navbar with user:",
        user?.email || "no user",
    );

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

                {/* User Avatar - FIXED with null checks */}
                <div className="lynx-navbar-footer">
                    <div
                        className="lynx-user-avatar"
                        title={user?.displayName || user?.email || "User"}
                    >
                        {user?.displayName?.[0] || user?.email?.[0] || "U"}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HoverNavbar;
