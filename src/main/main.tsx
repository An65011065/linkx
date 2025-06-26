import React from "react";
import { createRoot } from "react-dom/client";
import MainTab from "./MainTab";

const container = document.getElementById("root");
if (container) {
    const root = createRoot(container);
    root.render(<MainTab />);
}
