import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'

const base = process.env.VITE_BASE_PATH ?? '/'
const basePathPattern = base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      devOptions: { enabled: false },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        globIgnores: ['legacy/**', '**/legacy/sw.js'],
        navigateFallback: `${base}index.html`,
        navigateFallbackDenylist: [new RegExp(`^${basePathPattern}legacy`)],
        clientsClaim: true,
        skipWaiting: true,
      },
      manifest: {
        name: 'Relationshape',
        short_name: 'Relationshape',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#0f0c1a',
        background_color: '#07091a',
        icons: [
          { src: 'icons/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
          { src: 'icons/icon-512.svg', sizes: '512x512', type: 'image/svg+xml' },
        ],
      },
    }),
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
