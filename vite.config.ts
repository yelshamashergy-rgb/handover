import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // Relative base so the build works under any path (e.g. GitHub Pages /repo/).
  // Safe because the app uses HashRouter — no server-side route rewrites needed.
  base: './',
  plugins: [react(), tailwindcss()],
})
