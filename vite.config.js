import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// base: './' keeps asset paths relative so the built app runs from file://
// (double-click dist/index.html) or any static host without server config.
export default defineConfig({
  base: './',
  plugins: [
    react(),
    // PWA support. injectRegister:false → we register the service worker
    // ourselves (a later step) so we can add Web Push handlers. No backend yet.
    VitePWA({
      // Custom service worker (src/sw.js) so we can handle Web Push.
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      injectRegister: false,
      manifest: {
        name: 'My Calander',
        short_name: 'My Calander',
        description: 'GrowthifyEdge OS — your agency operating system.',
        theme_color: '#6366f1',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
    }),
  ],
  server: { port: 5173 },
  preview: { port: 4173 },
  build: {
    // Split large vendors into their own chunks for better long-term caching.
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
          motion: ['framer-motion'],
          vendor: ['date-fns', 'lucide-react', 'localforage', '@supabase/supabase-js', 'clsx'],
        },
      },
    },
  },
})
