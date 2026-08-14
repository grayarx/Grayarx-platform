import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  root: path.resolve(root, "client"),
  resolve: {
    alias: {
      "@": path.resolve(root, "client/src"),
    },
  },
  server: {
    fs: {
      allow: [root, path.resolve(root, "../node_modules")],
    },
  },
});
