import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: path.resolve(__dirname, '../dist'),  // Output to the Flask static folder
    assetsDir: 'assets',  // Assets will be generated in 'dist/assets'
    emptyOutDir: true,  // Clean the output directory before building
  },
  server: {
    host: '0.0.0.0',  // Allow access from other devices on the network
    port: 5173,  // Development server port
    proxy: {
      '/api': 'http://localhost:5000',  // Proxy API requests to Flask backend
    },
  },
})
