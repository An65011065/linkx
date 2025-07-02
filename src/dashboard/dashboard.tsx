import React from "react";
import ReactDOM from "react-dom/client";
import DashboardTab from "./components/DashboardTab";
import "../shared/styles/index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <DashboardTab />
    </React.StrictMode>,
);
