import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vercel serves the site from the root (jagjot.vercel.app/),
// GitHub Pages serves it from /my-website/.
export default defineConfig({
  base: process.env.VERCEL ? '/' : '/my-website/',
  plugins: [react()],
})
