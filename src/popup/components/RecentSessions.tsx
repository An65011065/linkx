import React, { useState } from "react";
import SessionItem from "./SessionItem";

export interface Session {
    id: number;
    domain: string;
    type: "work" | "social" | "other";
    timeAgo: string;
    duration: string;
}

const RecentSessions: React.FC = () => {
    const [sortBy, setSortBy] = useState<"time" | "created">("time");

    // TODO: Replace with real data from useExtensionData hook
    const sessions: Session[] = [
        {
            id: 1,
            domain: "docs.google.com",
            type: "work",
            timeAgo: "2m ago",
            duration: "23m",
        },
        {
            id: 2,
            domain: "youtube.com",
            type: "social",
            timeAgo: "5m ago",
            duration: "47m",
        },
        {
            id: 3,
            domain: "github.com",
            type: "work",
            timeAgo: "12m ago",
            duration: "15m",
        },
        {
            id: 4,
            domain: "reddit.com",
            type: "social",
            timeAgo: "18m ago",
            duration: "8m",
        },
        {
            id: 5,
            domain: "wikipedia.org",
            type: "other",
            timeAgo: "25m ago",
            duration: "12m",
        },
    ]; // PLACEHOLDER DATA

    return (
        <div style={{ marginBottom: "20px" }}>
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "12px",
                }}
            >
                <h3
                    style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "#2d3436",
                        margin: 0,
                    }}
                >
                    Recent Sessions
                </h3>
                <select
                    value={sortBy}
                    onChange={(e) =>
                        setSortBy(e.target.value as "time" | "created")
                    }
                    style={{
                        fontSize: "11px",
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                        padding: "2px 6px",
                        backgroundColor: "white",
                        color: "#636e72",
                    }}
                >
                    <option value="time">By Time</option>
                    <option value="created">By Created</option>
                </select>
            </div>

            <div style={{ maxHeight: "160px", overflowY: "auto" }}>
                {sessions.map((session) => (
                    <SessionItem key={session.id} session={session} />
                ))}
            </div>
        </div>
    );
};

export default RecentSessions;
