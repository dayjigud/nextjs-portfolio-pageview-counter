# Repository guide for coding agents

## What this project is

This is a small Vite site with two HTML entry points. `index.html` is Ayodeji's portfolio. `projects/index.html` is the Donewell task app at `/projects/`. The app uses vanilla JavaScript and browser storage; there is no React application, account system, or task backend.

## Where to work

- Edit portfolio markup in `index.html` and its mobile navigation behavior in `src/navigation.js`.
- Edit Donewell markup in `projects/index.html` and its behavior in `src/projects.js`.
- Edit shared and page-specific styles in `src/index.css`; Tailwind settings are in `tailwind.config.js`.
- Vite builds both pages through `vite.config.ts`. Vercel settings are in `vercel.json`.
- `dist/` is tracked build output. Change source files first, then run `npm run build` to regenerate it. Do not hand-edit generated assets.

## Donewell behavior to preserve

- Tasks are stored locally under `donewell-tasks-v1`. Preserve existing saved tasks when changing the data model. Backup import/export uses JSON and must keep working with current backups.
- Due dates are local calendar dates in `YYYY-MM-DD` form. Avoid UTC conversions that can shift a date for users in other time zones.
- The calendar picker works in both add and edit forms. Keep it usable by keyboard and on narrow screens. Repeating tasks require a due date.
- `/projects/` is intentionally absent from the portfolio navigation, but anyone with its URL can access it. Do not treat that lack of a link as authentication.

## Commands and checks

Use Node.js 20 or newer and `npm ci` for a clean install. Run `npm run dev` for local work, `npm run build` for production output, and `npm test` for the Playwright suite. If Playwright's Chromium is missing, install it with `npx playwright install chromium`.

The tests in `tests/portfolio.spec.js` cover desktop and mobile layouts, navigation, accessibility, and Donewell task flows. Run the relevant tests after changing behavior; run the full suite when changes affect the portfolio or shared styles. Report any failures rather than changing tests to conceal them. Preserve semantic controls, visible focus states, and reduced-motion behavior.

`Performance_Audit_Report.md` and `OPTIMIZATION_SUMMARY.md` describe an older React version and are historical references, not current architecture documentation.
