import React, { useState, useRef, useEffect } from "react";
import {
    Plus,
    ArrowRight,
    X,
    Check,
    Layout,
    Trash2,
    Circle,
} from "lucide-react";

interface Template {
    name: string;
    urls: string[];
    backgroundColor?: string;
}

interface TemplateModalProps {
    onClose: () => void;
    onSave: (template: Template & { backgroundColor?: string }) => void;
    mode: "current" | "new";
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
            setUrls([...urls, newUrl.trim()]);
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
        <div className="absolute inset-0 bg-white border border-gray-200 rounded-2xl shadow-2xl flex flex-col p-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3 flex-1">
                    <input
                        type="text"
                        placeholder="Template Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-black placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors"
                    />

                    {/* Minimal Color Picker */}
                    <div className="relative">
                        <button
                            onClick={() =>
                                setIsColorPickerExpanded(!isColorPickerExpanded)
                            }
                            className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:border-gray-300 transition-colors"
                            style={{
                                backgroundColor: selectedColor || "#f8f9fa",
                            }}
                        >
                            <Plus
                                size={12}
                                color={selectedColor ? "#ffffff" : "#6c757d"}
                                style={{
                                    transform: isColorPickerExpanded
                                        ? "rotate(45deg)"
                                        : "rotate(0deg)",
                                    transition: "transform 0.2s ease",
                                }}
                            />
                        </button>

