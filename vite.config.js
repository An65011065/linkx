import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.json';
export default defineConfig(function (_a) {
    var mode = _a.mode;
    return ({
        plugins: [react(), crx({ manifest: manifest })],
        build: {
            watch: mode === 'development' ? {} : undefined,
            rollupOptions: {
                input: {
                    popup: 'src/popup/popup.html',
                    graph: 'src/graph/graph.html',
                    dashboard: 'src/dashboard/dashboard.html',
                },
            },
        },
        server: {
            port: 3001,
            hmr: {
                port: 3001,
                protocol: 'ws',
                host: 'localhost',
            },
        },
    });
});
