// src/auth/LoginPage.tsx
import React, { useState } from "react";
import { Calendar, Zap, Shield, Users, ArrowRight, Chrome } from "lucide-react";

interface LoginPageProps {
    onGoogleLogin: () => Promise<void>;
    isLoading?: boolean;
}

const LoginPage: React.FC<LoginPageProps> = ({
    onGoogleLogin,
    isLoading = false,
}) => {
    const [isAuthenticating, setIsAuthenticating] = useState(false);

    const handleGoogleLogin = async () => {
        setIsAuthenticating(true);
        try {
            await onGoogleLogin();
        } catch (error) {
            console.error("Login failed:", error);
            setIsAuthenticating(false);
        }
    };

    const features = [
        {
            icon: Calendar,
            title: "Calendar Sync",
            description: "Seamlessly integrate with Google Calendar",
        },
        {
            icon: Zap,
            title: "Smart Insights",
            description: "AI-powered productivity optimization",
        },
        {
            icon: Shield,
            title: "Privacy First",
            description: "Your data stays secure and private",
        },
        {
            icon: Users,
            title: "Team Ready",
            description: "Built for collaboration and sharing",
        },
    ];

    return (
        <div className="login-page">
            <div className="login-container">
                {/* Left Side - Hero Content */}
                <div className="hero-section">
                    <div className="hero-header">
                        <div className="logo-section">
                            <div className="logo-icon">
                                <Calendar size={24} />
                            </div>
                            <h1 className="logo-text">LyncX</h1>
                        </div>

                        <h2 className="hero-title">
                            Your Productivity
                            <span className="hero-accent">Supercharged</span>
                        </h2>

                        <p className="hero-description">
                            Transform how you manage time, tasks, and focus with
                            intelligent insights that adapt to your workflow.
                        </p>
                    </div>

                    {/* Features List */}
                    <div className="features-grid">
                        {features.map((feature, index) => (
                            <div key={index} className="feature-item">
                                <div className="feature-icon">
                                    <feature.icon size={16} />
                                </div>
                                <div className="feature-content">
                                    <h3 className="feature-title">
                                        {feature.title}
                                    </h3>
                                    <p className="feature-description">
                                        {feature.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Side - Login Card */}
                <div className="login-section">
                    <div className="login-card">
                        <div className="login-header">
                            <h3 className="login-title">Welcome to LyncX</h3>
                            <p className="login-subtitle">
                                Sign in to start optimizing your productivity
                            </p>
                        </div>

                        <button
                            onClick={handleGoogleLogin}
                            disabled={isAuthenticating}
                            className="google-button"
                        >
                            {isAuthenticating ? (
                                <>
                                    <div className="spinner"></div>
                                    <span>Connecting...</span>
                                </>
                            ) : (
                                <>
                                    <div className="google-icon">G</div>
                                    <span>Continue with Google</span>
                                    <ArrowRight
                                        size={16}
                                        className="arrow-icon"
                                    />
                                </>
                            )}
                        </button>

                        <div className="login-footer">
                            <div className="security-item">
                                <Shield size={14} />
                                <span>Your data is encrypted and secure</span>
                            </div>

                            <div className="security-item">
                                <Chrome size={14} />
                                <span>Works across all your devices</span>
                            </div>
                        </div>

                        <p className="terms-text">
                            By continuing, you agree to our Terms of Service and
                            Privacy Policy. We'll only access your calendar data
                            to provide insights.
                        </p>
                    </div>
                </div>
            </div>

            <style>{`
                .login-page {
                    min-height: 100vh;
                    background: #fafbfc;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                }

                .login-container {
                    max-width: 1200px;
                    width: 100%;
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 80px;
                    align-items: center;
                }

                /* Hero Section */
                .hero-section {
                    display: flex;
                    flex-direction: column;
                    gap: 40px;
                }

                .hero-header {
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                }

                .logo-section {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 16px;
                }

                .logo-icon {
                    width: 48px;
                    height: 48px;
                    background: #f1f5f9;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #475569;
                }

                .logo-text {
                    font-size: 32px;
                    font-weight: 700;
                    color: #0f172a;
                    margin: 0;
                }

                .hero-title {
                    font-size: 48px;
                    font-weight: 700;
                    color: #0f172a;
                    line-height: 1.1;
                    margin: 0;
                }

                .hero-accent {
                    display: block;
                    color: #3b82f6;
                }

                .hero-description {
                    font-size: 18px;
                    color: #64748b;
                    line-height: 1.6;
                    margin: 0;
                    max-width: 480px;
                }

                .features-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 24px;
                }

                .feature-item {
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    padding: 16px;
                    background: white;
                    border-radius: 12px;
                    border: 1px solid #e2e8f0;
                }

                .feature-icon {
                    width: 32px;
                    height: 32px;
                    background: #f8fafc;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #475569;
                    flex-shrink: 0;
                }

                .feature-content {
                    flex: 1;
                }

                .feature-title {
                    font-size: 14px;
                    font-weight: 600;
                    color: #0f172a;
                    margin: 0 0 4px 0;
                }

                .feature-description {
                    font-size: 13px;
                    color: #64748b;
                    margin: 0;
                    line-height: 1.4;
                }

                /* Login Section */
                .login-section {
                    display: flex;
                    justify-content: center;
                }

                .login-card {
                    width: 100%;
                    max-width: 400px;
                    background: white;
                    border-radius: 16px;
                    border: 1px solid #e2e8f0;
                    padding: 32px;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                }

                .login-header {
                    text-align: center;
                    margin-bottom: 32px;
                }

                .login-title {
                    font-size: 24px;
                    font-weight: 600;
                    color: #0f172a;
                    margin: 0 0 8px 0;
                }

                .login-subtitle {
                    font-size: 15px;
                    color: #64748b;
                    margin: 0;
                    line-height: 1.5;
                }

                .google-button {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    background: white;
                    border: 1.5px solid #e2e8f0;
                    color: #374151;
                    font-size: 15px;
                    font-weight: 500;
                    padding: 14px 20px;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    margin-bottom: 24px;
                }

                .google-button:hover:not(:disabled) {
                    border-color: #3b82f6;
                    background: #fefefe;
                    transform: translateY(-1px);
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                }

                .google-button:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .google-icon {
                    width: 20px;
                    height: 20px;
                    background: linear-gradient(45deg, #4285f4, #ea4335, #fbbc05, #34a853);
                    color: white;
                    border-radius: 4px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 12px;
                    font-weight: 700;
                }

                .spinner {
                    width: 16px;
                    height: 16px;
                    border: 2px solid #e2e8f0;
                    border-top: 2px solid #3b82f6;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }

                .arrow-icon {
                    transition: transform 0.2s ease;
                }

                .google-button:hover .arrow-icon {
                    transform: translateX(2px);
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                .login-footer {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    padding: 20px 0;
                    border-top: 1px solid #f1f5f9;
                    margin-bottom: 20px;
                }

                .security-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 13px;
                    color: #64748b;
                }

                .terms-text {
                    font-size: 12px;
                    color: #94a3b8;
                    line-height: 1.5;
                    text-align: center;
                    margin: 0;
                }

                /* Responsive */
                @media (max-width: 968px) {
                    .login-container {
                        grid-template-columns: 1fr;
                        gap: 48px;
                        text-align: center;
                    }

                    .hero-title {
                        font-size: 40px;
                    }

                    .features-grid {
                        grid-template-columns: 1fr;
                    }

                    .hero-description {
                        max-width: 100%;
                    }
                }

                @media (max-width: 640px) {
                    .login-page {
                        padding: 16px;
                    }

                    .hero-title {
                        font-size: 32px;
                    }

                    .hero-description {
                        font-size: 16px;
                    }

                    .login-card {
                        padding: 24px;
                    }
                }
            `}</style>
        </div>
    );
};

export default LoginPage;
