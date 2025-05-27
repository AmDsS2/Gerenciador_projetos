import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@shared": path.resolve(__dirname, "..", "shared"),
      "@assets": path.resolve(__dirname, "..", "attached_assets"),
    },
  },
  build: {
    outDir: "dist/client",
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      external: [
        "drizzle-orm",
        "drizzle-orm/pg-core",
        "drizzle-zod",
        "pg",
        "postgres",
        "zod",
        "react-router-dom"
      ],
      output: {
        globals: {
          "react-router-dom": "ReactRouterDOM"
        }
      }
    },
  },
  server: {
    port: 3000,
    host: true,
  },
}); 