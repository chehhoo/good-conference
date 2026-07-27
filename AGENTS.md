# AGENTS.md

This file provides guidance to Codex when working in this repository.

## Project Overview

`good-conference` is the attendee-facing portal for the Good Vessel / Good Camp
conference platform. It is a lightweight React + Vite + TypeScript frontend.

This repo is frontend-only. It has no backend, database, server process, or
business-data source of its own. All data comes from the Spring Boot API in
`good-api`.

## Ecosystem Context

Current repos:

```text
good-api/          Backend API + admin UI. Single source of truth.
good-conference/   This repo. Attendee portal.
good-register/     Public registration page.
good-scan/         Volunteer scan PWA.
good-infra/        Terraform infrastructure.
```

Do not add server-side logic, database access, or persistence here. If a feature
needs new data or rules, implement the API contract in `good-api` first and then
consume it from this app.

## Common Commands

```powershell
# Install dependencies
cd C:\Users\chehh\Projects\good-conference
npm install

# Start local dev server
npm run dev
# Opens http://localhost:5173

# Production build
npm run build

# Preview production build locally
npm run preview
```

The local backend must be running for API calls to work:

```powershell
cd C:\Users\chehh\Projects\good-api
docker compose up -d
```

`vite.config.ts` proxies `/api` to `http://localhost:8090` during local dev.

## Current Architecture

### Runtime flow

```text
Browser
  -> Vite dev proxy or production API base URL
  -> good-api Spring Boot API
  -> MariaDB
```

Production is static hosting: Vite builds `dist/`, GitHub Actions syncs it to
S3, and CloudFront serves `conference.goodvessel.org`.

### Source layout

```text
src/
  api/
    client.ts          Axios instance, API functions, shared API types
  components/
    Layout.tsx         Authenticated shell, header, logout, bottom nav
    SessionCard.tsx    Reusable session display and signup/unsignup card
    ShareModal.tsx     QR-code share modal
  pages/
    Login.tsx          OTP login + registration-code fallback
    Schedule.tsx       Full schedule, day tabs, signup/unsignup
    MySchedule.tsx     Logged-in attendee's signed-up sessions
    MyInfo.tsx         Family member meal and lodging view
  auth.ts              localStorage token/person helpers
  auth-context.tsx     Reactive auth context + logout cache clearing
  App.tsx              Routes and auth guard
  main.tsx             React root + QueryClientProvider + AuthProvider
  index.css            Tailwind base styles
```

## Auth Model

Attendee auth uses JWTs issued by `good-api`.

Supported login flows:

- OTP by phone or email:
  - `POST /api/conference/otp/send`
  - `POST /api/conference/otp/verify`
- Registration code fallback:
  - `POST /api/conference/login`

Frontend storage:

- Token key: `gc_token`
- Person key: `gc_person`

Use `useAuth()` from `src/auth-context.tsx` for auth state. Do not read
`localStorage` directly from pages or components unless updating the auth helper
itself.

The Axios instance in `src/api/client.ts` attaches the Bearer token. A 401
response clears auth and redirects to `/login`.

Logout must call `useAuth().logout()` so React Query cache is cleared. This is
important because schedule, family, and signup data are attendee-specific.

## Routing

Routes:

- `/login` - public login page
- `/` - authenticated schedule
- `/my-schedule` - authenticated personal agenda
- `/my-info` - authenticated family meals/lodging page

Authenticated routes are wrapped in `Layout`, which provides the sticky header,
logout button, and bottom navigation.

## API Conventions

All API functions and API-facing TypeScript interfaces belong in
`src/api/client.ts`.

Do not call `axios` directly from pages/components. Add a typed function to one
of the exported API objects instead:

- `scheduleApi`
- `conferenceApi`
- `otpApi`
- `myApi`

Use TanStack Query for server state. Avoid ad-hoc `useEffect` + `fetch`.

Important query keys:

- `['schedule', personId]`
- `['my-signups', personId]`
- `['my-family', personId]`

For authenticated queries, prefer `enabled: !!token` over `enabled: !!personId`.
The token can be valid even if the stored person object is missing or stale.

When signup/unsignup changes, invalidate both the full schedule and personal
agenda caches:

```ts
qc.invalidateQueries({ queryKey: ['schedule', personId] })
qc.invalidateQueries({ queryKey: ['my-signups', personId] })
```

## UI Conventions

- Use Tailwind CSS utility classes.
- Keep UI bilingual: Chinese first, English second.
- Match the established card style:
  `bg-white rounded-xl border border-gray-100 border-t-[3px] border-t-blue-600 shadow-sm`
- Use `lucide-react` icons for standard UI controls.
- Keep mobile behavior first-class. This is an attendee phone app more than a
  desktop dashboard.
- Keep operational UI dense, direct, and scannable.

## Current Features

Implemented:

- OTP login by email/phone
- Registration-code login fallback
- Auth guard and logout
- Schedule with day tabs
- Session signup/unsignup with capacity display
- Share QR code modal
- My Schedule page
- My Info page showing family meals and lodging

Still planned / likely future work:

- Personal QR code for check-in and scan workflows
- Push notifications / announcements
- Better offline handling for weak venue connectivity
- Event-specific branding/content if needed

## Environment Variables

Local dev usually needs no `.env` because the Vite proxy handles `/api`.

Production build uses:

```text
VITE_API_BASE_URL=https://api.goodvessel.org/api
```

This value is set in GitHub Actions during the build.

## Deployment

Deployment is static-site only:

1. Git tag matching `v*` triggers GitHub Actions.
2. Workflow builds `dist/`.
3. Deploy job waits on the `production` environment approval gate.
4. Workflow syncs `dist/` to S3.
5. Workflow invalidates CloudFront.

GitHub Actions variables/secrets expected:

- `AWS_ACCESS_KEY_ID` secret
- `AWS_SECRET_ACCESS_KEY` secret
- `AWS_REGION` variable
- `CONFERENCE_BUCKET` variable
- `CONFERENCE_CF_ID` variable

Terraform resources live in `good-infra`; this repo deploys app files only.

## Git Workflow Rules

- Do not push directly to `main`.
- Create a feature/fix branch and open a PR for changes.
- Before committing or pushing, summarize the planned changes and wait for
  explicit user approval.
- `main` may not have enforceable branch protection in every repo/account, so
  follow these rules by discipline.
- Exception: only skip the PR if the user explicitly asks to push directly or
  says to skip the PR.

