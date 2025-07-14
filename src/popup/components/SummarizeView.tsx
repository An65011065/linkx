// src/components/SummarizeView.tsx
import React, { useState, useEffect } from "react";
import { ArrowLeft, Copy, CheckCircle } from "lucide-react";
import { PageSummariseService } from "../../services/pageSummariseService";
import "../../shared/styles/fonts.css";

interface SummarizeViewProps {
    onBack: () => void;
    initialType?: "page" | "selection";
}

const SummarizeView: React.FC<SummarizeViewProps> = ({
    onBack,
    initialType = "page",
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [summary, setSummary] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    // Auto-start summarization when component mounts
    useEffect(() => {
        if (initialType === "selection") {
            handleSummarizeSelection();
        } else {
            handleSummarizePage();
        }
    }, [initialType]);

    // Listen for context menu messages
    useEffect(() => {
        const handleMessage = (message: { action: string; text?: string }) => {
            if (message.action === "summarize-selection") {
                console.log("📄 SummarizeView: Received selection request");
                handleSummarizeSelection();
            }
        };

        chrome.runtime.onMessage.addListener(handleMessage);

        return () => {
            chrome.runtime.onMessage.removeListener(handleMessage);
        };
    }, []);

    const handleSummarizePage = async () => {
        try {
            setIsLoading(true);
            setError(null);
            setSummary(null);

            console.log("📄 Starting page summarization...");

            const result = await PageSummariseService.extractAndSummarize();

            if (result.success && result.summary) {
                setSummary(result.summary);
                console.log("✅ Page summarization successful");
            } else {
                console.error("❌ Page summarization failed:", result.error);
                setError(result.error || "Failed to process page");
            }
        } catch (error) {
            console.error("❌ Error during page summarization:", error);
            setError(
                error instanceof Error
                    ? error.message
                    : "An error occurred while processing",
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleSummarizeSelection = async () => {
        try {
            setIsLoading(true);
            setError(null);
            setSummary(null);

            console.log("📄 Starting selection summarization...");

            const result = await PageSummariseService.summarizeSelection();

            if (result.success && result.summary) {
                setSummary(result.summary);
                console.log("✅ Selection summarization successful");
            } else {
                console.error(
                    "❌ Selection summarization failed:",
                    result.error,
                );
                setError(result.error || "Failed to process selection");
            }
        } catch (error) {
            console.error("❌ Error during selection summarization:", error);
            setError(
                error instanceof Error
                    ? error.message
                    : "An error occurred while processing",
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = async () => {
        if (summary) {
            try {
                await navigator.clipboard.writeText(summary);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (err) {
                console.error("Failed to copy:", err);
            }
        }
    };

    return (
        <div
            style={{
                width: "340px",
                height: "330px",
                fontFamily:
                    "Nunito-Regular, -apple-system, BlinkMacSystemFont, sans-serif",
                background: "#ffffff",
                borderRadius: "16px",
                border: "1px solid #e5e5e5",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
            }}
        >
            {/* Header */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "16px 20px",
                    borderBottom: "1px solid #e5e5e5",
                    flexShrink: 0,
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                    }}
                >
                    <button
                        onClick={onBack}
                        style={{
                            background: "none",
                            border: "none",
                            padding: "8px",
                            cursor: "pointer",
                            borderRadius: "8px",
                            display: "flex",
                            alignItems: "center",
                            transition: "background-color 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#f5f5f5";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor =
                                "transparent";
                        }}
                    >
                        <ArrowLeft size={20} color="#333333" />
                    </button>
                    <div>
                        <div
                            style={{
                                fontSize: "16px",
                                fontFamily: "Nunito-Bold",
                                color: "#333333",
                                fontWeight: "600",
                            }}
                        >
                            Hey LyncX
                        </div>
                    </div>
                </div>

                {/* Copy button */}
                {summary && (
                    <button
                        onClick={handleCopy}
                        style={{
                            background: "none",
                            border: "none",
                            padding: "8px",
                            cursor: "pointer",
                            borderRadius: "8px",
                            display: "flex",
                            alignItems: "center",
                            transition: "background-color 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#f5f5f5";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor =
                                "transparent";
                        }}
                        title={copied ? "Copied!" : "Copy"}
                    >
                        {copied ? (
                            <CheckCircle size={18} color="#333333" />
                        ) : (
                            <Copy size={18} color="#333333" />
                        )}
                    </button>
                )}
            </div>

            {/* Content Area */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                {/* Loading State */}
                {isLoading && (
                    <div
                        style={{
                            flex: 1,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "16px",
                            padding: "40px 20px",
                        }}
                    >
                        <div
                            style={{
                                width: "24px",
                                height: "24px",
                                border: "2px solid #e5e5e5",
                                borderTop: "2px solid #333333",
                                borderRadius: "50%",
                                animation: "spin 1s linear infinite",
                            }}
                        />
                        <div
                            style={{
                                fontSize: "14px",
                                color: "#666666",
                                fontFamily: "Nunito-Regular",
                                textAlign: "center",
                            }}
                        >
                            Processing...
                        </div>
                    </div>
                )}

                {/* Error State */}
                {error && !isLoading && (
                    <div
                        style={{
                            flex: 1,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "16px",
                            padding: "40px 20px",
                            textAlign: "center",
                        }}
                    >
                        <div
                            style={{
                                fontSize: "14px",
                                color: "#666666",
                                fontFamily: "Nunito-Regular",
                                lineHeight: "1.5",
                            }}
                        >
                            {error}
                        </div>
                    </div>
                )}

                {/* Summary Content */}
                {summary && !isLoading && (
                    <div
                        style={{
                            flex: 1,
                            overflowY: "auto",
                            padding: "20px",
                            fontSize: "14px",
                            lineHeight: "1.6",
                            color: "#333333",
                            fontFamily: "Nunito-Regular",
                            height: "100%",
                            maxHeight: "calc(330px - 60px)", // Total height minus header height
                            WebkitOverflowScrolling: "touch", // Smooth scrolling on iOS
                            msOverflowStyle: "none", // Hide scrollbar on IE/Edge
                            scrollbarWidth: "thin", // Firefox
                            scrollbarColor: "#e5e5e5 transparent", // Firefox
                        }}
                        className="summary-content"
                    >
                        {summary}

                        {/* Add webkit scrollbar styles */}
                        <style>
                            {`
                                .summary-content::-webkit-scrollbar {
                                    width: 6px;
                                }
                                .summary-content::-webkit-scrollbar-track {
                                    background: transparent;
                                }
                                .summary-content::-webkit-scrollbar-thumb {
                                    background: #e5e5e5;
                                    border-radius: 3px;
                                }
                                .summary-content::-webkit-scrollbar-thumb:hover {
                                    background: #d0d0d0;
                                }
                                .summary-content {
                                    -ms-overflow-style: none; /* Hide scrollbar on IE/Edge */
                                }
                            `}
                        </style>
                    </div>
                )}
            </div>

            {/* Spinning animation */}
            <style>
                {`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}
            </style>
        </div>
    );
};

export default SummarizeView;
