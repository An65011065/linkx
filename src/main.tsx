// This is for development testing only
import React from "react";
import ReactDOM from "react-dom/client";
import PopupApp from "./popup/components/MainContent";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <PopupApp />
    </React.StrictMode>,
);
