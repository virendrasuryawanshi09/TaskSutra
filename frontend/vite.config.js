import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // Generate source maps for Lighthouse Best Practices
    sourcemap: true,
    // Chunk splitting to reduce unused JS and long main-thread tasks
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor libs into separate chunks
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['react-hot-toast'],
          'vendor-http': ['axios'],
          'vendor-socket': ['socket.io-client'],
        },
      },
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 600,
  },
})

