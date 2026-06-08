import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// Base is '/' for root hosts (Netlify, custom domains); the GitHub Pages workflow
// sets DEPLOY_BASE=/handover/ for its sub-path. HashRouter means no server rewrites.
// https://vite.dev/config/
export default defineConfig({
  base: process.env.DEPLOY_BASE || '/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Handover — Off-Plan Tracker',
        short_name: 'Handover',
        description:
          'Track off-plan property payments, equity, fees and resale — privately, on your device.',
        theme_color: '#0E5C4A',
        background_color: '#0E5C4A',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '.',
        scope: '.',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,mjs}'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        // Don't let the SPA navigation fallback hijack the standalone privacy page.
        navigateFallbackDenylist: [/privacy\.html/],
      },
    }),
  ],
})
