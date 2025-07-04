import React from "react";
import { createRoot } from "react-dom/client";
import GraphVisualization from "./components/GraphVisualization";
import "../shared/styles/index.css";

const GraphPage: React.FC = () => {
    return (
        <div
            style={{
                width: "100vw",
                height: "100vh",
                display: "flex",
                flexDirection: "column",
                backgroundColor: "#f8f9fa",
            }}
        >
            <GraphVisualization />
        </div>
    );
};

const container = document.getElementById("app");
if (container) {
    const root = createRoot(container);
    root.render(<GraphPage />);
}
