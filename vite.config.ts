import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    // Keep production source maps opt-in to reduce deploy size and avoid
    // shipping source metadata unnecessarily.
    sourcemap: mode !== 'production' && process.env.VITE_SOURCEMAP === 'true',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (
            id.includes('/recharts/') ||
            id.includes('/d3-')
          ) return 'charts';
          // @google/genai is server-only (api/gemini.js) — never bundle into client.
          if (id.includes('/@google/genai/')) {
            throw new Error('@google/genai imported by client — use /api/gemini proxy instead.');
          }
          if (
            id.includes('/react/') ||
            id.includes('/react-dom/') ||
            id.includes('/react-router') ||
            id.includes('/scheduler/')
          ) return 'react-vendor';
          if (id.includes('/@supabase/')) return 'supabase-vendor';
          return 'vendor';
        },
      },
    },
  },
}));
