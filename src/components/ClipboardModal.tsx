import React, { useState, useEffect } from "react";
import { X, Copy, Trash2, Clipboard } from "lucide-react";

interface ClipboardItem {
    id: string;
    text: string;
    timestamp: number;
    source: string;
}

interface ClipboardModalProps {
    isVisible: boolean;
    items: ClipboardItem[];
    onClose: () => void;
    onDeleteItem: (id: string) => void;
    onClearAll: () => void;
    onRefresh: () => void;
}

const ClipboardModal: React.FC<ClipboardModalProps> = ({
    isVisible,
    items,
    onClose,
    onDeleteItem,
    onClearAll,
    onRefresh,
}) => {
    // Mock data for demo
    const mockItems: ClipboardItem[] = [
        {
            id: "1",
            text: "This is a sample clipboard item with some longer text to test truncation",
            timestamp: Date.now() - 300000, // 5 minutes ago
            source: "github.com",
        },
        {
            id: "2",
            text: "console.log('Hello World');",
            timestamp: Date.now() - 900000, // 15 minutes ago
            source: "vscode",
        },
        {
            id: "3",
            text: "rgba(255, 251, 235, 0.98)",
            timestamp: Date.now() - 1800000, // 30 minutes ago
            source: "figma.com",
        },
    ];

    const displayItems = items.length > 0 ? items : mockItems;

    const formatTime = (timestamp: number) => {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (minutes < 1) return "now";
        if (minutes < 60) return `${minutes}m`;
        if (hours < 24) return `${hours}h`;
        return `${days}d`;
    };

    const handleCopyToSystem = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            }
        };

        if (isVisible) {
            document.addEventListener("keydown", handleEscape);
        }

        return () => {
            document.removeEventListener("keydown", handleEscape);
        };
    }, [isVisible, onClose]);

    if (!isVisible) return null;

    return (
        <div className="notepad-container clipboard-overlay">
            <div className="notepad-modal clipboard-modal">
                {/* Header */}
                <div className="notepad-header">
                    <div className="notepad-header-left">
                        <div className="notepad-icon">
                            <Clipboard size={14} />
                        </div>
                        <h1 className="notepad-title">Clipboard</h1>
                        <div className="domain-count">
                            {displayItems.length}
                        </div>
                    </div>
                    <div className="notepad-header-right">
                        <button
                            onClick={onClearAll}
                            disabled={displayItems.length === 0}
                            className="notepad-minimize-btn"
                            title="Clear all"
                        >
                            <Trash2 size={14} />
                        </button>
                        <button onClick={onClose} className="notepad-close-btn">
                            <X size={14} />
                        </button>
                    </div>
                </div>

                {/* Help Section */}
                <div className="notepad-search-section">
                    <div className="clipboard-help">
                        <kbd>Shift</kbd> <kbd>Shift</kbd> to copy/paste
                    </div>
                </div>

                {/* Content */}
                <div className="notepad-editor">
                    {displayItems.length === 0 ? (
                        <div className="loading-state">
                            <Clipboard size={20} />
                            <span>No clips yet</span>
                            <div className="empty-help">
                                Select text and press Shift twice
                            </div>
                        </div>
                    ) : (
                        <div className="clipboard-items">
                            {displayItems.map((item, index) => (
                                <div key={item.id} className="clipboard-item">
                                    <div className="item-content">
                                        <div className="item-text">
                                            {item.text}
                                        </div>
                                        <div className="item-meta">
                                            <span className="item-source">
                                                {item.source}
                                            </span>
                                            <span className="item-time">
                                                {formatTime(item.timestamp)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="item-actions">
                                        <button
                                            onClick={() =>
                                                handleCopyToSystem(item.text)
                                            }
                                            className="action-btn"
                                            title="Copy"
                                        >
                                            <Copy size={12} />
                                        </button>
                                        <button
                                            onClick={() =>
                                                onDeleteItem(item.id)
                                            }
                                            className="action-btn danger"
                                            title="Delete"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                * {
                    color: inherit !important;
                }

                .clipboard-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    z-index: 10000000;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI",
                        system-ui, sans-serif;
                    animation: fadeIn 0.15s ease-out;
                    pointer-events: none;
                }

                .clipboard-modal {
                    position: fixed;
                    top: 50px;
                    right: 20px;
                    width: 280px;
                    max-height: 400px;
                    pointer-events: auto;
                    animation: slideDown 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
                }

                .notepad-container {
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI",
                        system-ui, sans-serif;
                    transition: transform 0.2s ease;
                }

                .notepad-modal {
                    background: rgba(255, 251, 235, 0.98);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(205, 133, 63, 0.35);
                    border-radius: 14px;
                    overflow: hidden;
                    box-shadow: 0 20px 40px rgba(160, 82, 45, 0.15);
                    display: flex;
                    flex-direction: column;
                }

                .notepad-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 8px 12px;
                    background: rgba(218, 165, 32, 0.15);
                    border-bottom: 1px solid rgba(205, 133, 63, 0.25);
                }

                .notepad-header-left {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .notepad-icon {
                    width: 18px;
                    height: 18px;
                    background: rgba(218, 165, 32, 0.25);
                    border-radius: 5px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: rgba(160, 82, 45, 0.85);
                }

                .notepad-title {
                    margin: 0;
                    font-size: 13px;
                    font-weight: 600;
                    color: rgba(101, 67, 33, 0.95);
                }

                .domain-count {
                    background: rgba(218, 165, 32, 0.2);
                    color: rgba(160, 82, 45, 0.85);
                    font-size: 9px;
                    font-weight: 600;
                    padding: 1px 5px;
                    border-radius: 5px;
                }

                .notepad-header-right {
                    display: flex;
                    align-items: center;
                    gap: 3px;
                }

                .notepad-minimize-btn,
                .notepad-close-btn {
                    width: 22px;
                    height: 22px;
                    background: rgba(218, 165, 32, 0.12);
                    border: none;
                    border-radius: 5px;
                    color: rgba(160, 82, 45, 0.75);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                }

                .notepad-minimize-btn:hover,
                .notepad-close-btn:hover {
                    background: rgba(218, 165, 32, 0.25);
                    color: rgba(160, 82, 45, 1);
                    transform: scale(1.05);
                }

                .notepad-minimize-btn:disabled {
                    opacity: 0.4;
                    cursor: not-allowed;
                    transform: none;
                }

                .notepad-minimize-btn:disabled:hover {
                    background: rgba(218, 165, 32, 0.12);
                    color: rgba(160, 82, 45, 0.75);
                }

                .notepad-search-section {
                    padding: 6px 12px;
                    background: rgba(218, 165, 32, 0.08);
                    border-bottom: 1px solid rgba(205, 133, 63, 0.15);
                }

                .clipboard-help {
                    text-align: center;
                    font-size: 10px;
                    color: rgba(160, 82, 45, 0.7);
                    font-weight: 500;
                }

                .clipboard-help kbd {
                    background: rgba(255, 248, 220, 0.9);
                    border: 1px solid rgba(205, 133, 63, 0.3);
                    border-radius: 2px;
                    padding: 1px 3px;
                    font-family: "SF Mono", Monaco, "Cascadia Code",
                        "Roboto Mono", Consolas, "Courier New", monospace;
                    font-size: 9px;
                    margin: 0 1px;
                    font-weight: 600;
                    color: rgba(101, 67, 33, 0.8);
                }

                .notepad-editor {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    max-height: 320px;
                }

                .loading-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 140px;
                    gap: 6px;
                    color: rgba(160, 82, 45, 0.7);
                    text-align: center;
                }

                .loading-state span {
                    font-size: 12px;
                    font-weight: 500;
                    color: rgba(101, 67, 33, 0.8);
                }

                .empty-help {
                    font-size: 10px;
                    color: rgba(160, 82, 45, 0.6);
                    margin-top: 2px;
                }

                .clipboard-items {
                    padding: 8px 12px;
                    overflow-y: auto;
                    flex: 1;
                }

                .clipboard-item {
                    display: flex;
                    align-items: flex-start;
                    gap: 8px;
                    padding: 8px 10px;
                    margin-bottom: 6px;
                    background: rgba(255, 248, 220, 0.6);
                    border: 1px solid rgba(205, 133, 63, 0.2);
                    border-radius: 6px;
                    transition: all 0.2s ease;
                    position: relative;
                }

                .clipboard-item:hover {
                    background: rgba(255, 248, 220, 0.8);
                    border-color: rgba(205, 133, 63, 0.35);
                    transform: translateY(-1px);
                }

                .clipboard-item:last-child {
                    margin-bottom: 0;
                }

                .item-content {
                    flex: 1;
                    min-width: 0;
                }

                .item-text {
                    color: rgba(101, 67, 33, 0.95);
                    line-height: 1.3;
                    word-break: break-word;
                    margin-bottom: 4px;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                    font-size: 12px;
                    font-weight: 500;
                }

                .item-meta {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 10px;
                    color: rgba(160, 82, 45, 0.7);
                }

                .item-source {
                    background: rgba(218, 165, 32, 0.2);
                    color: rgba(160, 82, 45, 0.85);
                    padding: 1px 4px;
                    border-radius: 3px;
                    font-weight: 600;
                    font-size: 9px;
                    max-width: 80px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .item-time {
                    font-weight: 500;
                }

                .item-actions {
                    display: flex;
                    gap: 2px;
                    flex-shrink: 0;
                }

                .action-btn {
                    width: 20px;
                    height: 20px;
                    background: rgba(218, 165, 32, 0.12);
                    border: none;
                    border-radius: 4px;
                    color: rgba(160, 82, 45, 0.7);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                    opacity: 0;
                    transform: scale(0.8);
                }

                .clipboard-item:hover .action-btn {
                    opacity: 1;
                    transform: scale(1);
                }

                .action-btn:hover {
                    background: rgba(218, 165, 32, 0.25);
                    color: rgba(160, 82, 45, 1);
                    transform: scale(1.05);
                }

                .action-btn.danger:hover {
                    background: rgba(239, 68, 68, 0.15);
                    color: rgba(239, 68, 68, 1);
                }

                .clipboard-items::-webkit-scrollbar {
                    width: 3px;
                }

                .clipboard-items::-webkit-scrollbar-track {
                    background: transparent;
                }

                .clipboard-items::-webkit-scrollbar-thumb {
                    background: rgba(205, 133, 63, 0.4);
                    border-radius: 2px;
                }

                .clipboard-items::-webkit-scrollbar-thumb:hover {
                    background: rgba(205, 133, 63, 0.6);
                }

                @keyframes fadeIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }

                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    );
};

export default ClipboardModal;
