import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/upload': 'http://localhost:5000',
      '/history': 'http://localhost:5000',
      '/scan': 'http://localhost:5000',
      '/auth': 'http://localhost:5000'
    }
  }
})