import React, { useState, useRef, useEffect } from "react";
import {
    Plus,
    ArrowRight,
    X,
    Check,
    Layout,
    Trash2,
    Circle,
    AlertTriangle,
} from "lucide-react";
import { freeTrial } from "../../main/MainTab";

interface Template {
    name: string;
    urls: string[];
    backgroundColor?: string;
}

interface TemplateModalProps {
    onClose: () => void;
    onSave: (template: Template & { backgroundColor?: string }) => void;
    mode: "current" | "new";
    isDarkMode?: boolean;
}

// Refined color options for Nordic aesthetic
const colorOptions = [
    { value: "#4285f4", label: "Blue" },
    { value: "#34a853", label: "Green" },
    { value: "#fbbc05", label: "Yellow" },
    { value: "#ea4335", label: "Red" },
    { value: "#9c27b0", label: "Purple" },
    { value: "#ff6b47", label: "Orange" },
];

const TemplateModal: React.FC<TemplateModalProps> = ({
    onClose,
    onSave,
    mode,
    isDarkMode = false,
}) => {
    const [name, setName] = useState("");
    const [urls, setUrls] = useState<string[]>([]);
    const [selectedColor, setSelectedColor] = useState<string | undefined>(
        undefined,
    );
    const [currentTabs, setCurrentTabs] = useState<
        { url: string; checked: boolean; title: string }[]
    >([]);
    const [newUrl, setNewUrl] = useState("");
    const [isColorPickerExpanded, setIsColorPickerExpanded] = useState(false);

    React.useEffect(() => {
        if (mode === "current") {
            chrome.tabs.query({ currentWindow: true }, (tabs) => {
                setCurrentTabs(
                    tabs
                        .filter(
                            (tab) =>
                                tab.url && !tab.url.startsWith("chrome://"),
                        )
                        .map((tab) => ({
                            url: tab.url!,
                            title: tab.title || "Untitled",
                            checked: true,
                        })),
                );
            });
        }
    }, [mode]);

    const handleSave = () => {
        const templateUrls =
            mode === "current"
                ? currentTabs.filter((tab) => tab.checked).map((tab) => tab.url)
                : urls;

        if (templateUrls.length === 0) return;

        let templateName = name.trim();
        if (!templateName) {
            chrome.storage.local.get("templates", (result) => {
                const existingTemplates = result.templates || [];
                let tempNumber = 1;
                while (
                    existingTemplates.some(
                        (t: Template) => t.name === `temp${tempNumber}`,
                    )
                ) {
                    tempNumber++;
                }
                templateName = `temp${tempNumber}`;

                onSave({
                    name: templateName,
                    urls: templateUrls,
                    backgroundColor: selectedColor,
                });
                onClose();
            });
            return;
        }

        onSave({
            name: templateName,
            urls: templateUrls,
            backgroundColor: selectedColor,
        });
        onClose();
    };

    const handleAddUrl = () => {
        if (newUrl.trim() && !urls.includes(newUrl)) {
            // Ensure URL has proper protocol
            let formattedUrl = newUrl.trim();
            if (
                !formattedUrl.startsWith("http://") &&
                !formattedUrl.startsWith("https://")
            ) {
                formattedUrl = "https://" + formattedUrl;
            }
            setUrls([...urls, formattedUrl]);
            setNewUrl("");
        }
    };

    const handleRemoveUrl = (urlToRemove: string) => {
        setUrls(urls.filter((url) => url !== urlToRemove));
    };

    const toggleTab = (index: number) => {
        setCurrentTabs(
            currentTabs.map((tab, i) =>
                i === index ? { ...tab, checked: !tab.checked } : tab,
            ),
        );
    };

    const handleColorSelect = (color: string | undefined) => {
        setSelectedColor(color);
        setIsColorPickerExpanded(false);
    };

    return (
        <div
            className={`absolute inset-0 flex flex-col p-6 ${
                isDarkMode
                    ? "bg-black/80 border border-white/20 backdrop-blur-sm"
                    : "bg-white border border-gray-200 shadow-2xl"
            } rounded-2xl`}
        >
            {/* Close Button */}
            <button
                onClick={onClose}
                className={`absolute top-3 left-3 p-1 rounded-lg transition-colors z-10 ${
                    isDarkMode
                        ? "text-white hover:bg-white/10"
                        : "text-gray-700 hover:bg-gray-100"
                }`}
            >
                <X size={16} />
            </button>

            {/* Header */}
            <div
                className={`flex items-center gap-3 mb-6 pb-4 border-b ${
                    isDarkMode ? "border-white/10" : "border-gray-100"
                }`}
            >
                <div className="flex items-center gap-3 flex-1">
                    <input
                        type="text"
                        placeholder="Template Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={`
                            flex-1 px-3 py-2 text-sm font-medium rounded-lg border 
                            focus:outline-none transition-colors
                            ${
                                isDarkMode
                                    ? "bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-white/50"
                                    : "bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-gray-400"
                            }
                        `}
                    />

                    {/* Color Picker */}
                    <div className="relative">
                        <button
                            onClick={() =>
                                setIsColorPickerExpanded(!isColorPickerExpanded)
                            }
                            className={`
                                w-8 h-8 rounded-full border flex items-center justify-center
                                transition-all duration-200 hover:scale-105
                                ${
                                    isDarkMode
                                        ? "border-white/50"
                                        : "border-gray-200 hover:border-gray-300"
                                }
                            `}
                            style={{
                                backgroundColor:
                                    selectedColor ||
                                    (isDarkMode ? "transparent" : "#f8f9fa"),
                                background: !selectedColor
                                    ? "conic-gradient(from 0deg, rgba(255,0,0,0.3), rgba(255,128,0,0.3), rgba(255,255,0,0.3), rgba(128,255,0,0.3), rgba(0,255,0,0.3), rgba(0,255,255,0.3), rgba(0,128,255,0.3), rgba(0,0,255,0.3), rgba(128,0,255,0.3), rgba(255,0,255,0.3), rgba(255,0,128,0.3))"
                                    : undefined,
                            }}
                        >
                            <Plus
                                size={16}
                                className={`
                                    transition-transform duration-200
                                    ${
                                        isColorPickerExpanded
                                            ? "rotate-45"
                                            : "rotate-0"
                                    }
                                    ${
                                        selectedColor
                                            ? "text-white drop-shadow-sm"
                                            : isDarkMode
                                            ? "text-white drop-shadow-sm"
                                            : "text-gray-500"
                                    }
                                `}
                            />
                        </button>

                        {isColorPickerExpanded && (
                            <div
                                className={`
                                    absolute top-10 right-0 p-2 rounded-lg border shadow-lg z-50
                                    flex gap-1
                                    ${
                                        isDarkMode
                                            ? "bg-black/90 border-white/20 backdrop-blur-sm"
                                            : "bg-white border-gray-200"
                                    }
                                `}
                            >
                                {colorOptions.map((color) => (
                                    <button
                                        key={color.value}
                                        onClick={() =>
                                            handleColorSelect(color.value)
                                        }
                                        className={`
                                            w-6 h-6 rounded-full border transition-all hover:scale-110
                                            ${
                                                selectedColor === color.value
                                                    ? isDarkMode
                                                        ? "border-2 border-white"
                                                        : "border-2 border-black"
                                                    : isDarkMode
                                                    ? "border border-white/30"
                                                    : "border border-white"
                                            }
                                        `}
                                        style={{ backgroundColor: color.value }}
                                        title={color.label}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                <button
                    onClick={handleSave}
                    disabled={
                        mode === "current"
                            ? !currentTabs.some((tab) => tab.checked)
                            : urls.length === 0
                    }
                    className={`
                        p-2 rounded-lg border transition-colors
                        disabled:opacity-50 disabled:cursor-not-allowed
                        ${
                            isDarkMode
                                ? "bg-white/10 border-white/20 hover:bg-white/20"
                                : "border-gray-200 hover:bg-gray-50"
                        }
                    `}
                >
                    <ArrowRight
                        size={16}
                        className={isDarkMode ? "text-white" : "text-gray-700"}
                    />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                {mode === "current" ? (
                    <div className="space-y-1">
                        {currentTabs.map((tab, index) => (
                            <div key={tab.url}>
                                <div
                                    onClick={() => toggleTab(index)}
                                    className={`
                                        flex items-center gap-3 p-2 rounded-lg cursor-pointer
                                        transition-colors
                                        ${
                                            isDarkMode
                                                ? "bg-white/5 hover:bg-white/10"
                                                : "hover:bg-gray-50"
                                        }
                                    `}
                                >
                                    <div
                                        className={`
                                            w-4 h-4 rounded border flex items-center justify-center
                                            flex-shrink-0 transition-colors
                                            ${
                                                tab.checked
                                                    ? "bg-black border-black"
                                                    : isDarkMode
                                                    ? "border-white/30"
                                                    : "border-gray-300"
                                            }
                                        `}
                                    >
                                        {tab.checked && (
                                            <Check
                                                size={10}
                                                className="text-white"
                                            />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div
                                            className={`
                                                font-medium text-sm truncate
                                                ${
                                                    isDarkMode
                                                        ? "text-white"
                                                        : "text-gray-900"
                                                }
                                            `}
                                        >
                                            {tab.title}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="flex gap-2">
                            <input
                                type="url"
                                placeholder="Enter URL"
                                value={newUrl}
                                onChange={(e) => setNewUrl(e.target.value)}
                                onKeyPress={(e) =>
                                    e.key === "Enter" && handleAddUrl()
                                }
                                className={`
                                    flex-1 px-3 py-2 text-sm rounded-lg border
                                    focus:outline-none transition-colors
                                    ${
                                        isDarkMode
                                            ? "bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-white/50"
                                            : "bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-gray-400"
                                    }
                                `}
                            />
                            <button
                                onClick={handleAddUrl}
                                disabled={!newUrl.trim()}
                                className={`
                                    px-4 py-2 rounded-lg border transition-colors
                                    disabled:opacity-50 disabled:cursor-not-allowed
                                    ${
                                        isDarkMode
                                            ? "bg-white/10 border-white/20 hover:bg-white/20"
                                            : "border-gray-200 hover:bg-gray-50"
                                    }
                                `}
                            >
                                <Plus
                                    size={16}
                                    className={
                                        isDarkMode
                                            ? "text-white"
                                            : "text-gray-700"
                                    }
                                />
                            </button>
                        </div>

                        <div className="space-y-2">
                            {urls.map((url, index) => (
                                <div
                                    key={index}
                                    className={`
                                        flex items-center gap-3 p-2 rounded-lg border
                                        ${
                                            isDarkMode
                                                ? "bg-white/5 border-white/20"
                                                : "bg-white border-gray-200"
                                        }
                                    `}
                                >
                                    <div className="flex-1 min-w-0">
                                        <div
                                            className={`
                                                text-sm truncate
                                                ${
                                                    isDarkMode
                                                        ? "text-white"
                                                        : "text-gray-900"
                                                }
                                            `}
                                        >
                                            {url}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveUrl(url)}
                                        className={`
                                            p-1 rounded transition-colors
                                            ${
                                                isDarkMode
                                                    ? "hover:bg-white/10"
                                                    : "hover:bg-red-50"
                                            }
                                        `}
                                    >
                                        <X size={12} className="text-white" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

interface TemplatesProps {
    isDarkMode?: boolean;
}

const Templates: React.FC<TemplatesProps> = ({ isDarkMode = false }) => {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState<"current" | "new">("current");
    const [isExpanded, setIsExpanded] = useState(false);
    const [isDeleteMode, setIsDeleteMode] = useState(false);
    const [isTrialMode, setIsTrialMode] = useState(freeTrial);
    const containerRef = useRef<HTMLDivElement>(null);
    const [showModeSelector, setShowModeSelector] = useState(false);

    useEffect(() => {
        loadTemplates();
    }, []);

    useEffect(() => {
        const checkTrialStatus = () => {
            setIsTrialMode(freeTrial);
        };

        // Check immediately
        checkTrialStatus();

        // Set up an interval to check frequently
        const interval = setInterval(checkTrialStatus, 100);

        return () => clearInterval(interval);
    }, []);

    // Handle expansion animation
    useEffect(() => {
        if (containerRef.current) {
            if (isExpanded) {
                const parentHeight =
                    containerRef.current.parentElement?.offsetHeight || 0;
                containerRef.current.style.height = `${parentHeight * 2}px`;
                containerRef.current.style.zIndex = "100";
            } else {
                containerRef.current.style.height = "100%";
                containerRef.current.style.zIndex = "1";
            }
        }
    }, [isExpanded]);

    const loadTemplates = () => {
        chrome.storage.local.get("templates", (result) => {
            if (result.templates) {
                setTemplates(result.templates);
            }
        });
    };

    const handleSaveTemplate = (template: Template) => {
        if (isTrialMode && templates.length >= 2) {
            alert(
                "Free trial allows only 2 templates at a time. Please delete an existing template first.",
            );
            return;
        }

        const newTemplates = [...templates, template];
        setTemplates(newTemplates);
        chrome.storage.local.set({ templates: newTemplates }, () => {
            loadTemplates();
        });
    };

    const handleOpenTemplate = (template: Template) => {
        template.urls.forEach((url) => {
            chrome.tabs.create({ url, active: false });
        });
        console.log("Opening template:", template.name);
    };

    const handleAddNewClick = () => {
        if (isTrialMode && templates.length >= 2) {
            alert(
                "Free trial allows only 2 templates at a time. Please delete an existing template first.",
            );
            return;
        }
        setIsExpanded(true);
        setShowModeSelector(true);
    };

    const handleModeSelect = (mode: "current" | "new") => {
        setModalMode(mode);
        setShowModeSelector(false);
        setShowModal(true);
    };

    const handleModalClose = () => {
        setShowModal(false);
        setShowModeSelector(false);
        setModalMode("current");
        setIsExpanded(false);
    };

    const handleDeleteTemplate = async (templateName: string) => {
        const updatedTemplates = templates.filter(
            (t) => t.name !== templateName,
        );
        setTemplates(updatedTemplates);
        await chrome.storage.local.set({ templates: updatedTemplates });
    };

    const displayedTemplates = isTrialMode ? templates.slice(0, 2) : templates;
    const hasHiddenTemplates = isTrialMode && templates.length > 2;
    const placeholdersNeeded = Math.max(0, 3 - displayedTemplates.length);

    return (
        <div
            ref={containerRef}
            className={`
                h-full flex flex-col relative transition-all duration-300 p-3 gap-2
                ${
                    isDarkMode
                        ? "bg-white/5 border border-white/10 backdrop-blur-sm"
                        : "bg-white border border-gray-200 shadow-sm"
                }
                rounded-2xl
            `}
        >
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Layout
                        size={16}
                        className={isDarkMode ? "text-white" : "text-gray-700"}
                    />
                    <div
                        className={`
                            text-sm font-medium
                            ${isDarkMode ? "text-white" : "text-gray-900"}
                        `}
                    >
                        Templates
                    </div>
                </div>

                {/* Delete mode toggle */}
                <button
                    onClick={() => setIsDeleteMode(!isDeleteMode)}
                    className={`
                        p-1 rounded-lg transition-colors
                        ${
                            isDarkMode
                                ? "hover:bg-white/10"
                                : "hover:bg-gray-100"
                        }
                    `}
                >
                    <Trash2
                        size={14}
                        className={
                            isDeleteMode
                                ? "text-red-500"
                                : isDarkMode
                                ? "text-white/50"
                                : "text-gray-400"
                        }
                    />
                </button>
            </div>

            {/* Warning Message for Free Trial */}

            {/* Templates Grid */}
            <div className="overflow-x-auto overflow-y-hidden -mx-3 px-3">
                <div
                    className="grid gap-1"
                    style={{
                        gridTemplateColumns: `repeat(${Math.max(
                            4,
                            displayedTemplates.length + 1,
                        )}, 1fr)`,
                        width:
                            displayedTemplates.length > 3
                                ? "fit-content"
                                : "100%",
                    }}
                >
                    {/* Add New Template Button */}
                    <div
                        onClick={handleAddNewClick}
                        className={`
                            h-12 min-w-20 p-2 rounded-lg border cursor-pointer
                            flex flex-col items-center justify-center gap-1
                            transition-all
                            ${
                                isDarkMode
                                    ? "bg-white/10 border-white/20 hover:bg-white/20"
                                    : "bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300"
                            }
                            ${
                                isTrialMode && templates.length >= 2
                                    ? "opacity-50 cursor-not-allowed"
                                    : ""
                            }
                        `}
                    >
                        <Plus
                            size={16}
                            className={
                                isDarkMode ? "text-white/70" : "text-gray-600"
                            }
                        />
                        <div
                            className={`
                                text-xs font-medium text-center
                                ${
                                    isDarkMode
                                        ? "text-white/70"
                                        : "text-gray-600"
                                }
                            `}
                        >
                            Add New
                        </div>
                    </div>

                    {/* Template Items - only show first 2 in trial mode */}
                    {displayedTemplates.map((template, index) => (
                        <div key={index} className="relative">
                            {isDeleteMode && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteTemplate(template.name);
                                    }}
                                    className={`
                                        absolute top-1 right-1 z-10 p-1 rounded-full border
                                        transition-colors
                                        ${
                                            isDarkMode
                                                ? "bg-black/80 border-white/20 hover:bg-black/90"
                                                : "bg-white border-gray-200 hover:bg-red-50 hover:border-red-200"
                                        }
                                    `}
                                >
                                    <X size={8} className="text-white" />
                                </button>
                            )}
                            <div
                                onClick={() =>
                                    !isDeleteMode &&
                                    handleOpenTemplate(template)
                                }
                                className={`
                                    h-12 min-w-20 p-2 rounded-lg border
                                    flex flex-col items-center justify-center gap-1
                                    transition-all
                                    ${
                                        !isDeleteMode
                                            ? "cursor-pointer"
                                            : "cursor-default"
                                    }
                                    ${
                                        isDarkMode
                                            ? "border-white/20"
                                            : "border-gray-200"
                                    }
                                `}
                                style={{
                                    backgroundColor: template.backgroundColor
                                        ? isDarkMode
                                            ? `${template.backgroundColor}80`
                                            : `${template.backgroundColor}20`
                                        : isDarkMode
                                        ? "rgba(255, 255, 255, 0.1)"
                                        : "#f9fafb",
                                    borderColor: template.backgroundColor
                                        ? `${template.backgroundColor}60`
                                        : undefined,
                                }}
                                onMouseEnter={(e) => {
                                    if (!isDeleteMode) {
                                        if (isDarkMode) {
                                            e.currentTarget.style.backgroundColor =
                                                template.backgroundColor
                                                    ? `${template.backgroundColor}A6`
                                                    : "rgba(255, 255, 255, 0.15)";
                                        } else {
                                            e.currentTarget.style.backgroundColor =
                                                template.backgroundColor
                                                    ? `${template.backgroundColor}40`
                                                    : "#f3f4f6";
                                            e.currentTarget.style.boxShadow =
                                                "0 4px 12px rgba(0, 0, 0, 0.1)";
                                        }
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isDeleteMode) {
                                        if (isDarkMode) {
                                            e.currentTarget.style.backgroundColor =
                                                template.backgroundColor
                                                    ? `${template.backgroundColor}80`
                                                    : "rgba(255, 255, 255, 0.1)";
                                        } else {
                                            e.currentTarget.style.backgroundColor =
                                                template.backgroundColor
                                                    ? `${template.backgroundColor}20`
                                                    : "#f9fafb";
                                            e.currentTarget.style.boxShadow =
                                                "none";
                                        }
                                    }
                                }}
                            >
                                <div
                                    className={`
                                        text-xs font-medium text-center break-words leading-tight
                                        ${
                                            isDarkMode
                                                ? "text-white"
                                                : "text-gray-900"
                                        }
                                    `}
                                >
                                    {template.name}
                                </div>
                                <div
                                    className={`
                                        text-xs text-center
                                        ${
                                            isDarkMode
                                                ? "text-white/50"
                                                : "text-gray-500"
                                        }
                                    `}
                                >
                                    {template.urls.length} tabs
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Placeholder Templates */}
                    {Array.from({ length: placeholdersNeeded }).map(
                        (_, index) => (
                            <div
                                key={`placeholder-${index}`}
                                className={`
                                    h-12 min-w-20 p-2 rounded-lg border
                                    flex flex-col items-center justify-center gap-1
                                    ${
                                        isDarkMode
                                            ? "bg-white/5 border-white/10"
                                            : "bg-gray-25 border-gray-100"
                                    }
                                `}
                            >
                                <Circle
                                    size={16}
                                    className={
                                        isDarkMode
                                            ? "text-white/30"
                                            : "text-gray-300"
                                    }
                                />
                                <div
                                    className={`
                                        text-xs text-center
                                        ${
                                            isDarkMode
                                                ? "text-white/30"
                                                : "text-gray-400"
                                        }
                                    `}
                                >
                                    Empty
                                </div>
                            </div>
                        ),
                    )}
                </div>
            </div>

            {/* Mode Selector */}
            {showModeSelector && (
                <div
                    className={`
                        absolute inset-0 rounded-2xl border
                        flex flex-col items-center justify-center p-6 gap-6
                        ${
                            isDarkMode
                                ? "bg-black/90 border-white/20 backdrop-blur-sm"
                                : "bg-white border-gray-200 shadow-2xl"
                        }
                    `}
                >
                    <button
                        onClick={() => {
                            setShowModeSelector(false);
                            setIsExpanded(false);
                        }}
                        className={`absolute top-3 left-3 p-1 rounded-lg transition-colors ${
                            isDarkMode
                                ? "text-white hover:bg-white/10"
                                : "text-gray-700 hover:bg-gray-100"
                        }`}
                    >
                        <X size={16} />
                    </button>
                    <div className="flex gap-4 w-full max-w-md">
                        {/* Open Tabs Option */}
                        <button
                            onClick={() => handleModeSelect("current")}
                            className={`
                                flex-1 p-4 border rounded-xl transition-all
                                flex flex-col items-center gap-3
                                ${
                                    isDarkMode
                                        ? "bg-white/5 border-white/20 hover:bg-white/10"
                                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                }
                            `}
                        >
                            <Layout
                                size={24}
                                className={
                                    isDarkMode ? "text-white" : "text-gray-700"
                                }
                            />
                            <div
                                className={`
                                    text-sm font-medium
                                    ${
                                        isDarkMode
                                            ? "text-white"
                                            : "text-gray-900"
                                    }
                                `}
                            >
                                From Open Tabs
                            </div>
                            <div
                                className={`
                                    text-xs text-center
                                    ${
                                        isDarkMode
                                            ? "text-white/50"
                                            : "text-gray-500"
                                    }
                                `}
                            >
                                Create template from currently open tabs
                            </div>
                        </button>

                        {/* Manual Entry Option */}
                        <button
                            onClick={() => handleModeSelect("new")}
                            className={`
                                flex-1 p-4 border rounded-xl transition-all
                                flex flex-col items-center gap-3
                                ${
                                    isDarkMode
                                        ? "bg-white/5 border-white/20 hover:bg-white/10"
                                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                }
                            `}
                        >
                            <Plus
                                size={24}
                                className={
                                    isDarkMode ? "text-white" : "text-gray-700"
                                }
                            />
                            <div
                                className={`
                                    text-sm font-medium
                                    ${
                                        isDarkMode
                                            ? "text-white"
                                            : "text-gray-900"
                                    }
                                `}
                            >
                                Manual Entry
                            </div>
                            <div
                                className={`
                                    text-xs text-center
                                    ${
                                        isDarkMode
                                            ? "text-white/50"
                                            : "text-gray-500"
                                    }
                                `}
                            >
                                Add URLs manually to create template
                            </div>
                        </button>
                    </div>
                </div>
            )}

            {/* Template Modal */}
            {showModal && (
                <TemplateModal
                    onClose={handleModalClose}
                    onSave={handleSaveTemplate}
                    mode={modalMode}
                    isDarkMode={isDarkMode}
                />
            )}
        </div>
    );
};

export default Templates;
