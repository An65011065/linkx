import React from "react";
import { useExtensionData } from "../../shared/services/useExtensionData";

const GraphWidget: React.FC = () => {
    const { loading, error } = useExtensionData();

    const handleGraphClick = () => {
        // Open the graph visualization in a new tab
        chrome.tabs.create({
            url: chrome.runtime.getURL("src/graph/graph.html"),
        });
    };

    if (loading) {
        return (
            <div
                style={{
                    padding: "20px 0",
                    fontFamily: "Nunito-Regular, Arial, sans-serif",
                    color: "#666",
                    fontSize: "14px",
                }}
            >
                Loading graph data...
            </div>
        );
    }

    if (error) {
        return (
            <div
                style={{
                    padding: "20px 0",
                    fontFamily: "Nunito-Regular, Arial, sans-serif",
                    color: "#d63031",
                    fontSize: "14px",
                }}
            >
                Error loading graph data: {error}
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

                .graph-widget {
                    cursor: pointer;
                    transition: transform 0.2s ease-in-out;
                }

                .graph-widget:hover {
                    transform: scale(1.02);
                }

                .graph-preview {
                    width: 100%;
                    height: 100%;
                    border-radius: 12px;
                    background: linear-gradient(135deg, #f5f7fa 0%, #e4e7eb 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-family: 'Nunito-Regular', Arial, sans-serif;
                    color: #666;
                    text-align: center;
                    padding: 20px;
                }
            `}</style>
            <div
                style={{
                    marginTop: "40px",
                    width: "100%",
                    maxWidth: "600px",
                    height: "300px",
                }}
            >
                {/* Header */}
                <div
                    style={{
                        marginBottom: "10px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
                    <h2
                        style={{
                            fontFamily: "Nunito-Bold, Arial, sans-serif",
                            fontSize: "24px",
                            fontWeight: "700",
                            color: "#000",
                            margin: "0",
                        }}
                    >
                        Browsing Graph
                    </h2>
                </div>

                {/* Graph Preview */}
                <div
                    className="graph-widget"
                    onClick={handleGraphClick}
                    style={{
                        height: "calc(100% - 60px)", // Account for header height
                    }}
                >
                    <div className="graph-preview">
                        <div>
                            <div
                                style={{
                                    fontSize: "18px",
                                    marginBottom: "10px",
                                }}
                            >
                                Click to explore your browsing patterns
                            </div>
                            <div style={{ fontSize: "14px", opacity: 0.8 }}>
                                View detailed network analysis and
                                visualizations
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default GraphWidget;
