import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The site is served from https://jagjotsingh244-source.github.io/my-website/
export default defineConfig({
  base: '/my-website/',
  plugins: [react()],
})
