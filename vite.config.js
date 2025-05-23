import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5000,
    host: '0.0.0.0',
    allowedHosts: [
      'localhost',
      '.replit.dev',
      '.kirk.replit.dev',
      '767673f0-eefa-48ca-bb6a-13b436ad25b7-00-2pid3o616v935.kirk.replit.dev'
    ]
  },
  define: {
    global: 'globalThis',
  }
})