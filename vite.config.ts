import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // This enables the server to be accessible from any device on the network
    port: 5173, // Specify the port explicitly
  },
})
