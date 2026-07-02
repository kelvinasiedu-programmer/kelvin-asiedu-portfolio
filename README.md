# Kelvin Asiedu - Portfolio

My personal portfolio. It's a static site - hand-written HTML, CSS, and vanilla JS, with a three.js particle scene behind the homepage hero. No framework, no build step.

Pages: home, about, projects, experience, contact.

## Run it locally

The pages load ES modules through an importmap, so serve the folder instead of opening the files straight from disk:

```bash
npx serve .
```

Then open the URL it prints.

## Tests

There are two PowerShell scripts in `tests/`:

- `npm run smoke` checks the markup without a browser: every page is present, the shared nav links match, the homepage keeps its three.js shell while the subpages stay plain, and any `target="_blank"` link carries `rel="noopener noreferrer"`.
- `npm run runtime-smoke` loads the homepage in Playwright and fails if the console errors or the hero canvas doesn't render.

I run both after touching the homepage.

## Deploy

Hosted on Vercel. Everything is static, so any host works - just point it at the repo root. `npm run build` doesn't build anything; it echoes one line so Vercel has a command to run.
