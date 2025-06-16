import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { crx } from "@crxjs/vite-plugin";
import manifest from "./manifest.json";

export default defineConfig(({ mode }) => ({
    plugins: [react(), crx({ manifest })],
    build: {
        watch: mode === "development" ? {} : undefined,
        rollupOptions: {
            input: {
                popup: "src/popup/popup.html",
                graph: "src/graph/graph.html",
            },
        },
    },
}));
