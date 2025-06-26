// EvolutionPlayer.tsx - Evolution playback component

import React from "react";
import { format } from "date-fns";
import { Play, Pause, SkipBack, X } from "lucide-react";
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
}) => {
    const date = new Date(currentTimestamp);
    const timeStr = format(date, "h:mm a");
    const dateStr = format(date, "MMMM d");

    return (
        <>
            <div
                style={{
                    position: "absolute",
                    top: "20px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px 16px",
                    background: "white",
                    borderRadius: "12px",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                    zIndex: 1000,
                }}
            >
                <button
                    onClick={isPlaying ? onPause : onPlay}
                    style={{
                        width: "36px",
                        height: "36px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: isPlaying ? "#ff6b6b" : "#4285f4",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                    }}
                >
                    {isPlaying ? (
                        <Pause size={16} fill="currentColor" />
                    ) : (
                        <Play size={16} fill="currentColor" />
                    )}
                </button>

                <button
                    onClick={onReset}
                    style={{
                        width: "36px",
                        height: "36px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "#636e72",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                    }}
                >
                    <SkipBack size={16} fill="currentColor" />
                </button>

                <select
                    value={speed}
                    onChange={(e) => onSpeedChange(Number(e.target.value))}
                    style={{
                        padding: "8px 12px",
                        border: "1px solid #ddd",
                        borderRadius: "8px",
                        background: "white",
                        fontSize: "14px",
                        cursor: "pointer",
                    }}
                >
                    {speedOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>

                <EvolutionSearch
                    nodes={nodes}
                    onNodeSelect={onNodeSelect}
                    selectedNode={selectedNode}
                />

                <button
                    onClick={onClose}
                    style={{
                        width: "36px",
                        height: "36px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "transparent",
                        color: "#636e72",
                        border: "1px solid #ddd",
                        borderRadius: "8px",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
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
                    color: "#2d3436",
                    textShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    zIndex: 1000,
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
