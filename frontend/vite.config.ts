import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',  // Matches the `static_folder` in Flask ('/frontend/dist')
    assetsDir: 'assets',  // Assets will be generated in 'dist/assets'
  },
  server: {
    host: '0.0.0.0',  // Allow access from other devices on the network
    port: 5173,  // Development server port
    proxy: {
      '/api': 'http://localhost:5000',  // Proxy API requests to Flask backend
    },
  },
})
