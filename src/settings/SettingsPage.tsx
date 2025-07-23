import React, { useState } from "react";
import {
    ArrowLeft,
    User,
    CreditCard,
    Shield,
    Save,
    Check,
    ChevronRight,
    Eye,
    EyeOff,
    LogOut,
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

const SettingsPage = () => {
    const [currentTheme, setCurrentTheme] = useState<Theme>(themes[4]); // Default to cream
    const [activeSection, setActiveSection] = useState("account");
    const [user] = useState<AuthUser>({
        uid: "temp-user-123",
        email: "john.doe@lyncx.com",
        displayName: "John Doe",
        photoURL: null,
    });

    const [settings, setSettings] = useState({
        notifications: true,
        autoSync: true,
        privacy: true,
        analytics: false,
    });

    const [billing] = useState({
        plan: "Pro",
        price: "$9.99/month",
        nextBilling: "Dec 15, 2024",
        status: "active",
    });

    const [showPassword, setShowPassword] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    const sections = [
        { id: "account", label: "Account", icon: User },
        { id: "billing", label: "Billing", icon: CreditCard },
        { id: "privacy", label: "Privacy", icon: Shield },
    ];

    const handleSettingChange = (key: string, value: any) => {
        setSettings((prev) => ({ ...prev, [key]: value }));
        setHasChanges(true);
    };

    const handleSave = () => {
        console.log("Saving settings:", settings);
        setHasChanges(false);
    };

    const handleGoBack = () => {
        console.log("Going back to main interface");
    };

    const handleLogout = () => {
        console.log("Logging out...");
    };

    const renderAccount = () => (
        <div className="content-section">
            <h2>Account</h2>

            <div className="section-group">
                <h3>Theme</h3>
                <div className="theme-circles">
                    {themes.map((theme) => (
                        <div
                            key={theme.id}
                            className={`theme-circle ${
                                currentTheme.id === theme.id ? "active" : ""
                            }`}
                            onClick={() => setCurrentTheme(theme)}
                            style={{
                                background: theme.primary,
                                border:
                                    currentTheme.id === theme.id
                                        ? `2px solid ${theme.primary}`
                                        : "2px solid transparent",
                            }}
                        >
                            {currentTheme.id === theme.id && (
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
                <h3>Profile</h3>
                <div className="profile-row">
                    <div className="profile-avatar">
                        {user.displayName?.[0] || user.email?.[0] || "U"}
                    </div>
                    <div className="profile-fields">
                        <div className="field-group">
                            <label>Name</label>
                            <input
                                type="text"
                                defaultValue={user.displayName || ""}
                                placeholder="Enter your name"
                            />
                        </div>
                        <div className="field-group">
                            <label>Email</label>
                            <input
                                type="email"
                                defaultValue={user.email}
                                disabled
                                className="disabled"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="section-group">
                <h3>Security</h3>
                <div className="field-group">
                    <label>Password</label>
                    <div className="password-field">
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter current password"
                        />
                        <button
                            type="button"
                            className="password-toggle"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? (
                                <EyeOff size={16} />
                            ) : (
                                <Eye size={16} />
                            )}
                        </button>
                    </div>
                </div>
                <button className="link-btn">Change Password</button>
            </div>

            <div className="section-group">
                <div className="logout-row">
                    <div className="logout-info">
                        <div>Log out of all devices</div>
                    </div>
                    <button className="logout-btn" onClick={handleLogout}>
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

            <div className="section-group">
                <h3>Payment Method</h3>
                <div className="payment-row">
                    <div className="payment-details">
                        <CreditCard size={18} />
                        <div>
                            <div className="card-number">
                                •••• •••• •••• 4242
                            </div>
                            <div className="card-expiry">Expires 12/26</div>
                        </div>
                    </div>
                    <button className="link-btn">Update</button>
                </div>
            </div>

            <div className="section-group">
                <h3>Billing History</h3>
                <div className="history-list">
                    {[
                        {
                            date: "Nov 15, 2024",
                            amount: "$9.99",
                            status: "Paid",
                        },
                        {
                            date: "Oct 15, 2024",
                            amount: "$9.99",
                            status: "Paid",
                        },
                        {
                            date: "Sep 15, 2024",
                            amount: "$9.99",
                            status: "Paid",
                        },
                    ].map((invoice, index) => (
                        <div key={index} className="history-item">
                            <div className="history-date">{invoice.date}</div>
                            <div className="history-amount">
                                {invoice.amount}
                            </div>
                            <div className="history-status">
                                {invoice.status}
                            </div>
                            <button className="link-btn">Download</button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderPrivacy = () => (
        <div className="content-section">
            <h2>Privacy</h2>

            <div className="section-group">
                <h3>Notifications</h3>
                <div className="setting-row">
                    <div className="setting-info">
                        <div className="setting-label">Push Notifications</div>
                        <div className="setting-desc">
                            Get notified about important updates
                        </div>
                    </div>
                    <label className="toggle">
                        <input
                            type="checkbox"
                            checked={settings.notifications}
                            onChange={(e) =>
                                handleSettingChange(
                                    "notifications",
                                    e.target.checked,
                                )
                            }
                        />
                        <span className="toggle-slider" />
                    </label>
                </div>
            </div>

            <div className="section-group">
                <h3>Sync & Storage</h3>
                <div className="setting-row">
                    <div className="setting-info">
                        <div className="setting-label">Auto Sync</div>
                        <div className="setting-desc">
                            Automatically sync data across devices
                        </div>
                    </div>
                    <label className="toggle">
                        <input
                            type="checkbox"
                            checked={settings.autoSync}
                            onChange={(e) =>
                                handleSettingChange(
                                    "autoSync",
                                    e.target.checked,
                                )
                            }
                        />
                        <span className="toggle-slider" />
                    </label>
                </div>
            </div>

            <div className="section-group">
                <h3>Privacy Controls</h3>
                <div className="setting-row">
                    <div className="setting-info">
                        <div className="setting-label">Enhanced Privacy</div>
                        <div className="setting-desc">
                            Block tracking and improve privacy
                        </div>
                    </div>
                    <label className="toggle">
                        <input
                            type="checkbox"
                            checked={settings.privacy}
                            onChange={(e) =>
                                handleSettingChange("privacy", e.target.checked)
                            }
                        />
                        <span className="toggle-slider" />
                    </label>
                </div>
                <div className="setting-row">
                    <div className="setting-info">
                        <div className="setting-label">Usage Analytics</div>
                        <div className="setting-desc">
                            Help improve LyncX by sharing usage data
                        </div>
                    </div>
                    <label className="toggle">
                        <input
                            type="checkbox"
                            checked={settings.analytics}
                            onChange={(e) =>
                                handleSettingChange(
                                    "analytics",
                                    e.target.checked,
                                )
                            }
                        />
                        <span className="toggle-slider" />
                    </label>
                </div>
            </div>
        </div>
    );

    return (
        <div
            className="settings-page"
            style={{
                "--primary": currentTheme.primary,
                "--secondary": currentTheme.secondary,
                "--accent": currentTheme.accent,
                "--background": currentTheme.background,
                "--surface": currentTheme.surface,
                "--text": currentTheme.text,
                "--text-secondary": currentTheme.textSecondary,
            }}
        >
            {/* Header */}
            <div className="settings-header">
                <button className="back-btn" onClick={handleGoBack}>
                    <ArrowLeft size={18} />
                </button>
                <h1>Settings</h1>
                {hasChanges && (
                    <button className="save-btn" onClick={handleSave}>
                        <Save size={14} />
                        Save
                    </button>
                )}
            </div>

            {/* Main Layout */}
            <div className="settings-layout">
                {/* Left Sidebar (30%) */}
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

                {/* Content Area (70%) */}
                <div className="settings-content">
                    {activeSection === "account" && renderAccount()}
                    {activeSection === "billing" && renderBilling()}
                    {activeSection === "privacy" && renderPrivacy()}
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

                .save-btn {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    background: var(--primary);
                    color: white;
                    border: none;
                    padding: 8px 12px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 500;
                    font-size: 13px;
                    transition: all 0.2s ease;
                }

                .save-btn:hover {
                    transform: scale(1.02);
                }

                .settings-layout {
                    display: flex;
                    gap: 40px;
                    max-width: 1200px;
                    margin: 0 auto;
                    min-height: calc(100vh - 120px);
                }

                /* Sidebar (30%) */
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
                    background: var(--surface);
                }

                /* Content Area (70%) */
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

                /* Profile */
                .profile-row {
                    display: flex;
                    gap: 20px;
                    align-items: flex-start;
                }

                .profile-avatar {
                    width: 64px;
                    height: 64px;
                    border-radius: 16px;
                    background: var(--primary);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 600;
                    color: white;
                    font-size: 24px;
                    flex-shrink: 0;
                }

                .profile-fields {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .field-group {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }

                .field-group label {
                    font-size: 14px;
                    font-weight: 500;
                    color: var(--text-secondary);
                }

                .field-group input {
                    padding: 10px 12px;
                    background: var(--surface);
                    border: 1px solid transparent;
                    border-radius: 8px;
                    color: var(--text);
                    font-size: 14px;
                    transition: all 0.2s ease;
                    font-family: inherit;
                }

                .field-group input:focus {
                    outline: none;
                    border-color: var(--primary);
                    background: var(--background);
                }

                .field-group input.disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .password-field {
                    position: relative;
                }

                .password-toggle {
                    position: absolute;
                    right: 10px;
                    top: 50%;
                    transform: translateY(-50%);
                    background: none;
                    border: none;
                    color: var(--text-secondary);
                    cursor: pointer;
                    padding: 4px;
                    border-radius: 4px;
                    transition: all 0.2s ease;
                }

                .password-toggle:hover {
                    background: var(--surface);
                }

                .link-btn {
                    background: none;
                    border: none;
                    color: var(--primary);
                    cursor: pointer;
                    font-weight: 500;
                    padding: 0;
                    font-size: 14px;
                    transition: all 0.2s ease;
                    align-self: flex-start;
                    margin-top: 8px;
                }

                .link-btn:hover {
                    opacity: 0.8;
                }

                /* Logout */
                .logout-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                .logout-info div {
                    font-size: 14px;
                    color: var(--text);
                }

                .logout-btn {
                    background: #ef4444;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 6px;
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

                .payment-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 16px;
                    background: var(--surface);
                    border-radius: 10px;
                }

                .payment-details {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .card-number {
                    font-weight: 500;
                    color: var(--text);
                    font-size: 14px;
                }

                .card-expiry {
                    font-size: 12px;
                    color: var(--text-secondary);
                }

                .history-list {
                    background: var(--surface);
                    border-radius: 10px;
                    overflow: hidden;
                }

                .history-item {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 16px 20px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                }

                .history-item:last-child {
                    border-bottom: none;
                }

                .history-date {
                    font-weight: 500;
                    color: var(--text);
                    flex: 1;
                    font-size: 14px;
                }

                .history-amount {
                    font-weight: 600;
                    color: var(--text);
                    margin: 0 20px;
                    font-size: 14px;
                }

                .history-status {
                    color: #22c55e;
                    font-weight: 500;
                    font-size: 12px;
                    margin: 0 20px;
                }

                /* Privacy Settings */
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
                    
                    .profile-row {
                        flex-direction: column;
                        align-items: center;
                        text-align: center;
                    }
                    
                    .billing-card {
                        flex-direction: column;
                        gap: 16px;
                        text-align: center;
                    }
                    
                    .history-item {
                        flex-direction: column;
                        gap: 8px;
                        text-align: center;
                    }
                    
                    .history-date,
                    .history-amount {
                        margin: 0;
                    }
                    
                    .logout-row {
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
