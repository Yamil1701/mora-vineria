import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/mora-vineria/",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: ["icons/icon-192.svg", "icons/icon-512.svg"],
      manifest: {
        id: "/mora-vineria/",
        name: "Mora Vinería",
        short_name: "Mora",
        description:
          "App local para ordenar ventas, productos, movimientos y reportes de Mora Vinería.",
        start_url: "/mora-vineria/",
        scope: "/mora-vineria/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#121014",
        theme_color: "#D7268F",
        lang: "es-AR",
        icons: [
          {
            src: "icons/icon-192.svg",
            sizes: "192x192",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
          {
            src: "icons/icon-512.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ],
        screenshots: [],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico,json,webmanifest}"],
      },
    }),
  ],
  test: {
    environment: "jsdom",
    globals: true,
  },
});