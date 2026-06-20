import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' keeps asset paths relative so the built app runs from file://
// (double-click dist/index.html) or any static host without server config.
export default defineConfig({
  base: './',
  plugins: [react()],
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
