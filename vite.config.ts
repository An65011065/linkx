import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { crx } from "@crxjs/vite-plugin";
import manifest from "./manifest.json";
import { resolve } from "path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

export default defineConfig(({ mode }) => ({
    plugins: [
        react(),
        crx({
            manifest,
            // Add this to help with service worker issues
            browser: "chrome",
        }),
    ],
    resolve: {
        alias: {
            "@": resolve(__dirname, "src"),
        },
    },
    define: {
        "process.env.OPENAI_API_KEY": JSON.stringify(
            process.env.OPENAI_API_KEY,
        ),
    },
    css: {
        postcss: "./postcss.config.js",
    },
    build: {
        watch: mode === "development" ? {} : undefined,
        rollupOptions: {
            input: {
                // Remove background from here - let crx plugin handle it
                contentScript: "src/services/contentScript.ts",
                hoverNavbarInjector: "src/content/hoverNavbarInjector.ts",
                popup: resolve(__dirname, "src/popup/popup.html"),
                graph: resolve(__dirname, "src/graph/graph.html"),
                dashboard: resolve(__dirname, "src/dashboard/dashboard.html"),
                main: resolve(__dirname, "src/main/main.html"),
                waterfall: resolve(__dirname, "waterfall.html"), // Add this
            },
        },
    },
}));
