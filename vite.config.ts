import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { crx } from "@crxjs/vite-plugin";
import manifest from "./manifest.json";

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), crx({ manifest })],
    build: {
        rollupOptions: {
            input: {
                popup: "./public/popup.html",
                graph: "./public/graph.html",
                background: "src/background.ts",
            },
            output: { entryFileNames: "[name].js" },
        },
    },
});
