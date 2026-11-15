import { defineConfig } from "vite";

export default defineConfig({
  // Relative asset paths so the built app also works from file://
  // (headless-Chrome tests on this VM) and any static host.
  base: "./",
  // Static site: no backend. Everything runs in the browser.
  build: {
    outDir: "dist",
    sourcemap: false,
    target: "es2022",
  },
  server: {
    port: 5173,
  },
  preview: {
    port: 4173,
    strictPort: true,
  },
});
