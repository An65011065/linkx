import React from "react";
import { RotateCw, Expand } from "lucide-react";
import type { ActionButtonsProps } from "../types/component.types";

/**
 * ActionButtons component for standalone mode
 * Simplified set of actions (no evolution mode since it's standalone)
 */
const ActionButtons: React.FC<ActionButtonsProps> = ({
    isDarkMode,
    viewOrientation,
    onToggleOrientation,
    onExpand,
    className,
    style,
}) => {
    const buttonClasses = `p-3 rounded-xl backdrop-blur-xl shadow-lg border transition-all duration-200 hover:scale-105 ${
        isDarkMode
            ? "bg-[#0f0f23]/95 border-[#1a1a2e]/50 text-slate-300 hover:bg-[#1a1a2e]/80 hover:text-slate-100"
            : "bg-white/95 border-amber-200/50 text-amber-600 hover:bg-amber-50/80 hover:text-amber-800"
    }`;

    return (
        <div
            className={`absolute top-5 right-5 z-[1002] flex flex-col gap-2 ${
                className || ""
            }`}
            style={style}
        >
            {/* Orientation Toggle */}
            <button
                onClick={onToggleOrientation}
                className={buttonClasses}
                title={`Switch to ${
                    viewOrientation === "vertical" ? "horizontal" : "vertical"
                } view`}
            >
                <RotateCw size={18} />
            </button>

            {/* Expand/Fullscreen */}
            {onExpand && (
                <button
                    onClick={onExpand}
                    className={buttonClasses}
                    title="Expand to full screen"
                >
                    <Expand size={18} />
                </button>
            )}
        </div>
    );
};

export default ActionButtons;
