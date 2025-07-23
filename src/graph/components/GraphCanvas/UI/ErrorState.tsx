import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import type { ErrorStateProps } from "../types/component.types";

/**
 * ErrorState component for displaying error messages with retry option
 */
const ErrorState: React.FC<ErrorStateProps> = ({
    error,
    onRetry,
    isDarkMode,
    className,
    style,
}) => {
    const getTextClasses = (
        variant: "primary" | "secondary" | "muted" = "primary",
    ) => {
        if (isDarkMode) {
            switch (variant) {
                case "primary":
                    return "text-slate-100";
                case "secondary":
                    return "text-slate-300";
                case "muted":
                    return "text-slate-400";
            }
        } else {
            switch (variant) {
                case "primary":
                    return "text-amber-900";
                case "secondary":
                    return "text-amber-700";
                case "muted":
                    return "text-amber-600";
            }
        }
    };

    return (
        <div
            className={`text-center max-w-md mx-auto p-6 ${className || ""}`}
            style={style}
        >
            <div
                className={`mb-4 ${
                    isDarkMode ? "text-red-400" : "text-red-500"
                }`}
            >
                <AlertTriangle className="w-16 h-16 mx-auto" />
            </div>

            <h3
                className={`text-lg font-semibold mb-2 ${getTextClasses(
                    "primary",
                )}`}
            >
                Error Loading Data
            </h3>

            <p className={`text-sm mb-4 ${getTextClasses("secondary")}`}>
                {error ||
                    "An unexpected error occurred while loading the network data."}
            </p>

            <div className={`text-xs mb-6 ${getTextClasses("muted")}`}>
                This could be due to a network issue or data corruption. Please
                try refreshing the page.
            </div>

            <button
                onClick={onRetry}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    isDarkMode
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-amber-600 text-white hover:bg-amber-700"
                }`}
            >
                <RefreshCw size={16} />
                Try Again
            </button>
        </div>
    );
};

export default ErrorState;
