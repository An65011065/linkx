// SessionItem.tsx - Individual session component
import React from "react";
import type { Session } from "./RecentSessions";
import { Briefcase, Users, Globe } from "lucide-react";

interface SessionItemProps {
    session: Session;
}

const getTypeColor = (type: string): string => {
    switch (type) {
        case "work":
            return "#4285f4";
        case "social":
            return "#ff6b47";
        case "other":
            return "#6c757d";
        default:
            return "#6c757d";
    }
};

const getTypeIcon = (type: string) => {
    const iconProps = { size: 14, color: getTypeColor(type) };
    switch (type) {
        case "work":
            return <Briefcase {...iconProps} />;
        case "social":
            return <Users {...iconProps} />;
        case "other":
            return <Globe {...iconProps} />;
        default:
            return "🌐";
    }
};

const SessionItem: React.FC<SessionItemProps> = ({ session }) => {
    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 12px",
                marginBottom: "4px",
                borderRadius: "6px",
                backgroundColor: "#fafbfc",
                // border: `1px solid ${getTypeColor(session.type)}20`,
            }}
        >
            <div style={{ display: "flex", alignItems: "center", flex: 1 }}>
                <div
                    style={{
                        width: "3px",
                        height: "24px",
                        backgroundColor: getTypeColor(session.type),
                        borderRadius: "2px",
                        marginRight: "10px",
                    }}
                />
                <div>
                    <div
                        style={{
                            fontSize: "13px",
                            fontWeight: 600,
                            color: "#2d3436",
                            marginBottom: "2px",
                        }}
                    >
                        {session.domain}
                    </div>
                    <div
                        style={{
                            fontSize: "11px",
                            color: "#636e72",
                        }}
                    >
                        {session.duration} • {session.timeAgo}
                    </div>
                </div>
            </div>
            <div
                style={{
                    fontSize: "16px",
                    opacity: 0.6,
                }}
            >
                {getTypeIcon(session.type)}
            </div>
        </div>
    );
};

export default SessionItem;
