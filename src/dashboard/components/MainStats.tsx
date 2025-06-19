import React from "react";
import { useStatsData } from "../../shared/services/useExtensionData";

const MainStats: React.FC = () => {
    const { stats, totalActiveTime, loading, error } = useStatsData();

    if (loading) {
        return (
            <div
                style={{
                    display: "flex",
                    gap: "120px",
                    marginTop: "60px",
                    paddingLeft: "52px",
                }}
            >
                loading...
            </div>
        );
    }

    if (error) {
        return (
            <div
                style={{
                    display: "flex",
                    gap: "120px",
                    marginTop: "60px",
                    paddingLeft: "52px",
                }}
            >
                Error loading stats
            </div>
        );
    }

    // Calculate flow percentage: (work + other) / (work + other + social) * 100
    const flowPercentage =
        totalActiveTime > 0
            ? Math.round(
                  ((stats.workTime + stats.otherTime) / totalActiveTime) * 100,
              )
            : 0;

    return (
        <>
            <style>{`
                @font-face {
                    font-family: 'Nunito-Regular';
                    src: url('${chrome.runtime.getURL(
                        "src/assets/fonts/Nunito-Regular.ttf",
                    )}') format('truetype');
                    font-weight: 400;
                    font-style: normal;
                }
                @font-face {
                    font-family: 'Nunito-Bold';
                    src: url('${chrome.runtime.getURL(
                        "src/assets/fonts/Nunito-Bold.ttf",
                    )}') format('truetype');
                    font-weight: 700;
                    font-style: normal;
                }
            `}</style>
            <div
                style={{
                    display: "flex",
                    gap: "120px",
                    marginTop: "40px",
                    paddingLeft: "0px",
                }}
            >
                {/* Links */}
                <div>
                    <div
                        style={{
                            fontFamily: "Nunito-Regular, Arial, sans-serif",
                            fontSize: "20px",
                            fontWeight: "400",
                            color: "#666",
                            marginBottom: "6px",
                            borderBottom: "2px solid #000",
                            paddingBottom: "3px",
                            width: "120px",
                        }}
                    >
                        Links
                    </div>
                    <div
                        style={{
                            fontFamily: "Nunito-Bold, Arial, sans-serif",
                            fontSize: "32px",
                            fontWeight: "700",
                            color: "#000",
                        }}
                    >
                        {stats.totalUrls}
                    </div>
                </div>

                {/* Time */}
                <div>
                    <div
                        style={{
                            fontFamily: "Nunito-Regular, Arial, sans-serif",
                            fontSize: "20px",
                            fontWeight: "400",
                            color: "#666",
                            marginBottom: "12px",
                            borderBottom: "2px solid #000",
                            paddingBottom: "3px",
                            width: "120px",
                        }}
                    >
                        Time
                    </div>
                    <div
                        style={{
                            fontFamily: "Nunito-Bold, Arial, sans-serif",
                            fontSize: "32px",
                            fontWeight: "700",
                            color: "#000",
                        }}
                    >
                        {totalActiveTime.toFixed(1)}h
                    </div>
                </div>

                {/* Flow */}
                <div>
                    <div
                        style={{
                            fontFamily: "Nunito-Regular, Arial, sans-serif",
                            fontSize: "20px",
                            fontWeight: "400",
                            color: "#666",
                            marginBottom: "12px",
                            borderBottom: "2px solid #000",
                            paddingBottom: "3px",
                            width: "120px",
                        }}
                    >
                        Flow
                    </div>
                    <div
                        style={{
                            fontFamily: "Nunito-Bold, Arial, sans-serif",
                            fontSize: "32px",
                            fontWeight: "700",
                            color: "#000",
                        }}
                    >
                        {flowPercentage}%
                    </div>
                </div>
            </div>
        </>
    );
};

export default MainStats;
