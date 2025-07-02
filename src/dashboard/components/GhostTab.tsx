import React, { useState } from "react";
import { useExtensionData } from "../../data/useExtensionData";

interface WasteData {
    domain: string;
    totalDuration: number;
    totalActive: number;
    wastedTime: number;
    wasteRatio: number;
    urls: {
        url: string;
        title: string;
        duration: number;
        activeTime: number;
        wastedTime: number;
    }[];
}

const GhostTabs: React.FC = () => {
    const { currentSession, isLoading, error } = useExtensionData();
    const [hoveredDomain, setHoveredDomain] = useState<string | null>(null);

    // Process waste data by domain
    const processWasteData = (): WasteData[] => {
        if (!currentSession) return [];

        const domainMap = new Map<string, WasteData>();

        // Aggregate all visits by domain
        currentSession.tabSessions.forEach((tab) => {
            tab.urlVisits.forEach((visit) => {
                if (visit.duration > 0) {
                    const wastedTime = visit.duration - visit.activeTime;

                    if (!domainMap.has(visit.domain)) {
                        domainMap.set(visit.domain, {
                            domain: visit.domain,
                            totalDuration: 0,
                            totalActive: 0,
                            wastedTime: 0,
                            wasteRatio: 0,
                            urls: [],
                        });
                    }

                    const domainData = domainMap.get(visit.domain)!;
                    domainData.totalDuration += visit.duration;
                    domainData.totalActive += visit.activeTime;
                    domainData.wastedTime += wastedTime;

                    // Add URL details
                    domainData.urls.push({
                        url: visit.url,
                        title: visit.title || visit.url,
                        duration: visit.duration,
                        activeTime: visit.activeTime,
                        wastedTime: wastedTime,
                    });
                }
            });
        });

        // Calculate waste ratios and sort
        const wasteArray = Array.from(domainMap.values())
            .map((data) => ({
                ...data,
                wasteRatio:
                    data.totalDuration > 0
                        ? (data.wastedTime / data.totalDuration) * 100
                        : 0,
            }))
            .filter((d) => d.wastedTime > 60000) // Only show domains with >1 min waste
            .sort((a, b) => b.wastedTime - a.wastedTime)
            .slice(0, 15); // Top 15 domains

        return wasteArray;
    };

    const formatTime = (ms: number): string => {
        const minutes = Math.floor(ms / (1000 * 60));
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            return `${hours}h`;
        }
        return `${minutes}m`;
    };

    const wasteData = processWasteData();

    if (isLoading || error || !currentSession || wasteData.length === 0) {
        return null;
    }

    return (
        <div
            style={{
                background: "rgba(255, 255, 255, 0.05)",
                borderRadius: "16px",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                backdropFilter: "blur(10px)",
                padding: "20px",
                width: "fit-content",
                minWidth: "200px",
                position: "relative",
            }}
        >
            {/* Title */}
            <h3
                style={{
                    fontSize: "14px",
                    fontWeight: "400",
                    color: "rgba(255, 255, 255, 0.9)",
                    margin: "0 0 16px 0",
                    fontFamily: "system-ui, -apple-system, sans-serif",
                }}
            >
                Ghost Tabs
            </h3>

            {/* Grid - 3 columns */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: "4px",
                }}
            >
                {wasteData.map((domain) => (
                    <div
                        key={domain.domain}
                        onMouseEnter={() => setHoveredDomain(domain.domain)}
                        onMouseLeave={() => setHoveredDomain(null)}
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "6px",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            transform:
                                hoveredDomain === domain.domain
                                    ? "translateY(-2px)"
                                    : "none",
                            width: "48px",
                        }}
                    >
                        {/* Favicon with subtle border */}
                        <div>
                            <img
                                src={`https://www.google.com/s2/favicons?domain=${domain.domain}&sz=32`}
                                alt={domain.domain}
                                style={{
                                    width: "18px",
                                    height: "18px",
                                    borderRadius: "4px",
                                }}
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = "none";
                                    const parent = target.parentElement;
                                    if (parent) {
                                        parent.innerHTML = `<span style="color: rgba(255, 255, 255, 0.6); font-size: 12px; font-weight: 500;">${domain.domain[0].toUpperCase()}</span>`;
                                    }
                                }}
                            />
                        </div>

                        {/* Waste ratio */}
                        <div
                            style={{
                                fontSize: "11px",
                                fontWeight: "500",
                                color:
                                    domain.wasteRatio > 70
                                        ? "rgba(255, 255, 255, 0.7)"
                                        : domain.wasteRatio > 40
                                        ? "#ffa726"
                                        : "rgba(255, 255, 255, 0.7)",
                                fontFamily:
                                    "system-ui, -apple-system, sans-serif",
                            }}
                        >
                            {Math.round(domain.wasteRatio)}%
                        </div>
                    </div>
                ))}
            </div>

            {/* Hover tooltip */}
            {hoveredDomain && (
                <div
                    style={{
                        position: "absolute",
                        top: "100%",
                        left: "50%",
                        transform: "translateX(-50%)",
                        marginTop: "8px",
                        background: "rgba(0, 0, 0, 0.9)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        borderRadius: "8px",
                        padding: "12px",
                        zIndex: 1000,
                        minWidth: "180px",
                        boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
                    }}
                >
                    {(() => {
                        const data = wasteData.find(
                            (d) => d.domain === hoveredDomain,
                        );
                        if (!data) return null;

                        return (
                            <>
                                <div
                                    style={{
                                        fontSize: "12px",
                                        fontWeight: "500",
                                        color: "rgba(255, 255, 255, 0.9)",
                                        marginBottom: "8px",
                                    }}
                                >
                                    {data.domain}
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        fontSize: "11px",
                                        color: "rgba(255, 255, 255, 0.6)",
                                        marginBottom: "4px",
                                    }}
                                >
                                    <span>Wasted</span>
                                    <span
                                        style={{
                                            color: "#ff6b47",
                                            fontWeight: "500",
                                        }}
                                    >
                                        {formatTime(data.wastedTime)}
                                    </span>
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        fontSize: "11px",
                                        color: "rgba(255, 255, 255, 0.6)",
                                    }}
                                >
                                    <span>Tabs</span>
                                    <span>{data.urls.length}</span>
                                </div>
                            </>
                        );
                    })()}
                </div>
            )}
        </div>
    );
};

export default GhostTabs;
