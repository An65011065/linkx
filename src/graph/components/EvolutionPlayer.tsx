import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, Square, X, ChevronDown } from "lucide-react";
import EvolutionSearch from "./EvolutionSearch";
import type { NetworkNode } from "../types/network.types";

interface EvolutionPlayerProps {
    isPlaying: boolean;
    speed: number;
    currentTimestamp: number;
    nodes: NetworkNode[];
    selectedNode: string | null;
    onPlay: () => void;
    onPause: () => void;
    onReset: () => void;
    onSpeedChange: (speed: number) => void;
    onClose: () => void;
    onNodeSelect: (nodeId: string | null) => void;
    isDarkMode?: boolean;
}

const speedOptions = [
    { value: 0.25, label: "0.25x" },
    { value: 0.5, label: "0.5x" },
    { value: 1, label: "1x" },
    { value: 2, label: "2x" },
    { value: 4, label: "4x" },
    { value: 8, label: "8x" },
];

export const EvolutionPlayer: React.FC<EvolutionPlayerProps> = ({
    isPlaying,
    speed,
    currentTimestamp,
    nodes,
    selectedNode,
    onPlay,
    onPause,
    onReset,
    onSpeedChange,
    onClose,
    onNodeSelect,
    isDarkMode = true,
}) => {
    const [speedDropdownVisible, setSpeedDropdownVisible] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const speedDropdownRef = useRef<HTMLDivElement>(null);

    // Entrance animation
    useEffect(() => {
        setIsVisible(true);
    }, []);

    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                speedDropdownRef.current &&
                !speedDropdownRef.current.contains(event.target as Node)
            ) {
                setSpeedDropdownVisible(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const date = new Date(currentTimestamp);
    const timeStr = date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });
    const dateStr = date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
    });

    return (
        <>
            <div
                style={{
                    position: "absolute",
                    top: "20px",
                    left: "50%",
                    transform: `translateX(-50%) translateY(${
                        isVisible ? "0" : "-20px"
                    }) scale(${isVisible ? "1" : "0.95"})`,
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px 16px",
                    background: isDarkMode ? "rgba(0, 0, 0, 0.9)" : "white",
                    borderRadius: "12px",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                    zIndex: 1000,
                    border: isDarkMode
                        ? "1px solid rgba(255, 255, 255, 0.1)"
                        : "1px solid rgba(0, 0, 0, 0.1)",
                    backdropFilter: "blur(10px)",
                    opacity: isVisible ? 1 : 0,
                    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                    willChange: "transform, opacity",
                }}
            >
                {/* Container for search and speed dropdown */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        background: isDarkMode
                            ? "rgba(255, 255, 255, 0.1)"
                            : "rgba(0, 0, 0, 0.05)",
                        borderRadius: "20px",
                        padding: "8px 12px",
                        border: isDarkMode
                            ? "1px solid rgba(255, 255, 255, 0.2)"
                            : "1px solid #ddd",
                        height: "36px",
                        minWidth: "400px",
                        transition: "all 0.3s ease",
                        willChange: "background, border-color",
                    }}
                >
                    {/* Evolution Search Component */}
                    <div style={{ flex: 1 }}>
                        <EvolutionSearch
                            nodes={nodes}
                            onNodeSelect={onNodeSelect}
                            selectedNode={selectedNode}
                            isDarkMode={isDarkMode}
                        />
                    </div>

                    {/* Speed Dropdown */}
                    <div style={{ position: "relative" }}>
                        <button
                            onClick={() =>
                                setSpeedDropdownVisible(!speedDropdownVisible)
                            }
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "4px 8px",
                                background: "transparent",
                                color: isDarkMode ? "#ffffff" : "#333333",
                                border: "none",
                                borderRadius: "4px",
                                fontSize: "12px",
                                cursor: "pointer",
                                fontWeight: "500",
                                transition: "all 0.2s ease",
                                willChange: "background, transform",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = isDarkMode
                                    ? "rgba(255, 255, 255, 0.1)"
                                    : "rgba(0, 0, 0, 0.1)";
                                e.currentTarget.style.transform = "scale(1.02)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background =
                                    "transparent";
                                e.currentTarget.style.transform = "scale(1)";
                            }}
                        >
                            {speed}x
                            <ChevronDown size={12} />
                        </button>
                        {speedDropdownVisible && (
                            <div
                                ref={speedDropdownRef}
                                style={{
                                    position: "absolute",
                                    top: "100%",
                                    right: 0,
                                    marginTop: "4px",
                                    background: isDarkMode
                                        ? "rgba(0, 0, 0, 0.95)"
                                        : "white",
                                    borderRadius: "8px",
                                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                                    border: isDarkMode
                                        ? "1px solid rgba(255, 255, 255, 0.2)"
                                        : "1px solid #ddd",
                                    zIndex: 1002,
                                    minWidth: "60px",
                                    transform: "translateY(-4px) scale(0.98)",
                                    opacity: 0,
                                    animation:
                                        "dropdownFadeIn 0.2s ease forwards",
                                }}
                            >
                                {speedOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => {
                                            onSpeedChange(option.value);
                                            setSpeedDropdownVisible(false);
                                        }}
                                        style={{
                                            width: "100%",
                                            padding: "4px 8px",
                                            textAlign: "left",
                                            background:
                                                speed === option.value
                                                    ? isDarkMode
                                                        ? "rgba(255, 255, 255, 0.1)"
                                                        : "#f5f5f5"
                                                    : "transparent",
                                            color: isDarkMode
                                                ? "#ffffff"
                                                : "#333333",
                                            border: "none",
                                            fontSize: "12px",
                                            cursor: "pointer",
                                            borderRadius:
                                                speed === option.value
                                                    ? "4px"
                                                    : "0",
                                            transition: "all 0.2s ease",
                                            willChange: "background, transform",
                                        }}
                                        onMouseEnter={(e) => {
                                            if (speed !== option.value) {
                                                e.currentTarget.style.background =
                                                    isDarkMode
                                                        ? "rgba(255, 255, 255, 0.1)"
                                                        : "#f5f5f5";
                                                e.currentTarget.style.transform =
                                                    "scale(1.02)";
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (speed !== option.value) {
                                                e.currentTarget.style.background =
                                                    "transparent";
                                                e.currentTarget.style.transform =
                                                    "scale(1)";
                                            }
                                        }}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Control Buttons */}
                <button
                    onClick={isPlaying ? onPause : onPlay}
                    style={{
                        width: "36px",
                        height: "36px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "transparent",
                        color: isDarkMode ? "#ffffff" : "#333333",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        willChange: "background, transform",
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = isDarkMode
                            ? "rgba(255, 255, 255, 0.15)"
                            : "rgba(0, 0, 0, 0.15)";
                        e.currentTarget.style.transform = "scale(1.05)";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.transform = "scale(1)";
                    }}
                >
                    {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                </button>

                <button
                    onClick={onReset}
                    style={{
                        width: "36px",
                        height: "36px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "transparent",
                        color: isDarkMode ? "#ffffff" : "#333333",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        willChange: "background, transform",
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = isDarkMode
                            ? "rgba(255, 255, 255, 0.15)"
                            : "rgba(0, 0, 0, 0.15)";
                        e.currentTarget.style.transform = "scale(1.05)";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.transform = "scale(1)";
                    }}
                >
                    <Square size={16} />
                </button>

                <button
                    onClick={onClose}
                    style={{
                        width: "36px",
                        height: "36px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "transparent",
                        color: isDarkMode ? "#ffffff" : "#333333",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        willChange: "background, transform",
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = isDarkMode
                            ? "rgba(255, 255, 255, 0.15)"
                            : "rgba(0, 0, 0, 0.15)";
                        e.currentTarget.style.transform = "scale(1.05)";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.transform = "scale(1)";
                    }}
                >
                    <X size={16} />
                </button>
            </div>

            {/* Time Display */}
            <div
                style={{
                    position: "fixed",
                    bottom: "40px",
                    right: "40px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    gap: "4px",
                    fontFamily: "Nunito-Regular, sans-serif",
                    color: isDarkMode ? "#ffffff" : "#2d3436",
                    textShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    zIndex: 1000,
                    transform: `translateX(${
                        isVisible ? "0" : "20px"
                    }) translateY(${isVisible ? "0" : "20px"})`,
                    opacity: isVisible ? 1 : 0,
                    transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
                    willChange: "transform, opacity",
                }}
            >
                <div
                    style={{
                        fontSize: "48px",
                        fontWeight: "bold",
                        lineHeight: "1",
                        letterSpacing: "-0.02em",
                    }}
                >
                    {timeStr}
                </div>
                <div
                    style={{
                        fontSize: "24px",
                        opacity: 0.8,
                    }}
                >
                    {dateStr}
                </div>
            </div>
        </>
    );
};
