import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  build: {
    // Source maps only in dev — Vercel returns 403 for .map files in production
    sourcemap: mode !== 'production',

    rollupOptions: {
      output: {
        manualChunks(id) {
          // ── React core ─────────────────────────────────────────────────────
          // Never changes, longest cache lifetime
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/react-is/') ||
            id.includes('node_modules/scheduler/')
          ) return 'vendor-react';

          // ── Router ─────────────────────────────────────────────────────────
          if (
            id.includes('node_modules/react-router') ||
            id.includes('node_modules/@remix-run/')
          ) return 'vendor-router';

          // ── Recharts + D3 ─────────────────────────────────────────────────
          // Only Dashboard uses these — and Dashboard is lazy-loaded.
          // Keeping them in a named chunk prevents duplication if multiple
          // lazy routes ever import recharts.
          if (
            id.includes('node_modules/recharts') ||
            id.includes('node_modules/d3-') ||
            id.includes('node_modules/victory-vendor')
          ) return 'vendor-charts';

          // ── Moment.js ─────────────────────────────────────────────────────
          if (id.includes('node_modules/moment')) return 'vendor-moment';

          // ── React Icons ───────────────────────────────────────────────────
          if (id.includes('node_modules/react-icons')) return 'vendor-icons';

          // ── Socket.io ─────────────────────────────────────────────────────
          if (
            id.includes('node_modules/socket.io-client') ||
            id.includes('node_modules/engine.io-client') ||
            id.includes('node_modules/@socket.io/')
          ) return 'vendor-socket';

          // ── Axios ─────────────────────────────────────────────────────────
          if (
            id.includes('node_modules/axios') ||
            id.includes('node_modules/form-data')
          ) return 'vendor-http';

          // ── Toast ─────────────────────────────────────────────────────────
          if (id.includes('node_modules/react-hot-toast')) return 'vendor-ui';

          // ── react-helmet-async ────────────────────────────────────────────
          // Small, no CSS — safe to group
          if (id.includes('node_modules/react-helmet-async')) return 'vendor-helmet';

          // ─────────────────────────────────────────────────────────────────
          // DO NOT put these in shared vendor chunks:
          //
          // • framer-motion  — 78 KiB, used in Navbar/SideMenu on every page.
          //   Putting it in a vendor chunk forces it to load eagerly.
          //   Let Rollup tree-shake it naturally into only the chunks that use it.
          //
          // • react-datepicker — has its own CSS. Putting it in vendor-misc
          //   causes Vite to generate a vendor-misc.css that is RENDER-BLOCKING
          //   even though CreateTask (the only consumer) is lazy-loaded.
          //   Let it bundle into the CreateTask chunk instead.
          //
          // • @headlessui/react — same reason as react-datepicker.
          // ─────────────────────────────────────────────────────────────────
        },
      },
    },

    chunkSizeWarningLimit: 600,
  },
}))
