# Kelvin Asiedu Portfolio

Static homepage redesign for Kelvin Asiedu's portfolio. The site ships as plain HTML, CSS, and ES modules, so deployment is intentionally simple and does not require a bundling step.

## Local verification

Run the smoke checks and static build command before publishing:

```bash
npm run smoke
npm run runtime-smoke
npm run build
```

## Deployment notes

- The project is deploy-ready from the repository root.
- `npm run build` is the expected production build command and `npm run vercel-build` delegates to it for Vercel deployments.
- `npm run runtime-smoke` launches a local static server and uses Playwright CLI to confirm the homepage loads without runtime console errors and that the hero canvas renders.
- All homepage assets are referenced with relative paths from `index.html`, so the site can also be deployed to other static hosts without changing the source.
- Re-run the smoke script after homepage edits to confirm accessibility hooks, external-link hardening, and key responsive CSS guards are still present.
