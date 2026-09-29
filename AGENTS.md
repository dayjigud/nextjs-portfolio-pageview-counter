# Repository guide for coding agents

Keep this file synchronized with major architecture and development workflow changes. Before finishing a substantial coding task, check whether it changes anything documented here or adds information future agents need; update this file in the same change when it does. Skip documentation churn for minor fixes and cosmetic edits.

## Project overview

This is a Vite site with two HTML entry points: Ayodeji Adeniyi's portfolio at `/` and the Donewell task app at `/projects/`. The current implementation uses semantic HTML, vanilla JavaScript, Tailwind CSS, and custom CSS. There is no React app or client-side router.

Donewell runs entirely in the browser. It has no account system, server API, or database. The absence of a portfolio link to `/projects/` does not make that page authenticated or access-controlled.

## Repository map

- `index.html`: portfolio content and markup; `src/navigation.js`: accessible mobile menu behavior.
- `projects/index.html`: Donewell markup; `src/projects.js`: task state, calendar, filters, repeating tasks, and JSON backup import/export.
- `src/index.css`: shared and page-specific styles. `tailwind.config.js` defines theme tokens and scanned source files; `postcss.config.js` wires Tailwind and Autoprefixer.
- `public/images/`: static images. `vite.config.ts` configures both HTML build entries and relative asset paths.
- `tests/portfolio.spec.js` and `playwright.config.js`: desktop and mobile Chromium browser tests, including accessibility checks.
- `.github/workflows/ci.yml`: CI install, Chromium setup, and test run. `vercel.json`: deployment build and output settings.
- `dist/`: tracked generated production output. Edit source files, then regenerate with `npm run build`; do not hand-edit generated assets.
- `plans/` contains working notes. `Performance_Audit_Report.md` and `OPTIMIZATION_SUMMARY.md` describe an older React version and are historical, not current architecture guidance.

## Setup and commands

Use Node.js 20 or newer and npm. No application environment variables or secret configuration are required by the current source. Playwright reads `CI` to adjust retries, reporting, and server reuse in CI.

```sh
npm ci
npm run dev
npm run build
npm run preview
npm test
```

`npm test` builds the site, then runs Playwright against the production preview server. If Chromium is missing, run `npx playwright install chromium`. The package has no lint, formatting, type-check, or database script; do not assume those checks exist because `tsconfig.json` is present. Vercel builds with `npm run build` and serves `dist/`.

## Implementation conventions and constraints

- Keep page markup in its HTML entry point, behavior in the corresponding `src/*.js` module, and styling in `src/index.css`. Follow existing semantic controls, ARIA state, visible focus styles, and `prefers-reduced-motion` handling.
- Donewell saves its task array in `localStorage` under `donewell-tasks-v1`. Preserve existing saved tasks when evolving the data shape. JSON backup import/export uses version `1`; keep current backups readable.
- Due dates are local calendar dates in `YYYY-MM-DD` form. Avoid UTC conversions that could shift a user's date. Repeating tasks require a due date, and the date picker must work in both add and edit forms with keyboard and narrow screens.
- Task rows are rendered from user-entered data in `src/projects.js`; keep escaping and backup validation intact when changing rendering or import behavior.
- The portfolio and Donewell share the stylesheet but have distinct page styling. Check both pages when changing shared CSS or Tailwind configuration.

## Testing expectations

Run relevant Playwright tests after behavior changes; run the full `npm test` suite for portfolio or shared-style changes. Tests cover navigation, desktop and mobile layouts, keyboard interaction, accessibility, and Donewell persistence, calendar, recurrence, filtering, and backups. Report failures rather than changing tests to hide them. After source changes that affect production output, run `npm run build` so tracked `dist/` matches the source.
