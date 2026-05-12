import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // All /api calls in React will be forwarded to Flask on port 8000
      '/scrape':          { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/dashboard':       { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/products':        { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/recommendation':  { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/ai-recommendation':{ target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/chat':            { target: 'http://127.0.0.1:8000', changeOrigin: true },
    }
  }
})
