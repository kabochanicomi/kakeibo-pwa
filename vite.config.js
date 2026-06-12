import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: false, // public/manifest.json を使用
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,ico,svg}'],
        navigateFallback: '/kakeibo-pwa/index.html',
      },
    }),
  ],
  base: '/kakeibo-pwa/',
})
