import React from "react";
import { Plus, Minus, RotateCcw } from "lucide-react";

interface ZoomControlProps {
    isDarkMode: boolean;
    zoom: number;
    minZoom?: number;
    maxZoom?: number;
    onZoomChange: (zoom: number) => void;
    onReset?: () => void;
    className?: string;
}

const ZoomControl: React.FC<ZoomControlProps> = ({
    isDarkMode,
    zoom,
    minZoom = 0.1,
    maxZoom = 3,
    onZoomChange,
    onReset,
    className = "",
}) => {
    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseFloat(e.target.value);
        onZoomChange(value);
    };

    const handleZoomIn = () => {
        const newZoom = Math.min(maxZoom, zoom + 0.1);
        onZoomChange(newZoom);
    };

    const handleZoomOut = () => {
        const newZoom = Math.max(minZoom, zoom - 0.1);
        onZoomChange(newZoom);
    };

    const handleReset = () => {
        onReset?.();
    };

    return (
        <div
            className={`fixed bottom-8 right-8 z-[1000] ${className}`}
            style={{ pointerEvents: "auto" }}
        >
            <div className="flex flex-col items-center gap-2">
                {/* Zoom In Button */}
                <button
                    onClick={handleZoomIn}
                    disabled={zoom >= maxZoom}
                    className={`mb-1 rounded-lg transition-all duration-200 ${
                        zoom >= maxZoom
                            ? isDarkMode
                                ? "text-slate-600 cursor-not-allowed"
                                : "text- gray-400 cursor-not-allowed"
                            : isDarkMode
                            ? "text-slate-300 hover:text-white hover:bg-slate-800/60"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/60"
                    }`}
                >
                    <Plus size={16} />
                </button>

                {/* Zoom Slider */}
                <div className="flex flex-col items-center h-20 justify-center">
                    <input
                        type="range"
                        min={minZoom}
                        max={maxZoom}
                        step={0.05}
                        value={zoom}
                        onChange={handleSliderChange}
                        className="slider-vertical"
                        style={{
                            width: "60px",
                            height: "4px",
                            transform: "rotate(-90deg)",
                            appearance: "none",
                            background: isDarkMode ? "#374151" : "#d1d5db",
                            borderRadius: "2px",
                            cursor: "pointer",
                        }}
                    />
                </div>

                {/* Zoom Out Button */}
                <button
                    onClick={handleZoomOut}
                    disabled={zoom <= minZoom}
                    className={`mt-1 rounded-lg transition-all duration-200 ${
                        zoom <= minZoom
                            ? isDarkMode
                                ? "text-slate-600 cursor-not-allowed"
                                : "text-gray-400 cursor-not-allowed"
                            : isDarkMode
                            ? "text-slate-300 hover:text-white hover:bg-slate-800/60"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/60"
                    }`}
                >
                    <Minus size={16} />
                </button>

                {/* Reset Button */}
                {onReset && (
                    <button
                        onClick={handleReset}
                        className={`mt-2 rounded-lg transition-all duration-200 ${
                            isDarkMode
                                ? "text-slate-400 hover:text-white hover:bg-slate-800/60"
                                : "text-gray-500 hover:text-gray-900 hover:bg-gray-100/60"
                        }`}
                        title="Reset zoom and position"
                    >
                        <RotateCcw size={16} />
                    </button>
                )}
            </div>

            {/* Custom styles for the slider thumb */}
            <style>{`
                .slider-vertical::-webkit-slider-thumb {
                    appearance: none;
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    background: #f5b049;
                    cursor: pointer;
                    border: none;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
                }

                .slider-vertical::-moz-range-thumb {
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    background: #f5b049;
                    cursor: pointer;
                    border: none;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
                }

                .slider-vertical::-webkit-slider-track {
                    height: 4px;
                    border-radius: 2px;
                }

                .slider-vertical::-moz-range-track {
                    height: 4px;
                    border-radius: 2px;
                    border: none;
                }
            `}</style>
        </div>
    );
};

export default ZoomControl;
