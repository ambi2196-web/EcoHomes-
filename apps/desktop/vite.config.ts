import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Resolve ens-engine package directly from packages folder
      "@ecohomes/ens-engine": path.resolve(__dirname, "../../packages/ens-engine/src/index.ts"),
    },
  },
  server: {
    port: 1420,
    strictPort: true,
    host: true,          // expose on all network interfaces (0.0.0.0)
    watch: { ignored: ["**/src-tauri/**"] },
  },
  clearScreen: false,
});
