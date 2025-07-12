import React, { useState, useEffect, useRef } from "react";
import {
    FileText,
    Search,
    ChevronRight,
    Plus,
    ArrowLeft,
    Copy,
    AlertTriangle,
    Trash2,
    X,
} from "lucide-react";

// Mock freeTrial for demo
const freeTrial = false;

interface Note {
    domain: string;
    content: string;
    lastModified: number;
    createdAt: number;
}

interface NotesOverviewProps {
    isDarkMode?: boolean;
}

const NotesOverview: React.FC<NotesOverviewProps> = ({
    isDarkMode = false,
}) => {
    const [notes, setNotes] = useState<Note[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const [isAddingNote, setIsAddingNote] = useState(false);
    const [newNoteContent, setNewNoteContent] = useState("");
    const [selectedNote, setSelectedNote] = useState<Note | null>(null);
    const [copyMessage, setCopyMessage] = useState("");
    const [isTrialMode, setIsTrialMode] = useState(freeTrial);
    const [isDeleteMode, setIsDeleteMode] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadNotes();
    }, []);

    useEffect(() => {
        const checkTrialStatus = () => {
            setIsTrialMode(freeTrial);
        };
        checkTrialStatus();
        const interval = setInterval(checkTrialStatus, 100);
        return () => clearInterval(interval);
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
                if (
                    key.startsWith("note_") &&
                    !key.includes("timestamp") &&
                    !key.includes("created")
                ) {
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
            noteEntries.sort((a, b) => b.lastModified - a.lastModified);
            setNotes(noteEntries);
        } catch (err) {
            console.error("Error loading notes:", err);
        }
    };

    const handleDeleteNote = async (domain: string) => {
        try {
            await chrome.storage.local.remove([
                `note_${domain}`,
                `note_timestamp_${domain}`,
                `note_created_${domain}`,
            ]);
            await loadNotes();
        } catch (err) {
            console.error("Error deleting note:", err);
        }
    };

    const handleSaveNote = async (domain: string, content: string) => {
        try {
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
        }
    };

    const handleAutoSaveNewNote = async (content: string) => {
        if (!content.trim()) return;

        try {
            // Extract first word as domain
            const firstWord = content.trim().split(/\s+/)[0];
            const domain = firstWord.toLowerCase();

            const timestamp = Date.now();
            await chrome.storage.local.set({
                [`note_${domain}`]: content,
                [`note_timestamp_${domain}`]: timestamp,
                [`note_created_${domain}`]: timestamp,
            });

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

    const formatLastModified = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
        });
    };

    const getPreviewText = (content: string) => {
        if (!content || typeof content !== "string") {
            return "";
        }
        const firstLine = content.split("\n")[0];
        return firstLine.length > 80
            ? firstLine.slice(0, 80) + "..."
            : firstLine;
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

    const displayedNotes = isTrialMode
        ? filteredNotes.slice(0, 4)
        : filteredNotes;
    const hasHiddenNotes = isTrialMode && filteredNotes.length > 4;

    // Get preview domain from new note content
    const getPreviewDomain = (content: string) => {
        if (!content.trim()) return "new-note";
        const firstWord = content.trim().split(/\s+/)[0];
        return firstWord.toLowerCase();
    };

    const renderNoteEditor = (
        note: Note,
        onClose: () => void,
        isNew = false,
    ) => {
        const editorClasses = `absolute inset-0 ${
            isDarkMode
                ? "bg-black bg-opacity-95 border-white border-opacity-20"
                : "bg-white border-gray-200"
        } rounded-2xl flex flex-col border shadow-xl backdrop-blur-sm`;

        const handleKeyDown = () => {
            // No-op - removed keyboard shortcuts
        };

        return (
            <div className={editorClasses}>
                {/* Minimal Header */}
                <div className="flex items-center justify-between p-3 border-b border-opacity-10">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                if (isNew && newNoteContent.trim()) {
                                    handleAutoSaveNewNote(newNoteContent);
                                } else {
                                    onClose();
                                }
                            }}
                            className={`p-1 rounded transition-colors ${
                                isDarkMode
                                    ? "hover:bg-white hover:bg-opacity-20 text-white"
                                    : "hover:bg-gray-100 text-gray-600"
                            }`}
                        >
                            <ArrowLeft size={16} />
                        </button>
                        <span
                            className={`text-sm font-medium ${
                                isDarkMode ? "text-white" : "text-black"
                            }`}
                        >
                            {isNew
                                ? getPreviewDomain(newNoteContent)
                                : note.domain}
                        </span>
                    </div>
                    <button
                        onClick={() =>
                            handleCopyNote(
                                isNew ? newNoteContent : note.content,
                            )
                        }
                        className={`p-1 rounded transition-colors ${
                            isDarkMode
                                ? "hover:bg-white hover:bg-opacity-20 text-white"
                                : "hover:bg-gray-100 text-gray-600"
                        }`}
                        title="Copy note"
                    >
                        <Copy size={16} />
                    </button>
                </div>

                {/* Copy Message */}
                {copyMessage && (
                    <div
                        className={`mx-3 mt-2 p-2 rounded text-xs text-center ${
                            isDarkMode
                                ? "bg-green-500 bg-opacity-20 text-green-400"
                                : "bg-green-50 text-green-700"
                        }`}
                    >
                        {copyMessage}
                    </div>
                )}

                {/* Text Editor */}
                <textarea
                    ref={textareaRef}
                    value={isNew ? newNoteContent : note.content}
                    onChange={(e) => {
                        if (isNew) {
                            setNewNoteContent(e.target.value);
                        } else {
                            const newContent = e.target.value;
                            clearTimeout((window as any).notesSaveTimeout);
                            (window as any).notesSaveTimeout = setTimeout(
                                () => {
                                    handleSaveNote(note.domain, newContent);
                                },
                                1000,
                            );
                            setSelectedNote((prev) =>
                                prev ? { ...prev, content: newContent } : null,
                            );
                        }
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder={
                        isNew
                            ? "Start typing..."
                            : `Write your note about ${note.domain}...`
                    }
                    className={`flex-1 p-4 m-3 rounded-lg resize-none text-sm leading-relaxed outline-none focus:ring-1 focus:ring-blue-500 ${
                        isDarkMode
                            ? "bg-white bg-opacity-5 border-white border-opacity-10 text-white placeholder-gray-500"
                            : "bg-gray-50 border-gray-200 text-black placeholder-gray-500"
                    } border`}
                    autoFocus
                />
            </div>
        );
    };

    const containerClasses = `${
        isDarkMode
            ? "bg-white bg-opacity-5 border-white border-opacity-10"
            : "bg-white border-gray-200"
    } rounded-2xl border shadow-lg p-3 h-full flex flex-col gap-3 relative backdrop-blur-sm`;

    return (
        <div className={containerClasses}>
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <FileText
                        size={16}
                        className={isDarkMode ? "text-white" : "text-gray-700"}
                    />
                    <h3
                        className={`text-sm font-medium ${
                            isDarkMode ? "text-white" : "text-gray-900"
                        }`}
                    >
                        Site Notes
                    </h3>
                </div>
                <div className="flex items-center gap-0.5">
                    {/* Search Icon/Bar */}
                    <div
                        className="relative flex items-center transition-all duration-300"
                        style={{ width: isSearchExpanded ? "200px" : "32px" }}
                    >
                        {isSearchExpanded && (
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search notes..."
                                className={`w-full py-1 px-3 pr-8 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                    isDarkMode
                                        ? "bg-white bg-opacity-10 border-white border-opacity-20 text-white placeholder-gray-400"
                                        : "bg-gray-100 border-gray-200 text-black placeholder-gray-400"
                                } border`}
                            />
                        )}
                        <button
                            onClick={handleSearchIconClick}
                            className={`${
                                isSearchExpanded ? "absolute right-2" : ""
                            } p-1 rounded transition-colors ${
                                isDarkMode
                                    ? "text-white hover:bg-white hover:bg-opacity-10"
                                    : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                            }`}
                        >
                            <Search size={16} />
                        </button>
                    </div>
                    {/* Delete Button */}
                    <button
                        onClick={() => setIsDeleteMode(!isDeleteMode)}
                        className={`p-1 rounded transition-colors ${
                            isDeleteMode
                                ? isDarkMode
                                    ? "bg-red-500 bg-opacity-20 text-red-400"
                                    : "bg-red-50 text-red-600"
                                : isDarkMode
                                ? "text-white hover:bg-white hover:bg-opacity-10"
                                : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                        }`}
                        title={isDeleteMode ? "Cancel delete" : "Delete notes"}
                    >
                        <Trash2 size={16} />
                    </button>
                    {/* New Note Button */}
                    <button
                        onClick={() => setIsAddingNote(true)}
                        className={`p-1 rounded transition-colors ${
                            isDarkMode
                                ? "text-white hover:bg-white hover:bg-opacity-15"
                                : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                        }`}
                        title="New Note"
                    >
                        <Plus size={18} />
                    </button>
                </div>
            </div>

            {/* Warning Message for Free Trial */}
            {hasHiddenNotes && (
                <div
                    className={`p-3 rounded-lg flex items-start gap-2 mb-2 ${
                        isDarkMode
                            ? "bg-yellow-500 bg-opacity-20 border border-yellow-500 border-opacity-30"
                            : "bg-yellow-50 border border-yellow-200"
                    }`}
                >
                    <AlertTriangle
                        size={16}
                        className={
                            isDarkMode ? "text-yellow-400" : "text-yellow-600"
                        }
                    />
                    <div
                        className={`text-sm ${
                            isDarkMode ? "text-yellow-400" : "text-yellow-700"
                        }`}
                    >
                        Your plan only supports 4 notes at a time. Please access
                        notes via extension popup.
                    </div>
                </div>
            )}

            {/* Notes List */}
            <div className="flex-1 overflow-y-auto">
                {displayedNotes.map((note, index) => (
                    <div key={note.domain}>
                        <div
                            onClick={() => {
                                if (isDeleteMode) {
                                    handleDeleteNote(note.domain);
                                } else {
                                    setSelectedNote(note);
                                }
                            }}
                            className={`py-1.5 cursor-pointer rounded-lg px-2 -mx-2 transition-colors ${
                                isDeleteMode
                                    ? isDarkMode
                                        ? "hover:bg-red-500 hover:bg-opacity-20"
                                        : "hover:bg-red-50"
                                    : isDarkMode
                                    ? "hover:bg-white hover:bg-opacity-10"
                                    : "hover:bg-gray-50"
                            }`}
                        >
                            <div className="flex items-center justify-between mb-0.5">
                                <div
                                    className={`text-sm font-semibold truncate flex-1 mr-2 ${
                                        isDarkMode ? "text-white" : "text-black"
                                    }`}
                                >
                                    {note.domain}
                                </div>
                                <div
                                    className={`flex items-center gap-1 text-xs flex-shrink-0 ${
                                        isDarkMode
                                            ? "text-white text-opacity-50"
                                            : "text-gray-500"
                                    }`}
                                >
                                    {isDeleteMode ? (
                                        <X size={16} className="text-red-500" />
                                    ) : (
                                        <>
                                            {formatLastModified(
                                                note.lastModified,
                                            )}
                                            <ChevronRight size={12} />
                                        </>
                                    )}
                                </div>
                            </div>
                            <div
                                className={`text-xs truncate ${
                                    isDarkMode
                                        ? "text-white text-opacity-70"
                                        : "text-gray-600"
                                }`}
                            >
                                {getPreviewText(note.content)}
                            </div>
                        </div>
                        {index < displayedNotes.length - 1 && (
                            <div
                                className={`h-px my-1 ${
                                    isDarkMode
                                        ? "bg-white bg-opacity-10"
                                        : "bg-gray-200"
                                }`}
                            />
                        )}
                    </div>
                ))}
                {displayedNotes.length === 0 && !isAddingNote && (
                    <div
                        className={`py-4 text-center text-sm ${
                            isDarkMode
                                ? "text-white text-opacity-50"
                                : "text-gray-500"
                        }`}
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
                        domain: getPreviewDomain(newNoteContent),
                        content: newNoteContent,
                        lastModified: Date.now(),
                        createdAt: Date.now(),
                    },
                    () => {
                        setIsAddingNote(false);
                        setNewNoteContent("");
                    },
                    true,
                )}
        </div>
    );
};

export default NotesOverview;
