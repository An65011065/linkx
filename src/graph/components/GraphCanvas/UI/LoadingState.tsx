import React from "react";
import type { LoadingStateProps } from "../types/component.types";

/**
 * LoadingState component for showing loading spinner and message
 */
const LoadingState: React.FC<LoadingStateProps> = ({
    message = "Loading browsing data...",
    isDarkMode,
    className,
    style,
}) => {
    return (
        <div className={`text-center ${className || ""}`} style={style}>
            {/* Loading Spinner */}
            <div
                className={`animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4 ${
                    isDarkMode ? "border-blue-400" : "border-amber-600"
                }`}
            />

            {/* Loading Message */}
            <p
                className={`font-medium ${
                    isDarkMode ? "text-slate-200" : "text-amber-900"
                }`}
            >
                {message}
            </p>

            {/* Optional subtitle */}
            <p
                className={`text-sm mt-2 ${
                    isDarkMode ? "text-slate-400" : "text-amber-600"
                }`}
            >
                This may take a moment...
            </p>
        </div>
    );
};

export default LoadingState;
