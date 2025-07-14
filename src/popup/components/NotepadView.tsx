import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, Save, Copy, Calendar, Tag } from "lucide-react";

interface Note {
    id?: string;
    domain: string;
    content: string;
    lastModified: number;
    createdAt: number;
}

interface NotepadViewProps {
    currentDomain: string;
    onBack: () => void;
    // New props for backend integration
    onSaveNote: (domain: string, content: string) => Promise<void>;
    onLoadNote: (domain: string) => Promise<Note | null>;
    onNoteUpdated?: () => void; // Optional callback to refresh parent
}

const NotepadView: React.FC<NotepadViewProps> = ({
    currentDomain,
    onBack,
    onSaveNote,
    onLoadNote,
    onNoteUpdated,
}) => {
    const [note, setNote] = useState("");
    const [isSaving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [copyMessage, setCopyMessage] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Load existing note on mount
    useEffect(() => {
        const loadNote = async () => {
            try {
                setIsLoading(true);
                setLoadError(null);
                console.log(`🔄 Loading note for domain: ${currentDomain}`);

                const existingNote = await onLoadNote(currentDomain);

                if (existingNote) {
                    setNote(existingNote.content);
                    setLastSaved(new Date(existingNote.lastModified));
                    console.log(`✅ Loaded note for ${currentDomain}`);
                } else {
                    // No existing note, start fresh
                    setNote("");
                    setLastSaved(null);
                    console.log(
                        `📝 No existing note for ${currentDomain}, starting fresh`,
                    );
                }
            } catch (err) {
                console.error("❌ Error loading note:", err);
                setLoadError("Failed to load note");
                setNote(""); // Start fresh on error
            } finally {
                setIsLoading(false);
            }
        };

        loadNote();
    }, [currentDomain, onLoadNote]);

    // Auto-save note with debounce
    useEffect(() => {
        if (note === "" || isLoading) return; // Don't save empty notes or while loading

        const saveNote = async () => {
            try {
                setSaving(true);
                console.log(`💾 Auto-saving note for ${currentDomain}`);

                await onSaveNote(currentDomain, note);

                setLastSaved(new Date());
                setLoadError(null); // Clear any previous errors

                // Notify parent that note was updated
                if (onNoteUpdated) {
                    onNoteUpdated();
                }

                console.log(`✅ Note saved for ${currentDomain}`);
            } catch (err) {
                console.error("❌ Error saving note:", err);
                setLoadError("Failed to save note");
            } finally {
                setSaving(false);
            }
        };

        const timeoutId = setTimeout(saveNote, 1000); // 1 second debounce (matching NotesOverview)

        return () => clearTimeout(timeoutId);
    }, [note, currentDomain, onSaveNote, onNoteUpdated, isLoading]);

    const handleCopyNote = async () => {
        if (note.trim()) {
            try {
                await navigator.clipboard.writeText(note);
                setCopyMessage("Note copied to clipboard");

                // Clear message after 2 seconds
                setTimeout(() => {
                    setCopyMessage("");
                }, 2000);
            } catch (err) {
                console.error("Failed to copy note:", err);
            }
        }
    };

    const addTimestamp = () => {
        const timestamp = new Date().toLocaleString();
        const newText = note + (note ? "\n\n" : "") + `--- ${timestamp} ---\n`;
        setNote(newText);

        // Focus and move cursor to end
        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.focus();
                textareaRef.current.selectionStart =
                    textareaRef.current.selectionEnd = newText.length;
            }
        }, 0);
    };

    const formatLastSaved = (date: Date) => {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));

        if (diffMins < 1) return "Just saved";
        if (diffMins < 60) return `Saved ${diffMins}m ago`;
        if (diffMins < 1440) return `Saved ${Math.floor(diffMins / 60)}h ago`;
        return `Saved ${date.toLocaleDateString()}`;
    };

    // Show loading state
    if (isLoading) {
        return (
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "12px",
                }}
            >
                <div
                    style={{
                        width: "24px",
                        height: "24px",
                        border: "2px solid #e9ecef",
                        borderTop: "2px solid #4285f4",
                        borderRadius: "50%",
                        animation: "spin 1s linear infinite",
                    }}
                />
                <div
                    style={{
                        fontSize: "14px",
                        color: "#6c757d",
                        fontFamily: "Nunito-Regular",
                    }}
                >
                    Loading note for {currentDomain}...
                </div>
                <style>
                    {`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}
                </style>
            </div>
        );
    }

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
                gap: "12px",
            }}
        >
            {/* Header */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
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
                            transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#f8f9fa";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor =
                                "transparent";
                        }}
                    >
                        <ArrowLeft size={20} color="#495057" />
                    </button>
                    <div>
                        <div
                            style={{
                                fontSize: "16px",
                                fontFamily: "Nunito-Bold",
                                color: "#2c3e50",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                            }}
                        >
                            <Tag size={16} color="#495057" />
                            {currentDomain}
                        </div>
                        <div
                            style={{
                                fontSize: "12px",
                                color: loadError ? "#dc3545" : "#6c757d",
                                fontFamily: "Nunito-Regular",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                            }}
                        >
                            {loadError ? (
                                loadError
                            ) : isSaving ? (
                                <>
                                    <Save size={12} color="#495057" />
                                    Saving...
                                </>
                            ) : lastSaved ? (
                                formatLastSaved(lastSaved)
                            ) : (
                                "Start typing to save"
                            )}
                        </div>
                    </div>
                </div>

                {/* Action buttons */}
                <div style={{ display: "flex", gap: "4px" }}>
                    <button
                        onClick={addTimestamp}
                        style={{
                            background: "none",
                            border: "none",
                            padding: "6px",
                            cursor: "pointer",
                            borderRadius: "6px",
                            display: "flex",
                            alignItems: "center",
                            transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#f8f9fa";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor =
                                "transparent";
                        }}
                        title="Add timestamp"
                    >
                        <Calendar size={16} color="#495057" />
                    </button>

                    {note.trim() && (
                        <button
                            onClick={handleCopyNote}
                            style={{
                                background: "none",
                                border: "none",
                                padding: "6px",
                                cursor: "pointer",
                                borderRadius: "6px",
                                display: "flex",
                                alignItems: "center",
                                transition: "all 0.2s ease",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor =
                                    "#f8f9fa";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor =
                                    "transparent";
                            }}
                            title="Copy note"
                        >
                            <Copy size={16} color="#495057" />
                        </button>
                    )}
                </div>
            </div>

            {/* Error message */}
            {loadError && (
                <div
                    style={{
                        padding: "12px",
                        backgroundColor: "#f8d7da",
                        color: "#721c24",
                        border: "1px solid #f5c6cb",
                        borderRadius: "8px",
                        fontSize: "14px",
                        fontFamily: "Nunito-Regular",
                    }}
                >
                    {loadError}
                </div>
            )}

            {/* Copy message */}
            {copyMessage && (
                <div
                    style={{
                        fontSize: "12px",
                        color: "#28a745",
                        fontFamily: "Nunito-Regular",
                        textAlign: "center",
                    }}
                >
                    {copyMessage}
                </div>
            )}

            {/* Notepad */}
            <textarea
                ref={textareaRef}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={`Jot down thoughts about ${currentDomain}...\n\nTips:\n• Use the calendar icon to add timestamps\n• Notes auto-save as you type\n• Perfect for research, ideas, or reminders`}
                disabled={!!loadError} // Disable if there's an error
                style={{
                    flex: 1,
                    padding: "16px",
                    border: loadError
                        ? "1px solid #dc3545"
                        : "1px solid #e9ecef",
                    borderRadius: "12px",
                    resize: "none",
                    fontSize: "14px",
                    fontFamily: "Nunito-Regular",
                    lineHeight: "1.6",
                    color: loadError ? "#6c757d" : "#2c3e50",
                    backgroundColor: loadError ? "#f8f9fa" : "#fdfdfd",
                    outline: "none",
                    transition: "all 0.2s ease",
                    opacity: loadError ? 0.6 : 1,
                }}
                onFocus={(e) => {
                    if (!loadError) {
                        e.currentTarget.style.backgroundColor = "white";
                        e.currentTarget.style.borderColor = "#4285f4";
                        e.currentTarget.style.boxShadow =
                            "0 0 0 3px rgba(66, 133, 244, 0.1)";
                    }
                }}
                onBlur={(e) => {
                    if (!loadError) {
                        e.currentTarget.style.backgroundColor = "#fdfdfd";
                        e.currentTarget.style.borderColor = "#e9ecef";
                        e.currentTarget.style.boxShadow = "none";
                    }
                }}
            />
        </div>
    );
};

export default NotepadView;
