import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  build: {
    // Source maps only in dev — Vercel returns 403 for .map files in production,
    // which triggers Lighthouse "missing source maps" console errors.
    sourcemap: mode !== 'production',

    rollupOptions: {
      output: {
        // ─── Granular vendor chunk splitting ──────────────────────────────────
        // Each entry becomes a separately cached chunk. Users only re-download
        // a chunk when THAT library changes, not the entire bundle.
        manualChunks(id) {
          // React core — changes almost never
          if (id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/react-is/') ||
              id.includes('node_modules/scheduler/')) {
            return 'vendor-react';
          }

          // Router — changes rarely
          if (id.includes('node_modules/react-router') ||
              id.includes('node_modules/@remix-run/')) {
            return 'vendor-router';
          }

          // Recharts + D3 deps — large, changes rarely, only needed on dashboard
          if (id.includes('node_modules/recharts') ||
              id.includes('node_modules/d3-') ||
              id.includes('node_modules/victory-vendor')) {
            return 'vendor-charts';
          }

          // Framer Motion — large animation library
          if (id.includes('node_modules/framer-motion')) {
            return 'vendor-motion';
          }

          // Moment.js — large date library
          if (id.includes('node_modules/moment')) {
            return 'vendor-moment';
          }

          // React Icons — large icon set
          if (id.includes('node_modules/react-icons')) {
            return 'vendor-icons';
          }

          // Socket.io client
          if (id.includes('node_modules/socket.io-client') ||
              id.includes('node_modules/engine.io-client') ||
              id.includes('node_modules/@socket.io/')) {
            return 'vendor-socket';
          }

          // Axios + http utils
          if (id.includes('node_modules/axios') ||
              id.includes('node_modules/form-data')) {
            return 'vendor-http';
          }

          // Toast notifications
          if (id.includes('node_modules/react-hot-toast')) {
            return 'vendor-ui';
          }

          // Headless UI, react-datepicker, react-helmet
          if (id.includes('node_modules/@headlessui') ||
              id.includes('node_modules/react-datepicker') ||
              id.includes('node_modules/react-helmet-async')) {
            return 'vendor-misc';
          }
        },
      },
    },

    // Increase chunk size warning limit
    chunkSizeWarningLimit: 600,
  },
}))
