import React from "react";
import { Combine } from "lucide-react";

const ConsolidateTabs: React.FC = () => {
    const handleConsolidateTabs = async () => {
        try {
            // Get all tabs in the current window
            const tabs = await chrome.tabs.query({ currentWindow: true });

            // Get the active tab
            const activeTab = tabs.find((tab) => tab.active);

            if (!activeTab) return;

            // Filter out the active tab and get URLs of other tabs
            const nonActiveTabUrls = tabs
                .filter((tab) => !tab.active && tab.url)
                .map((tab) => ({
                    url: tab.url!,
                    title: tab.title || "Untitled",
                }));

            if (nonActiveTabUrls.length === 0) return;

            // Create HTML content for the new tab
            const htmlContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Consolidated Tabs</title>
                    <style>
                        body {
                            font-family: system-ui, -apple-system, sans-serif;
                            max-width: 800px;
                            margin: 40px auto;
                            padding: 0 20px;
                            background: #f5f5f5;
                        }
                        h1 {
                            color: #333;
                            border-bottom: 2px solid #eee;
                            padding-bottom: 10px;
                        }
                        .tab-list {
                            list-style: none;
                            padding: 0;
                        }
                        .tab-item {
                            background: white;
                            margin: 10px 0;
                            padding: 15px;
                            border-radius: 8px;
                            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                            transition: transform 0.2s;
                        }
                        .tab-item:hover {
                            transform: translateY(-2px);
                        }
                        .tab-link {
                            color: #2196f3;
                            text-decoration: none;
                            display: block;
                            word-break: break-all;
                        }
                        .tab-link:hover {
                            text-decoration: underline;
                        }
                        .tab-title {
                            color: #666;
                            font-size: 0.9em;
                            margin-top: 5px;
                        }
                    </style>
                </head>
                <body>
                    <h1>Consolidated Tabs (${nonActiveTabUrls.length})</h1>
                    <ul class="tab-list">
                        ${nonActiveTabUrls
                            .map(
                                (tab) => `
                            <li class="tab-item">
                                <a href="${tab.url}" class="tab-link" target="_blank">
                                    ${tab.url}
                                </a>
                                <div class="tab-title">${tab.title}</div>
                            </li>
                        `,
                            )
                            .join("")}
                    </ul>
                </body>
                </html>
            `;

            // Create a new tab with the consolidated URLs
            await chrome.tabs.create({
                url:
                    "data:text/html;charset=utf-8," +
                    encodeURIComponent(htmlContent),
            });

            // Close all non-active tabs
            const tabsToClose = tabs
                .filter((tab) => !tab.active)
                .map((tab) => tab.id!)
                .filter((id) => id !== undefined);

            await chrome.tabs.remove(tabsToClose);
        } catch (error) {
            console.error("Error consolidating tabs:", error);
        }
    };

    return (
        <button
            onClick={handleConsolidateTabs}
            style={{
                background: "rgba(46, 204, 113, 0.7)",
                border: "1px solid rgba(46, 204, 113, 0.3)",
                borderRadius: "8px",
                padding: "8px 12px",
                color: "rgba(255, 255, 255, 0.9)",
                cursor: "pointer",
                transition: "all 0.2s ease",
                fontSize: "13px",
                fontWeight: "500",
                fontFamily: "system-ui, -apple-system, sans-serif",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                width: "100%",
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(46, 204, 113, 0.9)";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(46, 204, 113, 0.7)";
            }}
            title="Consolidate all tabs into one list"
        >
            <Combine size={16} />
            Consolidate Tabs
        </button>
    );
};

export default ConsolidateTabs;
