import { createRoot } from "react-dom/client";
import MainTab from "./MainTab";
import "../shared/styles/index.css";

const container = document.getElementById("root");
if (container) {
    const root = createRoot(container);
    root.render(<MainTab />);
}
