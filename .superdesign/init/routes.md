# Routes
- `/`: index.html, portfolio, inline nav/footer.
- `/projects/`: projects/index.html, workshop with Donewell, inline header/footer.
- `/projects/shop/`: proposed new target, no current rendered UI.
No client router. Build entries:
## `vite.config.ts`
```ts
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
      },
    },
  },
});

```
