// SearchComponent.tsx - Search functionality component

import React, { useState, useRef, useEffect } from "react";
import type { NetworkNode } from "../types/network.types";
import "../styles/components.css";

interface SearchComponentProps {
    nodes: NetworkNode[];
    onSearch: (searchTerm: string) => void;
    isDarkMode: boolean;
}

const SearchComponent: React.FC<SearchComponentProps> = ({
    onSearch,
    isDarkMode,
}) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [isFocused, setIsFocused] = useState(false);
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
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder="Search URLs"
                    className="search-input"
                    style={{
                        width: "100%",
                        padding: "8px 16px",
                        fontSize: "13px",
                        border: `2px solid ${
                            isDarkMode
                                ? isFocused
                                    ? "rgba(255, 255, 255, 0.5)"
                                    : "rgba(255, 255, 255, 0.3)"
                                : isFocused
                                ? "rgba(0, 0, 0, 0.3)"
                                : "rgba(0, 0, 0, 0.15)"
                        }`,
                        borderRadius: "20px",
                        backgroundColor: isDarkMode
                            ? "rgba(0, 0, 0, 0.8)"
                            : "rgba(255, 255, 255, 0.9)",
                        color: isDarkMode ? "#fff" : "#333",
                        backdropFilter: "blur(8px)",
                        outline: "none",
                        transition: "border-color 0.2s ease",
                    }}
                />
            </div>
        </div>
    );
};

export default SearchComponent;
