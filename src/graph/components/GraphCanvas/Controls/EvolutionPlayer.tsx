import React from "react";
import { Play, Pause, RotateCcw, X } from "lucide-react";
import type { EvolutionPlayerProps } from "../types/component.types";

/**
 * EvolutionPlayer component for controlling evolution mode animation
 * Note: In standalone mode, evolution might be disabled, but keeping for completeness
 */
const EvolutionPlayer: React.FC<EvolutionPlayerProps> = ({
    isEvolutionMode,
    isPlaying,
    evolutionSpeed,
    currentTimestamp,
    visibleNodes,
    visibleLinks,
    isDarkMode,
    onPlay,
    onPause,
    onReset,
    onSpeedChange,
    onExit,
    className,
    style,
}) => {
    // Don't render if not in evolution mode
    if (!isEvolutionMode) {
        return null;
    }

    const speedOptions = [0.5, 1, 2, 4];

    return (
        <div
            className={`absolute top-5 left-1/2 transform -translate-x-1/2 z-[1001] ${
                className || ""
            }`}
            style={style}
        >
            <div
                className={`flex items-center gap-3 px-6 py-4 rounded-2xl backdrop-blur-xl border shadow-lg ${
                    isDarkMode
                        ? "bg-slate-800/95 border-slate-700/50 text-slate-200"
                        : "bg-white/95 border-amber-200/50 text-amber-700"
                }`}
            >
                {/* Play/Pause Button */}
                <button
                    onClick={isPlaying ? onPause : onPlay}
                    className={`p-2 rounded-xl transition-all duration-200 hover:scale-105 ${
                        isDarkMode
                            ? "bg-slate-600/80 hover:bg-slate-500/80 text-slate-200 hover:text-slate-100"
                            : "bg-amber-100/80 hover:bg-amber-200/80 text-amber-700 hover:text-amber-800"
                    }`}
                    title={isPlaying ? "Pause evolution" : "Play evolution"}
                >
                    {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                </button>

                {/* Speed Control */}
                <div className="flex items-center gap-2">
                    <span
                        className={`text-xs font-medium ${
                            isDarkMode ? "text-slate-400" : "text-amber-600"
                        }`}
                    >
                        Speed:
                    </span>
                    <select
                        value={evolutionSpeed}
                        onChange={(e) =>
                            onSpeedChange?.(Number(e.target.value))
                        }
                        className={`text-xs font-medium border rounded-lg px-2 py-1 outline-none transition-colors duration-200 ${
                            isDarkMode
                                ? "text-slate-100 bg-slate-700 border-slate-600 focus:border-slate-500"
                                : "text-amber-800 bg-amber-50 border-amber-200 focus:border-amber-400"
                        }`}
                    >
                        {speedOptions.map((speed) => (
                            <option key={speed} value={speed}>
                                {speed}x
                            </option>
                        ))}
                    </select>
                </div>

                {/* Progress Info */}
                <div
                    className={`text-xs font-medium border-l border-r px-3 ${
                        isDarkMode
                            ? "border-slate-600 text-slate-300"
                            : "border-amber-300 text-amber-700"
                    }`}
                >
                    <div className="flex gap-4">
                        <span>
                            Nodes:{" "}
                            <span className="font-semibold">
                                {visibleNodes.size}
                            </span>
                        </span>
                        <span>
                            Links:{" "}
                            <span className="font-semibold">
                                {visibleLinks.size}
                            </span>
                        </span>
                    </div>
                </div>

                {/* Current Time */}
                <div
                    className={`text-xs font-medium ${
                        isDarkMode ? "text-slate-300" : "text-amber-700"
                    }`}
                >
                    <span
                        className={
                            isDarkMode ? "text-slate-400" : "text-amber-600"
                        }
                    >
                        Time:{" "}
                    </span>
                    <span className="font-semibold">
                        {currentTimestamp
                            ? new Date(currentTimestamp).toLocaleTimeString(
                                  "en-US",
                                  {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      hour12: true,
                                  },
                              )
                            : "Start"}
                    </span>
                </div>

                {/* Reset Button */}
                <button
                    onClick={onReset}
                    className={`p-2 rounded-xl transition-all duration-200 hover:scale-105 ${
                        isDarkMode
                            ? "bg-slate-600/80 hover:bg-slate-500/80 text-slate-200 hover:text-slate-100"
                            : "bg-amber-100/80 hover:bg-amber-200/80 text-amber-700 hover:text-amber-800"
                    }`}
                    title="Reset evolution"
                >
                    <RotateCcw size={16} />
                </button>

                {/* Exit Button */}
                <button
                    onClick={onExit}
                    className={`p-2 rounded-xl transition-all duration-200 hover:scale-105 ${
                        isDarkMode
                            ? "bg-red-600/80 hover:bg-red-500/80 text-red-200 hover:text-red-100"
                            : "bg-red-100/80 hover:bg-red-200/80 text-red-700 hover:text-red-800"
                    }`}
                    title="Exit evolution mode"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
};

export default EvolutionPlayer;
