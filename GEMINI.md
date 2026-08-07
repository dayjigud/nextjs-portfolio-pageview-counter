# Project Guide

## Overview

This repository contains Ayodeji Adeniyi's static, single-page portfolio. The current implementation uses semantic HTML, Tailwind CSS, a small vanilla JavaScript accessibility helper, and Vite. It does not use React, a client-side router, or Vercel Analytics.

## Commands

- `npm ci`: install the locked dependency set.
- `npm run dev`: start the Vite development server.
- `npm run build`: create the production build in `dist/`.
- `npm run preview`: serve the production build locally.
- `npm test`: build and run the Playwright smoke and accessibility suite.

## Development conventions

- The page markup and content live in `index.html`.
- Tailwind configuration lives in `tailwind.config.js`; custom styles live in `src/index.css`.
- Keep JavaScript progressive and minimal. `src/navigation.js` exists to synchronize mobile-menu accessibility state and close the menu reliably.
- Respect `prefers-reduced-motion` whenever adding or changing animation.
- Update browser tests when changing navigation, interactive disclosures, local assets, or accessibility behavior.
- Vercel deployment settings live in `vercel.json`.

## Historical material

`Performance_Audit_Report.md` and `OPTIMIZATION_SUMMARY.md` concern an earlier React implementation. Do not treat their component names, bundle sizes, or recommendations as descriptions of the current site.
