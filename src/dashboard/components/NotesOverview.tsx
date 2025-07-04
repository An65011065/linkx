import React, { useState, useEffect, useRef } from "react";
import {
    FileText,
    Search,
    ChevronRight,
    Calendar,
    Plus,
    X,
    ArrowLeft,
    Save,
    Copy,
    Tag,
    ExternalLink,
} from "lucide-react";

interface Note {
    domain: string;
    content: string;
    lastModified: number;
    createdAt: number;
}

const NotesOverview: React.FC = () => {
    const [notes, setNotes] = useState<Note[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const [isAddingNote, setIsAddingNote] = useState(false);
    const [newNoteDomain, setNewNoteDomain] = useState("");
    const [newNoteContent, setNewNoteContent] = useState("");
    const [selectedNote, setSelectedNote] = useState<Note | null>(null);
    const [isSaving, setSaving] = useState(false);
    const [copyMessage, setCopyMessage] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadNotes();
    }, []);

    useEffect(() => {
        if (isSearchExpanded && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isSearchExpanded]);

    const loadNotes = async () => {
        try {
            const storage = await chrome.storage.local.get(null);
            const noteEntries: Note[] = [];

            for (const [key, value] of Object.entries(storage)) {
                if (key.startsWith("note_") && !key.includes("timestamp")) {
                    const domain = key.replace("note_", "");
                    const timestamp =
                        storage[`note_timestamp_${domain}`] || Date.now();
                    noteEntries.push({
                        domain,
                        content: value as string,
                        lastModified: timestamp,
                        createdAt:
                            storage[`note_created_${domain}`] || timestamp,
                    });
                }
            }

            noteEntries.sort((a, b) => b.createdAt - a.createdAt);
            setNotes(noteEntries);
        } catch (err) {
            console.error("Error loading notes:", err);
        }
    };

    const handleSaveNote = async (domain: string, content: string) => {
        try {
            setSaving(true);
            const timestamp = Date.now();

            await chrome.storage.local.set({
                [`note_${domain}`]: content,
                [`note_timestamp_${domain}`]: timestamp,
            });

            await loadNotes();
            if (selectedNote) {
                setSelectedNote((prev) => ({
                    ...prev!,
                    content,
                    lastModified: timestamp,
                }));
            }
        } catch (err) {
            console.error("Error saving note:", err);
        } finally {
            setSaving(false);
        }
    };

    const handleAddNote = async () => {
        if (!newNoteDomain.trim() || !newNoteContent.trim()) return;

        try {
            const timestamp = Date.now();
            const domain = newNoteDomain.trim();

            await chrome.storage.local.set({
                [`note_${domain}`]: newNoteContent,
                [`note_timestamp_${domain}`]: timestamp,
                [`note_created_${domain}`]: timestamp,
            });

            setNewNoteDomain("");
            setNewNoteContent("");
            setIsAddingNote(false);
            loadNotes();
        } catch (err) {
            console.error("Error saving note:", err);
        }
    };

    const handleCopyNote = async (content: string) => {
        if (content.trim()) {
            try {
                await navigator.clipboard.writeText(content);
                setCopyMessage("Note copied to clipboard");
                setTimeout(() => setCopyMessage(""), 2000);
            } catch (err) {
                console.error("Failed to copy note:", err);
            }
        }
    };

    const addTimestamp = (
        content: string,
        setContent: (content: string) => void,
    ) => {
        const timestamp = new Date().toLocaleString();
        const newText =
            content + (content ? "\n\n" : "") + `--- ${timestamp} ---\n`;
        setContent(newText);

        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.focus();
                textareaRef.current.selectionStart =
                    textareaRef.current.selectionEnd = newText.length;
            }
        }, 0);
    };

    const formatLastModified = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
        });
    };

    const getPreviewText = (content: string) => {
        return content.length > 100 ? content.slice(0, 100) + "..." : content;
    };

    const openLink = (domain: string) => {
        window.open(`https://${domain}`, "_blank");
    };

    const handleSearchIconClick = () => {
        if (isSearchExpanded) {
            setSearchQuery("");
            setIsSearchExpanded(false);
        } else {
            setIsSearchExpanded(true);
        }
    };

    const filteredNotes = notes.filter(
        (note) =>
            note.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
            note.content.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    // Render note editor (used for both viewing and editing)
    const renderNoteEditor = (
        note: Note,
        onClose: () => void,
        isNew = false,
    ) => (
        <div
            style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "rgba(0, 0, 0, 0.8)",
                backdropFilter: "blur(4px)",
                display: "flex",
                flexDirection: "column",
                borderRadius: "16px",
                padding: "20px",
            }}
        >
            {/* Header */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "12px",
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
                        onClick={onClose}
                        style={{
                            background: "none",
                            border: "none",
                            padding: "8px",
                            cursor: "pointer",
                            color: "#ffffff",
                            display: "flex",
                            alignItems: "center",
                        }}
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div
                            style={{
                                fontSize: "16px",
                                color: "#ffffff",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                fontFamily:
                                    "system-ui, -apple-system, sans-serif",
                            }}
                        >
                            <Tag size={16} />
                            {note.domain}
                        </div>
                        <div
                            style={{
                                fontSize: "12px",
                                color: "rgba(255, 255, 255, 0.6)",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                fontFamily:
                                    "system-ui, -apple-system, sans-serif",
                            }}
                        >
                            {isSaving ? (
                                <>
                                    <Save size={12} />
                                    Saving...
                                </>
                            ) : (
                                formatLastModified(note.lastModified)
                            )}
                        </div>
                    </div>
                </div>

                {/* Action buttons */}
                <div style={{ display: "flex", gap: "8px" }}>
                    <button
                        onClick={() =>
                            addTimestamp(
                                isNew ? newNoteContent : selectedNote!.content,
                                isNew
                                    ? setNewNoteContent
                                    : (content) =>
                                          handleSaveNote(note.domain, content),
                            )
                        }
                        style={{
                            background: "none",
                            border: "none",
                            padding: "6px",
                            cursor: "pointer",
                            color: "#ffffff",
                        }}
                        title="Add timestamp"
                    >
                        <Calendar size={16} />
                    </button>

                    <button
                        onClick={() =>
                            handleCopyNote(
                                isNew ? newNoteContent : note.content,
                            )
                        }
                        style={{
                            background: "none",
                            border: "none",
                            padding: "6px",
                            cursor: "pointer",
                            color: "#ffffff",
                        }}
                        title="Copy note"
                    >
                        <Copy size={16} />
                    </button>

                    {!isNew && (
                        <button
                            onClick={() => openLink(note.domain)}
                            style={{
                                background: "none",
                                border: "none",
                                padding: "6px",
                                cursor: "pointer",
                                color: "#ffffff",
                            }}
                            title="Open link"
                        >
                            <ExternalLink size={16} />
                        </button>
                    )}
                </div>
            </div>

            {/* Copy message */}
            {copyMessage && (
                <div
                    style={{
                        fontSize: "12px",
                        color: "#4285f4",
                        textAlign: "center",
                        marginBottom: "8px",
                        fontFamily: "system-ui, -apple-system, sans-serif",
                    }}
                >
                    {copyMessage}
                </div>
            )}

            {/* Note content */}
            <textarea
                ref={textareaRef}
                value={isNew ? newNoteContent : note.content}
                onChange={(e) => {
                    if (isNew) {
                        setNewNoteContent(e.target.value);
                    } else {
                        handleSaveNote(note.domain, e.target.value);
                    }
                }}
                placeholder={`Write your note about ${note.domain}...`}
                style={{
                    flex: 1,
                    padding: "16px",
                    background: "rgba(255, 255, 255, 0.1)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    borderRadius: "12px",
                    resize: "none",
                    fontSize: "14px",
                    fontFamily: "system-ui, -apple-system, sans-serif",
                    lineHeight: "1.6",
                    color: "#ffffff",
                    outline: "none",
                }}
            />

            {isNew && (
                <div
                    style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: "8px",
                        marginTop: "16px",
                    }}
                >
                    <button
                        onClick={onClose}
                        style={{
                            padding: "8px 16px",
                            borderRadius: "8px",
                            border: "1px solid rgba(255, 255, 255, 0.2)",
                            background: "transparent",
                            color: "#ffffff",
                            cursor: "pointer",
                            fontSize: "14px",
                            fontFamily: "system-ui, -apple-system, sans-serif",
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleAddNote}
                        style={{
                            padding: "8px 16px",
                            borderRadius: "8px",
                            border: "none",
                            background: "#4285f4",
                            color: "#ffffff",
                            cursor: "pointer",
                            fontSize: "14px",
                            fontFamily: "system-ui, -apple-system, sans-serif",
                        }}
                    >
                        Add Note
                    </button>
                </div>
            )}
        </div>
    );

    return (
        <div
            style={{
                background: "rgba(255, 255, 255, 0.05)",
                borderRadius: "16px",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                backdropFilter: "blur(10px)",
                padding: "12px",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                position: "relative",
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
                    <FileText size={20} color="#ffffff" />
                    <h3
                        style={{
                            margin: 0,
                            fontSize: "16px",
                            fontWeight: 600,
                            color: "#ffffff",
                            fontFamily: "system-ui, -apple-system, sans-serif",
                        }}
                    >
                        Site Notes
                    </h3>
                </div>

                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                    }}
                >
                    {/* Search Icon/Bar */}
                    <div
                        style={{
                            position: "relative",
                            display: "flex",
                            alignItems: "center",
                            transition: "all 0.3s ease",
                            width: isSearchExpanded ? "200px" : "32px",
                        }}
                    >
                        {isSearchExpanded ? (
                            <div
                                style={{
                                    position: "relative",
                                    width: "100%",
                                }}
                            >
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                    placeholder="Search notes..."
                                    style={{
                                        width: "100%",
                                        padding: "6px 30px 6px 12px",
                                        borderRadius: "8px",
                                        border: "1px solid rgba(255, 255, 255, 0.2)",
                                        background: "rgba(255, 255, 255, 0.1)",
                                        color: "#ffffff",
                                        fontSize: "14px",
                                        outline: "none",
                                        fontFamily:
                                            "system-ui, -apple-system, sans-serif",
                                        boxSizing: "border-box",
                                    }}
                                    onBlur={() => {
                                        if (!searchQuery) {
                                            setIsSearchExpanded(false);
                                        }
                                    }}
                                />
                                <button
                                    onClick={handleSearchIconClick}
                                    style={{
                                        position: "absolute",
                                        right: "6px",
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        background: "none",
                                        border: "none",
                                        padding: "2px",
                                        cursor: "pointer",
                                        color: "rgba(255, 255, 255, 0.5)",
                                        display: "flex",
                                        alignItems: "center",
                                    }}
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={handleSearchIconClick}
                                style={{
                                    padding: "6px",
                                    borderRadius: "8px",
                                    // border: "1px solid rgba(255, 255, 255, 0.2)",
                                    // background: "rgba(255, 255, 255, 0.1)",
                                    color: "#ffffff",
                                    cursor: "pointer",
                                    transition: "all 0.2s ease",
                                    display: "flex",
                                    alignItems: "center",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background =
                                        "rgba(255, 255, 255, 0.15)";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background =
                                        "transparent";
                                }}
                            >
                                <Search size={16} />
                            </button>
                        )}
                    </div>
                    {/* New Note Button */}
                    <button
                        onClick={() => setIsAddingNote(true)}
                        style={{
                            padding: "6px",
                            borderRadius: "8px",
                            // border: "1px solid rgba(255, 255, 255, 0.2)",
                            // background: "rgba(255, 255, 255, 0.1)",
                            color: "#ffffff",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            display: "flex",
                            alignItems: "center",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background =
                                "rgba(255, 255, 255, 0.15)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                        }}
                        title="New Note"
                    >
                        <Plus size={18} />
                    </button>
                </div>
            </div>

            {/* Notes List */}
            <div
                style={{
                    flex: 1,
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column",
                    marginRight: "-8px",
                    paddingRight: "8px",
                }}
            >
                {filteredNotes.map((note, index) => (
                    <div key={note.domain}>
                        <div
                            onClick={() => setSelectedNote(note)}
                            style={{
                                padding: "8px 0",
                                cursor: "pointer",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    marginBottom: "4px",
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: "14px",
                                        fontWeight: 600,
                                        color: "#ffffff",
                                        fontFamily:
                                            "system-ui, -apple-system, sans-serif",
                                    }}
                                >
                                    {note.domain}
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "6px",
                                        fontSize: "12px",
                                        color: "rgba(255, 255, 255, 0.5)",
                                        fontFamily:
                                            "system-ui, -apple-system, sans-serif",
                                    }}
                                >
                                    {formatLastModified(note.lastModified)}
                                    <ChevronRight size={14} />
                                </div>
                            </div>
                            <div
                                style={{
                                    fontSize: "13px",
                                    color: "rgba(255, 255, 255, 0.7)",
                                    fontFamily:
                                        "system-ui, -apple-system, sans-serif",
                                    lineHeight: "1.4",
                                }}
                            >
                                {getPreviewText(note.content)}
                            </div>
                        </div>
                        {index < filteredNotes.length - 1 && (
                            <div
                                style={{
                                    height: "1px",
                                    background: "rgba(255, 255, 255, 0.1)",
                                    margin: "8px 0",
                                }}
                            />
                        )}
                    </div>
                ))}

                {filteredNotes.length === 0 && !isAddingNote && (
                    <div
                        style={{
                            padding: "16px 0",
                            textAlign: "center",
                            color: "rgba(255, 255, 255, 0.5)",
                            fontSize: "14px",
                            fontFamily: "system-ui, -apple-system, sans-serif",
                        }}
                    >
                        {searchQuery
                            ? "No matching notes found"
                            : "No notes yet"}
                    </div>
                )}
            </div>

            {/* Note Editor Modal */}
            {selectedNote &&
                renderNoteEditor(selectedNote, () => setSelectedNote(null))}

            {/* New Note Modal */}
            {isAddingNote &&
                renderNoteEditor(
                    {
                        domain: newNoteDomain,
                        content: newNoteContent,
                        lastModified: Date.now(),
                        createdAt: Date.now(),
                    },
                    () => {
                        setIsAddingNote(false);
                        setNewNoteDomain("");
                        setNewNoteContent("");
                    },
                    true,
                )}
        </div>
    );
};

export default NotesOverview;
