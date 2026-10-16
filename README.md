# E don happen / Neighbourhood Signal

A Lagos community incident feed: residents share structured local observations, independently confirm or dispute reports, and receive relevant in-app notifications. Moderators review reports with an audit trail. The frontend uses the team's **E don happen** branding; the backend project is **Neighbourhood Signal**.

The integrated local demo lives on **`demo/pitch-integration`**. Existing `main`, frontend, notification and moderation branches are preserved. This is a demonstration of the core reporting workflow, not a complete implementation of the original PRD.

## Quick start

Requirements: Node.js 24 (24.15+ recommended), npm 11, Docker Desktop with Linux containers, and Git. Docker must be running. Commands below are run from the repository root. On Windows PowerShell, use `npm.cmd` if execution policy blocks `npm`.

```powershell
git switch demo/pitch-integration
npm.cmd ci
Copy-Item backend/.env.example backend/.env
npm.cmd run db:up
npm.cmd run build
npm.cmd run demo:seed
npm.cmd run dev
```

Do not overwrite an existing `.env` that you have customised. The example settings are for the local demo only.

- App: http://127.0.0.1:5173
- API root: http://127.0.0.1:3000/api
- Swagger API explorer: http://127.0.0.1:3000/api/docs

`npm run dev` starts both workspaces. Alternatively, use separate terminals:

```powershell
npm.cmd run start:dev --workspace backend
npm.cmd run dev --workspace frontend
```

To use the compiled backend: `npm.cmd run start:prod --workspace backend` after building. Keep the frontend dev server running for the browser app. Vite proxies `/api` requests to port 3000. The frontend build can also be inspected with `npm.cmd run preview --workspace frontend` at port 4173 while the backend runs.

The dedicated Docker Compose project is `signal-demo`. PostgreSQL/PostGIS uses localhost **55432**, Redis uses **56379**, and the database is **`neighbourhood_signal_demo`**. These differ from the original development ports/database. `npm run db:down` stops the demo containers while retaining their data volumes. Do not add `--volumes` unless you intend to delete demo data.

## Demonstrate the product

Open **Login** and choose a sample account. Press **Get verification code**, copy the displayed six-digit local code, then verify. **No SMS is sent.** Registration accepts a Nigerian local number or an international number and saves the name, area and default category preferences.

| Account | Phone | Use |
| --- | --- | --- |
| Ada | +2348000000001 | Report author; starts with nine illustrative verified reports |
| Tunde | +2348000000002 | Independent witness and notification recipient |
| Zainab | +2348000000003 | Second independent witness |
| Bisi / Moderator | +2348000000004 | Review reports and record verification reasons |

Sample phones, people and events are illustrative. Seeded reports contain `[Sample]` labels. Seeding preserves existing records and does not reset votes or moderator decisions.

Suggested walkthrough:

1. Sign in as Ada and show the nearby feed. Filter by area, radius or category.
2. Use **Report** to submit a factual observation. Show its unverified label, then refresh to show persistence.
3. Sign in as Tunde in a separate browser session and open **Notifications**. A matching saved subscription receives the new report. Open it and record a firsthand confirmation.
4. Use Zainab to add an independent confirmation. Two confirmations produce **Corroborated**. A dispute produces **Disputed**; votes do not independently verify facts.
5. Sign in as Moderator, open **Moderation**, open a report, enter a reason of at least ten characters and mark it verified. The report and its audit record update together.
6. Refresh Ada's profile/feed. After ten reports are currently moderator-verified, **Trusted contributor** appears. A badge describes contribution history, not proof of identity or automatic verification of future reports.
7. Show **Preferences**: choose categories, area and radius; save the area/radius for enabled subscriptions.

Use separate browsers or normal/incognito windows to represent independent users. Sessions are stored per browser tab. OTP requests are limited to three per phone within 15 minutes, codes expire after five minutes, and a code allows three failed attempts. Reuse an existing logged-in session during rehearsals rather than requesting codes repeatedly.

## What works

- Real phone-OTP demo authentication, access/refresh tokens, active-account checks and profile updates.
- Persistent report creation and detail, category/radius filtering, observation timestamps and approximate location display. Times in the dashboard use Africa/Lagos.
- One stored vote per user/report, changeable votes, self-vote prevention, firsthand confirmation and concurrent-request protection.
- Separate community confidence and moderator verification states.
- Contributor badge calculated from ten distinct, currently verified reports.
- Category/radius subscription storage, geographic matching, durable in-app inbox and read state. The dashboard polls every 20 seconds and has a refresh button.
- Moderator queue, reasoned state changes, self-review prevention and transactional audit history.
- Desktop/mobile dashboard, existing landing page/PWA shell, API documentation and explicit errors/loading/empty states.

