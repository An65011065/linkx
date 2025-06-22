import React from "react";

interface ChannelCardProps {
    icon: string; // URL to icon or emoji
    domain: string;
    urlCount: number; // number of URLs visited
    timeSpent: string; // formatted time like "2.5h" or "45m"
    iconColor: string; // background color for the icon
}

const ChannelCard: React.FC<ChannelCardProps> = ({
    icon,
    domain,
    urlCount,
    timeSpent,
    iconColor,
}) => {
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
                    backgroundColor: "white",
                    borderRadius: "16px",
                    padding: "24px 16px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                    flex: "1",
                    minWidth: "120px",
                    maxWidth: "160px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    border: "1px solid #f0f0f0",
                    position: "relative",
                    paddingTop: "48px",
                    margin: "24px 8px 0",
                }}
            >
                {/* Icon */}
                <div
                    style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "50%",
                        backgroundColor: iconColor,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "24px",
                        position: "absolute",
                        top: "-24px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        border: "4px solid white",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    }}
                >
                    {icon}
                </div>

                {/* Domain Name */}
                <div
                    style={{
                        fontFamily: "Nunito-Bold, Arial, sans-serif",
                        fontSize: "16px",
                        fontWeight: "700",
                        color: "#000",
                        marginBottom: "4px",
                        textTransform: "capitalize",
                    }}
                >
                    {domain}
                </div>

                {/* URL Count */}
                <div
                    style={{
                        fontFamily: "Nunito-Regular, Arial, sans-serif",
                        fontSize: "12px",
                        color: "#666",
                        marginBottom: "16px",
                    }}
                >
                    {urlCount} URLs visited
                </div>

                {/* Time Spent */}
                <div
                    style={{
                        fontFamily: "Nunito-Bold, Arial, sans-serif",
                        fontSize: "22px",
                        fontWeight: "700",
                        color: "#000",
                    }}
                >
                    {timeSpent}
                </div>
            </div>
        </>
    );
};

export default ChannelCard;
