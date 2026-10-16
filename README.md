# E don happen

A location-aware community incident reporting application for Lagos. Residents publish observations, confirm or dispute nearby reports, manage alert subscriptions, and receive in-app and optional browser push notifications. Moderators review reports and record reasons for decisions. The backend domain is named **Neighbourhood Signal**.

## Project status

The integrated application is a functional development prototype, not a production release. This documentation describes [implementation snapshot `09db39d`](https://github.com/johdanike/group_9b/tree/09db39de1b8b761a369135badbb0802e9f730f99) on `demo/pitch-integration`. The documentation can be merged independently; its presence on `main` does not imply that the integrated runtime has been merged there.

Implemented: phone verification in local demo mode, JWT sessions, persistent geospatial reports, independent community votes, moderator review, contributor history badges, category/radius subscriptions, inbox notifications, and an installable PWA with opt-in Web Push. Production SMS, media uploads, emergency response dispatch, billing, and several moderation workflows remain incomplete.

## Technology

| Layer | Stack |
| --- | --- |
| Web application | React 19, React Router 7, Vite 8, Tailwind CSS 4 |
| API | NestJS 12, TypeScript 6, Passport/JWT, class-validator |
| Persistence | PostgreSQL 15 with PostGIS, TypeORM |
| Infrastructure | Redis 7, Docker Compose, optional Cloudflare temporary tunnel |
| PWA | vite-plugin-pwa, Workbox, service worker, encrypted Web Push/VAPID |
| Validation | Vitest, Node.js HTTP integration tests, Oxlint |

## Getting started

Use Node.js 24, npm 11, Git, and Docker Desktop with Linux containers. Run commands from the repository root. On Windows, use `npm.cmd` if PowerShell execution policy blocks `npm`.

```sh
git switch demo/pitch-integration
npm ci
```

Copy `backend/.env.example` to `backend/.env` without overwriting existing settings (`Copy-Item backend/.env.example backend/.env` in PowerShell, or `cp backend/.env.example backend/.env` on macOS/Linux).

```sh
npm run db:up
npm run build
npm run demo:seed
npm run dev
```

Open the application at http://127.0.0.1:5173 and API documentation at http://127.0.0.1:3000/api/docs. Vite forwards `/api` to the backend on port 3000. Local PostgreSQL uses port 55432 and Redis uses 56379. `npm run db:down` stops containers while retaining database volumes.

Authentication currently requires `DEMO_MODE=true` outside production. Request a code in the application and read it on the host from `backend/.local/demo-otps.json`. Codes are generated only by the backend; no SMS provider is configured. This private file must never be committed or served publicly. The seed provides fictional accounts `+2348000000001` through `+2348000000004`; the fourth is a moderator. Sample reports are illustrative.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start backend and frontend development processes |
| `npm run build` | Compile backend and build the PWA |
| `npm test` | Run backend unit tests |
| `npm run test:e2e` | Run HTTP integration tests using its own API process and the configured demo database |
| `npm run lint --workspace backend` | Run type-aware backend linting |
| `npm run demo:seed` | Add guarded, idempotent sample data after building |
| `npm run demo:serve` | Serve built frontend and proxy the API on port 4173 |
| `npm run demo:share` | Start an optional temporary public HTTPS tunnel |

## Mobile and PWA access

For a built application, run the compiled backend (`npm run start:prod --workspace backend`) and `npm run demo:serve` in separate terminals after `npm run build`. `start:prod` names the compiled entry point; it does not set `NODE_ENV`.

Install `cloudflared` or set `CLOUDFLARED_PATH` to its executable, then run `npm run demo:share`. Open the printed HTTPS URL on the phone. The host computer and processes must remain running. A new tunnel URL is a new browser origin and requires a new installation/subscription. Plain HTTP on a LAN generally cannot provide PWA installation or Web Push; `localhost` on a phone refers to the phone itself.

Enable notifications through the application's explicit permission button. On supported iPhones/iPads, install through Safari's Add to Home Screen and launch the installed app before enabling push. The PWA caches its shell, not report data or offline writes. Provider acceptance does not prove notification display.

## Repository layout

```text
backend/src/       Nest modules, entities, DTOs, guards, services, seed
frontend/src/      Pages, shared components, API/session/push helpers, service worker
frontend/public/   Icons and static assets
scripts/           Development launcher, integration suite, static/API proxy, tunnel
init-scripts/      Fresh-database PostGIS initialization
docs/              Development and implementation reference
```

## Development and deployment

Read [the development guide](docs/DEVELOPMENT.md) for setup, architecture, every source file's symbols/imports, API routes, data models, configuration, workflows, tests, troubleshooting, and production prerequisites.

Keep changes focused and reviewable. Run the checks relevant to a change, document API/configuration changes, and submit a pull request. Never commit `.env`, backend `.local` data, private notes, VAPID private keys, access tokens, or real personal data. Use synthetic fixtures when testing.

Production requires a stable HTTPS origin, managed secrets, reviewed database migrations, backups, real SMS verification, authorization hardening, abuse controls, and operational monitoring. Docker Compose defaults and automatic demo schema synchronization are development settings. See the guide's release checklist before deploying.

## License

No open-source license has been granted. The backend package is marked `UNLICENSED`; obtain the repository owner's permission for redistribution or reuse.
