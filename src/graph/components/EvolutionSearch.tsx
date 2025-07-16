import React, { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";
import type { NetworkNode } from "../types/network.types";

interface EvolutionSearchProps {
    nodes: NetworkNode[];
    onNodeSelect: (nodeId: string | null) => void;
    selectedNode: string | null;
    isDarkMode?: boolean;
}

const EvolutionSearch: React.FC<EvolutionSearchProps> = ({
    nodes,
    onNodeSelect,
    selectedNode,
    isDarkMode = true,
}) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [dropdownVisible, setDropdownVisible] = useState(false);
    const [matchingNodes, setMatchingNodes] = useState<NetworkNode[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Get selected node details
    const selectedNodeDetails = selectedNode
        ? nodes.find((n) => n.id === selectedNode)
        : null;

    // Handle search term changes
    useEffect(() => {
        if (!searchTerm.trim()) {
            setMatchingNodes([]);
            setDropdownVisible(false);
            return;
        }

        const searchTermLower = searchTerm.toLowerCase();
        const filtered = nodes
            .filter(
                (node) =>
                    node.url.toLowerCase().includes(searchTermLower) ||
                    (node.youtubeMetadata?.title || "")
                        .toLowerCase()
                        .includes(searchTermLower),
            )
            .slice(0, 5);

        setMatchingNodes(filtered);
        setDropdownVisible(filtered.length > 0);
    }, [searchTerm, nodes]);

    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node) &&
                !inputRef.current?.contains(event.target as Node)
            ) {
                setDropdownVisible(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Format URL for display
    const formatUrl = (url: string) => {
        try {
            const urlObj = new URL(url);
            const path = urlObj.pathname !== "/" ? urlObj.pathname : "";
            const query = urlObj.search;
            const domain = urlObj.hostname.replace(/^www\./, "");
            return {
                domain,
                fullPath: `${domain}${path}${query}`,
            };
        } catch {
            return {
                domain: url,
                fullPath: url,
            };
        }
    };

    // Truncate text for display
    const truncateText = (text: string, maxLength: number = 30) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + "...";
    };

    return (
        <div style={{ position: "relative", width: "100%" }}>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    width: "100%",
                }}
            >
                {selectedNode ? (
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            background: isDarkMode
                                ? "rgba(66, 133, 244, 0.2)"
                                : "#e3f2fd",
                            padding: "4px 8px",
                            borderRadius: "4px",
                            fontSize: "14px",
                            color: isDarkMode ? "#66b3ff" : "#1976d2",
                            // Remove flex: 1 to make it fit content
                            width: "fit-content",
                        }}
                    >
                        <span
                            style={{
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                maxWidth: "250px", // Set a reasonable max width
                            }}
                        >
                            {truncateText(
                                selectedNodeDetails?.youtubeMetadata?.title ||
                                    formatUrl(selectedNodeDetails?.url || "")
                                        .fullPath,
                            )}
                        </span>
                        <button
                            onClick={() => {
                                onNodeSelect(null);
                                setSearchTerm("");
                            }}
                            style={{
                                background: "none",
                                border: "none",
                                padding: "2px",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                color: isDarkMode ? "#66b3ff" : "#1976d2",
                            }}
                        >
                            <X size={14} />
                        </button>
                    </div>
                ) : (
                    <input
                        ref={inputRef}
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search URLs to track"
                        style={{
                            border: "none",
                            outline: "none",
                            width: "100%",
                            fontSize: "14px",
                            background: "transparent",
                            color: isDarkMode ? "#ffffff" : "#333333",
                        }}
                    />
                )}
            </div>

            {/* Dropdown */}
            {dropdownVisible && !selectedNode && (
                <div
                    ref={dropdownRef}
                    style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        marginTop: "4px",
                        background: isDarkMode
                            ? "rgba(0, 0, 0, 0.95)"
                            : "white",
                        borderRadius: "8px",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                        maxHeight: "200px",
                        overflowY: "auto",
                        zIndex: 1001,
                        border: isDarkMode
                            ? "1px solid rgba(255, 255, 255, 0.2)"
                            : "1px solid #ddd",
                    }}
                >
                    {matchingNodes.map((node) => {
                        const urlInfo = formatUrl(node.url);
                        return (
                            <div
                                key={node.id}
                                onClick={() => {
                                    onNodeSelect(node.id);
                                    setSearchTerm("");
                                    setDropdownVisible(false);
                                }}
                                style={{
                                    padding: "8px 12px",
                                    cursor: "pointer",
                                    borderBottom: isDarkMode
                                        ? "1px solid rgba(255, 255, 255, 0.1)"
                                        : "1px solid #eee",
                                    fontSize: "14px",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "2px",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background =
                                        isDarkMode
                                            ? "rgba(255, 255, 255, 0.1)"
                                            : "#f5f5f5";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background =
                                        "transparent";
                                }}
                            >
                                <div
                                    style={{
                                        fontWeight: 500,
                                        color: isDarkMode
                                            ? "#ffffff"
                                            : "#333333",
                                    }}
                                >
                                    {node.youtubeMetadata?.title ||
                                        urlInfo.fullPath}
                                </div>
                                <div
                                    style={{
                                        fontSize: "12px",
                                        color: isDarkMode
                                            ? "#888888"
                                            : "#666666",
                                    }}
                                >
                                    {urlInfo.domain}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default EvolutionSearch;
