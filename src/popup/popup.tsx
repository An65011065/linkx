import React from "react";
import ReactDOM from "react-dom/client";
import PopupApp from "./components/PopupApp";
import "../shared/styles/index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <PopupApp />
    </React.StrictMode>,
);
