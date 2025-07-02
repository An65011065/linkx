import React from "react";

interface ChannelCardProps {
    icon: string;
    domain: string;
    urlCount: number;
    timeSpent: string;
}

const ChannelCard: React.FC<ChannelCardProps> = ({
    icon,
    domain,
    urlCount,
    timeSpent,
}) => (
    <div
        style={{
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(10px)",
            borderRadius: "12px",
            padding: "32px 12px 16px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            flex: "1",
            minWidth: "100px",
            maxWidth: "140px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            position: "relative",
            margin: "16px 6px 0",
        }}
    >
        <img
            src={icon}
            alt={`${domain} icon`}
            style={{
                width: "28px",
                height: "28px",
                position: "absolute",
                top: "-14px",
                left: "50%",
                transform: "translateX(-50%)",
            }}
        />
        <div
            style={{
                fontFamily: "Nunito-Bold, Arial, sans-serif",
                fontSize: "14px",
                fontWeight: "700",
                marginBottom: "2px",
                textTransform: "capitalize",
                color: "rgba(255, 255, 255, 0.9)",
            }}
        >
            {domain}
        </div>
        <div
            style={{
                fontFamily: "Nunito-Regular, Arial, sans-serif",
                fontSize: "11px",
                color: "rgba(255, 255, 255, 0.5)",
                marginBottom: "12px",
            }}
        >
            {urlCount} URLs visited
        </div>
        <div
            style={{
                fontFamily: "Nunito-Bold, Arial, sans-serif",
                fontSize: "18px",
                fontWeight: "700",
                color: "rgba(255, 255, 255, 0.9)",
            }}
        >
            {timeSpent}
        </div>
    </div>
);

export default ChannelCard;
