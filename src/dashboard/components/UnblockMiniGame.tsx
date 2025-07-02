import React, { useState, useEffect, useCallback } from "react";
import Confetti from "./Confetti";

interface UnblockMiniGameProps {
    onSuccess: () => void;
    onCancel: () => void;
}

const UnblockMiniGame: React.FC<UnblockMiniGameProps> = ({
    onSuccess,
    onCancel,
}) => {
    const [position, setPosition] = useState(0);
    const [direction, setDirection] = useState(1);
    const [attempts, setAttempts] = useState(2);
    const [isActive, setIsActive] = useState(true);
    const [showConfetti, setShowConfetti] = useState(false);
    const targetZoneStart = 53; // percentage
    const targetZoneEnd = 60; // percentage

    useEffect(() => {
        if (!isActive) return;

        const interval = setInterval(() => {
            setPosition((prev) => {
                const next = prev + direction;
                if (next >= 100 || next <= 0) {
                    setDirection((d) => -d);
                }
                return next;
            });
        }, 10);

        return () => clearInterval(interval);
    }, [direction, isActive]);

    const handleKeyPress = useCallback(
        (e: KeyboardEvent) => {
            if (!isActive || e.code !== "Space") return;

            e.preventDefault();

            if (position >= targetZoneStart && position <= targetZoneEnd) {
                setIsActive(false);
                setShowConfetti(true);
                setTimeout(() => {
                    onSuccess();
                }, 1500);
            } else {
                setAttempts((prev) => {
                    const newAttempts = prev - 1;
                    if (newAttempts <= 0) {
                        setIsActive(false);
                        onCancel();
                    }
                    return newAttempts;
                });
            }
        },
        [position, isActive, onSuccess, onCancel],
    );

    useEffect(() => {
        window.addEventListener("keydown", handleKeyPress);
        return () => window.removeEventListener("keydown", handleKeyPress);
    }, [handleKeyPress]);

    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1000,
                fontFamily: "Nunito-Regular, Arial, sans-serif",
            }}
        >
            {showConfetti && <Confetti duration={2000} />}
            <div
                style={{
                    backgroundColor: "white",
                    padding: "24px",
                    borderRadius: "12px",
                    width: "400px",
                    position: "relative",
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        top: "12px",
                        right: "24px",
                        fontSize: "14px",
                        color: "#636e72",
                        fontFamily: "Nunito-Bold, Arial, sans-serif",
                    }}
                >
                    Attempts left: {attempts}
                </div>

                <h3
                    style={{
                        textAlign: "center",
                        marginBottom: "20px",
                        color: "#2d3436",
                        fontFamily: "Nunito-Bold, Arial, sans-serif",
                    }}
                >
                    Hit SPACE when the pointer is in the green zone
                </h3>

                <div
                    style={{
                        width: "100%",
                        height: "30px",
                        backgroundColor: "#f8f9fa",
                        borderRadius: "15px",
                        position: "relative",
                        overflow: "hidden",
                    }}
                >
                    {/* Target Zone */}
                    <div
                        style={{
                            position: "absolute",
                            left: `${targetZoneStart}%`,
                            width: `${targetZoneEnd - targetZoneStart}%`,
                            height: "100%",
                            backgroundColor: "#00b894",
                            opacity: 0.3,
                        }}
                    />

                    {/* Moving Pointer */}
                    <div
                        style={{
                            position: "absolute",
                            left: `${position}%`,
                            width: "4px",
                            height: "100%",
                            backgroundColor: "#d63031",
                            transform: "translateX(-50%)",
                            transition: "left 0.01s linear",
                        }}
                    />
                </div>

                <button
                    onClick={onCancel}
                    style={{
                        marginTop: "20px",
                        padding: "8px 16px",
                        backgroundColor: "transparent",
                        color: "#636e72",
                        border: "1px solid #ddd",
                        borderRadius: "6px",
                        fontFamily: "Nunito-Regular, Arial, sans-serif",
                        fontSize: "12px",
                        cursor: "pointer",
                        display: "block",
                        margin: "20px auto 0",
                    }}
                >
                    Cancel
                </button>
            </div>
        </div>
    );
};

export default UnblockMiniGame;
