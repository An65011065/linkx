import React, { useState } from "react";
import {
    ArrowLeft,
    User,
    CreditCard,
    Check,
    ChevronRight,
    LogOut,
    Download,
} from "lucide-react";
// Import the actual HoverNavbar component
import HoverNavbar from "../components/HoverNavbar";
// Import AIService for data download
import AIService from "../main/services/AIService";
// Import theme hook instead of managing local state
import { useTheme } from "../hooks/useTheme";

interface AuthUser {
    uid: string;
    email: string;
    displayName: string | null;
    photoURL: string | null;
}

const SettingsPage = () => {
    // Use global theme instead of local state
    const { theme: currentTheme, themes, updateTheme } = useTheme();

    const [activeSection, setActiveSection] = useState("account");
    const [user] = useState<AuthUser>({
        uid: "temp-user-123",
        email: "anAdhikari@lyncx.com",
        displayName: "An Adhikari",
        photoURL: null,
    });

    const [settings, setSettings] = useState({
        showExploreOnLaunch: true,
    });

    const [billing] = useState({
        plan: "Pro",
        price: "$9.99/month",
        nextBilling: "Dec 15, 2024",
        status: "active",
    });

    const sections = [
        { id: "account", label: "Account", icon: User },
        { id: "billing", label: "Billing", icon: CreditCard },
    ];

    const handleSettingChange = (key: string, value: any) => {
        setSettings((prev) => ({ ...prev, [key]: value }));
    };

    const handleGoBack = () => {
        console.log("Going back to main interface");
    };

    const handleLogout = () => {
        console.log("Logging out...");
    };

    const handleDownloadData = async () => {
        try {
            console.log("📊 Preparing browsing data for download...");

            // Get the same data that's sent to the assistant
            const aiService = AIService.getInstance();
            const browsingContext = await aiService.getAllBrowsingData();

            if (!browsingContext) {
                console.error("No browsing data available");
                alert("No browsing data available to download");
                return;
            }

            // Create CSV content (same as Firebase function)
            const visits = browsingContext.today.allVisits || [];
            const sortedVisits = [...visits].sort(
                (a, b) => b.startTime - a.startTime,
            );

            const headers = [
                "domain",
                "title",
                "date",
                "readableTime",
                "activeTimeMinutes",
            ];

            const rows = sortedVisits.map((visit) => {
                const date = new Date(visit.startTime);
                const timeDisplay =
                    visit.readableTime ||
                    date.toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                    });

                return [
                    visit.domain || "",
                    (visit.title || "").replace(/"/g, '""'),
                    date.toISOString().split("T")[0],
                    timeDisplay,
                    visit.activeTimeMinutes || 0,
                ];
            });

            // Add summary row (5 columns to match headers)
            const summaryRow = [
                "SUMMARY_DATA",
                `Total visits: ${sortedVisits.length}, Active minutes: ${browsingContext.today.totalActiveMinutes}, Sessions: ${browsingContext.today.tabSessions}`,
                browsingContext.today.date,
                "Summary",
                browsingContext.today.totalActiveMinutes,
            ];

            const csvLines = [
                headers.join(","),
                summaryRow.map((cell) => `"${cell}"`).join(","),
                ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
            ];

            const csvContent = csvLines.join("\n");

            // Create and download file
            const blob = new Blob([csvContent], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `browsing-data-${browsingContext.today.date}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            console.log("✅ CSV downloaded successfully");
        } catch (error) {
            console.error("❌ Error downloading browsing data:", error);
            alert("Error downloading data. Check console for details.");
        }
    };

    // Theme change handler using ThemeService
    const handleThemeChange = async (theme: any) => {
        console.log("🎨 Settings theme change requested:", theme.name);
        await updateTheme(theme);
    };

    const renderAccount = () => (
        <div className="content-section">
            <h2>Account</h2>

            <div className="section-group">
                <h3>Profile</h3>
                <div className="profile-info">
                    <div className="profile-avatar">
                        {user.displayName?.[0] || user.email?.[0] || "U"}
                    </div>
                    <div className="profile-details">
                        <div className="profile-name">{user.displayName}</div>
                        <div className="profile-email">{user.email}</div>
                    </div>
                </div>
            </div>

            <div className="section-group">
                <h3>Theme</h3>
                <div className="theme-circles">
                    {themes.map((theme) => (
                        <div
                            key={theme.id}
                            className={`theme-circle ${
                                currentTheme?.id === theme.id ? "active" : ""
                            }`}
                            onClick={() => handleThemeChange(theme)}
                            style={{
                                background: theme.primary,
                                border:
                                    currentTheme?.id === theme.id
                                        ? `2px solid ${theme.primary}`
                                        : "2px solid transparent",
                            }}
                        >
                            {currentTheme?.id === theme.id && (
                                <Check
                                    size={12}
                                    style={{
                                        color:
                                            theme.id === "mono"
                                                ? "#000"
                                                : "#fff",
                                    }}
                                />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="section-group">
                <h3>Preferences</h3>
                <div className="setting-row">
                    <div className="setting-info">
                        <div className="setting-label">
                            Show Explore on Launch
                        </div>
                        <div className="setting-desc">
                            Open explorer when loading a page.
                        </div>
                    </div>
                    <label className="toggle">
                        <input
                            type="checkbox"
                            checked={settings.showExploreOnLaunch}
                            onChange={(e) =>
                                handleSettingChange(
                                    "showExploreOnLaunch",
                                    e.target.checked,
                                )
                            }
                        />
                        <span className="toggle-slider" />
                    </label>
                </div>
            </div>

            <div className="section-group">
                <h3>Data</h3>
                <div className="data-action">
                    <div className="action-info">
                        <div className="action-label">Download Your Data</div>
                        <div className="action-desc">
                            Your data stays on your device. Download it anytime
                            for your explorations.
                        </div>
                    </div>
                    <button
                        className="download-btn"
                        onClick={handleDownloadData}
                    >
                        <Download size={16} />
                        Download
                    </button>
                </div>
            </div>

            <div className="section-group">
                <div className="logout-row">
                    <div className="logout-info">
                        <div className="logout-label">Logout</div>
                        <div className="logout-desc">
                            This will sign you out.
                        </div>
                    </div>
                    <button className="logout-btn" onClick={handleLogout}>
                        <LogOut size={16} />
                        Log out
                    </button>
                </div>
            </div>
        </div>
    );

    const renderBilling = () => (
        <div className="content-section">
            <h2>Billing</h2>

            <div className="section-group">
                <h3>Current Plan</h3>
                <div className="billing-card">
                    <div className="plan-details">
                        <div className="plan-name">{billing.plan}</div>
                        <div className="plan-price">{billing.price}</div>
                        <div className="plan-status">
                            <div className="status-dot active" />
                            Next billing: {billing.nextBilling}
                        </div>
                    </div>
                    <button className="manage-btn">
                        Manage <ChevronRight size={14} />
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div
            className="settings-page"
            style={{
                "--primary": currentTheme?.primary,
                "--secondary": currentTheme?.secondary,
                "--accent": currentTheme?.accent,
                "--background": currentTheme?.background,
                "--surface": currentTheme?.surface,
                "--text": currentTheme?.text,
                "--text-secondary": currentTheme?.textSecondary,
            }}
        >
            {/* Import the actual HoverNavbar component - no currentTheme prop needed */}
            <HoverNavbar alwaysVisible={true} />

            {/* Header */}
            <div className="settings-header">
                <button className="back-btn" onClick={handleGoBack}>
                    <ArrowLeft size={18} />
                </button>
                <h1>Settings</h1>
            </div>

            {/* Main Layout */}
            <div className="settings-layout">
                {/* Left Sidebar */}
                <div className="settings-sidebar">
                    {sections.map((section) => {
                        const Icon = section.icon;
                        return (
                            <button
                                key={section.id}
                                className={`sidebar-item ${
                                    activeSection === section.id ? "active" : ""
                                }`}
                                onClick={() => setActiveSection(section.id)}
                            >
                                <Icon size={16} />
                                <span>{section.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Content Area */}
                <div className="settings-content">
                    {activeSection === "account" && renderAccount()}
                    {activeSection === "billing" && renderBilling()}
                </div>
            </div>

            <style>{`
                .settings-page {
                    min-height: 100vh;
                    background: var(--background);
                    color: var(--text);
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
                    padding: 20px;
                }

                .settings-header {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    margin-bottom: 32px;
                    max-width: 1200px;
                    margin-left: auto;
                    margin-right: auto;
                }

                .back-btn {
                    background: none;
                    border: none;
                    color: var(--text-secondary);
                    cursor: pointer;
                    padding: 8px;
                    border-radius: 6px;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .back-btn:hover {
                    background: var(--surface);
                    transform: scale(1.05);
                }

                .settings-header h1 {
                    margin: 0;
                    font-size: 24px;
                    font-weight: 600;
                    color: var(--text);
                    flex: 1;
                }

                .settings-layout {
                    display: flex;
                    gap: 40px;
                    max-width: 1200px;
                    margin: 0 auto;
                    min-height: calc(100vh - 120px);
                }

                /* Sidebar */
                .settings-sidebar {
                    width: 30%;
                    min-width: 200px;
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }

                .sidebar-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    background: none;
                    border: none;
                    color: var(--text-secondary);
                    cursor: pointer;
                    padding: 12px 16px;
                    border-radius: 8px;
                    transition: all 0.2s ease;
                    font-size: 14px;
                    font-weight: 500;
                    text-align: left;
                    width: 100%;
                }

                .sidebar-item:hover {
                    background: var(--surface);
                    color: var(--text);
                }

                .sidebar-item.active {
                    background: var(--surface);
                    color: var(--text);
                    border-left: 2px solid var(--primary);
                }

                /* Content Area */
                .settings-content {
                    flex: 1;
                    min-width: 0;
                }

                .content-section {
                    padding: 0;
                }

                .content-section h2 {
                    margin: 0 0 32px 0;
                    font-size: 28px;
                    font-weight: 600;
                    color: var(--text);
                }

                .section-group {
                    margin-bottom: 40px;
                    padding-bottom: 32px;
                    border-bottom: 1px solid var(--surface);
                }

                .section-group:last-child {
                    border-bottom: none;
                    margin-bottom: 0;
                    padding-bottom: 0;
                }

                .section-group h3 {
                    margin: 0 0 16px 0;
                    font-size: 16px;
                    font-weight: 600;
                    color: var(--text);
                }

                /* Theme Circles */
                .theme-circles {
                    display: flex;
                    gap: 12px;
                    flex-wrap: wrap;
                }

                .theme-circle {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                    position: relative;
                }

                .theme-circle:hover {
                    transform: scale(1.1);
                }

                .theme-circle.active {
                    box-shadow: 0 0 0 2px var(--background), 0 0 0 4px var(--primary);
                }

                /* Profile Info */
                .profile-info {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }

                .profile-avatar {
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    background: var(--primary);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 600;
                    color: white;
                    font-size: 18px;
                    flex-shrink: 0;
                }

                .profile-details {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }

                .profile-name {
                    font-size: 16px;
                    font-weight: 600;
                    color: var(--text);
                }

                .profile-email {
                    font-size: 14px;
                    color: var(--text-secondary);
                }

                /* Settings Rows */
                .setting-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 16px 0;
                    border-bottom: 1px solid var(--surface);
                }

                .setting-row:last-child {
                    border-bottom: none;
                }

                .setting-info {
                    flex: 1;
                }

                .setting-label {
                    font-weight: 500;
                    color: var(--text);
                    margin-bottom: 4px;
                    font-size: 14px;
                }

                .setting-desc {
                    font-size: 13px;
                    color: var(--text-secondary);
                    opacity: 0.8;
                }

                /* Toggle Switch */
                .toggle {
                    position: relative;
                    display: inline-block;
                    width: 44px;
                    height: 26px;
                    cursor: pointer;
                }

                .toggle input {
                    opacity: 0;
                    width: 0;
                    height: 0;
                }

                .toggle-slider {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: var(--surface);
                    transition: all 0.3s ease;
                    border-radius: 26px;
                }

                .toggle-slider:before {
                    position: absolute;
                    content: "";
                    height: 20px;
                    width: 20px;
                    left: 3px;
                    bottom: 3px;
                    background: var(--text-secondary);
                    transition: all 0.3s ease;
                    border-radius: 50%;
                }

                .toggle input:checked + .toggle-slider {
                    background: var(--primary);
                }

                .toggle input:checked + .toggle-slider:before {
                    transform: translateX(18px);
                    background: white;
                }

                /* Data Action */
                .data-action {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                .action-info {
                    flex: 1;
                }

                .action-label {
                    font-weight: 500;
                    color: var(--text);
                    margin-bottom: 4px;
                    font-size: 14px;
                }

                .action-desc {
                    font-size: 13px;
                    color: var(--text-secondary);
                    opacity: 0.8;
                }

                .download-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: var(--surface);
                    color: var(--text);
                    border: 1px solid var(--surface);
                    padding: 10px 16px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 500;
                    font-size: 14px;
                    transition: all 0.2s ease;
                }

                .download-btn:hover {
                    background: var(--primary);
                    color: white;
                    border-color: var(--primary);
                    transform: scale(1.02);
                }

                /* Logout */
                .logout-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                .logout-info {
                    flex: 1;
                }

                .logout-label {
                    font-weight: 500;
                    color: var(--text);
                    margin-bottom: 4px;
                    font-size: 14px;
                }

                .logout-desc {
                    font-size: 13px;
                    color: var(--text-secondary);
                    opacity: 0.8;
                }

                .logout-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: #ef4444;
                    color: white;
                    border: none;
                    padding: 10px 16px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 500;
                    font-size: 14px;
                    transition: all 0.2s ease;
                }

                .logout-btn:hover {
                    background: #dc2626;
                    transform: scale(1.02);
                }

                /* Billing */
                .billing-card {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 20px;
                    background: var(--surface);
                    border-radius: 12px;
                    border: 1px solid var(--primary);
                }

                .plan-name {
                    font-size: 18px;
                    font-weight: 600;
                    color: var(--text);
                    margin-bottom: 4px;
                }

                .plan-price {
                    font-size: 24px;
                    font-weight: 700;
                    color: var(--primary);
                    margin-bottom: 6px;
                }

                .plan-status {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: var(--text-secondary);
                    font-size: 13px;
                }

                .status-dot {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    background: #22c55e;
                }

                .manage-btn {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    background: var(--primary);
                    color: white;
                    border: none;
                    padding: 10px 16px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 500;
                    font-size: 14px;
                    transition: all 0.2s ease;
                }

                .manage-btn:hover {
                    transform: scale(1.02);
                }

                /* Responsive */
                @media (max-width: 768px) {
                    .settings-layout {
                        flex-direction: column;
                        gap: 24px;
                    }
                    
                    .settings-sidebar {
                        width: 100%;
                        flex-direction: row;
                        overflow-x: auto;
                        gap: 8px;
                    }
                    
                    .sidebar-item {
                        white-space: nowrap;
                        min-width: 120px;
                        justify-content: center;
                    }
                    
                    .profile-info {
                        flex-direction: column;
                        align-items: center;
                        text-align: center;
                    }
                    
                    .billing-card {
                        flex-direction: column;
                        gap: 16px;
                        text-align: center;
                    }
                    
                    .logout-row, .data-action {
                        flex-direction: column;
                        gap: 12px;
                        text-align: center;
                    }
                }
            `}</style>
        </div>
    );
};

export default SettingsPage;
