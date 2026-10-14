# E don happen

A location-based notification app: register, pick your location, and get notified when something happens where you are — only people at the same location see it.

## Stack

- [Vite](https://vite.dev) + React 19
- Tailwind CSS v4 (`@tailwindcss/vite`)
- react-router-dom v7
- PWA via [vite-plugin-pwa](https://vite-plugin-pwa.netlify.app) (installable, offline app shell)

Brand colors: primary vivid-green `#12D900`, ink black-grey `#303234`.

## Pages

| Route | Description |
|---|---|
| `/` | Landing page — hero, how it works, features, social proof, FAQ, CTA |
| `/register` | Sign-up form with location dropdown (sample list) |
| `/login` | Log-in form |
| `/dashboard` | User dashboard shell — notifications, people at location (demo data) |

> Frontend-only phase: auth and notifications are mocked (`sessionStorage`); wire a backend later.

## Commands

```bash
npm install        # install dependencies
npm run dev        # start dev server
npm run build      # production build (includes SW + manifest in dist/)
npm run preview    # serve the production build
npm run lint       # oxlint
```

## PWA

The production build is a full PWA: `dist/manifest.webmanifest`, service worker precaching the app shell, icons in `public/`. Serve `dist/` over HTTPS (or localhost) to get the install prompt.

Regenerate icons after design changes:

```bash
node scripts/generate-icons.mjs
```

## Project structure

```
src/
├── components/     Navbar, Footer, Logo, LocationSelect, cards, accordion
├── data/           locations.js (sample location list)
├── pages/          Landing, Register, Login, Dashboard
├── App.jsx         routes
├── main.jsx        router + service-worker registration
└── index.css       Tailwind theme (brand tokens, btn utilities)
```
