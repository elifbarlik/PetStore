import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss()],
    build: {
        rollupOptions: {
            output: {
                // Stable vendor chunks: app deploys do not invalidate the cached libraries
                manualChunks(id) {
                    if (!id.includes("node_modules")) return undefined;
                    if (id.includes("firebase") || id.includes("@firebase")) return "firebase";
                    if (/[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/.test(id))
                        return "react";
                    return "vendor";
                },
            },
        },
    },
});