External push, SMS and email delivery are not connected. A saved inbox entry means available in this application's inbox; it does not indicate a message reached a phone or that an emergency responder acknowledged it.

## Repository structure

```text
backend/
  src/
    config/             Environment and TypeORM configuration
    database/           Database module
    redis/              Existing Redis infrastructure connection
    modules/
      identity/         OTP, JWT, profiles, users and role checks
      reports/          Report API, feed, votes and public projections
      notifications/    Preferences, matching and inbox records
      moderation/       Review, state transitions and audit history
      ...               Retained domain entities/scaffolding
    demo/               Guarded sample-data seed
  test/                 Unit-test setup
frontend/
  src/
    components/         Existing shared presentation components
    pages/              Landing, authentication and dashboard
    lib/                API client and session helpers
    data/               Pilot area centres, categories and label explanations
  public/               Existing PWA assets
scripts/                Workspace launcher and HTTP integration suite
init-scripts/           Fresh-database PostGIS setup
```

The root `package.json` uses npm workspaces and one `package-lock.json`. Run dependency installation from the root. Backend and frontend have separate scripts/configuration and import trees. The original overlapping `src` trees and unused empty report controller/service scaffolds were removed.

## Main technologies and request flow

React + React Router + Vite + Tailwind power the UI. NestJS uses Passport/JWT for authenticated requests, class-validator/class-transformer for DTO validation, TypeORM for persistence, PostgreSQL/PostGIS for geographic queries, and Redis for the existing infrastructure connection. OTP storage currently remains in backend process memory. Swagger exposes the API contract. Vitest covers unit behaviour; the Node test runner exercises real HTTP/database integration.

```text
React form -> shared API client -> Vite /api proxy -> Nest controller
  -> JWT/role guards + DTO validation -> service -> TypeORM/PostGIS
  -> public response -> refreshed React state
```

Creating a report and its matching in-app notifications is one database transaction. Voting locks the report row, updates the user's unique contribution, recalculates counts and sets community confidence. Moderator review saves the state and audit action together. Public report responses omit private user fields and round coordinates.

## Configuration

`backend/.env.example` documents local settings. Actual `.env` files are ignored. `DEMO_MODE=true` enables the explicitly labelled local OTP adapter and development schema synchronisation; production does not enable either. JWT example secrets are local placeholders. Query logging is off by default; set `DB_LOGGING=true` temporarily if needed.

The seed refuses to run unless demo mode is enabled, the environment is not production and the database is named `neighbourhood_signal_demo`. Fresh databases receive timezone-aware event columns. Existing databases from the older schema need a reviewed timestamp/schema migration before reuse; this demo is intended to use its dedicated database.

## Checks

With demo containers running and `backend/.env` configured:

```powershell
npm.cmd run build
npm.cmd test
npm.cmd run test:e2e
```

The HTTP integration suite starts a separate API process on **3100**, creates temporary test users and reports, and removes its own fixtures afterwards. It checks persistence, geographic filtering, privacy, ownership, validation, concurrent votes, role checks, audit writes, badge threshold and suspension. Keep port 3100 free. Unit tests use TypeScript decorator metadata so Nest's dependency injection behaves consistently with the production build.

## Deferred work

This demo does not implement the full PRD. Map view, uploaded evidence, duplicate grouping, full appeals, automatic freshness/expiry policies, real notification providers/workers, production abuse controls, billing and community administration remain follow-up work. Some inherited service methods/domain modules are scaffolding; unsupported merge/appeal-review operations explicitly fail instead of claiming completion.

SOS remains deferred until responder coverage, escalation, delivery monitoring and operational ownership satisfy the PRD's readiness gate. Before any real pilot, introduce reviewed database migrations, production secrets/session hardening, provider integrations, moderation policies and deployment monitoring.

## Reconcile with the team later

Review this branch through a pull request before merging into `main`. Small commits separate branch integration, layout, backend fixes, frontend integration, demo data, tests and documentation. Existing team branches can be merged or selected fixes cherry-picked after reviewing the new paths. No force-push or automatic merge into `main` is required.
