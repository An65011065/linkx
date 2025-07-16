import React, { useState, useEffect, useCallback } from "react";
import {
    onboardingSteps,
    getPositionStyle,
    getVisiblePositionStyle,
} from "./onboardingSteps";
import "./onboarding.css";

interface OnboardingOverlayProps {
    onClose: () => void;
    isDarkMode?: boolean;
}

const OnboardingOverlay: React.FC<OnboardingOverlayProps> = ({
    onClose,
    isDarkMode = true,
}) => {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const [showWelcome, setShowWelcome] = useState(true);

    const currentStep = onboardingSteps[currentStepIndex];

    // Show welcome sequence on mount
    useEffect(() => {
        // Hide all components immediately when onboarding starts
        document.querySelectorAll(".dashboard-component").forEach((comp) => {
            comp.classList.add("onboarding-hidden");
            comp.classList.remove(
                "onboarding-highlighted",
                "onboarding-visible",
            );
        });

        setTimeout(() => setIsVisible(true), 100);
    }, []);

    // Handle welcome completion and start instructions
    const startInstructions = useCallback(() => {
        setShowWelcome(false);

        // Reduce blur for instruction mode
        const overlay = document.querySelector(".onboarding-overlay");
        if (overlay) {
            overlay.classList.add("instructions-mode");
        }

        // Hide all components initially
        document.querySelectorAll(".dashboard-component").forEach((comp) => {
            comp.classList.add("onboarding-hidden");
            comp.classList.remove(
                "onboarding-highlighted",
                "onboarding-visible",
            );
        });

        showInstructionStep(0);
    }, []);

    // Show specific instruction step
    const showInstructionStep = useCallback((stepIndex: number) => {
        const step = onboardingSteps[stepIndex];

        // Hide all components first
        document.querySelectorAll(".dashboard-component").forEach((comp) => {
            comp.classList.add("onboarding-hidden");
            comp.classList.remove(
                "onboarding-highlighted",
                "onboarding-visible",
            );
        });

        // Show required components (make them visible but not highlighted)
        step.showComponents.forEach((compId) => {
            const component = document.getElementById(compId);
            if (component) {
                component.classList.remove("onboarding-hidden");
                component.classList.add("onboarding-visible");

                // Only highlight the current component
                if (compId === step.component) {
                    component.classList.add("onboarding-highlighted");
                }
            }
        });

        setCurrentStepIndex(stepIndex);
    }, []);

    // Navigate to next step
    const nextStep = useCallback(() => {
        if (currentStepIndex < onboardingSteps.length - 1) {
            showInstructionStep(currentStepIndex + 1);
        } else {
            // End of onboarding
            endOnboarding();
        }
    }, [currentStepIndex, showInstructionStep]);

    // Navigate to previous step
    const previousStep = useCallback(() => {
        if (currentStepIndex > 0) {
            showInstructionStep(currentStepIndex - 1);
        }
    }, [currentStepIndex, showInstructionStep]);

    // End onboarding and restore normal state
    const endOnboarding = useCallback(() => {
        // Show all components
        document.querySelectorAll(".dashboard-component").forEach((comp) => {
            comp.classList.remove(
                "onboarding-hidden",
                "onboarding-highlighted",
                "onboarding-visible",
            );
        });

        setIsVisible(false);
        setTimeout(() => onClose(), 300);
    }, [onClose]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (showWelcome) {
                if (e.key === "ArrowRight" || e.key === " ") {
                    startInstructions();
                }
            } else {
                if (e.key === "ArrowRight") {
                    nextStep();
                } else if (e.key === "ArrowLeft") {
                    previousStep();
                } else if (e.key === "Escape") {
                    endOnboarding();
                }
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [showWelcome, startInstructions, nextStep, previousStep, endOnboarding]);

    // Close on overlay click
    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            endOnboarding();
        }
    };

    return (
        <div
            className={`onboarding-overlay ${isVisible ? "visible" : ""}`}
            onClick={handleOverlayClick}
        >
            {showWelcome ? (
                // Welcome Screen
                <div className="onboarding-welcome">
                    <div className="welcome-content">
                        <h1 className="welcome-title">Hi, Welcome to LyncX</h1>
                        <p className="welcome-subtitle">
                            Here's everything you need to know about the
                            dashboard
                        </p>
                        <div className="welcome-instruction">
                            Use arrow keys to navigate →
                        </div>
                    </div>
                </div>
            ) : (
                // Instruction Content with Red Card Design
                <div
                    className={`onboarding-instruction position-${currentStep.position}`}
                    style={getVisiblePositionStyle(currentStep.position)}
                >
                    <div className="instruction-content">
                        <div className="instruction-meta">
                            <div className="instruction-meta-line"></div>
                            <span className="instruction-meta-text">
                                FEATURE
                            </span>
                        </div>
                        <div className="instruction-main">
                            <h3 className="instruction-title">
                                {currentStep.title}
                            </h3>
                            <p
                                className="instruction-text"
                                dangerouslySetInnerHTML={{
                                    __html: currentStep.content,
                                }}
                            />
                        </div>
                        <div className="instruction-navigation">
                            <div className="instruction-progress">
                                {currentStepIndex + 1} of{" "}
                                {onboardingSteps.length}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Skip Button */}
            <button className="onboarding-skip" onClick={endOnboarding}>
                Skip Tour
            </button>

            {/* Progress Indicators */}
            {!showWelcome && (
                <div className="onboarding-progress-dots">
                    {onboardingSteps.map((_, index) => (
                        <div
                            key={index}
                            className={`progress-dot ${
                                index === currentStepIndex ? "active" : ""
                            } ${index < currentStepIndex ? "completed" : ""}`}
                            onClick={() => showInstructionStep(index)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default OnboardingOverlay;
