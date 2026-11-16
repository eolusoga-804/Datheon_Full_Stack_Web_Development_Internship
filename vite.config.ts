import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // Keep the hand-written manifest and register the worker in built pages.
      manifest: false,
      strategies: "generateSW",
      injectRegister: "script-defer",
      registerType: "prompt",
      workbox: {
        // Precache built files only. Keep live API requests on the network.
        globPatterns: ["**/*.{html,js,css,svg,png,webmanifest}"],
        cleanupOutdatedCaches: true,
        navigateFallback: "index.html",
        navigateFallbackAllowlist: [/^\/(?:\?.*)?$/],
      },
    }),
  ],
});
