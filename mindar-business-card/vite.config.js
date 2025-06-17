// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    open: true, // Auto-open browser on `npm run dev`
  },
  assetsInclude: ['**/*.glb'], // Ensure .glb files are served correctly
});
