import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { crx } from "@crxjs/vite-plugin";
import manifest from "./manifest.json";
import { resolve } from "path";
import dotenv from "dotenv";

dotenv.config();

export default defineConfig(({ mode }) => ({
    plugins: [
        react(),
        crx({
            manifest,
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
                popup: resolve(__dirname, "src/popup/popup.html"),
                graph: resolve(__dirname, "src/graph/graph.html"),
                dashboard: resolve(__dirname, "src/dashboard/dashboard.html"),
                main: resolve(__dirname, "src/main/main.html"),
                landing: resolve(__dirname, "src/landing/landing.html"),
                waterfall: resolve(__dirname, "waterfall.html"),
                // Fixed settings path
                settings: resolve(__dirname, "src/settings/settings.html"),
            },
        },
    },
}));
