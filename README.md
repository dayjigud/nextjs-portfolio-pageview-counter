# Ayodeji Adeniyi — Portfolio

Ayodeji Adeniyi's single-page portfolio, featuring selected product-engineering and product-management work, experience, capabilities, credentials, and contact details.

## Architecture

The current site is intentionally small and static:

- Semantic HTML in `index.html`
- Tailwind CSS and custom CSS in `src/index.css`
- A small vanilla JavaScript module in `src/navigation.js` that keeps the mobile menu's accessible state synchronized and closes it after navigation
- Vite for local development and production builds
- Vercel configuration in `vercel.json`

There is no React application or client-side router in the current implementation. Most interaction and all animation are CSS-driven.

## Local development

### Prerequisites

- Node.js 20 or later
- npm

```sh
npm ci
npm run dev
```

Vite prints the local development URL in the terminal.

## Checks

```sh
npm run build
npm test
```

`npm test` builds the production site and runs the Playwright browser and accessibility smoke tests against it. Install the test browser once with `npx playwright install chromium` if it is not already available.

## Production build

```sh
npm run build
npm run preview
```

Vite writes production files to `dist/`. Vercel uses the same build command and output directory.

## Historical reports

`Performance_Audit_Report.md` and `OPTIMIZATION_SUMMARY.md` describe an earlier React-based version of this portfolio. They are retained as historical records and are not documentation for the current architecture.
