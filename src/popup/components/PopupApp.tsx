// PopupApp.tsx - Main popup container component
import React from "react";
import StatsPanel from "./StatsPanel";
import RecentActivity from "./RecentActivity";
import ActionButtons from "./ActionButtons";
import { useExtensionData } from "../hooks/useExtensionData";

const PopupApp: React.FC = () => {
    const { data, loading, error } = useExtensionData();

    return (
        <div className="popup-app">
            <StatsPanel data={data} loading={loading} />
            <RecentActivity data={data} loading={loading} />
            <ActionButtons />
        </div>
    );
};

export default PopupApp;
