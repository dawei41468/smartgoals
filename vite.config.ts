import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("react-dom") || id.includes("react")) return "vendor-react";
            if (id.includes("@tanstack")) return "vendor-query";
            if (id.includes("recharts")) return "vendor-charts";
            if (id.includes("framer-motion")) return "vendor-motion";
            if (id.includes("date-fns")) return "vendor-date";
            if (
              id.includes("@radix-ui") ||
              id.includes("lucide-react") ||
              id.includes("cmdk") ||
              id.includes("vaul")
            )
              return "vendor-ui";
            return "vendor";
          }
        },
      },
    },
  },
  server: {
    port: 6100,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
    proxy: {
      "/api": "http://127.0.0.1:6000",
    },
  },
});
