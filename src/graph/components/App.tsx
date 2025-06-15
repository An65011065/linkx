// App.tsx - Main application component
import React from "react";
import GraphVisualization from "./GraphVisualization";
import MetricsPanel from "./MetricsPanel";
import ControlPanel from "./ControlPanel";
import { useNetworkData } from "../hooks/useNetworkData";

const App: React.FC = () => {
    const { data, loading, error } = useNetworkData();

    if (loading) return <div>Loading graph...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className="graph-app">
            <MetricsPanel data={data} />
            <GraphVisualization data={data} />
            <ControlPanel />
        </div>
    );
};

export default App;
