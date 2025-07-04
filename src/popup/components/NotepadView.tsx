import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, Save, Copy, Calendar, Tag } from "lucide-react";

interface NotepadViewProps {
    currentDomain: string;
    onBack: () => void;
}

const NotepadView: React.FC<NotepadViewProps> = ({ currentDomain, onBack }) => {
    const [note, setNote] = useState("");
    const [isSaving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [copyMessage, setCopyMessage] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Load existing note on mount
    useEffect(() => {
        const loadNote = async () => {
            try {
                const key = `note_${currentDomain}`;
                const result = await chrome.storage.local.get(key);
                if (result[key]) {
                    setNote(result[key]);
                    // Get last saved timestamp
                    const timestampKey = `note_timestamp_${currentDomain}`;
                    const timestampResult = await chrome.storage.local.get(
                        timestampKey,
                    );
                    if (timestampResult[timestampKey]) {
                        setLastSaved(new Date(timestampResult[timestampKey]));
                    }
                }
            } catch (err) {
                console.error("Error loading note:", err);
            }
        };
        loadNote();
    }, [currentDomain]);

    // Auto-save note with debounce
    useEffect(() => {
        if (note === "") return; // Don't save empty notes

        const saveNote = async () => {
            try {
                setSaving(true);
                const key = `note_${currentDomain}`;
                const timestampKey = `note_timestamp_${currentDomain}`;
                const timestamp = Date.now();

                await chrome.storage.local.set({
                    [key]: note,
                    [timestampKey]: timestamp,
                });

                setLastSaved(new Date(timestamp));
            } catch (err) {
                console.error("Error saving note:", err);
            } finally {
                setSaving(false);
            }
        };

        const timeoutId = setTimeout(saveNote, 500); // Debounce for 500ms

        return () => clearTimeout(timeoutId);
    }, [note, currentDomain]);

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
                                color: "#6c757d",
                                fontFamily: "Nunito-Regular",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                            }}
                        >
                            {isSaving ? (
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
                style={{
                    flex: 1,
                    padding: "16px",
                    border: "1px solid #e9ecef",
                    borderRadius: "12px",
                    resize: "none",
                    fontSize: "14px",
                    fontFamily: "Nunito-Regular",
                    lineHeight: "1.6",
                    color: "#2c3e50",
                    backgroundColor: "#fdfdfd",
                    outline: "none",
                    transition: "all 0.2s ease",
                }}
                onFocus={(e) => {
                    e.currentTarget.style.backgroundColor = "white";
                    e.currentTarget.style.borderColor = "#4285f4";
                    e.currentTarget.style.boxShadow =
                        "0 0 0 3px rgba(66, 133, 244, 0.1)";
                }}
                onBlur={(e) => {
                    e.currentTarget.style.backgroundColor = "#fdfdfd";
                    e.currentTarget.style.borderColor = "#e9ecef";
                    e.currentTarget.style.boxShadow = "none";
                }}
            />
        </div>
    );
};

export default NotepadView;
