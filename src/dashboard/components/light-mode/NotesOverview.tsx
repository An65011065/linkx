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
        <div className="absolute inset-0 bg-white rounded-2xl flex flex-col p-5 border border-gray-200 shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-gray-800"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="text-lg font-medium text-black flex items-center gap-2">
                            <Tag size={16} />
                            {isNew ? (
                                <input
                                    type="text"
                                    value={newNoteDomain}
                                    onChange={(e) =>
                                        setNewNoteDomain(e.target.value)
                                    }
                                    placeholder="Enter domain..."
                                    className="bg-transparent border-none outline-none text-black placeholder-gray-400"
                                />
                            ) : (
                                note.domain
                            )}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-2">
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
                <div className="flex gap-2">
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
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-gray-800"
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
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-gray-800"
                        title="Copy note"
                    >
                        <Copy size={16} />
                    </button>

                    {!isNew && (
                        <button
                            onClick={() => openLink(note.domain)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-gray-800"
                            title="Open link"
                        >
                            <ExternalLink size={16} />
                        </button>
                    )}
                </div>
            </div>

            {/* Copy message */}
            {copyMessage && (
                <div className="text-sm text-blue-600 text-center mb-2">
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
                className="flex-1 p-4 bg-gray-50 border border-gray-200 rounded-lg resize-none text-sm leading-relaxed text-black placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            {isNew && (
                <div className="flex justify-end gap-2 mt-4">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors text-sm"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleAddNote}
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm"
                    >
                        Add Note
                    </button>
                </div>
            )}
        </div>
    );

    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-3 h-full flex flex-col gap-3 relative">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <FileText size={20} className="text-gray-600" />
                    <h3 className="text-lg font-medium text-black">
                        Site Notes
                    </h3>
                </div>

                <div className="flex items-center gap-2">
                    {/* Search Icon/Bar */}
                    <div
                        className="relative flex items-center transition-all duration-300"
                        style={{ width: isSearchExpanded ? "200px" : "32px" }}
                    >
                        {isSearchExpanded ? (
                            <div className="relative w-full">
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                    placeholder="Search notes..."
                                    className="w-full py-2 px-3 pr-8 rounded-lg border border-gray-200 bg-gray-50 text-black text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                                    onBlur={() => {
                                        if (!searchQuery) {
                                            setIsSearchExpanded(false);
                                        }
                                    }}
                                />
                                <button
                                    onClick={handleSearchIconClick}
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={handleSearchIconClick}
                                className="p-2 rounded-lg text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-all duration-200"
                            >
                                <Search size={16} />
                            </button>
                        )}
                    </div>
                    {/* New Note Button */}
                    <button
                        onClick={() => setIsAddingNote(true)}
                        className="p-2 rounded-lg text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-all duration-200"
                        title="New Note"
                    >
                        <Plus size={18} />
                    </button>
                </div>
            </div>

            {/* Notes List */}
            <div className="flex-1 overflow-y-auto flex flex-col -mr-2 pr-2">
                {filteredNotes.map((note, index) => (
                    <div key={note.domain}>
                        <div
                            onClick={() => setSelectedNote(note)}
                            className="py-2 cursor-pointer hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-colors"
                        >
                            <div className="flex items-center justify-between mb-1">
                                <div className="text-sm font-semibold text-black">
                                    {note.domain}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    {formatLastModified(note.lastModified)}
                                    <ChevronRight size={14} />
                                </div>
                            </div>
                            <div className="text-sm text-gray-600 leading-relaxed">
                                {getPreviewText(note.content)}
                            </div>
                        </div>
                        {index < filteredNotes.length - 1 && (
                            <div className="h-px bg-gray-200 my-2" />
                        )}
                    </div>
                ))}

                {filteredNotes.length === 0 && !isAddingNote && (
                    <div className="py-4 text-center text-gray-500 text-sm">
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
