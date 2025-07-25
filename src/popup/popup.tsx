import React from "react";
import ReactDOM from "react-dom/client";

const rootElement = document.getElementById("root");
if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
        <div style={{
            width: "340px",
            height: "330px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "Arial, sans-serif",
            fontSize: "16px",
            background: "#f8f9fa",
            color: "#333"
        }}>
            popup is cleared
        </div>
    );
}
