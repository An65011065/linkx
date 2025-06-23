import React from "react";
import { useExtensionData } from "../../data/useExtensionData";

const GraphWidget: React.FC = () => {
    const { isLoading, error } = useExtensionData();

    const openGraph = () => {
        chrome.tabs.create({
            url: chrome.runtime.getURL("src/graph/graph.html"),
        });
    };

    if (isLoading) {
        return (
            <div style={{ margin: "40px 24px", width: "auto" }}>
                <div
                    style={{
                        fontFamily: "Nunito-Regular, Arial, sans-serif",
                        fontSize: "14px",
                        color: "#666",
                        padding: "20px 0",
                    }}
                >
                    Loading graph...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ margin: "40px 24px", width: "auto" }}>
                <div
                    style={{
                        fontFamily: "Nunito-Regular, Arial, sans-serif",
                        fontSize: "14px",
                        color: "#d63031",
                        padding: "20px 0",
                    }}
                >
                    Error loading graph: {error}
                </div>
            </div>
        );
    }

    return (
        <>
            <style>{`
                @font-face {
                    font-family: 'Nunito-Regular';
                    src: url('${chrome.runtime.getURL(
                        "src/assets/fonts/Nunito-Regular.ttf",
                    )}') format('truetype');
                    font-weight: 400;
                    font-style: normal;
                }
                @font-face {
                    font-family: 'Nunito-Bold';
                    src: url('${chrome.runtime.getURL(
                        "src/assets/fonts/Nunito-Bold.ttf",
                    )}') format('truetype');
                    font-weight: 700;
                    font-style: normal;
                }
            `}</style>
            <div style={{ margin: "40px 24px", width: "auto" }}>
                <h2
                    style={{
                        fontFamily: "Nunito-Bold, Arial, sans-serif",
                        fontSize: "20px",
                        color: "#2d3436",
                        marginBottom: "20px",
                    }}
                >
                    Network Graph
                </h2>
                <div
                    style={{
                        backgroundColor: "#f8f9fa",
                        borderRadius: "12px",
                        padding: "24px",
                        textAlign: "center",
                    }}
                >
                    <div
                        style={{
                            fontFamily: "Nunito-Regular, Arial, sans-serif",
                            fontSize: "14px",
                            color: "#636e72",
                            marginBottom: "16px",
                        }}
                    >
                        Visualize your browsing patterns as an interactive
                        network
                    </div>
                    <button
                        onClick={openGraph}
                        style={{
                            backgroundColor: "#4285f4",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            padding: "12px 24px",
                            fontFamily: "Nunito-Bold, Arial, sans-serif",
                            fontSize: "14px",
                            cursor: "pointer",
                            transition: "background-color 0.2s",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#3367d6";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "#4285f4";
                        }}
                    >
                        Open Network Graph
                    </button>
                </div>
            </div>
        </>
    );
};

export default GraphWidget;
