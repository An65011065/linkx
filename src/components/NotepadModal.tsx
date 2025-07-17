import React, { useState, useEffect, useRef } from "react";
import {
    X,
    Search,
    FileText,
    GripVertical,
    ChevronLeft,
    ChevronRight,
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
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [position, setPosition] = useState({ x: 20, y: 100 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    const modalRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const dragHandleRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isVisible) {
            loadAllNotes(); // Load all notes first
        }
    }, [isVisible]);

    // Separate effect for loading domain-specific note
    useEffect(() => {
        if (isVisible && selectedDomain) {
            loadNoteForDomain(selectedDomain);
        }
    }, [selectedDomain]);

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
                // Create new note for this domain
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
            console.log("📚 Loading all notes for cross-domain access...");
            const response = await chrome.runtime.sendMessage({
                type: "LOAD_ALL_NOTES",
            });

            if (response && response.success) {
                console.log(
                    "✅ Loaded notes:",
                    response.notes.map((n) => n.domain),
                );
                setAllNotes(response.notes || []);
            } else {
                console.warn("⚠️ No notes received or request failed");
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
                await loadAllNotes(); // Refresh the notes list
            }
        } catch (error) {
            console.error("Error saving note:", error);
        } finally {
            setSaving(false);
        }
    };

    const switchToDomain = (targetDomain: string) => {
        setSelectedDomain(targetDomain);
        setSearchQuery(""); // Clear search when switching domains
    };

    // Auto-save on content change (debounced)
    useEffect(() => {
        if (!noteContent.trim() || loading) return;

        const timeoutId = setTimeout(() => {
            saveNote();
        }, 1000); // 1 second debounce

        return () => clearTimeout(timeoutId);
    }, [noteContent, selectedDomain]);

    // Filter notes based on search
    const filteredNotes = allNotes.filter(
        (note) =>
            note.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
            note.content.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    // Get unique domains for the domain list
    const uniqueDomains = Array.from(
        new Set([selectedDomain, ...allNotes.map((note) => note.domain)]),
    );

    // Drag and drop functionality
    const handleMouseDown = (e: React.MouseEvent) => {
        if (!dragHandleRef.current?.contains(e.target as Node)) return;

        setIsDragging(true);
        const rect = modalRef.current?.getBoundingClientRect();
        if (rect) {
            setDragOffset({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            });
        }
        e.preventDefault();
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;

            const newX = e.clientX - dragOffset.x;
            const newY = e.clientY - dragOffset.y;

            // Keep within viewport bounds
            const maxX = window.innerWidth - (isCollapsed ? 60 : 320);
            const maxY = window.innerHeight - 400;

            setPosition({
                x: Math.max(0, Math.min(newX, maxX)),
                y: Math.max(0, Math.min(newY, maxY)),
            });
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("mouseup", handleMouseUp);
        }

        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isDragging, dragOffset, isCollapsed]);

    // Prevent event propagation to avoid interfering with page inputs
    const handleKeyDown = (e: React.KeyboardEvent) => {
        e.stopPropagation();
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        e.stopPropagation();
        setNoteContent(e.target.value);
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.stopPropagation();
        setSearchQuery(e.target.value);
    };

    if (!isVisible) return null;

    return (
        <div
            ref={modalRef}
            className="sticky-notepad"
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
                width: isCollapsed ? "60px" : "320px",
            }}
            onMouseDown={handleMouseDown}
        >
            {/* Drag Handle & Header */}
            <div ref={dragHandleRef} className="notepad-header">
                <GripVertical size={12} className="drag-handle" />
                {!isCollapsed && (
                    <>
                        <FileText size={12} />
                        <span className="domain-title">{selectedDomain}</span>
                    </>
                )}
                <div className="header-controls">
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="collapse-btn"
                    >
                        {isCollapsed ? (
                            <ChevronRight size={12} />
                        ) : (
                            <ChevronLeft size={12} />
                        )}
                    </button>
                    <button onClick={onClose} className="close-btn">
                        <X size={12} />
                    </button>
                </div>
            </div>

            {!isCollapsed && (
                <>
                    {/* Search Bar */}
                    <div className="search-section">
                        <div className="search-bar">
                            <Search size={12} />
                            <input
                                type="text"
                                placeholder="Search notes..."
                                value={searchQuery}
                                onChange={handleSearchChange}
                                onKeyDown={handleKeyDown}
                                className="search-input"
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    </div>

                    {/* Domain Tabs */}
                    <div className="domain-tabs">
                        {/* Current domain first - always stays in first position */}
                        <button
                            onClick={() => switchToDomain(domain)}
                            className={`domain-tab ${
                                selectedDomain === domain ? "active" : ""
                            }`}
                        >
                            {domain.length > 10
                                ? domain.substring(0, 10) + "..."
                                : domain}
                        </button>

                        {/* Other domains from all notes */}
                        {Array.from(
                            new Set(allNotes.map((note) => note.domain)),
                        )
                            .filter((domainName) => domainName !== domain)
                            .slice(0, 3)
                            .map((domainName) => (
                                <button
                                    key={domainName}
                                    onClick={() => switchToDomain(domainName)}
                                    className={`domain-tab ${
                                        selectedDomain === domainName
                                            ? "active"
                                            : ""
                                    }`}
                                >
                                    {domainName.length > 10
                                        ? domainName.substring(0, 10) + "..."
                                        : domainName}
                                </button>
                            ))}
                    </div>

                    {/* Note Editor */}
                    <div className="note-editor">
                        {loading ? (
                            <div className="loading">
                                <div className="spinner"></div>
                            </div>
                        ) : (
                            <textarea
                                ref={textareaRef}
                                value={noteContent}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                                onClick={(e) => e.stopPropagation()}
                                onFocus={(e) => e.stopPropagation()}
                                placeholder={`Notes for ${selectedDomain}...`}
                                className="note-textarea"
                            />
                        )}
                    </div>

                    {/* Status Footer */}
                    <div className="notepad-footer">
                        <span className="status-text">
                            {saving
                                ? "Saving..."
                                : noteContent.trim()
                                ? "Saved"
                                : "Type to start..."}
                        </span>
                        <span className="char-count">{noteContent.length}</span>
                    </div>
                </>
            )}

            <style jsx>{`
                .sticky-notepad {
                    position: fixed;
                    background: rgba(255, 248, 220, 0.98);
                    border: 1px solid rgba(218, 165, 32, 0.3);
                    border-radius: 8px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15),
                        0 0 0 1px rgba(255, 248, 220, 0.5);
                    z-index: 9999999;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI",
                        Roboto, sans-serif;
                    animation: slideInLeft 0.3s ease-out;
                    transition: width 0.2s ease;
                    user-select: none;
                    height: 400px;
                    display: flex;
                    flex-direction: column;
                }

                .notepad-header {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 8px 10px;
                    background: rgba(255, 235, 59, 0.2);
                    border-bottom: 1px solid rgba(218, 165, 32, 0.2);
                    cursor: move;
                    flex-shrink: 0;
                }

                .drag-handle {
                    color: rgba(139, 69, 19, 0.7);
                    cursor: grab;
                }

                .drag-handle:active {
                    cursor: grabbing;
                }

                .domain-title {
                    flex: 1;
                    font-size: 12px;
                    font-weight: 600;
                    color: rgba(139, 69, 19, 0.9);
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .header-controls {
                    display: flex;
                    gap: 4px;
                }

                .collapse-btn,
                .close-btn {
                    width: 18px;
                    height: 18px;
                    border: none;
                    background: rgba(139, 69, 19, 0.1);
                    border-radius: 3px;
                    color: rgba(139, 69, 19, 0.7);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.15s ease;
                }

                .collapse-btn:hover,
                .close-btn:hover {
                    background: rgba(139, 69, 19, 0.2);
                    color: rgba(139, 69, 19, 0.9);
                }

                .search-section {
                    padding: 8px 10px;
                    border-bottom: 1px solid rgba(218, 165, 32, 0.2);
                    flex-shrink: 0;
                }

                .search-bar {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    background: rgba(255, 255, 255, 0.7);
                    border-radius: 4px;
                    padding: 6px 8px;
                    border: 1px solid rgba(218, 165, 32, 0.2);
                }

                .search-input {
                    flex: 1;
                    background: none;
                    border: none;
                    outline: none;
                    font-size: 11px;
                    color: rgba(139, 69, 19, 0.9);
                }

                .search-input::placeholder {
                    color: rgba(139, 69, 19, 0.5);
                }

                .domain-tabs {
                    display: flex;
                    gap: 2px;
                    padding: 6px 8px;
                    border-bottom: 1px solid rgba(218, 165, 32, 0.2);
                    flex-shrink: 0;
                    overflow-x: auto;
                }

                .domain-tab {
                    padding: 4px 8px;
                    border: none;
                    background: rgba(255, 255, 255, 0.5);
                    border-radius: 3px;
                    font-size: 10px;
                    color: rgba(139, 69, 19, 0.7);
                    cursor: pointer;
                    transition: all 0.15s ease;
                    white-space: nowrap;
                    flex-shrink: 0;
                }

                .domain-tab:hover {
                    background: rgba(255, 255, 255, 0.8);
                }

                .domain-tab.active {
                    background: rgba(255, 235, 59, 0.6);
                    color: rgba(139, 69, 19, 0.9);
                    font-weight: 600;
                }

                .note-editor {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }

                .loading {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                }

                .spinner {
                    width: 14px;
                    height: 14px;
                    border: 2px solid rgba(218, 165, 32, 0.2);
                    border-top: 2px solid rgba(218, 165, 32, 0.8);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }

                .note-textarea {
                    flex: 1;
                    background: rgba(255, 255, 255, 0.3);
                    border: none;
                    outline: none;
                    padding: 12px;
                    font-size: 12px;
                    line-height: 1.4;
                    color: rgba(139, 69, 19, 0.9);
                    resize: none;
                    font-family: "SF Mono", Monaco, "Cascadia Code",
                        "Roboto Mono", Consolas, "Courier New", monospace;
                    user-select: text;
                }

                .note-textarea::placeholder {
                    color: rgba(139, 69, 19, 0.4);
                }

                .note-textarea:focus {
                    background: rgba(255, 255, 255, 0.5);
                }

                .notepad-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 6px 10px;
                    background: rgba(255, 235, 59, 0.1);
                    border-top: 1px solid rgba(218, 165, 32, 0.2);
                    flex-shrink: 0;
                }

                .status-text {
                    font-size: 10px;
                    color: rgba(139, 69, 19, 0.6);
                }

                .char-count {
                    font-size: 10px;
                    color: rgba(139, 69, 19, 0.5);
                }

                @keyframes slideInLeft {
                    from {
                        transform: translateX(-100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }

                @keyframes spin {
                    from {
                        transform: rotate(0deg);
                    }
                    to {
                        transform: rotate(360deg);
                    }
                }

                /* Scrollbar styling */
                .domain-tabs::-webkit-scrollbar {
                    height: 2px;
                }

                .domain-tabs::-webkit-scrollbar-track {
                    background: transparent;
                }

                .domain-tabs::-webkit-scrollbar-thumb {
                    background: rgba(218, 165, 32, 0.3);
                    border-radius: 1px;
                }
            `}</style>
        </div>
    );
};

export default NotepadModal;
