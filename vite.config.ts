import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    // Avoid a Windows Rollup crash while clearing an existing output directory.
    emptyOutDir: false,
  },
});
