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

    // Container styles based on mode
    const containerStyle = isDarkMode
        ? {
              position: "absolute" as const,
              inset: 0,
              background: "rgba(0, 0, 0, 0.8)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              borderRadius: "16px",
              backdropFilter: "blur(10px)",
              display: "flex",
              flexDirection: "column" as const,
              padding: "24px",
          }
        : {};

    const modalClasses = isDarkMode
        ? ""
        : "absolute inset-0 bg-white border border-gray-200 rounded-2xl shadow-2xl flex flex-col p-6";

    return (
        <div style={isDarkMode ? containerStyle : {}} className={modalClasses}>
            {/* Header */}
            <div
                style={
                    isDarkMode
                        ? {
                              display: "flex",
                              alignItems: "center",
                              gap: "12px",
                              marginBottom: "24px",
                              paddingBottom: "16px",
                              borderBottom:
                                  "1px solid rgba(255, 255, 255, 0.1)",
                          }
                        : {}
                }
                className={
                    !isDarkMode
                        ? "flex items-center gap-3 mb-6 pb-4 border-b border-gray-100"
                        : ""
                }
            >
                <div
                    style={
                        isDarkMode
                            ? {
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "12px",
                                  flex: 1,
                              }
                            : {}
                    }
                    className={
                        !isDarkMode ? "flex items-center gap-3 flex-1" : ""
                    }
                >
                    <input
                        type="text"
                        placeholder="Template Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        style={
                            isDarkMode
                                ? {
                                      flex: 1,
                                      padding: "6px 12px",
                                      borderRadius: "8px",
                                      border: "1px solid rgba(255, 255, 255, 0.2)",
                                      background: "rgba(255, 255, 255, 0.1)",
                                      color: "#ffffff",
                                      fontSize: "14px",
                                      outline: "none",
                                      height: "100%",
                                  }
                                : {}
                        }
                        className={
                            !isDarkMode
                                ? "flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-black placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors"
                                : ""
                        }
                    />

                    {/* Color Picker */}
                    <div style={{ position: "relative" }}>
                        <button
                            onClick={() =>
                                setIsColorPickerExpanded(!isColorPickerExpanded)
                            }
                            style={
                                isDarkMode
                                    ? {
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
                                      }
                                    : {
                                          backgroundColor:
                                              selectedColor || "#f8f9fa",
                                      }
                            }
                            className={
                                !isDarkMode
                                    ? "w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:border-gray-300 transition-colors"
                                    : ""
                            }
                        >
                            <Plus
                                size={isDarkMode ? 14 : 12}
                                color={
                                    selectedColor
                                        ? "#ffffff"
                                        : isDarkMode
                                        ? "#ffffff"
                                        : "#6c757d"
                                }
                                style={{
                                    filter: isDarkMode
                                        ? "drop-shadow(0 0 2px rgba(0,0,0,0.8))"
                                        : undefined,
                                    transform: isColorPickerExpanded
                                        ? "rotate(45deg)"
                                        : "rotate(0deg)",
                                    transition: "transform 0.2s ease",
                                }}
                            />
                        </button>

                        {isColorPickerExpanded && (
                            <div
                                style={
                                    isDarkMode
                                        ? {
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
                                          }
                                        : {}
                                }
                                className={
                                    !isDarkMode
                                        ? "absolute top-10 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-50"
                                        : ""
                                }
                            >
                                {colorOptions.map((color) => (
                                    <button
                                        key={color.value}
                                        onClick={() =>
                                            handleColorSelect(color.value)
                                        }
                                        style={
                                            isDarkMode
                                                ? {
                                                      width: "1.5rem",
                                                      height: "1.5rem",
                                                      borderRadius: "50%",
                                                      background: color.value,
                                                      border:
                                                          selectedColor ===
                                                          color.value
                                                              ? "2px solid #ffffff"
                                                              : "1px solid rgba(255, 255, 255, 0.3)",
                                                      cursor: "pointer",
                                                      padding: 0,
                                                      transition:
                                                          "all 0.2s ease",
                                                  }
                                                : {
                                                      backgroundColor:
                                                          color.value,
                                                      border:
                                                          selectedColor ===
                                                          color.value
                                                              ? "2px solid #000000"
                                                              : "transparent",
                                                  }
                                        }
                                        className={
                                            !isDarkMode
                                                ? "w-6 h-6 rounded-full border border-white m-1 hover:scale-110 transition-transform"
                                                : ""
                                        }
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
                    style={
                        isDarkMode
                            ? {
                                  padding: "8px",
                                  borderRadius: "8px",
                                  background: "rgba(255, 255, 255, 0.1)",
                                  border: "1px solid rgba(255, 255, 255, 0.2)",
                                  cursor: "pointer",
                                  transition: "all 0.2s ease",
                              }
                            : {}
                    }
                    className={
                        !isDarkMode
                            ? "p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            : ""
                    }
                >
                    <ArrowRight
                        size={16}
                        color={isDarkMode ? "#ffffff" : "#374151"}
                    />
                </button>
                <button
                    onClick={onClose}
                    style={
                        isDarkMode
                            ? {
                                  padding: "8px",
                                  borderRadius: "8px",
                                  background: "rgba(255, 255, 255, 0.1)",
                                  border: "1px solid rgba(255, 255, 255, 0.2)",
                                  cursor: "pointer",
                                  transition: "all 0.2s ease",
                              }
                            : {}
                    }
                    className={
                        !isDarkMode
                            ? "p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                            : ""
                    }
                >
                    <X size={16} color={isDarkMode ? "#ffffff" : "#374151"} />
                </button>
            </div>

            {/* Content */}
            <div
                style={
                    isDarkMode ? { flex: 1, overflowY: "auto" as const } : {}
                }
                className={!isDarkMode ? "flex-1 overflow-y-auto" : ""}
            >
                {mode === "current" ? (
                    <div
                        style={
                            isDarkMode
                                ? {
                                      display: "flex",
                                      flexDirection: "column",
                                      gap: "4px",
                                  }
                                : {}
                        }
                        className={!isDarkMode ? "space-y-1" : ""}
                    >
                        {currentTabs.map((tab, index) => (
                            <div key={tab.url}>
                                <div
                                    onClick={() => toggleTab(index)}
                                    style={
                                        isDarkMode
                                            ? {
                                                  display: "flex",
                                                  alignItems: "center",
                                                  gap: "12px",
                                                  padding: "8px",
                                                  borderRadius: "8px",
                                                  cursor: "pointer",
                                                  transition: "all 0.2s ease",
                                                  background:
                                                      "rgba(255, 255, 255, 0.05)",
                                              }
                                            : {}
                                    }
                                    className={
                                        !isDarkMode
                                            ? "flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                                            : ""
                                    }
                                >
                                    <div
                                        style={{
                                            width: "16px",
                                            height: "16px",
                                            border: `1px solid ${
                                                tab.checked
                                                    ? "#000000"
                                                    : isDarkMode
                                                    ? "rgba(255, 255, 255, 0.3)"
                                                    : "#d1d5db"
                                            }`,
                                            borderRadius: "4px",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            flexShrink: 0,
                                            transition: "colors 0.2s ease",
                                            backgroundColor: tab.checked
                                                ? "#000000"
                                                : "transparent",
                                        }}
                                    >
                                        {tab.checked && (
                                            <Check size={10} color="#ffffff" />
                                        )}
                                    </div>
                                    <div
                                        style={
                                            isDarkMode
                                                ? { flex: 1, minWidth: 0 }
                                                : {}
                                        }
                                        className={
                                            !isDarkMode ? "flex-1 min-w-0" : ""
                                        }
                                    >
                                        <div
                                            style={
                                                isDarkMode
                                                    ? {
                                                          color: "#ffffff",
                                                          fontSize: "14px",
                                                          fontWeight: 500,
                                                          whiteSpace: "nowrap",
                                                          overflow: "hidden",
                                                          textOverflow:
                                                              "ellipsis",
                                                      }
                                                    : {}
                                            }
                                            className={
                                                !isDarkMode
                                                    ? "font-medium text-sm truncate text-black"
                                                    : ""
                                            }
                                        >
                                            {tab.title}
                                        </div>
                                        <div
                                            style={
                                                isDarkMode
                                                    ? {
                                                          color: "rgba(255, 255, 255, 0.5)",
                                                          fontSize: "12px",
                                                          whiteSpace: "nowrap",
                                                          overflow: "hidden",
                                                          textOverflow:
                                                              "ellipsis",
                                                      }
                                                    : {}
                                            }
                                            className={
                                                !isDarkMode
                                                    ? "text-xs truncate text-gray-500"
                                                    : ""
                                            }
                                        >
                                            {tab.url}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div
                        style={
                            isDarkMode
                                ? {
                                      display: "flex",
                                      flexDirection: "column",
                                      gap: "12px",
                                  }
                                : {}
                        }
                        className={!isDarkMode ? "space-y-3" : ""}
                    >
                        <div
                            style={
                                isDarkMode
                                    ? { display: "flex", gap: "8px" }
                                    : {}
                            }
                            className={!isDarkMode ? "flex gap-2" : ""}
                        >
                            <input
                                type="url"
                                placeholder="Enter URL"
                                value={newUrl}
                                onChange={(e) => setNewUrl(e.target.value)}
                                onKeyPress={(e) =>
                                    e.key === "Enter" && handleAddUrl()
                                }
                                style={
                                    isDarkMode
                                        ? {
                                              flex: 1,
                                              padding: "8px 12px",
                                              borderRadius: "8px",
                                              border: "1px solid rgba(255, 255, 255, 0.2)",
                                              background:
                                                  "rgba(255, 255, 255, 0.1)",
                                              color: "#ffffff",
                                              fontSize: "14px",
                                              outline: "none",
                                          }
                                        : {}
                                }
                                className={
                                    !isDarkMode
                                        ? "flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 transition-colors text-black placeholder-gray-400"
                                        : ""
                                }
                            />
                            <button
                                onClick={handleAddUrl}
                                disabled={!newUrl.trim()}
                                style={
                                    isDarkMode
                                        ? {
                                              padding: "8px 16px",
                                              borderRadius: "8px",
                                              background:
                                                  "rgba(255, 255, 255, 0.1)",
                                              border: "1px solid rgba(255, 255, 255, 0.2)",
                                              cursor: newUrl.trim()
                                                  ? "pointer"
                                                  : "not-allowed",
                                              opacity: newUrl.trim() ? 1 : 0.5,
                                              transition: "all 0.2s ease",
                                          }
                                        : {}
                                }
                                className={
                                    !isDarkMode
                                        ? "px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        : ""
                                }
                            >
                                <Plus
                                    size={16}
                                    color={isDarkMode ? "#ffffff" : "#374151"}
                                />
                            </button>
                        </div>

                        <div
                            style={
                                isDarkMode
                                    ? {
                                          display: "flex",
                                          flexDirection: "column",
                                          gap: "8px",
                                      }
                                    : {}
                            }
                            className={!isDarkMode ? "space-y-2" : ""}
                        >
                            {urls.map((url, index) => (
                                <div
                                    key={index}
                                    style={
                                        isDarkMode
                                            ? {
                                                  display: "flex",
                                                  alignItems: "center",
                                                  gap: "12px",
                                                  padding: "8px",
                                                  borderRadius: "8px",
                                                  border: "1px solid rgba(255, 255, 255, 0.2)",
                                                  background:
                                                      "rgba(255, 255, 255, 0.05)",
                                              }
                                            : {}
                                    }
                                    className={
                                        !isDarkMode
                                            ? "flex items-center gap-3 p-2 rounded-lg border border-gray-200"
                                            : ""
                                    }
                                >
                                    <div
                                        style={
                                            isDarkMode
                                                ? { flex: 1, minWidth: 0 }
                                                : {}
                                        }
                                        className={
                                            !isDarkMode ? "flex-1 min-w-0" : ""
                                        }
                                    >
                                        <div
                                            style={
                                                isDarkMode
                                                    ? {
                                                          color: "#ffffff",
                                                          fontSize: "14px",
                                                          whiteSpace: "nowrap",
                                                          overflow: "hidden",
                                                          textOverflow:
                                                              "ellipsis",
                                                      }
                                                    : {}
                                            }
                                            className={
                                                !isDarkMode
                                                    ? "text-sm truncate text-black"
                                                    : ""
                                            }
                                        >
                                            {url}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveUrl(url)}
                                        style={
                                            isDarkMode
                                                ? {
                                                      padding: "4px",
                                                      borderRadius: "4px",
                                                      background: "transparent",
                                                      border: "none",
                                                      cursor: "pointer",
                                                      transition:
                                                          "all 0.2s ease",
                                                  }
                                                : {}
                                        }
                                        className={
                                            !isDarkMode
                                                ? "p-1 rounded hover:bg-red-50 transition-colors"
                                                : ""
                                        }
                                    >
                                        <X size={12} color="#ef4444" />
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
    const [containerHeight, setContainerHeight] = useState(100);
    const containerRef = useRef<HTMLDivElement>(null);
    const [showModeSelector, setShowModeSelector] = useState(false);

    useEffect(() => {
        loadTemplates();
    }, []);

    // Track container height for responsive scaling
    useEffect(() => {
        const updateHeight = () => {
            if (containerRef.current) {
                setContainerHeight(containerRef.current.offsetHeight);
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

    // Container styles based on mode
    const containerStyle = isDarkMode
        ? {
              background: "rgba(255, 255, 255, 0.05)",
              borderRadius: "16px",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              backdropFilter: "blur(10px)",
              padding: `${dimensions.padding}px`,
              gap: `${dimensions.gap}px`,
              height: "100%",
              display: "flex",
              flexDirection: "column" as const,
              position: "relative" as const,
              transition: "all 0.3s ease",
          }
        : {
              padding: `${dimensions.padding}px`,
              gap: `${dimensions.gap}px`,
          };

    const containerClasses = isDarkMode
        ? ""
        : "bg-white rounded-2xl border border-gray-200 h-full flex flex-col relative transition-all duration-300 shadow-sm";

    return (
        <div
            ref={containerRef}
            style={containerStyle}
            className={containerClasses}
        >
            {/* Header */}
            <div
                style={
                    isDarkMode
                        ? {
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                          }
                        : {}
                }
                className={
                    !isDarkMode ? "flex items-center justify-between" : ""
                }
            >
                <div
                    style={
                        isDarkMode
                            ? {
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                              }
                            : {}
                    }
                    className={!isDarkMode ? "flex items-center gap-2" : ""}
                >
                    <Layout
                        size={dimensions.iconSize}
                        color={isDarkMode ? "#ffffff" : "#374151"}
                    />
                    <div
                        style={
                            isDarkMode
                                ? {
                                      color: "#ffffff",
                                      fontSize: `${Math.max(
                                          12,
                                          dimensions.fontSize + 3,
                                      )}px`,
                                      fontFamily:
                                          "system-ui, -apple-system, sans-serif",
                                      fontWeight: 500,
                                  }
                                : {
                                      fontSize: `${Math.max(
                                          12,
                                          dimensions.fontSize + 3,
                                      )}px`,
                                  }
                        }
                        className={!isDarkMode ? "font-medium text-black" : ""}
                    >
                        Templates
                    </div>
                </div>

                {/* Delete mode toggle */}
                <button
                    onClick={() => setIsDeleteMode(!isDeleteMode)}
                    style={
                        isDarkMode
                            ? {
                                  padding: "4px",
                                  borderRadius: "8px",
                                  background: "transparent",
                                  border: "none",
                                  cursor: "pointer",
                                  transition: "all 0.2s ease",
                              }
                            : {}
                    }
                    className={
                        !isDarkMode
                            ? "p-1 rounded-lg hover:bg-gray-100 transition-colors"
                            : ""
                    }
                >
                    <Trash2
                        size={Math.max(12, dimensions.iconSize - 2)}
                        color={
                            isDeleteMode
                                ? "#ef4444"
                                : isDarkMode
                                ? "rgba(255, 255, 255, 0.5)"
                                : "#9ca3af"
                        }
                    />
                </button>
            </div>

            {/* Templates Grid */}
            <div
                style={
                    isDarkMode
                        ? {
                              overflowX: "auto",
                              overflowY: "hidden",
                              margin: `0 -${dimensions.padding}px`,
                              padding: `0 ${dimensions.padding}px`,
                          }
                        : {
                              margin: `0 -${dimensions.padding}px`,
                              padding: `0 ${dimensions.padding}px`,
                          }
                }
                className={
                    !isDarkMode ? "overflow-x-auto overflow-y-hidden" : ""
                }
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
                        style={
                            isDarkMode
                                ? {
                                      background: "rgba(255, 255, 255, 0.1)",
                                      borderRadius: "8px",
                                      border: "1px solid rgba(255, 255, 255, 0.2)",
                                      display: "flex",
                                      flexDirection: "column",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      gap: "4px",
                                      cursor: "pointer",
                                      transition: "all 0.2s ease",
                                      padding: "8px",
                                      height: `${dimensions.cardHeight}px`,
                                      minWidth: "80px",
                                  }
                                : {
                                      height: `${dimensions.cardHeight}px`,
                                      minWidth: "80px",
                                  }
                        }
                        className={
                            !isDarkMode
                                ? "bg-gray-50 rounded-lg border border-gray-200 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-gray-100 hover:border-gray-300 transition-all hover:-translate-y-0.5 p-2"
                                : ""
                        }
                    >
                        <Plus
                            size={dimensions.iconSize}
                            color={
                                isDarkMode
                                    ? "rgba(255, 255, 255, 0.7)"
                                    : "#6b7280"
                            }
                        />
                        <div
                            style={
                                isDarkMode
                                    ? {
                                          color: "rgba(255, 255, 255, 0.7)",
                                          fontSize: `${dimensions.fontSize}px`,
                                          fontFamily:
                                              "system-ui, -apple-system, sans-serif",
                                          textAlign: "center",
                                          fontWeight: 500,
                                      }
                                    : {
                                          fontSize: `${dimensions.fontSize}px`,
                                      }
                            }
                            className={
                                !isDarkMode
                                    ? "text-gray-600 font-medium text-center"
                                    : ""
                            }
                        >
                            Add New
                        </div>
                    </div>

                    {/* Template Items */}
                    {templates.map((template, index) => (
                        <div key={index} style={{ position: "relative" }}>
                            {isDeleteMode && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteTemplate(template.name);
                                    }}
                                    style={
                                        isDarkMode
                                            ? {
                                                  position: "absolute",
                                                  top: "4px",
                                                  right: "4px",
                                                  zIndex: 10,
                                                  padding: "4px",
                                                  borderRadius: "50%",
                                                  background:
                                                      "rgba(0, 0, 0, 0.8)",
                                                  border: "1px solid rgba(255, 255, 255, 0.2)",
                                                  cursor: "pointer",
                                                  transition: "all 0.2s ease",
                                              }
                                            : {}
                                    }
                                    className={
                                        !isDarkMode
                                            ? "absolute top-1 right-1 z-10 p-1 rounded-full bg-white border border-gray-200 hover:bg-red-50 hover:border-red-200 transition-colors"
                                            : ""
                                    }
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
                                style={
                                    isDarkMode
                                        ? {
                                              borderRadius: "8px",
                                              border: "1px solid rgba(255, 255, 255, 0.2)",
                                              display: "flex",
                                              flexDirection: "column",
                                              alignItems: "center",
                                              justifyContent: "center",
                                              gap: "4px",
                                              cursor: isDeleteMode
                                                  ? "default"
                                                  : "pointer",
                                              transition: "all 0.2s ease",
                                              padding: "8px",
                                              height: `${dimensions.cardHeight}px`,
                                              minWidth: "80px",
                                              background:
                                                  template.backgroundColor
                                                      ? `${template.backgroundColor}80`
                                                      : "rgba(255, 255, 255, 0.1)",
                                          }
                                        : {
                                              height: `${dimensions.cardHeight}px`,
                                              minWidth: "80px",
                                              backgroundColor:
                                                  template.backgroundColor
                                                      ? `${template.backgroundColor}20`
                                                      : "#f9fafb",
                                              borderColor:
                                                  template.backgroundColor
                                                      ? `${template.backgroundColor}60`
                                                      : "#e5e7eb",
                                              cursor: isDeleteMode
                                                  ? "default"
                                                  : "pointer",
                                          }
                                }
                                className={
                                    !isDarkMode
                                        ? "rounded-lg border flex flex-col items-center justify-center gap-1 cursor-pointer transition-all hover:-translate-y-0.5 p-2"
                                        : ""
                                }
                                onMouseEnter={(e) => {
                                    if (!isDeleteMode) {
                                        if (isDarkMode) {
                                            e.currentTarget.style.background =
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
                                            e.currentTarget.style.background =
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
                                    style={
                                        isDarkMode
                                            ? {
                                                  color: "#ffffff",
                                                  fontSize: `${dimensions.fontSize}px`,
                                                  fontFamily:
                                                      "system-ui, -apple-system, sans-serif",
                                                  textAlign: "center",
                                                  wordBreak: "break-word",
                                                  lineHeight: "1.2",
                                              }
                                            : {
                                                  fontSize: `${dimensions.fontSize}px`,
                                              }
                                    }
                                    className={
                                        !isDarkMode
                                            ? "font-medium text-black text-center break-words leading-tight"
                                            : ""
                                    }
                                >
                                    {template.name}
                                </div>
                                <div
                                    style={
                                        isDarkMode
                                            ? {
                                                  color: "rgba(255, 255, 255, 0.5)",
                                                  fontSize: `${Math.max(
                                                      8,
                                                      dimensions.fontSize - 1,
                                                  )}px`,
                                                  fontFamily:
                                                      "system-ui, -apple-system, sans-serif",
                                              }
                                            : {
                                                  fontSize: `${Math.max(
                                                      8,
                                                      dimensions.fontSize - 1,
                                                  )}px`,
                                              }
                                    }
                                    className={
                                        !isDarkMode
                                            ? "text-gray-500 text-center"
                                            : ""
                                    }
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
                                style={
                                    isDarkMode
                                        ? {
                                              background:
                                                  "rgba(255, 255, 255, 0.05)",
                                              borderRadius: "8px",
                                              border: "1px solid rgba(255, 255, 255, 0.1)",
                                              display: "flex",
                                              flexDirection: "column",
                                              alignItems: "center",
                                              justifyContent: "center",
                                              gap: "4px",
                                              padding: "8px",
                                              height: `${dimensions.cardHeight}px`,
                                              minWidth: "80px",
                                          }
                                        : {
                                              height: `${dimensions.cardHeight}px`,
                                              minWidth: "80px",
                                          }
                                }
                                className={
                                    !isDarkMode
                                        ? "bg-gray-25 rounded-lg border border-gray-100 flex flex-col items-center justify-center gap-1 p-2"
                                        : ""
                                }
                            >
                                <Circle
                                    size={dimensions.iconSize}
                                    color={
                                        isDarkMode
                                            ? "rgba(255, 255, 255, 0.3)"
                                            : "#d1d5db"
                                    }
                                />
                                <div
                                    style={
                                        isDarkMode
                                            ? {
                                                  color: "rgba(255, 255, 255, 0.3)",
                                                  fontSize: `${dimensions.fontSize}px`,
                                                  fontFamily:
                                                      "system-ui, -apple-system, sans-serif",
                                                  textAlign: "center",
                                              }
                                            : {
                                                  fontSize: `${dimensions.fontSize}px`,
                                              }
                                    }
                                    className={
                                        !isDarkMode
                                            ? "text-gray-400 text-center"
                                            : ""
                                    }
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
                    style={
                        isDarkMode
                            ? {
                                  position: "absolute",
                                  inset: 0,
                                  background: "rgba(0, 0, 0, 0.9)",
                                  border: "1px solid rgba(255, 255, 255, 0.2)",
                                  borderRadius: "16px",
                                  backdropFilter: "blur(10px)",
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  padding: "24px",
                                  gap: "24px",
                              }
                            : {}
                    }
                    className={
                        !isDarkMode
                            ? "absolute inset-0 bg-white border border-gray-200 rounded-2xl shadow-2xl flex flex-col items-center justify-center p-6 gap-6"
                            : ""
                    }
                >
                    <div
                        style={
                            isDarkMode
                                ? {
                                      display: "flex",
                                      gap: "16px",
                                      width: "100%",
                                      maxWidth: "28rem",
                                  }
                                : {}
                        }
                        className={
                            !isDarkMode ? "flex gap-4 w-full max-w-md" : ""
                        }
                    >
                        {/* Open Tabs Option */}
                        <button
                            onClick={() => handleModeSelect("current")}
                            style={
                                isDarkMode
                                    ? {
                                          flex: 1,
                                          padding: "16px",
                                          border: "1px solid rgba(255, 255, 255, 0.2)",
                                          borderRadius: "12px",
                                          background:
                                              "rgba(255, 255, 255, 0.05)",
                                          cursor: "pointer",
                                          transition: "all 0.2s ease",
                                          display: "flex",
                                          flexDirection: "column",
                                          alignItems: "center",
                                          gap: "12px",
                                      }
                                    : {}
                            }
                            className={
                                !isDarkMode
                                    ? "flex-1 p-4 border border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all flex flex-col items-center gap-3"
                                    : ""
                            }
                        >
                            <Layout
                                size={24}
                                color={isDarkMode ? "#ffffff" : "#374151"}
                            />
                            <div
                                style={
                                    isDarkMode
                                        ? {
                                              color: "#ffffff",
                                              fontSize: "14px",
                                              fontWeight: 500,
                                          }
                                        : {}
                                }
                                className={
                                    !isDarkMode
                                        ? "text-sm font-medium text-black"
                                        : ""
                                }
                            >
                                From Open Tabs
                            </div>
                            <div
                                style={
                                    isDarkMode
                                        ? {
                                              color: "rgba(255, 255, 255, 0.5)",
                                              fontSize: "12px",
                                              textAlign: "center",
                                          }
                                        : {}
                                }
                                className={
                                    !isDarkMode
                                        ? "text-xs text-center text-gray-500"
                                        : ""
                                }
                            >
                                Create template from currently open tabs
                            </div>
                        </button>

                        {/* Manual Entry Option */}
                        <button
                            onClick={() => handleModeSelect("new")}
                            style={
                                isDarkMode
                                    ? {
                                          flex: 1,
                                          padding: "16px",
                                          border: "1px solid rgba(255, 255, 255, 0.2)",
                                          borderRadius: "12px",
                                          background:
                                              "rgba(255, 255, 255, 0.05)",
                                          cursor: "pointer",
                                          transition: "all 0.2s ease",
                                          display: "flex",
                                          flexDirection: "column",
                                          alignItems: "center",
                                          gap: "12px",
                                      }
                                    : {}
                            }
                            className={
                                !isDarkMode
                                    ? "flex-1 p-4 border border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all flex flex-col items-center gap-3"
                                    : ""
                            }
                        >
                            <Plus
                                size={24}
                                color={isDarkMode ? "#ffffff" : "#374151"}
                            />
                            <div
                                style={
                                    isDarkMode
                                        ? {
                                              color: "#ffffff",
                                              fontSize: "14px",
                                              fontWeight: 500,
                                          }
                                        : {}
                                }
                                className={
                                    !isDarkMode
                                        ? "text-sm font-medium text-black"
                                        : ""
                                }
                            >
                                Manual Entry
                            </div>
                            <div
                                style={
                                    isDarkMode
                                        ? {
                                              color: "rgba(255, 255, 255, 0.5)",
                                              fontSize: "12px",
                                              textAlign: "center",
                                          }
                                        : {}
                                }
                                className={
                                    !isDarkMode
                                        ? "text-xs text-center text-gray-500"
                                        : ""
                                }
                            >
                                Add URLs manually to create template
                            </div>
                        </button>
                    </div>

                    <button
                        onClick={() => {
                            setShowModeSelector(false);
                            setIsExpanded(false);
                        }}
                        style={
                            isDarkMode
                                ? {
                                      padding: "8px 16px",
                                      borderRadius: "8px",
                                      border: "1px solid rgba(255, 255, 255, 0.2)",
                                      background: "rgba(255, 255, 255, 0.1)",
                                      color: "#ffffff",
                                      cursor: "pointer",
                                      transition: "all 0.2s ease",
                                  }
                                : {}
                        }
                        className={
                            !isDarkMode
                                ? "px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                                : ""
                        }
                    >
                        Cancel
                    </button>
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
