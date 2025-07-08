import React from "react";
import { Layers2 } from "lucide-react";
import ConsolidateTabs from "./ConsolidateTabs";

interface ShortcutsProps {
    isDarkMode?: boolean;
}

const Shortcuts: React.FC<ShortcutsProps> = ({ isDarkMode = false }) => {
    return (
        <div
            className={`rounded-2xl p-3 w-full h-full relative flex flex-col gap-3 ${
                isDarkMode
                    ? "bg-white/5 border border-white/10 backdrop-blur-sm"
                    : "bg-white border border-gray-200 shadow-lg"
            }`}
        >
            <div className="flex items-center gap-2 mb-2">
                <Layers2
                    size={16}
                    className={isDarkMode ? "text-white" : "text-gray-700"}
                />
                <h3
                    className={`text-sm font-medium ${
                        isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                >
                    Quick Actions
                </h3>
            </div>

            <div className="flex flex-col gap-2 flex-1">
                <ConsolidateTabs
                    shouldConsolidate={false}
                    className={`
                                        w-full px-3 py-2 rounded-lg text-xs font-medium
                                        flex items-center justify-center gap-2
                                        ${
                                            isDarkMode
                                                ? "bg-green-500/20 border border-green-500/30 text-green-200 hover:bg-green-500/30 hover:border-green-500/50 transition-all duration-200 cursor-pointer hover:-translate-y-0.2"
                                                : "bg-green-50 border border-green-200 text-green-700 hover:bg-green-100 hover:border-green-300 transition-all duration-200 cursor-pointer hover:-translate-y-0.25"
                                        }
                                    `}
                />
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            console.log("Ask LynxX clicked");
                        }}
                        className={`
                            flex-1 px-3 py-2 rounded-lg text-xs font-medium
                            flex items-center justify-center gap-1.5
                            transition-all duration-200
                            ${
                                isDarkMode
                                    ? "bg-purple-500/20 border border-purple-500/30 text-purple-200 hover:bg-purple-500/30 hover:border-purple-500/50 "
                                    : "bg-purple-50 border border-purple-200 text-purple-700 hover:bg-purple-100 hover:border-purple-300"
                            }
                        `}
                        title="Ask LynxX for help"
                    >
                        <span className="text-sm">🤖</span>
                        Ask LyncX
                    </button>

                    <button
                        onClick={() => {
                            console.log("View Plan clicked");
                        }}
                        className={`
                            flex-1 px-3 py-2 rounded-lg text-xs font-semibold
                            flex items-center justify-center gap-1.5
                            transition-all duration-200
                            bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500
                            text-white shadow-lg
                            hover:scale-105 hover:shadow-xl
                            ${
                                isDarkMode
                                    ? "shadow-purple-500/25 hover:shadow-purple-500/40"
                                    : "shadow-purple-500/25 hover:shadow-purple-500/40"
                            }
                        `}
                        title="View your personalized plan"
                    >
                        <span className="text-sm">✨</span>
                        View Plans
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Shortcuts;
