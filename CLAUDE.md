# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**good-conference** is the attendee-facing portal for the Good Camp conference platform. A React + Vite + TypeScript app that lets registered attendees view the conference schedule, sign up for sessions, check meal status, scan in with their QR badge, and manage their personal agenda.

This repo is **frontend only** — it has no backend of its own. All data comes from the Spring Boot API in the `good-api` repo.

---

## Ecosystem Context

```
good-api/           ← Backend API + Admin UI  (platform core)
good-conference/    ← THIS REPO  (attendee portal)
good-register/      ← Public registration page  (planned)
good-scan/          ← Volunteer scan app  (in progress)
```

**The good-api backend is the single source of truth.** Never add a database or server-side logic here.

---

## Common Commands

```powershell
# Install dependencies
npm install

# Start dev server (proxies /api → localhost:8090)
npm run dev        # → http://localhost:5173

# Production build
npm run build      # tsc + vite build → dist/

# Preview production build locally
npm run preview
```

The good-api backend must be running for API calls to work:

```powershell
# In the good-api directory
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

In production the app is built to static files served from a CDN or nginx. The `/api` prefix routes to the good-api backend via nginx reverse proxy.

### Project Structure

```
src/
├── api/
│   └── client.ts          Axios instance + all TypeScript types + API functions
├── auth.ts                StoredPerson type, getToken/clearAuth helpers
├── auth-context.tsx        AuthContext + useAuth hook
├── components/
│   ├── Layout.tsx          5-tab bottom nav, header, theme toggle
│   ├── SessionCard.tsx     Reusable session card (time column layout)
│   └── ShareModal.tsx      Share URL modal
├── pages/
│   ├── Dashboard.tsx       Home (/) — badge card, today meals, today sessions
│   ├── Schedule.tsx        /schedule — all sessions, day tabs, signup
│   ├── MySchedule.tsx      /my-schedule — signed-up sessions grouped by day
│   ├── MyQR.tsx            /my-qr — QR code card + full-screen badge mode + meal plan
│   ├── MyInfo.tsx          /my-info — family member cards with meals + lodging
│   └── Login.tsx           /login — OTP + registration-code auth
├── App.tsx                Root component + route definitions
├── main.tsx               React entry point + QueryClientProvider
└── index.css              Tailwind base + CSS custom property theme tokens
```

### Routes

| Path | Page | Auth |
|---|---|---|
| `/login` | Login | Public |
| `/` | Dashboard | Required |
| `/schedule` | Schedule | Required |
| `/my-schedule` | MySchedule | Required |
| `/my-qr` | MyQR | Required |
| `/my-info` | MyInfo | Required |

### Key Conventions

- **API calls:** All in `src/api/client.ts`. Use `scheduleApi`, `myApi`, `otpApi`, etc. — never call `axios` directly from pages.
- **Data fetching:** TanStack Query (React Query v5) everywhere. No `useEffect` + `fetch`.
- **Types:** Define TypeScript interfaces in `client.ts` alongside their API functions.
- **Auth:** JWT stored in `localStorage` as `gc_token`. Person object stored as `gc_person`. Axios interceptor adds `Authorization: Bearer` header. 401 responses redirect to `/login`.
- **QR value:** Use `person.uid` if set, otherwise fall back to `String(person.id)` — this matches `good-scan`'s own lookup logic exactly.

### Design System

The app uses a **dark-first CSS custom property** theming system.

**Tokens defined in `src/index.css`:**

```css
:root {                          /* dark (default) */
  --bg, --surface, --surface2    /* backgrounds */
  --border, --border2            /* dividers */
  --accent, --accent-dim         /* vermillion #C8341A */
  --gold, --gold-dim             /* gold #EFA020 */
  --green, --green-dim           /* green #22C55E */
  --amber                        /* amber #F59E0B */
  --text, --text-mid, --text-dim /* foregrounds */
  --nav                          /* bottom nav / header bg */
}
```

**Three-state theme:**
- Bare `:root` = dark (default)
- `@media (prefers-color-scheme: light) :root:not([data-theme="dark"])` = system light
- `:root[data-theme="light"]` / `:root[data-theme="dark"]` = explicit toggle (persisted to `localStorage` as `gc_theme`)

**Rules:**
- Always style with `style={{ color: 'var(--text)' }}` inline styles or Tailwind arbitrary values — never hardcode `text-gray-900` or `bg-white` for themed elements.
- The QR code and full-screen badge are always white-background (for scanner contrast) — this is intentional, not a theming omission.
- Tailwind color tokens `navy`, `vermillion`, `gold` are defined in `tailwind.config.js` for use in class names when needed.

### Vite Proxy Config

`vite.config.ts` proxies `/api` to `http://localhost:8090` in dev.