                        {isColorPickerExpanded && (
                            <div className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-lg p-2 shadow-lg z-50 flex gap-1">
                                <button
                                    onClick={() => handleColorSelect(undefined)}
                                    className="w-6 h-6 rounded-full border border-gray-200 bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors"
                                    title="No Color"
                                >
                                    <X size={10} color="#9ca3af" />
                                </button>
                                {colorOptions.map((color) => (
                                    <button
                                        key={color.value}
                                        onClick={() =>
                                            handleColorSelect(color.value)
                                        }
                                        className="w-6 h-6 rounded-full border-2 transition-all hover:scale-110"
                                        style={{
                                            backgroundColor: color.value,
                                            borderColor:
                                                selectedColor === color.value
                                                    ? "#000000"
                                                    : "transparent",
                                        }}
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
                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <ArrowRight size={16} color="#374151" />
                </button>
                <button
                    onClick={onClose}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                    <X size={16} color="#374151" />
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
                                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                                >
                                    <div
                                        className="w-4 h-4 border border-gray-300 rounded flex items-center justify-center flex-shrink-0 transition-colors"
                                        style={{
                                            backgroundColor: tab.checked
                                                ? "#000000"
                                                : "transparent",
                                            borderColor: tab.checked
                                                ? "#000000"
                                                : "#d1d5db",
                                        }}
                                    >
                                        {tab.checked && (
                                            <Check size={10} color="#ffffff" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-black truncate">
                                            {tab.title}
                                        </div>
                                    </div>
                                </div>
                                {index < currentTabs.length - 1 && (
                                    <div className="h-px bg-gray-100 mx-2" />
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div>
                        <div className="flex gap-2 mb-4">
                            <input
                                type="url"
                                placeholder="Enter URL"
                                value={newUrl}
                                onChange={(e) => setNewUrl(e.target.value)}
                                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-black placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors"
                            />
                            <button
                                onClick={handleAddUrl}
                                className="px-3 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center"
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                        <div className="space-y-1">
                            {urls.map((url, index) => (
                                <div key={url}>
                                    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors">
                                        <div className="flex-1 text-sm font-medium text-black break-all">
                                            {url}
                                        </div>
                                        <button
                                            onClick={() => handleRemoveUrl(url)}
                                            className="p-1 rounded hover:bg-gray-100 transition-colors"
                                        >
                                            <X size={14} color="#9ca3af" />
                                        </button>
                                    </div>
                                    {index < urls.length - 1 && (
                                        <div className="h-px bg-gray-100 mx-2" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const Templates: React.FC = () => {
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState<"current" | "new">("current");
    const [templates, setTemplates] = useState<Template[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isDeleteMode, setIsDeleteMode] = useState(false);
    const [containerHeight, setContainerHeight] = useState(0);

    useEffect(() => {
        loadTemplates();
    }, []);

    // Track container height for responsive scaling
    useEffect(() => {
        const updateHeight = () => {
            if (containerRef.current) {
                const height = containerRef.current.offsetHeight;
                setContainerHeight(height);
            }
        };

        updateHeight();
        window.addEventListener("resize", updateHeight);
        return () => window.removeEventListener("resize", updateHeight);
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

    const [showModeSelector, setShowModeSelector] = useState(false);

    const handleAddNewClick = () => {
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

    // Calculate responsive dimensions based on container height
    const getResponsiveDimensions = () => {
        const baseHeight = 100;
        const baseCardHeight = 50;
        const baseFontSize = 11;
        const baseIconSize = 16;

        const scale = Math.max(0.6, Math.min(1, containerHeight / baseHeight));

        return {
            cardHeight: Math.max(35, baseCardHeight * scale),
            fontSize: Math.max(9, baseFontSize * scale),
            iconSize: Math.max(12, baseIconSize * scale),
            gap: Math.max(4, 8 * scale),
            padding: Math.max(8, 12 * scale),
        };
    };

    const dimensions = getResponsiveDimensions();
    const placeholdersNeeded = Math.max(0, 3 - templates.length);

    return (
        <div
            ref={containerRef}
            className="bg-white rounded-2xl border border-gray-200 h-full flex flex-col relative transition-all duration-300 shadow-sm"
            style={{
                padding: `${dimensions.padding}px`,
                gap: `${dimensions.gap}px`,
            }}
        >
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Layout size={dimensions.iconSize} color="#374151" />
                    <div
                        className="font-medium text-black"
                        style={{
                            fontSize: `${Math.max(
                                12,
                                dimensions.fontSize + 3,
                            )}px`,
                        }}
                    >
                        Templates
                    </div>
                </div>

                {/* Delete mode toggle */}
                <button
                    onClick={() => setIsDeleteMode(!isDeleteMode)}
                    className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                >
                    <Trash2
                        size={Math.max(12, dimensions.iconSize - 2)}
                        color={isDeleteMode ? "#ef4444" : "#9ca3af"}
                    />
                </button>
            </div>

            {/* Templates Grid */}
            <div
                className="overflow-x-auto overflow-y-hidden"
                style={{
                    margin: `0 -${dimensions.padding}px`,
                    padding: `0 ${dimensions.padding}px`,
                }}
            >
                <div
                    className="grid gap-2"
                    style={{
                        gridTemplateColumns: `repeat(${Math.max(
                            4,
                            templates.length + 1,
                        )}, 1fr)`,
                        gap: `${dimensions.gap}px`,
                        width: templates.length > 3 ? "fit-content" : "100%",
                    }}
                >
                    {/* Add New Template Button */}
                    <div
                        onClick={handleAddNewClick}
                        className="bg-gray-50 rounded-lg border border-gray-200 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-gray-100 hover:border-gray-300 transition-all hover:-translate-y-0.5 p-2"
                        style={{
                            height: `${dimensions.cardHeight}px`,
                            minWidth: "80px",
                        }}
                    >
                        <Plus size={dimensions.iconSize} color="#6b7280" />
                        <div
                            className="text-gray-600 font-medium text-center"
                            style={{ fontSize: `${dimensions.fontSize}px` }}
                        >
                            Add New
                        </div>
                    </div>

                    {/* Template Items */}
                    {templates.map((template, index) => (
                        <div key={index} className="relative">
                            {isDeleteMode && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteTemplate(template.name);
                                    }}
                                    className="absolute top-1 right-1 z-10 p-1 rounded-full bg-white border border-gray-200 hover:bg-red-50 hover:border-red-200 transition-colors"
                                >
                                    <X
                                        size={Math.max(
                                            8,
                                            dimensions.iconSize - 6,
                                        )}
                                        color="#ef4444"
                                    />
                                </button>
                            )}
                            <div
                                onClick={() =>
                                    !isDeleteMode &&
                                    handleOpenTemplate(template)
                                }
                                className="rounded-lg border flex flex-col items-center justify-center gap-1 cursor-pointer transition-all hover:-translate-y-0.5 p-2"
                                style={{
                                    height: `${dimensions.cardHeight}px`,
                                    minWidth: "80px",
                                    backgroundColor: template.backgroundColor
                                        ? `${template.backgroundColor}20`
                                        : "#f9fafb",
                                    borderColor: template.backgroundColor
                                        ? `${template.backgroundColor}60`
                                        : "#e5e7eb",
                                    cursor: isDeleteMode
                                        ? "default"
                                        : "pointer",
                                }}
                                onMouseEnter={(e) => {
                                    if (!isDeleteMode) {
                                        e.currentTarget.style.backgroundColor =
                                            template.backgroundColor
                                                ? `${template.backgroundColor}40`
                                                : "#f3f4f6";
                                        e.currentTarget.style.boxShadow =
                                            "0 4px 12px rgba(0, 0, 0, 0.1)";
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isDeleteMode) {
                                        e.currentTarget.style.backgroundColor =
                                            template.backgroundColor
                                                ? `${template.backgroundColor}20`
                                                : "#f9fafb";
                                        e.currentTarget.style.boxShadow =
                                            "none";
                                    }
                                }}
                            >
                                <div
                                    className="font-medium text-black text-center break-words leading-tight"
                                    style={{
                                        fontSize: `${dimensions.fontSize}px`,
                                    }}
                                >
                                    {template.name}
                                </div>
                                <div
                                    className="text-gray-500 text-center"
                                    style={{
                                        fontSize: `${Math.max(
                                            8,
                                            dimensions.fontSize - 1,
                                        )}px`,
                                    }}
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
                                className="bg-gray-25 rounded-lg border border-gray-100 flex flex-col items-center justify-center gap-1 p-2"
                                style={{
                                    height: `${dimensions.cardHeight}px`,
                                    minWidth: "80px",
                                }}
                            >
                                <Circle
                                    size={dimensions.iconSize}
                                    color="#d1d5db"
                                />
                                <div
                                    className="text-gray-400 text-center"
                                    style={{
                                        fontSize: `${dimensions.fontSize}px`,
                                    }}
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
                <div className="absolute inset-0 bg-white border border-gray-200 rounded-2xl shadow-2xl flex flex-col items-center justify-center p-6 gap-6">
                    <div className="flex gap-4 w-full max-w-md">
                        {/* Open Tabs Option */}
                        <button
                            onClick={() => handleModeSelect("current")}
                            className="flex-1 p-4 border border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all flex flex-col items-center gap-3"
                        >
                            <Layout size={24} color="#374151" />
                            <div className="text-sm font-medium text-black">
                                From Open Tabs
                            </div>
                            <div className="text-xs text-gray-600 text-center leading-relaxed">
                                Save your currently open tabs as a template
                            </div>
                        </button>

                        {/* Add Manually Option */}
                        <button
                            onClick={() => handleModeSelect("new")}
                            className="flex-1 p-4 border border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all flex flex-col items-center gap-3"
                        >
                            <Plus size={24} color="#374151" />
                            <div className="text-sm font-medium text-black">
                                Add Manually
                            </div>
                            <div className="text-xs text-gray-600 text-center leading-relaxed">
                                Manually enter URLs for your template
                            </div>
                        </button>
                    </div>

                    {/* Close button */}
                    <button
                        onClick={handleModalClose}
                        className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <X size={16} color="#6b7280" />
                    </button>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <TemplateModal
                    mode={modalMode}
                    onClose={handleModalClose}
                    onSave={(template) => {
                        handleSaveTemplate(template);
                        setIsExpanded(false);
                    }}
                />
            )}
        </div>
    );
};

export default Templates;
