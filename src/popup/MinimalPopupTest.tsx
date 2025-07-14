// src/popup/components/MinimalPopupTest.tsx - Create this file for testing
import React from "react";

const MinimalPopupTest: React.FC = () => {
    console.log("🔧 [DEBUG] MinimalPopupTest rendering");

    return (
        <div
            style={{
                width: "340px",
                height: "330px",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontFamily: "Arial, sans-serif",
                textAlign: "center",
                padding: "20px",
                boxSizing: "border-box",
            }}
        >
            <div>
                <h2>✅ React is Working!</h2>
                <p>Popup loaded successfully</p>
                <p style={{ fontSize: "12px", opacity: 0.8 }}>
                    Extension ID: {chrome?.runtime?.id || "Unknown"}
                </p>
                <button
                    style={{
                        background: "rgba(255,255,255,0.2)",
                        border: "1px solid rgba(255,255,255,0.3)",
                        color: "white",
                        padding: "8px 16px",
                        borderRadius: "4px",
                        cursor: "pointer",
                        marginTop: "10px",
                    }}
                    onClick={() => {
                        console.log("Button clicked - React events working");
                        alert("React is working!");
                    }}
                >
                    Test Button
                </button>
            </div>
        </div>
    );
};

export default MinimalPopupTest;
