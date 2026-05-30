# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Real-time garbage container management system for residential communities. Residents report container status via mobile app; administrators monitor operations via a web dashboard. Privacy-first: no real personal data is stored — alias-based identification only, and reports auto-delete after 30 days.

## Repository Structure

Three independent sub-projects:

- **`backend/`** — FastAPI REST API (Python 3.11, SQLite via SQLAlchemy)
- **`dashboard/`** — Admin/researcher web dashboard (React 19 + TypeScript + Vite)
- **`mobile/`** — Resident mobile-web app (React + TypeScript + Vite, served as a web app)

## Commands

### Backend

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env          # set JWT_SECRET before running
alembic upgrade head            # apply DB migrations
python seed.py                  # create admin user + 10 access codes + 3 schedules
uvicorn app.main:app --reload   # http://localhost:8000
```

Interactive API docs: `http://localhost:8000/docs`

Run a migration: `alembic revision --autogenerate -m "description"`

### Dashboard

```powershell
cd dashboard
npm install
npm run dev      # http://localhost:5173 (proxies /api → localhost:8000)
npm run build
npm run lint
```

### Mobile

```powershell
cd mobile
npm install
npm run dev      # http://localhost:5174
npm run build
```

Neither frontend has a test suite yet. Linting uses ESLint (flat config).

## Architecture

### Backend (`backend/app/`)

- **`main.py`** — Creates the FastAPI app, mounts all routers under `/api/v1/`, and starts the APScheduler background jobs.
- **`config.py`** — Reads `JWT_SECRET` and `PORT` from the `.env` file.
- **`database.py`** — SQLAlchemy engine + session factory (SQLite at `db/gestion.db`).
- **`dependencies.py`** — `get_current_user` / `require_role()` FastAPI dependencies for route guards.
- **`models/`** — SQLAlchemy ORM models: `User`, `Report`, `AccessCode`, `Schedule`, `NotifPref`.
- **`routers/`** — One file per resource group: `auth`, `reports`, `codes`, `schedules`, `stats`, `notifications`, `export`, `privacy`.
- **`services/`** — `auth_service` (JWT encode/decode, code validation), `push_service` (Expo push SDK), `cleanup_service`.
- **`jobs/cleanup_job.py`** — APScheduler jobs: daily 2 AM cleanup of expired reports, Friday 10 AM weekly tip push, per-schedule truck reminders 30 min before pickup.

### Data Model Key Points

- **User** registration is invitation-only via 8-char `AccessCode`. No email/phone stored.
- **Report** statuses: `EMPTY | HALF | FULL | OVERFLOW`. Each report has `expires_at = created_at + 30 days`; cleanup job deletes expired rows.
- **AccessCode** statuses: `ACTIVE → USED` on registration; admin can `SUSPEND` or `REVOKE`.
- **NotifPref** — 6 boolean push notification preferences per user (PUSH01–PUSH06).

### Role-Based Access

Four roles enforced via `require_role()` dependency:

| Role | Access |
|------|--------|
| `RESIDENT` | Submit/view own reports, view schedules, manage push prefs |
| `ADMIN` | Everything + manage codes/schedules, send admin push notifications |
| `RESEARCHER` | Stats, logs, export (read-only analytics) |
| `VIEWER` | Read-only dashboard |

### Push Notifications

- Uses **Expo Server SDK** (`exponent-server-sdk`). Tokens are registered per user via `POST /api/v1/notifications/register-token`.
- PUSH01 = truck reminder, PUSH02 = full alert, PUSH03 = overflow alert, PUSH04 = collection confirmed, PUSH05 = schedule change, PUSH06 = weekly tip.

### Frontend Architecture (dashboard & mobile)

Both frontends share the same pattern:
- **`src/api/client.ts`** — Axios instance with base URL + `Authorization: Bearer <token>` interceptor.
- **`src/auth/AuthContext.tsx`** — React context holding `token` + `role`; reads from `localStorage`.
- **`src/auth/PrivateRoute.tsx`** — Role-based route guard.
- **`src/pages/`** — One component per route.

Dashboard `vite.config.ts` proxies `/api` → `http://localhost:8000`, so no CORS issues in dev.

The mobile app is a **Vite web app**, not a native React Native / Expo app — it runs in a mobile browser.

## Environment

Backend requires a `.env` file (see `.env.example`):

```
JWT_SECRET=your-secret-here
PORT=8000
```

Default seed credentials (created by `seed.py`):
- Admin alias: `admin` / code: `ADMIN0001`
- 10 resident access codes printed to console on first run
