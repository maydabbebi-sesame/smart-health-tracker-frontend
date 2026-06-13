import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: [
      {
        '/mediassist': {
          target: 'http://127.0.0.1:5001',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/mediassist/, ''),
        }
      },
      {
        '/api': {
          target: 'http://127.0.0.1:5000/api',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/backend\/api/, '')
        }
      }
    ]
  },
})
