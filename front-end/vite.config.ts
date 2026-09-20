import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        // keep three.js / gsap in their own long-lived chunks
        manualChunks: (id) => (id.includes('node_modules/three/') ? 'three' : id.includes('node_modules/gsap/') ? 'gsap' : undefined),
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
