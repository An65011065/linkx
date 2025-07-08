import React from "react";
import { Combine } from "lucide-react";

interface ConsolidateTabsProps {
    shouldConsolidate?: boolean;
    className?: string;
    children?: React.ReactNode;
}

interface ConsolidatedTab {
    url: string;
    title: string;
}

interface ConsolidationSession {
    id: string;
    timestamp: string;
    tabs: ConsolidatedTab[];
}

const ConsolidateTabs: React.FC<ConsolidateTabsProps> = ({
    shouldConsolidate = false,
    className = "",
    children,
}) => {
    const handleConsolidateTabs = async () => {
        try {
            if (shouldConsolidate) {
                // Get all tabs in the current window
                const tabs = await chrome.tabs.query({ currentWindow: true });
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

                // Get existing sessions from storage
                const result = await chrome.storage.local.get(
                    "consolidateSessions",
                );
                const existingSessions: ConsolidationSession[] =
                    result.consolidateSessions || [];

                // Create new session
                const newSession = {
                    id: Date.now().toString(),
                    timestamp: new Date().toLocaleString(),
                    tabs: nonActiveTabUrls,
                };

                // Add new session to the beginning
                const updatedSessions = [newSession, ...existingSessions];

                // Save updated sessions
                await chrome.storage.local.set({
                    consolidateSessions: updatedSessions,
                });
            }

            // Get existing sessions from storage (either the just updated ones or current ones)
            const result = await chrome.storage.local.get(
                "consolidateSessions",
            );
            const existingSessions: ConsolidationSession[] =
                result.consolidateSessions || [];

            // Create HTML content to display existing sessions
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
                            background: white;
                        }
                        h1 {
                            color: #333;
                            margin-bottom: 30px;
                            font-size: 24px;
                        }
                        .session {
                            margin: 20px 0;
                            padding-bottom: 20px;
                        }
                        .session-header {
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            margin-bottom: 10px;
                        }
                        .disperse-btn {
                            background: none;
                            border: none;
                            color: #333;
                            cursor: pointer;
                            font-size: 14px;
                            text-decoration: none;
                        }
                        .disperse-btn:hover {
                            color: #666;
                        }
                        .timestamp {
                            color: #666;
                            font-size: 14px;
                        }
                        .tab-list {
                            list-style: none;
                            padding: 0;
                            margin: 0;
                        }
                        .tab-item {
                            margin: 5px 0;
                            color: #333;
                            cursor: pointer;
                            text-decoration: none;
                        }
                        .tab-item:hover {
                            color: #666;
                        }
                        .divider {
                            border-bottom: 1px solid #ccc;
                            margin: 20px 0;
                        }
                        .no-tabs-message {
                            color: #666;
                            font-size: 16px;
                            text-align: center;
                            margin: 40px 0;
                        }
                    </style>
                </head>
                <body>
                    <h1>Consolidated Tabs</h1>
                    ${
                        existingSessions.length === 0
                            ? '<div class="no-tabs-message">No tabs are consolidated. You can do it through the extension.</div>'
                            : existingSessions
                                  .map(
                                      (
                                          session: ConsolidationSession,
                                          index: number,
                                      ) => `
                            <div class="session">
                                <div class="session-header">
                                    <span class="timestamp">${
                                        session.timestamp
                                    }</span>
                                    <button class="disperse-btn" onclick="disperseLinks('${
                                        session.id
                                    }')">
                                        Disperse tabs(${session.tabs.length})
                                    </button>
                                </div>
                                <ul class="tab-list">
                                    ${session.tabs
                                        .map(
                                            (tab: ConsolidatedTab) => `
                                        <li class="tab-item" onclick="window.open('${tab.url}', '_blank')">
                                            ${tab.title}
                                        </li>
                                    `,
                                        )
                                        .join("")}
                                </ul>
                                ${
                                    index < existingSessions.length - 1
                                        ? '<div class="divider"></div>'
                                        : ""
                                }
                            </div>
                        `,
                                  )
                                  .join("")
                    }
                    
                    <script>
                        async function disperseLinks(sessionId) {
                            try {
                                const result = await chrome.storage.local.get('consolidateSessions');
                                const sessions = result.consolidateSessions || [];
                                const session = sessions.find(s => s.id === sessionId);
                                
                                if (session) {
                                    for (const tab of session.tabs) {
                                        await chrome.tabs.create({
                                            url: tab.url,
                                            active: false
                                        });
                                    }
                                }
                            } catch (error) {
                                console.error('Error dispersing links:', error);
                            }
                        }
                    </script>
                </body>
                </html>
            `;

            // Create a new tab with the consolidated URLs
            await chrome.tabs.create({
                url:
                    "data:text/html;charset=utf-8," +
                    encodeURIComponent(htmlContent),
            });
        } catch (error) {
            console.error("Error opening consolidated tabs:", error);
        }
    };

    return (
        <div className={className} onClick={handleConsolidateTabs}>
            <Combine size={24} color="#28a745" strokeWidth={2} />
            {children}
        </div>
    );
};

export default ConsolidateTabs;
