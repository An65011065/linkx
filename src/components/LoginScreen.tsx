import React, { useState } from "react";
import { Calendar, User, ArrowRight, Check } from "lucide-react";

interface LoginScreenProps {
    onGoogleLogin: () => Promise<void>;
    onContinueWithoutSignin: () => void;
    isLoading?: boolean;
}

const LoginScreen: React.FC<LoginScreenProps> = ({
    onGoogleLogin,
    onContinueWithoutSignin,
    isLoading = false,
}) => {
    const [selectedOption, setSelectedOption] = useState<string | null>(null);

    const handleGoogleLogin = async () => {
        setSelectedOption("google");
        try {
            await onGoogleLogin();
        } catch (error) {
            setSelectedOption(null);
            console.error("Login failed:", error);
        }
    };

    const handleContinueWithout = () => {
        setSelectedOption("continue");
        onContinueWithoutSignin();
    };

    return (
        /* REMOVED FULL-SCREEN CONTAINER - Just the modal positioned like FlowModal */
        <div className="flow-login-modal">
            <div className="flow-login-header">
                <div className="flow-login-icon">
                    <Calendar size={24} />
                </div>
                <h1 className="flow-login-title">Welcome to Flow</h1>
                <p className="flow-login-subtitle">
                    Sync your calendar or start organizing tasks
                </p>
            </div>

            <div className="flow-login-options">
                <button
                    className={`flow-login-option ${
                        selectedOption === "google" ? "loading" : ""
                    }`}
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                >
                    <div className="option-icon-wrapper">
                        <div className="option-icon google">
                            <Calendar size={18} />
                        </div>
                    </div>
                    <div className="option-content">
                        <h3 className="option-title">
                            Connect Google Calendar
                        </h3>
                        <p className="option-description">
                            Sync your events and create calendar-aware tasks
                        </p>
                        <div className="option-features">
                            <div className="feature-item">
                                <Check size={12} />
                                <span>View upcoming events</span>
                            </div>
                            <div className="feature-item">
                                <Check size={12} />
                                <span>Smart scheduling</span>
                            </div>
                            <div className="feature-item">
                                <Check size={12} />
                                <span>Create calendar events</span>
                            </div>
                        </div>
                    </div>
                    <div className="option-arrow">
                        {selectedOption === "google" ? (
                            <div className="loading-spinner" />
                        ) : (
                            <ArrowRight size={16} />
                        )}
                    </div>
                </button>

                <button
                    className={`flow-login-option ${
                        selectedOption === "continue" ? "loading" : ""
                    }`}
                    onClick={handleContinueWithout}
                    disabled={isLoading}
                >
                    <div className="option-icon-wrapper">
                        <div className="option-icon simple">
                            <User size={18} />
                        </div>
                    </div>
                    <div className="option-content">
                        <h3 className="option-title">
                            Continue Without Syncing
                        </h3>
                        <p className="option-description">
                            Use Flow for local task management only
                        </p>
                        <div className="option-features">
                            <div className="feature-item">
                                <Check size={12} />
                                <span>Create and manage tasks</span>
                            </div>
                            <div className="feature-item">
                                <Check size={12} />
                                <span>Daily organization</span>
                            </div>
                        </div>
                    </div>
                    <div className="option-arrow">
                        {selectedOption === "continue" ? (
                            <div className="loading-spinner" />
                        ) : (
                            <ArrowRight size={16} />
                        )}
                    </div>
                </button>
            </div>

            <div className="flow-login-footer">
                <p className="privacy-note">
                    Your data is stored securely and never shared
                </p>
            </div>

            <style jsx>{`
                .flow-login-modal {
                    position: fixed;
                    top: 60px;
                    right: 20px;
                    width: 420px;
                    max-width: 90vw;
                    background: rgba(255, 251, 235, 0.98);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(205, 133, 63, 0.9);
                    border-radius: 16px;
                    overflow: hidden;
                    box-shadow: 0 24px 48px rgba(160, 82, 45, 0.15);
                    animation: slideUp 0.4s ease-out;
                    z-index: 10000000;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI",
                        system-ui, sans-serif;
                    pointer-events: auto;
                }

                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px) scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }

                .flow-login-header {
                    text-align: center;
                    padding: 32px 24px 24px;
                    background: rgba(218, 165, 32, 0.08);
                    border-bottom: 1px solid rgba(205, 133, 63, 0.25);
                }

                .flow-login-icon {
                    width: 48px;
                    height: 48px;
                    background: rgba(218, 165, 32, 0.25);
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: rgba(160, 82, 45, 0.85);
                    margin: 0 auto 16px;
                }

                .flow-login-title {
                    margin: 0 0 8px;
                    font-size: 24px;
                    font-weight: 700;
                    color: rgba(101, 67, 33, 0.95);
                }

                .flow-login-subtitle {
                    margin: 0;
                    font-size: 15px;
                    color: rgba(160, 82, 45, 0.7);
                    font-weight: 500;
                }

                .flow-login-options {
                    padding: 24px;
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .flow-login-option {
                    display: flex;
                    align-items: flex-start;
                    gap: 16px;
                    padding: 20px;
                    background: rgba(255, 248, 220, 0.6);
                    border: 1.5px solid rgba(205, 133, 63, 0.2);
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    text-align: left;
                    width: 100%;
                    position: relative;
                    overflow: hidden;
                }

                .flow-login-option:hover {
                    border-color: rgba(205, 133, 63, 0.35);
                    background: rgba(255, 248, 220, 0.8);
                    transform: translateY(-1px);
                    box-shadow: 0 8px 16px rgba(160, 82, 45, 0.1);
                }

                .flow-login-option:active {
                    transform: translateY(0);
                }

                .flow-login-option.loading {
                    pointer-events: none;
                    border-color: rgba(205, 133, 63, 0.35);
                    background: rgba(255, 248, 220, 0.8);
                }

                .flow-login-option:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }

                .option-icon-wrapper {
                    flex-shrink: 0;
                }

                .option-icon {
                    width: 44px;
                    height: 44px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 600;
                }

                .option-icon.google {
                    background: rgba(218, 165, 32, 0.2);
                    color: rgba(160, 82, 45, 0.85);
                }

                .option-icon.simple {
                    background: rgba(218, 165, 32, 0.2);
                    color: rgba(160, 82, 45, 0.85);
                }

                .option-content {
                    flex: 1;
                    min-width: 0;
                }

                .option-title {
                    margin: 0 0 4px;
                    font-size: 16px;
                    font-weight: 600;
                    color: rgba(101, 67, 33, 0.95);
                }

                .option-description {
                    margin: 0 0 12px;
                    font-size: 14px;
                    color: rgba(160, 82, 45, 0.7);
                    line-height: 1.4;
                }

                .option-features {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }

                .feature-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 13px;
                    color: rgba(160, 82, 45, 0.8);
                    font-weight: 500;
                }

                .feature-item svg {
                    color: rgba(34, 197, 94, 0.7);
                    flex-shrink: 0;
                }

                .option-arrow {
                    flex-shrink: 0;
                    color: rgba(160, 82, 45, 0.6);
                    margin-top: 2px;
                }

                .loading-spinner {
                    width: 16px;
                    height: 16px;
                    border: 2px solid rgba(218, 165, 32, 0.25);
                    border-top: 2px solid rgba(160, 82, 45, 0.85);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    0% {
                        transform: rotate(0deg);
                    }
                    100% {
                        transform: rotate(360deg);
                    }
                }

                .flow-login-footer {
                    padding: 16px 24px 24px;
                    text-align: center;
                    background: rgba(218, 165, 32, 0.15);
                    border-top: 1px solid rgba(205, 133, 63, 0.25);
                }

                .privacy-note {
                    margin: 0;
                    font-size: 12px;
                    color: rgba(160, 82, 45, 0.7);
                    font-weight: 500;
                }
            `}</style>
        </div>
    );
};

export default LoginScreen;
