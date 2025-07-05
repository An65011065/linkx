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
    backgroundColor?: string; // Optional background color
}

interface TemplateModalProps {
    onClose: () => void;
    onSave: (template: Template & { backgroundColor?: string }) => void;
    mode: "current" | "new";
}

// Predefined color options
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
            // Get all tabs in the current window
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
                            checked: true, // Set to true by default
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

        // Generate automatic name if none provided
        let templateName = name.trim();
        if (!templateName) {
            // Get existing template names to find the next available temp number
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

    const handleColorSelect = (color: string) => {
        setSelectedColor(color);
        setIsColorPickerExpanded(false);
    };

    return (
        <div
            style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "rgba(0, 0, 0, 0.9)",
                backdropFilter: "blur(4px)",
                display: "flex",
                flexDirection: "column",
                borderRadius: "16px",
                padding: "16px 16px 0px 16px",
            }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "12px",
                }}
            >
                {/* Template Name Input */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        flex: 1,
                    }}
                >
                    <input
                        type="text"
                        placeholder="Template Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        style={{
                            flex: 1,
                            padding: "6px 12px",
                            borderRadius: "8px",
                            border: "1px solid rgba(255, 255, 255, 0.2)",
                            background: "rgba(255, 255, 255, 0.1)",
                            color: "#ffffff",
                            fontSize: "14px",
                            outline: "none",
                            height: "100%",
                        }}
                    />

                    {/* Rainbow Color Picker */}
                    <div style={{ position: "relative" }}>
                        <button
                            onClick={() =>
                                setIsColorPickerExpanded(!isColorPickerExpanded)
                            }
                            style={{
                                width: "2rem",
                                height: "2rem",
                                borderRadius: "50%",
                                background:
                                    selectedColor ||
                                    "conic-gradient(from 0deg, rgba(255,0,0,0.3), rgba(255,128,0,0.3), rgba(255,255,0,0.3), rgba(128,255,0,0.3), rgba(0,255,0,0.3), rgba(0,255,255,0.3), rgba(0,128,255,0.3), rgba(0,0,255,0.3), rgba(128,0,255,0.3), rgba(255,0,255,0.3), rgba(255,0,128,0.3))",
                                border: "1px solid rgba(255, 255, 255, 0.5)",
                                cursor: "pointer",
                                padding: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "all 0.2s ease",
                                transform: isColorPickerExpanded
                                    ? "scale(1.05)"
                                    : "scale(1)",
                            }}
                        >
                            <Plus
                                size={14}
                                color="#ffffff"
                                style={{
                                    filter: "drop-shadow(0 0 2px rgba(0,0,0,0.8))",
                                    transform: isColorPickerExpanded
                                        ? "rotate(45deg)"
                                        : "rotate(0deg)",
                                    transition: "transform 0.2s ease",
                                }}
                            />
                        </button>

                        {/* Expanded Color Options */}
                        {isColorPickerExpanded && (
                            <div
                                style={{
                                    position: "absolute",
                                    top: "calc(100% + 8px)",
                                    right: 0,
                                    background: "rgba(0, 0, 0, 0.9)",
                                    border: "1px solid rgba(255, 255, 255, 0.2)",
                                    borderRadius: "8px",
                                    padding: "8px",
                                    display: "flex",
                                    gap: "4px",
                                    zIndex: 1000,
                                    backdropFilter: "blur(8px)",
                                    animation: "fadeIn 0.2s ease-out",
                                }}
                            >
                                {/* Clear/None option */}
                                <button
                                    onClick={() => handleColorSelect(undefined)}
                                    style={{
                                        width: "1.5rem",
                                        height: "1.5rem",
                                        borderRadius: "50%",
                                        background: "transparent",
                                        border: "2px solid rgba(255, 255, 255, 0.5)",
                                        cursor: "pointer",
                                        padding: 0,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        transition: "all 0.2s ease",
                                    }}
                                    title="No Color"
                                >
                                    <X
                                        size={10}
                                        color="rgba(255, 255, 255, 0.5)"
                                    />
                                </button>

                                {colorOptions.map((color) => (
                                    <button
                                        key={color.value}
                                        onClick={() =>
                                            handleColorSelect(color.value)
                                        }
                                        style={{
                                            width: "1.5rem",
                                            height: "1.5rem",
                                            borderRadius: "50%",
                                            background: color.value,
                                            border:
                                                selectedColor === color.value
                                                    ? "2px solid white"
                                                    : "2px solid transparent",
                                            cursor: "pointer",
                                            padding: 0,
                                            transition: "all 0.2s ease",
                                            transform:
                                                selectedColor === color.value
                                                    ? "scale(1.1)"
                                                    : "scale(1)",
                                        }}
                                        title={color.label}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Save and Close buttons */}
                <button
                    onClick={handleSave}
                    disabled={
                        mode === "current"
                            ? !currentTabs.some((tab) => tab.checked)
                            : urls.length === 0
                    }
                    style={{
                        background: "none",
                        border: "none",
                        color: "#ffffff",
                        cursor: "pointer",
                        display: "flex",
                        opacity: (
                            mode === "current"
                                ? !currentTabs.some((tab) => tab.checked)
                                : urls.length === 0
                        )
                            ? 0.5
                            : 1,
                        padding: "6px",
                    }}
                >
                    <ArrowRight size={16} />
                </button>
                <button
                    onClick={onClose}
                    style={{
                        background: "none",
                        border: "none",
                        color: "#ffffff",
                        cursor: "pointer",
                        padding: "6px",
                        display: "flex",
                        alignItems: "center",
                        height: "32px",
                        width: "32px",
                    }}
                >
                    <X size={16} />
                </button>
            </div>

            <div
                style={{
                    flex: 1,
                    overflowY: "auto",
                    marginRight: "-8px",
                    paddingRight: "8px",
                }}
            >
                {mode === "current" ? (
                    currentTabs.map((tab, index) => (
                        <div key={tab.url}>
                            <div
                                onClick={() => toggleTab(index)}
                                style={{
                                    padding: "8px 0",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                }}
                            >
                                <div
                                    style={{
                                        width: "16px",
                                        height: "16px",
                                        border: "1.5px solid rgba(255, 255, 255, 0.5)",
                                        borderRadius: "3px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flexShrink: 0,
                                        background: tab.checked
                                            ? "rgba(255, 255, 255, 0.1)"
                                            : "transparent",
                                    }}
                                >
                                    {tab.checked && (
                                        <Check size={12} color="#ffffff" />
                                    )}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div
                                        style={{
                                            color: "#ffffff",
                                            fontSize: "11px",
                                            marginBottom: "1px",
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                        }}
                                    >
                                        {tab.title}
                                    </div>
                                </div>
                            </div>
                            {index < currentTabs.length - 1 && (
                                <div
                                    style={{
                                        height: "1px",
                                        background: "rgba(255, 255, 255, 0.1)",
                                        margin: "1px 0",
                                    }}
                                />
                            )}
                        </div>
                    ))
                ) : (
                    <>
                        <div
                            style={{
                                display: "flex",
                                gap: "8px",
                                marginBottom: "12px",
                            }}
                        >
                            <input
                                type="url"
                                placeholder="Enter URL"
                                value={newUrl}
                                onChange={(e) => setNewUrl(e.target.value)}
                                style={{
                                    flex: 1,
                                    padding: "8px 12px",
                                    borderRadius: "8px",
                                    border: "1px solid rgba(255, 255, 255, 0.2)",
                                    background: "rgba(255, 255, 255, 0.1)",
                                    color: "#ffffff",
                                    fontSize: "14px",
                                    outline: "none",
                                }}
                            />
                            <button
                                onClick={handleAddUrl}
                                style={{
                                    padding: "8px",
                                    borderRadius: "8px",
                                    border: "1px solid rgba(255, 255, 255, 0.2)",
                                    background: "#4285f4",
                                    color: "#ffffff",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                }}
                            >
                                <Plus size={20} />
                            </button>
                        </div>
                        {urls.map((url, index) => (
                            <div key={url}>
                                <div
                                    style={{
                                        padding: "8px 0",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                    }}
                                >
                                    <div
                                        style={{
                                            flex: 1,
                                            color: "#ffffff",
                                            fontSize: "14px",
                                            wordBreak: "break-all",
                                        }}
                                    >
                                        {url}
                                    </div>
                                    <button
                                        onClick={() => handleRemoveUrl(url)}
                                        style={{
                                            background: "none",
                                            border: "none",
                                            color: "rgba(255, 255, 255, 0.5)",
                                            cursor: "pointer",
                                            padding: "4px",
                                            display: "flex",
                                        }}
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                                {index < urls.length - 1 && (
                                    <div
                                        style={{
                                            height: "1px",
                                            background:
                                                "rgba(255, 255, 255, 0.1)",
                                            margin: "4px 0",
                                        }}
                                    />
                                )}
                            </div>
                        ))}
                    </>
                )}
            </div>

            <style jsx>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(-8px);
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
            loadTemplates(); // Reload templates after saving
        });
    };

    const handleOpenTemplate = (template: Template) => {
        // Open all URLs in the template
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

    // Add delete template function
    const handleDeleteTemplate = async (templateName: string) => {
        const updatedTemplates = templates.filter(
            (t) => t.name !== templateName,
        );
        setTemplates(updatedTemplates);
        await chrome.storage.local.set({ templates: updatedTemplates });
    };

    // Calculate responsive dimensions based on container height
    const getResponsiveDimensions = () => {
        // Base dimensions for optimal layout
        const baseHeight = 100; // Base container height
        const baseCardHeight = 50;
        const baseFontSize = 11;
        const baseIconSize = 16;

        // Calculate scale factor based on container height
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

    // Calculate how many placeholder slots we need
    const placeholdersNeeded = Math.max(0, 3 - templates.length);

    return (
        <div
            ref={containerRef}
            style={{
                background: "rgba(255, 255, 255, 0.05)",
                borderRadius: "16px",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                backdropFilter: "blur(10px)",
                padding: `${dimensions.padding}px ${dimensions.padding}px 0px ${dimensions.padding}px`,
                // paddingBottom: "0px",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                gap: `${dimensions.gap}px`,
                position: "relative",
                transition: "all 0.3s ease-in-out",
            }}
        >
            {/* Header */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "0px",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: `${dimensions.gap}px`,
                    }}
                >
                    <Layout size={dimensions.iconSize} color="#ffffff" />
                    <div
                        style={{
                            color: "#ffffff",
                            fontSize: `${Math.max(
                                12,
                                dimensions.fontSize + 3,
                            )}px`,
                            fontWeight: 600,
                            fontFamily: "system-ui, -apple-system, sans-serif",
                        }}
                    >
                        Templates
                    </div>
                </div>

                {/* Delete mode toggle */}
                <button
                    onClick={() => setIsDeleteMode(!isDeleteMode)}
                    style={{
                        background: "none",
                        border: "none",
                        padding: "4px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.2s ease",
                    }}
                >
                    <Trash2
                        size={Math.max(12, dimensions.iconSize - 2)}
                        color={isDeleteMode ? "#e74c3c" : "#ffffff"}
                    />
                </button>
            </div>

            <div
                style={{
                    overflowX: templates.length > 3 ? "auto" : "hidden",
                    overflowY: "hidden",
                    margin: `0 -${dimensions.padding}px`,
                    padding: `0 ${dimensions.padding}px`,
                }}
                className="hide-scrollbar"
            >
                <div
                    style={{
                        display: "grid",
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
                        style={{
                            height: `${dimensions.cardHeight}px`,
                            minWidth: "80px",
                            background: "rgba(255, 255, 255, 0.1)",
                            borderRadius: "8px",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "2px",
                            cursor: "pointer",
                            border: "1px solid rgba(255, 255, 255, 0.2)",
                            transition: "all 0.2s ease",
                            padding: "4px",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background =
                                "rgba(255, 255, 255, 0.15)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background =
                                "rgba(255, 255, 255, 0.1)";
                        }}
                    >
                        <Plus size={dimensions.iconSize} color="#ffffff" />
                        <div
                            style={{
                                color: "#ffffff",
                                fontSize: `${dimensions.fontSize}px`,
                                fontFamily:
                                    "system-ui, -apple-system, sans-serif",
                            }}
                        >
                            Add New
                        </div>
                    </div>

                    {/* Template Items */}
                    {templates.map((template, index) => (
                        <div
                            key={index}
                            style={{
                                position: "relative",
                            }}
                        >
                            {isDeleteMode && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteTemplate(template.name);
                                    }}
                                    style={{
                                        position: "absolute",
                                        top: "5%",
                                        right: "5%",
                                        zIndex: 2,
                                        border: "none",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        cursor: "pointer",
                                        padding: 0,
                                        transition: "all 0.2s ease",
                                    }}
                                >
                                    <X
                                        size={Math.max(
                                            10,
                                            dimensions.iconSize - 4,
                                        )}
                                        color="#ffffff"
                                    />
                                </button>
                            )}
                            <div
                                onClick={() =>
                                    !isDeleteMode &&
                                    handleOpenTemplate(template)
                                }
                                style={{
                                    height: `${dimensions.cardHeight}px`,
                                    minWidth: "80px",
                                    background: template.backgroundColor
                                        ? `${template.backgroundColor}80`
                                        : "rgba(255, 255, 255, 0.1)",
                                    borderRadius: "8px",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "2px",
                                    cursor: isDeleteMode
                                        ? "default"
                                        : "pointer",
                                    border: template.backgroundColor
                                        ? `1px solid ${template.backgroundColor}33`
                                        : "1px solid rgba(255, 255, 255, 0.2)",
                                    transition: "all 0.2s ease",
                                    padding: "4px",
                                    backdropFilter: "blur(10px)",
                                }}
                                onMouseEnter={(e) => {
                                    if (!isDeleteMode) {
                                        e.currentTarget.style.background =
                                            template.backgroundColor
                                                ? `${template.backgroundColor}A6`
                                                : "rgba(255, 255, 255, 0.15)";
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isDeleteMode) {
                                        e.currentTarget.style.background =
                                            template.backgroundColor
                                                ? `${template.backgroundColor}80`
                                                : "rgba(255, 255, 255, 0.1)";
                                    }
                                }}
                            >
                                <div
                                    style={{
                                        color: "#ffffff",
                                        fontSize: `${dimensions.fontSize}px`,
                                        fontFamily:
                                            "system-ui, -apple-system, sans-serif",
                                        textAlign: "center",
                                        wordBreak: "break-word",
                                        lineHeight: "1.2",
                                    }}
                                >
                                    {template.name}
                                </div>
                                <div
                                    style={{
                                        color: "rgba(255, 255, 255, 0.5)",
                                        fontSize: `${Math.max(
                                            8,
                                            dimensions.fontSize - 1,
                                        )}px`,
                                        fontFamily:
                                            "system-ui, -apple-system, sans-serif",
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
                                style={{
                                    height: `${dimensions.cardHeight}px`,
                                    minWidth: "80px",
                                    background: "rgba(255, 255, 255, 0.05)",
                                    borderRadius: "8px",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "2px",
                                    border: "1px solid rgba(255, 255, 255, 0.1)",
                                    padding: "4px",
                                }}
                            >
                                <Circle
                                    size={dimensions.iconSize}
                                    color="rgba(255, 255, 255, 0.3)"
                                />
                                <div
                                    style={{
                                        color: "rgba(255, 255, 255, 0.3)",
                                        fontSize: `${dimensions.fontSize}px`,
                                        fontFamily:
                                            "system-ui, -apple-system, sans-serif",
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
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: "rgba(0, 0, 0, 0.9)",
                        backdropFilter: "blur(4px)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "16px",
                        padding: "16px",
                        gap: "16px",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            gap: "16px",
                            width: "100%",
                            maxWidth: "400px",
                        }}
                    >
                        {/* Open Tabs Option */}
                        <button
                            onClick={() => handleModeSelect("current")}
                            style={{
                                flex: 1,
                                padding: "16px",
                                borderRadius: "12px",
                                border: "1px solid rgba(255, 255, 255, 0.2)",
                                background: "rgba(66, 133, 244, 0.2)",
                                color: "#ffffff",
                                cursor: "pointer",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: "8px",
                                transition: "all 0.2s ease",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background =
                                    "rgba(66, 133, 244, 0.3)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background =
                                    "rgba(66, 133, 244, 0.2)";
                            }}
                        >
                            <Layout size={24} />
                            <div style={{ fontSize: "14px", fontWeight: 600 }}>
                                From Open Tabs
                            </div>
                            <div
                                style={{
                                    fontSize: "12px",
                                    color: "rgba(255, 255, 255, 0.7)",
                                    textAlign: "center",
                                }}
                            >
                                Save your currently open tabs as a template
                            </div>
                        </button>

                        {/* Add Manually Option */}
                        <button
                            onClick={() => handleModeSelect("new")}
                            style={{
                                flex: 1,
                                padding: "16px",
                                borderRadius: "12px",
                                border: "1px solid rgba(255, 255, 255, 0.2)",
                                background: "rgba(52, 168, 83, 0.2)",
                                color: "#ffffff",
                                cursor: "pointer",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: "8px",
                                transition: "all 0.2s ease",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background =
                                    "rgba(52, 168, 83, 0.3)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background =
                                    "rgba(52, 168, 83, 0.2)";
                            }}
                        >
                            <Plus size={24} />
                            <div style={{ fontSize: "14px", fontWeight: 600 }}>
                                Add Manually
                            </div>
                            <div
                                style={{
                                    fontSize: "12px",
                                    color: "rgba(255, 255, 255, 0.7)",
                                    textAlign: "center",
                                }}
                            >
                                Manually enter URLs for your template
                            </div>
                        </button>
                    </div>

                    {/* Close button */}
                    <button
                        onClick={handleModalClose}
                        style={{
                            position: "absolute",
                            top: "16px",
                            right: "16px",
                            background: "none",
                            border: "none",
                            color: "#ffffff",
                            cursor: "pointer",
                            padding: "6px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <X size={16} />
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
