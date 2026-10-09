import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/mora-vineria/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        id: '/mora-vineria/',
        name: 'Mora Vinería',
        short_name: 'Mora',
        description: 'Ventas, productos y movimientos para Mora Vinería',
        theme_color: '#101013',
        background_color: '#101013',
        display: 'standalone',
        start_url: '/mora-vineria/',
        scope: '/mora-vineria/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        navigateFallback: '/mora-vineria/index.html',
        globPatterns: ['**/*.{js,css,html,svg,png,webp}'],
      },
    }),
  ],
});
