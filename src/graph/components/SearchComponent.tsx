// SearchComponent.tsx - Search functionality component

import React, { useState, useRef, useEffect } from "react";
import type { NetworkNode } from "../types/network.types";
import "../styles/components.css";

interface SearchComponentProps {
    nodes: NetworkNode[];
    onSearch: (searchTerm: string) => void;
}

const SearchComponent: React.FC<SearchComponentProps> = ({
    nodes,
    onSearch,
}) => {
    const [searchTerm, setSearchTerm] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Handle ESC key
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setSearchTerm("");
                onSearch("");
                if (inputRef.current) {
                    inputRef.current.blur();
                }
            }
        };

        document.addEventListener("keydown", handleEsc);
        return () => document.removeEventListener("keydown", handleEsc);
    }, [onSearch]);

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setSearchTerm(value);

        // Filter nodes based on search term
        const filteredNodes = nodes.filter(
            (node) =>
                node.url.toLowerCase().includes(value.toLowerCase()) ||
                (node.youtubeMetadata?.title || "")
                    .toLowerCase()
                    .includes(value.toLowerCase()),
        );

        onSearch(value);
    };

    return (
        <div
            ref={containerRef}
            style={{
                position: "fixed",
                top: "20px",
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 1000,
                width: "400px",
            }}
        >
            <div className="search-input-container">
                <input
                    ref={inputRef}
                    type="text"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    placeholder="Search URLs"
                    className="search-input"
                    style={{
                        width: "100%",
                        padding: "12px 16px",
                        fontSize: "14px",
                        border: "1px solid rgba(0, 0, 0, 0.1)",
                        borderRadius: "8px",
                        backgroundColor: "rgba(255, 255, 255, 0.9)",
                    }}
                />
            </div>
        </div>
    );
};

export default SearchComponent;
