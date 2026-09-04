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
          // recharts@3 bundles its own d3 subset; d3-* covers any remaining d3 deps.
          // victory-vendor was a recharts@2 internal — no longer present.
          if (id.includes('/recharts/') || id.includes('/d3-')) return 'charts';
          if (
            id.includes('/react/') ||
            id.includes('/react-dom/') ||
            id.includes('/react-router') ||
            id.includes('/scheduler/')
          ) return 'react-vendor';
          if (id.includes('/@supabase/')) return 'supabase-vendor';
          // @google/genai is a server-only dependency used by api/gemini.js.
          // It must NOT be bundled into the client — exclude it here so a
          // misconfigured import would fail loudly at build time.
          if (id.includes('/@google/genai/')) {
            throw new Error(
              '@google/genai was imported by a client-side module. ' +
              'Gemini calls must go through /api/gemini (server proxy) only.'
            );
          }
          return 'vendor';
        },
      },
    },
  },
}));
