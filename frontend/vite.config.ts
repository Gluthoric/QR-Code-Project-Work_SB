import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist', // Match this to your Flask static folder
    assetsDir: 'assets', // Ensure assets are generated in /dist/assets
  },
  server: {
    host: '0.0.0.0', // This enables the server to be accessible from any device on the network
    port: 5173, // Specify the port explicitly
    proxy: {
      '/api': 'http://localhost:5000', // Proxy API requests to Flask
    },
  },
})
