// popup.tsx - Entry point for popup.html
import React from "react";
import ReactDOM from "react-dom/client";
import PopupApp from "./components/PopupApp";
import "./styles/popup.css";
import "../shared/styles/global.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <PopupApp />
    </React.StrictMode>,
);