---

## Features — Status

| Feature | Status | Notes |
|---|---|---|
| OTP + reg-code login | ✅ Done | `/login` page, JWT in localStorage |
| Schedule with day tabs + signup | ✅ Done | `/schedule` |
| Personal agenda | ✅ Done | `/my-schedule` |
| Personal QR code | ✅ Done | `/my-qr`, uses `uid` fallback to `id` |
| Full-screen badge mode | ✅ Done | Overlay in MyQR + Dashboard, Screen Wake Lock API |
| Meal status view | ✅ Done | Via `GET /api/conference/my/family` |
| Family + lodging info | ✅ Done | `/my-info` |
| Bold & festive redesign | ✅ Done | Dark-first, CSS custom properties, 5-tab nav |

---

## To-Do — Hotel-Grade Improvements (Priority Order)

These are the next features to build, ranked by guest impact on conference day.

### Critical (ship before conference)

| Feature | Effort | Notes |
|---|---|---|
| **Offline mode** | Medium | Cache schedule + family data in `localStorage` on first load. Show stale banner, never blank screen. QR must render offline (already from `localStorage`). |
| **Venue map** | Easy | Static floor-plan image per hotel. Tap session → "Get Directions" highlights the room. Even a PNG is enough. |
| **Meal table assignment** | Medium | Show "Day 2 Dinner · Grand Ballroom A · Table 34" on Dashboard. Needs backend to add `tableNumber` + `roomName` to family API response. |
| **Live announcements feed** | Medium | New tab in nav for organizer push messages. "Room B is now Salon 3." Needs a `GET /api/conference/announcements` endpoint + push notification. |
| **"Next up" countdown** | Easy | Dashboard widget: your next signed-up session, room, minutes remaining. Pure frontend using existing session data. |

### High Value

| Feature | Effort | Notes |
|---|---|---|
| **Session conflict detection** | Easy | When signing up, warn if another signed-up session overlaps in time. Frontend-only. |
| **Live capacity urgency** | Easy | "3 spots left" in amber when ≥80% full. "Full — join waitlist?" at 100%. Frontend-only on existing data. |
| **Calendar export (.ics)** | Easy | "Export My Schedule" button generates `.ics` from signed-up sessions. Frontend-only. |
| **One-tap session rating** | Medium | Push notification 15 min after session ends → star rating half-sheet. Needs backend `POST /api/schedule/:id/rating`. |
| **Speaker bios** | Medium | Tap speaker name → bottom sheet with photo + bio. Needs `speakers` table in backend. |
| **Check-in confirmation push** | Medium | When good-scan scans a QR, push "You're checked in · 歡迎！" back to the attendee's device. Needs FCM integration. |

### Nice to Have

| Feature | Effort | Notes |
|---|---|---|
| **Full language toggle (zh/en)** | Medium | A `lang` context wrapping the app. Session content already has `titleEng` / `descriptionEng` fields. |
| **Hotel essentials card** | Easy | WiFi password, concierge number, shuttle times pinned to Dashboard. Static data from organizer config. |
| **Social proof on capacity** | Easy | Rename "12 / 50" → "12 attending" with avatar-circle row. No backend change. |
| **Push notifications (FCM)** | Hard | Firebase Cloud Messaging for schedule-change alerts. |

---

## Environment Variables

No `.env` required for local dev — the Vite proxy handles the backend URL.

For production builds, set:

```
VITE_API_BASE_URL=https://yourdomain.com/api
```

Then update `src/api/client.ts` to read `import.meta.env.VITE_API_BASE_URL`.
