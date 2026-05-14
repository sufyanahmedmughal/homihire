import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // The backend URL — falls back to localhost:5000 if VITE_API_BASE_URL is not set
  const backendUrl = env.VITE_API_BASE_URL || 'http://localhost:5000'

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        // Proxy all /api requests to the backend server
        // This eliminates CORS entirely in dev — browser thinks it's same-origin
        '/api': {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  }
})
