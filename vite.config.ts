import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  base: './', // Use relative paths for assets
  plugins: [],
  build: {
    sourcemap: false, // Ensure sourcemaps are off for production
  },
});
