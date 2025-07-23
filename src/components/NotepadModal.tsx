import React, { useState, useEffect, useRef } from "react";
import {
    X,
    Search,
    FileText,
    Grip,
    Minimize,
    ChevronRight,
    Save,
} from "lucide-react";

interface Note {
    id?: string;
    domain: string;
    content: string;
    lastModified: number;
    createdAt: number;
}

interface NotepadModalProps {
    onClose: () => void;
    isVisible: boolean;
    domain: string;
}

const NotepadModal: React.FC<NotepadModalProps> = ({
    onClose,
    isVisible,
    domain,
}) => {
    const [currentNote, setCurrentNote] = useState<Note | null>(null);
    const [noteContent, setNoteContent] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [allNotes, setAllNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [selectedDomain, setSelectedDomain] = useState(domain);
    const [isMinimized, setIsMinimized] = useState(false);
    const [position, setPosition] = useState({ x: 20, y: 100 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [hasDragged, setHasDragged] = useState(false);

    const modalRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const dragRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isVisible) {
            loadAllNotes();
        }
    }, [isVisible]);

    useEffect(() => {
        if (isVisible && selectedDomain) {
            loadNoteForDomain(selectedDomain);
        }
    }, [selectedDomain]);

    // YouTube-specific fix (keeping your existing implementation)
    useEffect(() => {
        if (!isVisible) return;

        const isYouTube = window.location.hostname.includes("youtube.com");
        if (!isYouTube) return;

        console.log("🎯 Applying YouTube-specific spacebar fix");

        const ytPlayer = document.querySelector(
            "#movie_player, .html5-video-player",
        );
        const video = document.querySelector("video");

        if (ytPlayer) {
            const originalTabIndex = ytPlayer.getAttribute("tabindex");
            ytPlayer.setAttribute("tabindex", "-1");
            (ytPlayer as HTMLElement).blur?.();
            if (video) {
                video.blur?.();
            }
        }

        const spacebarBlockers: Array<(e: KeyboardEvent) => void> = [];

        const documentCapture = (e: KeyboardEvent) => {
            if (e.key === " " || e.key === "Spacebar") {
                const activeElement = document.activeElement;
                const isInModal = modalRef.current?.contains(
                    activeElement as Node,
                );

                if (isInModal) {
                    e.stopImmediatePropagation();
                    e.preventDefault();
                    return false;
                }
            }
        };

        document.addEventListener("keydown", documentCapture, {
            capture: true,
            passive: false,
        });
        document.addEventListener("keyup", documentCapture, {
            capture: true,
            passive: false,
        });

        return () => {
            document.removeEventListener("keydown", documentCapture, {
                capture: true,
            });
            document.removeEventListener("keyup", documentCapture, {
                capture: true,
            });
        };
    }, [isVisible]);

    const loadNoteForDomain = async (targetDomain: string) => {
        setLoading(true);
        try {
            const response = await chrome.runtime.sendMessage({
                type: "LOAD_NOTE",
                domain: targetDomain,
            });

            if (response && response.success && response.note) {
                setCurrentNote(response.note);
                setNoteContent(response.note.content || "");
            } else {
                setCurrentNote(null);
                setNoteContent("");
            }
        } catch (error) {
            console.error("Error loading note:", error);
            setNoteContent("");
        } finally {
            setLoading(false);
        }
    };

    const loadAllNotes = async () => {
        try {
            const response = await chrome.runtime.sendMessage({
                type: "LOAD_ALL_NOTES",
            });

            if (response && response.success) {
                setAllNotes(response.notes || []);
            }
        } catch (error) {
            console.error("❌ Error loading all notes:", error);
        }
    };

    const saveNote = async () => {
        if (!noteContent.trim()) return;

        setSaving(true);
        try {
            const response = await chrome.runtime.sendMessage({
                type: "SAVE_NOTE",
                domain: selectedDomain,
                content: noteContent,
            });

            if (response && response.success) {
                setCurrentNote(response.note);
                await loadAllNotes();
            }
        } catch (error) {
            console.error("Error saving note:", error);
        } finally {
            setSaving(false);
        }
    };

    const switchToDomain = (targetDomain: string) => {
        setSelectedDomain(targetDomain);
        setSearchQuery("");
    };

    useEffect(() => {
        if (!noteContent.trim() || loading) return;

        const timeoutId = setTimeout(() => {
            saveNote();
        }, 1000);

        return () => clearTimeout(timeoutId);
    }, [noteContent, selectedDomain]);

    const filteredNotes = allNotes.filter(
        (note) =>
            note.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
            note.content.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!dragRef.current) return;

        const rect = dragRef.current.getBoundingClientRect();
        setDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });
        setIsDragging(true);
        setHasDragged(false);
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging) return;

        setHasDragged(true);

        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;

        const width = isMinimized ? 120 : 380;
        const height = isMinimized ? 45 : 500;
        const maxX = window.innerWidth - width;
        const maxY = window.innerHeight - height;

        setPosition({
            x: Math.max(0, Math.min(newX, maxX)),
            y: Math.max(0, Math.min(newY, maxY)),
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleMinimizedClick = () => {
        if (!hasDragged) {
            setIsMinimized(false);
            setTimeout(() => {
                if (textareaRef.current) {
                    textareaRef.current.focus();
                }
            }, 100);
        }
    };

    useEffect(() => {
        if (isDragging) {
            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("mouseup", handleMouseUp);
            return () => {
                document.removeEventListener("mousemove", handleMouseMove);
                document.removeEventListener("mouseup", handleMouseUp);
            };
        }
    }, [isDragging, dragOffset]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        e.stopPropagation();
        if (e.key === "Escape") {
            e.preventDefault();
            onClose?.();
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        e.stopPropagation();
        setNoteContent(e.target.value);
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.stopPropagation();
        setSearchQuery(e.target.value);
    };

    const getWordCount = () => {
        return noteContent.trim() ? noteContent.trim().split(/\s+/).length : 0;
    };

    const getCharacterCount = () => {
        return noteContent.length;
    };

    if (!isVisible) return null;

    return (
        <div
            ref={modalRef}
            className={`notepad-container ${isMinimized ? "minimized" : ""}`}
            style={{
                left: position.x,
                top: position.y,
                transform: isDragging ? "scale(1.02)" : "scale(1)",
                cursor: isDragging ? "grabbing" : "default",
            }}
        >
            {/* Minimized State */}
            {isMinimized && (
                <div
                    ref={dragRef}
                    className="notepad-minimized"
                    onClick={handleMinimizedClick}
                    onMouseDown={handleMouseDown}
                >
                    <div className="minimized-icon">
                        <FileText size={16} />
                    </div>
                    <div className="minimized-info">
                        <span className="minimized-count">
                            {allNotes.length}
                        </span>
                        <span className="minimized-label">notes</span>
                    </div>
                </div>
            )}

            {/* Full State */}
            {!isMinimized && (
                <div className="notepad-modal">
                    {/* Header */}
                    <div
                        ref={dragRef}
                        className="notepad-header"
                        onMouseDown={handleMouseDown}
                    >
                        <div className="notepad-header-left">
                            <div className="drag-handle">
                                <Grip size={12} />
                            </div>
                            <div className="notepad-icon">
                                <FileText size={14} />
                            </div>
                            <h1 className="notepad-title">Notes</h1>
                        </div>
                        <div className="notepad-header-right">
                            <button
                                className="notepad-minimize-btn"
                                onClick={() => setIsMinimized(true)}
                            >
                                <Minimize size={14} />
                            </button>
                            <button
                                className="notepad-close-btn"
                                onClick={onClose}
                            >
                                <X size={14} />
                            </button>
                        </div>
                    </div>

                    {/* Domain Header */}
                    <div className="notepad-domain-header">
                        <div className="domain-selector">
                            <h2 className="domain-title">{selectedDomain}</h2>
                            <div className="domain-count">
                                {allNotes.length} notes
                            </div>
                        </div>
                        <div className="status-indicator">
                            {saving ? (
                                <div className="saving-spinner"></div>
                            ) : noteContent.trim() ? (
                                <Save size={14} className="saved-icon" />
                            ) : null}
                        </div>
                    </div>

                    {/* Search Section */}
                    <div className="notepad-search-section">
                        <div className="notepad-search-wrapper">
                            <Search size={14} className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search notes..."
                                value={searchQuery}
                                onChange={handleSearchChange}
                                onKeyDown={(e) => e.stopPropagation()}
                                className="notepad-search-input"
                            />
                        </div>
                    </div>

                    {/* Domain Tabs */}
                    <div className="notepad-tabs-section">
                        <div className="domain-tabs">
                            <button
                                onClick={() => switchToDomain(domain)}
                                className={`domain-tab ${
                                    selectedDomain === domain ? "active" : ""
                                }`}
                            >
                                {domain.length > 12
                                    ? domain.substring(0, 12) + "..."
                                    : domain}
                            </button>

                            {Array.from(
                                new Set(allNotes.map((note) => note.domain)),
                            )
                                .filter((domainName) => domainName !== domain)
                                .slice(0, 2)
                                .map((domainName) => (
                                    <button
                                        key={domainName}
                                        onClick={() =>
                                            switchToDomain(domainName)
                                        }
                                        className={`domain-tab ${
                                            selectedDomain === domainName
                                                ? "active"
                                                : ""
                                        }`}
                                    >
                                        {domainName.length > 12
                                            ? domainName.substring(0, 12) +
                                              "..."
                                            : domainName}
                                    </button>
                                ))}
                        </div>
                    </div>

                    {/* Note Editor */}
                    <div className="notepad-editor">
                        {loading ? (
                            <div className="loading-state">
                                <div className="loading-spinner"></div>
                                <span>Loading notes...</span>
                            </div>
                        ) : (
                            <textarea
                                ref={textareaRef}
                                value={noteContent}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                                onClick={(e) => e.stopPropagation()}
                                onFocus={(e) => e.stopPropagation()}
                                placeholder={`Write your notes for ${selectedDomain}...`}
                                className="notepad-textarea"
                            />
                        )}
                    </div>

                    {/* Footer */}
                    <div className="notepad-footer">
                        <div className="footer-stats">
                            <span className="word-count">
                                {getWordCount()} words
                            </span>
                            <span className="char-count">
                                {getCharacterCount()} characters
                            </span>
                        </div>
                        <div className="footer-status">
                            {saving
                                ? "Saving..."
                                : noteContent.trim()
                                ? "Saved"
                                : "Ready"}
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .notepad-container {
                    position: fixed;
                    z-index: 10000000;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI",
                        system-ui, sans-serif;
                    transition: transform 0.2s ease;
                }

                .notepad-minimized {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    background: rgba(101, 67, 33, 0.95);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(139, 69, 19, 0.3);
                    border-radius: 22px;
                    padding: 10px 14px;
                    cursor: grab;
                    transition: all 0.2s ease;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    width: fit-content;
                }

                .notepad-minimized:hover {
                    transform: scale(1.02);
                    background: rgba(101, 67, 33, 1);
                    border-color: rgba(139, 69, 19, 0.5);
                }

                .notepad-minimized:active {
                    cursor: grabbing;
                }

                .minimized-icon {
                    color: rgba(245, 245, 220, 0.9);
                }

                .minimized-info {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }

                .minimized-count {
                    color: rgba(245, 245, 220, 0.95);
                    font-weight: 700;
                    font-size: 13px;
                }

                .minimized-label {
                    color: rgba(245, 245, 220, 0.7);
                    font-size: 11px;
                    font-weight: 500;
                }

                .notepad-modal {
                    width: 380px;
                    height: 500px;
                    background: rgba(245, 245, 220, 0.95);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(139, 69, 19, 0.3);
                    border-radius: 14px;
                    overflow: hidden;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
                    display: flex;
                    flex-direction: column;
                }

                .notepad-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 10px 16px;
                    background: rgba(139, 69, 19, 0.1);
                    border-bottom: 1px solid rgba(139, 69, 19, 0.2);
                    cursor: grab;
                }

                .notepad-header:active {
                    cursor: grabbing;
                }

                .notepad-header-left {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .drag-handle {
                    color: rgba(139, 69, 19, 0.5);
                    cursor: grab;
                }

                .notepad-icon {
                    width: 22px;
                    height: 22px;
                    background: rgba(139, 69, 19, 0.2);
                    border-radius: 6px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: rgba(139, 69, 19, 0.8);
                }

                .notepad-title {
                    margin: 0;
                    font-size: 14px;
                    font-weight: 600;
                    color: rgba(101, 67, 33, 0.9);
                }

                .notepad-header-right {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }

                .notepad-minimize-btn,
                .notepad-close-btn {
                    width: 26px;
                    height: 26px;
                    background: rgba(139, 69, 19, 0.1);
                    border: none;
                    border-radius: 6px;
                    color: rgba(139, 69, 19, 0.7);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                }

                .notepad-minimize-btn:hover,
                .notepad-close-btn:hover {
                    background: rgba(139, 69, 19, 0.2);
                    color: rgba(139, 69, 19, 1);
                    transform: scale(1.05);
                }

                .notepad-domain-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 12px 16px 8px;
                    background: rgba(139, 69, 19, 0.05);
                }

                .domain-selector {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .domain-title {
                    margin: 0;
                    font-size: 16px;
                    font-weight: 700;
                    color: rgba(101, 67, 33, 0.9);
                    max-width: 200px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .domain-count {
                    background: rgba(139, 69, 19, 0.15);
                    color: rgba(139, 69, 19, 0.8);
                    font-size: 10px;
                    font-weight: 600;
                    padding: 2px 6px;
                    border-radius: 6px;
                }

                .status-indicator {
                    display: flex;
                    align-items: center;
                }

                .saving-spinner {
                    width: 12px;
                    height: 12px;
                    border: 2px solid rgba(139, 69, 19, 0.2);
                    border-top: 2px solid rgba(139, 69, 19, 0.8);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }

                .saved-icon {
                    color: rgba(34, 197, 94, 0.8);
                }

                .notepad-search-section {
                    padding: 10px 16px;
                    background: rgba(139, 69, 19, 0.05);
                    border-bottom: 1px solid rgba(139, 69, 19, 0.1);
                }

                .notepad-search-wrapper {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: rgba(245, 245, 220, 0.8);
                    border: 1px solid rgba(139, 69, 19, 0.2);
                    border-radius: 8px;
                    padding: 8px 10px;
                    transition: all 0.2s ease;
                }

                .notepad-search-wrapper:focus-within {
                    border-color: rgba(139, 69, 19, 0.4);
                    background: rgba(245, 245, 220, 0.95);
                    box-shadow: 0 0 0 2px rgba(139, 69, 19, 0.1);
                }

                .search-icon {
                    color: rgba(139, 69, 19, 0.6);
                }

                .notepad-search-input {
                    flex: 1;
                    border: none;
                    outline: none;
                    background: none;
                    font-size: 13px;
                    color: rgba(101, 67, 33, 0.9);
                    font-weight: 500;
                }

                .notepad-search-input::placeholder {
                    color: rgba(139, 69, 19, 0.5);
                }

                .notepad-tabs-section {
                    padding: 8px 16px;
                    background: rgba(139, 69, 19, 0.05);
                    border-bottom: 1px solid rgba(139, 69, 19, 0.1);
                }

                .domain-tabs {
                    display: flex;
                    gap: 4px;
                    overflow-x: auto;
                }

                .domain-tab {
                    padding: 6px 10px;
                    border: none;
                    background: rgba(245, 245, 220, 0.6);
                    border-radius: 6px;
                    font-size: 11px;
                    font-weight: 500;
                    color: rgba(139, 69, 19, 0.7);
                    cursor: pointer;
                    transition: all 0.2s ease;
                    white-space: nowrap;
                    flex-shrink: 0;
                }

                .domain-tab:hover {
                    background: rgba(245, 245, 220, 0.8);
                    color: rgba(139, 69, 19, 0.9);
                }

                .domain-tab.active {
                    background: rgba(139, 69, 19, 0.9);
                    color: rgba(245, 245, 220, 0.95);
                    font-weight: 600;
                }

                .notepad-editor {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }

                .loading-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    gap: 12px;
                    color: rgba(139, 69, 19, 0.6);
                }

                .loading-spinner {
                    width: 20px;
                    height: 20px;
                    border: 2px solid rgba(139, 69, 19, 0.2);
                    border-top: 2px solid rgba(139, 69, 19, 0.8);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }

                .notepad-textarea {
                    flex: 1;
                    background: rgba(245, 245, 220, 0.3);
                    border: none;
                    outline: none;
                    padding: 20px;
                    font-size: 14px;
                    line-height: 1.6;
                    color: rgba(101, 67, 33, 0.9);
                    resize: none;
                    font-family: "SF Mono", Monaco, "Cascadia Code",
                        "Roboto Mono", Consolas, "Courier New", monospace;
                    user-select: text;
                }

                .notepad-textarea::placeholder {
                    color: rgba(139, 69, 19, 0.4);
                }

                .notepad-textarea:focus {
                    background: rgba(245, 245, 220, 0.5);
                }

                .notepad-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 8px 16px;
                    background: rgba(139, 69, 19, 0.1);
                    border-top: 1px solid rgba(139, 69, 19, 0.2);
                }

                .footer-stats {
                    display: flex;
                    gap: 12px;
                    font-size: 10px;
                    color: rgba(139, 69, 19, 0.6);
                    font-weight: 500;
                }

                .footer-status {
                    font-size: 10px;
                    color: rgba(139, 69, 19, 0.7);
                    font-weight: 600;
                }

                @keyframes spin {
                    from {
                        transform: rotate(0deg);
                    }
                    to {
                        transform: rotate(360deg);
                    }
                }

                .domain-tabs::-webkit-scrollbar {
                    height: 3px;
                }

                .domain-tabs::-webkit-scrollbar-track {
                    background: transparent;
                }

                .domain-tabs::-webkit-scrollbar-thumb {
                    background: rgba(139, 69, 19, 0.3);
                    border-radius: 2px;
                }
            `}</style>
        </div>
    );
};

export default NotepadModal;
