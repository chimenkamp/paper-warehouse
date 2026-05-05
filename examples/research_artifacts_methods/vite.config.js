import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

const libRoot = resolve(__dirname, '../..');

export default defineConfig({
  plugins: [react()],
  base: process.env.BASE_URL || '/',
  resolve: {
    alias: {
      '@': resolve(libRoot, 'src'),
      '@components': resolve(libRoot, 'src/components'),
      '@views': resolve(libRoot, 'src/views'),
      '@viz': resolve(libRoot, 'src/viz'),
      '@lib': resolve(libRoot, 'src/lib'),
      '@styles': resolve(libRoot, 'src/styles'),
    },
  },
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          d3: ['d3'],
        },
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});
