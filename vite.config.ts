import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// https://vitejs.dev/config/
export default defineConfig({
  base: './', // Use relative paths for assets
  plugins: [],
  build: {
    sourcemap: false, // Ensure sourcemaps are off for production
    rollupOptions: {
      input: {
        main: resolve(process.cwd(), 'index.html'),
        projects: resolve(process.cwd(), 'projects/index.html'),
        shopCatalog: resolve(process.cwd(), 'projects/shop/index.html'),
        shopProduct: resolve(process.cwd(), 'projects/shop/product/index.html'),
        shopCart: resolve(process.cwd(), 'projects/shop/cart/index.html'),
        shopCheckout: resolve(process.cwd(), 'projects/shop/checkout/index.html'),
        shopConfirmation: resolve(process.cwd(), 'projects/shop/confirmation/index.html'),
        shopAccount: resolve(process.cwd(), 'projects/shop/account/index.html'),
        shopCallback: resolve(process.cwd(), 'projects/shop/auth/callback/index.html'),
      },
    },
  },
});
