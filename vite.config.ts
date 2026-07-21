import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/mora-vineria/",
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version ?? "0.3.0"),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: ["favicon.svg", "brand/*.svg", "icons/*.png"],
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
        theme_color: "#121014",
        lang: "es-AR",
        icons: [
          {
            src: "icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "icons/icon-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
        screenshots: [],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico,json,webmanifest}"],
        navigateFallback: "/mora-vineria/index.html",
      },
    }),
  ],
  test: {
    environment: "jsdom",
    globals: true,
  },
});
