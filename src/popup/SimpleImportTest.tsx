// src/popup/components/SimpleImportTest.tsx - Create this file
import React, { useEffect, useState } from "react";

const SimpleImportTest: React.FC = () => {
    const [results, setResults] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        const testImports = async () => {
            const testResults: { [key: string]: string } = {};

            // Test AuthService
            try {
                const authModule = await import("../services/authService");
                testResults.authService = `✅ Success: ${Object.keys(
                    authModule,
                ).join(", ")}`;
            } catch (error) {
                testResults.authService = `❌ Failed: ${
                    error instanceof Error ? error.message : "Unknown"
                }`;
            }

            // Test Firebase
            try {
                const firebaseModule = await import(
                    "../shared/services/firebase"
                );
                testResults.firebase = `✅ Success: ${Object.keys(
                    firebaseModule,
                ).join(", ")}`;
            } catch (error) {
                testResults.firebase = `❌ Failed: ${
                    error instanceof Error ? error.message : "Unknown"
                }`;
            }

            // Test LoginScreen
            try {
                const loginModule = await import(
                    "../popup/components/LoginScreen"
                );
                testResults.loginScreen = `✅ Success: ${Object.keys(
                    loginModule,
                ).join(", ")}`;
            } catch (error) {
                testResults.loginScreen = `❌ Failed: ${
                    error instanceof Error ? error.message : "Unknown"
                }`;
            }

            // Test MainContent
            try {
                const mainModule = await import("./components/MainContent");
                testResults.mainContent = `✅ Success: ${Object.keys(
                    mainModule,
                ).join(", ")}`;
            } catch (error) {
                testResults.mainContent = `❌ Failed: ${
                    error instanceof Error ? error.message : "Unknown"
                }`;
            }

            setResults(testResults);
        };

        testImports();
    }, []);

    return (
        <div
            style={{
                width: "340px",
                height: "330px",
                padding: "20px",
                fontFamily: "Arial, sans-serif",
                fontSize: "11px",
                overflowY: "auto",
                background: "#f5f5f5",
            }}
        >
            <h3>Import Test Results</h3>

            {Object.entries(results).map(([key, result]) => (
                <div
                    key={key}
                    style={{
                        marginBottom: "10px",
                        padding: "8px",
                        background: "white",
                        borderRadius: "4px",
                    }}
                >
                    <strong>{key}:</strong>
                    <br />
                    <span style={{ fontSize: "10px", wordBreak: "break-word" }}>
                        {result}
                    </span>
                </div>
            ))}

            {Object.keys(results).length === 0 && <div>Testing imports...</div>}
        </div>
    );
};

export default SimpleImportTest;
