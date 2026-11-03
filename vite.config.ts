import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { navHtml, loadingHtml } from './src/shop/render.js';

// https://vitejs.dev/config/
export default defineConfig({
  base: './', // Use relative paths for assets
  server: { allowedHosts: ['terminal.local'] }, // Managed development preview only
  plugins: [{
    name: 'luma-initial-layout',
    transformIndexHtml(html) {
      const mode = html.match(/data-shop-page="([a-z]+)"/)?.[1];
      if (!mode) return html;
      return html.replace('<header data-shop-nav></header>', `<header data-shop-nav>${navHtml()}</header>`)
        .replace('<div data-shop-initial></div>', loadingHtml(mode));
    },
  }],
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
