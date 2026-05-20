# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**good-conference** is the attendee-facing portal for the Good Camp conference platform. It is a lightweight React + Vite + TypeScript app that lets registered attendees view the conference schedule, sign up for sessions, check their meal and room status, and manage their personal agenda.

This repo is **frontend only** — it has no backend of its own. All data comes from the Spring Boot API in the `good-camp` repo.

---

## Ecosystem Context

This is one of four repos in the platform. See `good-camp/CLAUDE.md` for the full ecosystem architecture.

```
good-camp/          ← Backend API + Admin UI  (platform core)
good-conference/    ← THIS REPO  (attendee portal)
good-register/      ← Public registration page  (planned)
good-scan/          ← Volunteer scan app  (planned)
```

**The good-camp backend is the single source of truth.** Never add a database or server-side logic here — keep this app purely a consumer of the API.

---

## Common Commands

```powershell
# Install dependencies
cd C:\Users\CHoo1\Projects\good-conference
npm install

# Start dev server (proxies /api → localhost:8090)
npm run dev        # → http://localhost:5173

# Production build
npm run build      # tsc + vite build → dist/

# Preview production build locally
npm run preview
```

The good-camp backend must be running for API calls to work:

```powershell
# In the good-camp directory
docker compose up -d
```

---

## Architecture

### Request Flow

```
Browser (localhost:5173)
  → Vite dev proxy /api → localhost:8090 (Spring Boot)
  → MariaDB
```

In production the app is built to static files and served from a CDN or nginx. The `/api` prefix routes to the good-camp backend via nginx reverse proxy.

### Project Structure

```
src/
├── api/
│   └── client.ts        Axios instance + all TypeScript types + API functions
├── components/
│   └── SessionCard.tsx   Reusable session display card
├── pages/
│   └── Schedule.tsx      Main schedule page — day tabs, time-slot grouping, signup
├── App.tsx               Root component (add new pages/routes here)
├── main.tsx              React entry point + QueryClientProvider
└── index.css             Tailwind base styles
```

### Key Conventions

- **API calls:** All in `src/api/client.ts`. Use `scheduleApi`, etc. — never call `axios` directly from pages.
- **Data fetching:** TanStack Query (React Query v5) everywhere. No `useEffect` + `fetch`.
- **Types:** Define TypeScript interfaces in `client.ts` alongside their API functions.
- **Styling:** Tailwind CSS utility classes. Match the card style from `good-camp` admin UI: `bg-white rounded-xl border border-gray-100 border-t-[3px] border-t-blue-600 shadow-sm`.
- **UI language:** Chinese first, then English for all bilingual labels (e.g., `报名 Sign Up`).
- **No auth yet:** The schedule page is public. When user-specific features (meal status, room assignment) are added, use JWT stored in `localStorage` with an Axios request interceptor — follow the same pattern as `good-camp/frontend/src/api/client.ts`.

### Vite Proxy Config

`vite.config.ts` proxies `/api` to `http://localhost:8090` in dev. In production, the build is static and the hosting nginx handles the `/api` route. If the backend runs on a different port locally, update `vite.config.ts`.

---

## Planned Features

These are the next features to build in this repo, in priority order:

| Feature | API endpoint | Notes |
|---|---|---|
| Day-tab schedule with session signup | `GET /api/schedule` | Done |
| Personal agenda ("My Schedule") | `GET /api/schedule/my-signups` | Requires auth |
| Meal status view | `GET /api/meals/my` | Requires auth |
| Room assignment display | `GET /api/lodging/my` | Requires auth |
| Personal QR code | `GET /api/persons/me/qr` | Used for meal/session scanning |
| Push notifications | Firebase FCM | Schedule change alerts |
| Auth login page | `POST /api/auth/login` | Attendee login |

---

## Environment Variables

No `.env` required for local dev — the Vite proxy handles the backend URL.

For production builds, set:

```
VITE_API_BASE_URL=https://yourdomain.com/api
```

Then update `src/api/client.ts` to read `import.meta.env.VITE_API_BASE_URL`.
