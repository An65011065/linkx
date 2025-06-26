// EvolutionSearch.tsx - Evolution mode search component

import React, { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";
import type { NetworkNode } from "../types/network.types";
import "../styles/components.css";

interface EvolutionSearchProps {
    nodes: NetworkNode[];
    onNodeSelect: (nodeId: string | null) => void;
    selectedNode: string | null;
}

const EvolutionSearch: React.FC<EvolutionSearchProps> = ({
    nodes,
    onNodeSelect,
    selectedNode,
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
            .slice(0, 5); // Limit to 5 results

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
            // Include path and query parameters for more detail
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

    return (
        <div
            className="evolution-search-container"
            style={{ position: "relative" }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    width: "300px",
                    background: "white",
                    borderRadius: "8px",
                    padding: "8px 12px",
                    border: "1px solid #ddd",
                }}
            >
                {selectedNode ? (
                    <>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                background: "#e3f2fd",
                                padding: "4px 8px",
                                borderRadius: "4px",
                                fontSize: "14px",
                                color: "#1976d2",
                                flex: 1,
                            }}
                        >
                            <span
                                style={{
                                    maxWidth: "200px",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {selectedNodeDetails?.youtubeMetadata?.title ||
                                    formatUrl(selectedNodeDetails?.url || "")
                                        .fullPath}
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
                                    color: "#1976d2",
                                }}
                            >
                                <X size={14} />
                            </button>
                        </div>
                    </>
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
                        background: "white",
                        borderRadius: "8px",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                        maxHeight: "200px",
                        overflowY: "auto",
                        zIndex: 1001,
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
                                    borderBottom: "1px solid #eee",
                                    fontSize: "14px",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "2px",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background =
                                        "#f5f5f5";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = "white";
                                }}
                            >
                                <div style={{ fontWeight: 500 }}>
                                    {node.youtubeMetadata?.title ||
                                        urlInfo.fullPath}
                                </div>
                                <div
                                    style={{ fontSize: "12px", color: "#666" }}
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
