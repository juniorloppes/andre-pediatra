import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Caminhos relativos: funciona no GitHub Pages (/andre-pediatra/) e em qualquer subpasta.
  base: './',
})
