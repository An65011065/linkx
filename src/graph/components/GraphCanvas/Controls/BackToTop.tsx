import React from "react";
import { ChevronUp } from "lucide-react";

interface BackToTopProps {
    isDarkMode: boolean;
    onClick: () => void;
}

const BackToTop: React.FC<BackToTopProps> = ({ isDarkMode, onClick }) => {
    return (
        <button
            onClick={onClick}
            className={`fixed top-6 left-6 z-[10001] w-12 h-12 rounded-full transition-all duration-300 hover:scale-110 active:scale-95 shadow-lg ${
                isDarkMode
                    ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 shadow-slate-900/20"
                    : "bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-gray-900/10"
            }`}
            title="Back to top"
            aria-label="Back to top"
        >
            <ChevronUp className="w-5 h-5 mx-auto" />
        </button>
    );
};

export default BackToTop;