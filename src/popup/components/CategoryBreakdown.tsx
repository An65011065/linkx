import React from "react";
import { Briefcase, Users, Globe } from "lucide-react";

interface CategoryData {
    workTime: number; // minutes
    socialTime: number; // minutes
    otherTime: number; // minutes
}

const formatTime = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
};

const CategoryBreakdown: React.FC = () => {
    const categoryData: CategoryData = {
        workTime: 65, // PLACEHOLDER
        socialTime: 78, // PLACEHOLDER
        otherTime: 39, // PLACEHOLDER
    };

    const total =
        categoryData.workTime +
        categoryData.socialTime +
        categoryData.otherTime;
    const workPercent = total > 0 ? (categoryData.workTime / total) * 100 : 0;
    const socialPercent =
        total > 0 ? (categoryData.socialTime / total) * 100 : 0;
    const otherPercent = total > 0 ? (categoryData.otherTime / total) * 100 : 0;

    return (
        <div style={{ marginBottom: "24px" }}>
            {/* Progress bar */}
            <div
                style={{
                    display: "flex",
                    height: "6px",
                    borderRadius: "3px",
                    overflow: "hidden",
                    marginBottom: "12px",
                    backgroundColor: "#f1f3f4",
                }}
            >
                <div
                    style={{
                        width: `${workPercent}%`,
                        backgroundColor: "#4285f4",
                    }}
                />
                <div
                    style={{
                        width: `${socialPercent}%`,
                        backgroundColor: "#ff6b47",
                    }}
                />
                <div
                    style={{
                        width: `${otherPercent}%`,
                        backgroundColor: "#6c757d",
                    }}
                />
            </div>

            {/* Labels */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "12px",
                    fontWeight: 500,
                }}
            >
                <span
                    style={{
                        color: "#4285f4",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                    }}
                >
                    <Briefcase size={12} />
                    Work {formatTime(categoryData.workTime)}
                </span>
                <span
                    style={{
                        color: "#ff6b47",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                    }}
                >
                    <Users size={12} />
                    Social {formatTime(categoryData.socialTime)}
                </span>
                <span
                    style={{
                        color: "#6c757d",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                    }}
                >
                    <Globe size={12} />
                    Other {formatTime(categoryData.otherTime)}
                </span>
            </div>
        </div>
    );
};

export default CategoryBreakdown;
