import React from "react";
import {
    RotateCw,
    AlignHorizontalJustifyCenter,
    AlignVerticalJustifyCenter,
} from "lucide-react";
import type { ViewControlsProps } from "../types/component.types";

/**
 * ViewControls component for switching between vertical and horizontal layouts
 * Can be used as a standalone control or integrated into other button groups
 */
const ViewControls: React.FC<ViewControlsProps> = ({
    viewOrientation,
    onOrientationChange,
    isDarkMode,
    className,
    style,
}) => {
    const buttonClasses = `px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-2`;

    const activeClasses = isDarkMode
        ? "bg-slate-700/60 text-slate-200 border-slate-600"
        : "bg-amber-100/60 text-amber-800 border-amber-300";

    const inactiveClasses = isDarkMode
        ? "text-slate-400 hover:text-slate-300 hover:bg-slate-700/40 border-transparent"
        : "text-amber-600 hover:text-amber-700 hover:bg-amber-50/60 border-transparent";

    return (
        <div
            className={`inline-flex items-center gap-1 p-1 rounded-xl backdrop-blur-sm border ${
                isDarkMode
                    ? "bg-slate-800/40 border-slate-700/30"
                    : "bg-white/50 border-amber-200/30"
            } ${className || ""}`}
            style={style}
        >
            {/* Vertical Layout Button */}
            <button
                onClick={() => onOrientationChange("vertical")}
                className={`${buttonClasses} border ${
                    viewOrientation === "vertical"
                        ? activeClasses
                        : inactiveClasses
                }`}
                title="Vertical timeline layout"
            >
                <AlignVerticalJustifyCenter size={14} />
                <span>Vertical</span>
            </button>

            {/* Horizontal Layout Button */}
            <button
                onClick={() => onOrientationChange("horizontal")}
                className={`${buttonClasses} border ${
                    viewOrientation === "horizontal"
                        ? activeClasses
                        : inactiveClasses
                }`}
                title="Horizontal timeline layout"
            >
                <AlignHorizontalJustifyCenter size={14} />
                <span>Horizontal</span>
            </button>
        </div>
    );
};

/**
 * Simple toggle version - just an icon button
 */
export const ViewToggle: React.FC<ViewControlsProps> = ({
    viewOrientation,
    onOrientationChange,
    isDarkMode,
    className,
    style,
}) => {
    const handleToggle = () => {
        onOrientationChange(
            viewOrientation === "vertical" ? "horizontal" : "vertical",
        );
    };

    return (
        <button
            onClick={handleToggle}
            className={`p-3 rounded-xl backdrop-blur-xl shadow-lg border transition-all duration-200 hover:scale-105 ${
                isDarkMode
                    ? "bg-slate-800/95 border-slate-700/50 text-slate-300 hover:bg-slate-700/80 hover:text-slate-100"
                    : "bg-white/95 border-amber-200/50 text-amber-600 hover:bg-amber-50/80 hover:text-amber-800"
            } ${className || ""}`}
            title={`Switch to ${
                viewOrientation === "vertical" ? "horizontal" : "vertical"
            } layout`}
            style={style}
        >
            <RotateCw size={18} />
        </button>
    );
};

export default ViewControls;
