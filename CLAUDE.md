# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Real-time garbage container management system for residential communities. Residents report container status via a mobile web app; administrators monitor operations from the same app under a separate role-based layout. Privacy-first: no real personal data is stored — alias-based identification only, and reports auto-delete after 30 days.

## Repository Structure

Two independent sub-projects:

- **`backend/`** — FastAPI REST API (Python 3.11, SQLite via SQLAlchemy)
- **`mobile/`** — Single React + TypeScript + Vite app that serves **both** resident and admin UIs, switching layouts based on the authenticated user's role. Runs in a mobile browser (not React Native / Expo).

There is no separate `dashboard/` directory.

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

Run tests (60% coverage enforced):

```powershell
pytest                          # all tests
pytest tests/test_auth.py       # single module
pytest --cov=app --cov-report=term-missing
```

Tests use an in-memory SQLite DB (`conftest.py`) and mock APScheduler so jobs don't fire.

### Mobile

```powershell
cd mobile
npm install
npm run dev      # http://localhost:5174 (proxies /api → localhost:8000)
npm run build    # tsc -b + vite build
```

No test suite. No ESLint config currently in place despite the CLAUDE.md previously stating otherwise.

## Architecture

### Backend (`backend/app/`)

- **`main.py`** — Creates the FastAPI app, mounts all routers under `/api/v1/`, starts APScheduler jobs in the lifespan context.
- **`config.py`** — Reads `JWT_SECRET` and `PORT` from `.env` via pydantic-settings.
- **`database.py`** — SQLAlchemy engine + session factory (SQLite at `db/gestion.db`).
- **`dependencies.py`** — `get_current_user` extracts JWT, updates `last_seen`; `require_roles(*roles)` wraps it for route guards.
- **`models/`** — SQLAlchemy ORM models: `User`, `Report`, `AccessCode`, `Schedule`, `NotifPref`.
- **`routers/`** — One file per resource group: `auth`, `reports`, `codes`, `schedules`, `stats`, `notifications`, `export`, `privacy`.
- **`services/`** — `auth_service` (JWT encode/decode, 7-day expiry, code validation), `push_service` (Expo SDK batch sends), `cleanup_service`.
- **`jobs/cleanup_job.py`** — APScheduler jobs: daily 2 AM expired-report cleanup, Friday 10 AM weekly tip push, per-schedule truck reminders 30 min before pickup.

**Request validation inconsistency**: `reports` and `schedules` routers accept plain dicts (no Pydantic schema); only `auth` and `notifications` use Pydantic request bodies. New routes should use Pydantic schemas.

### Data Model Key Points

- **User** registration is invitation-only via 8-char `AccessCode`. No email/phone stored.
- **Report** statuses: `EMPTY | HALF | FULL | OVERFLOW`. Each report has `expires_at = created_at + 30 days`; cleanup job deletes expired rows.
- **AccessCode** statuses: `ACTIVE → USED` on registration; admin can `SUSPEND` or `REVOKE`.
- **NotifPref** — 6 boolean push notification preferences per user (PUSH01–PUSH06).

### Role-Based Access

Four roles enforced via `require_roles()` dependency:

| Role | Access |
|------|--------|
| `RESIDENT` | Submit/view own reports, view schedules, manage push prefs |
| `ADMIN` | Everything + manage codes/schedules, send admin push notifications |
| `RESEARCHER` | Stats, logs, export (read-only analytics) |
| `VIEWER` | Read-only dashboard |

### Push Notifications

- Uses **Expo Server SDK** (`exponent-server-sdk`), sending in 100-token batches.
- Sends only between **6 AM–9:30 PM** and skips users inactive >14 days (except PUSH01/PUSH03).
- PUSH01 = truck reminder, PUSH02 = full alert, PUSH03 = overflow alert (always-on, `SettingsPage` locks toggle), PUSH04 = collection confirmed, PUSH05 = schedule change, PUSH06 = weekly tip.
- Alert triggers: OVERFLOW → instant push; FULL → push only if 3+ FULL reports in the last hour.

### Mobile Frontend (`mobile/src/`)

**Single app, two layouts** — the app renders `ResidentLayout` or `AdminLayout` based on `user.role` after login.

- **`api/client.ts`** — Axios instance at `/api/v1` with `Authorization: Bearer <token>` interceptor. On 401 it dispatches `window.dispatchEvent(new Event('auth:logout'))` for global logout handling.
- **`auth/AuthContext.tsx`** — `login(alias, code)` calls `POST /auth/login` first; if that fails it falls back to `POST /auth/register`. Token stored under key `mb_jwt`, user under `mb_user` in `localStorage`. No refresh-token mechanism — token expires after 7 days.
- **`auth/PrivateRoute.tsx`** — Role-based route guard; root `/` redirects to `/dashboard` for admins.

**Layouts:**
- **`ResidentLayout`** — Dark sidebar (desktop) + bottom tab bar (mobile), 4 resident tabs.
- **`AdminLayout`** — White sidebar (desktop) + top scroll nav (mobile), 5 admin tabs + "← Vista residente" toggle.

**Design system** — Tailwind CSS v4 via `@import "tailwindcss"` in `index.css`. Custom status colors use `@theme` CSS variables (`status-empty`, `status-half`, `status-full`, `status-overflow`, `brand`). Component classes (`.btn`, `.card`, `.field-*`, `.data-table`, etc.) are defined in `@layer components`. Add new status-themed styles there, not as arbitrary Tailwind classes.

**Polling** — `HomePage` polls current container status every 30 s; `AdminDashboardPage` polls KPIs every 60 s.

**Cleanup log** — `LogsPage` fetches `GET /api/v1/stats/logs` and parses pipe-delimited entries (`timestamp|DELETED:n|STATUS:…|MSG:…`) written by the backend to `logs/cleanup.log`. If the log format changes in the backend, the frontend parser must match.

### Scheduler Behavior

Adding or editing a `Schedule` row via the API does **not** automatically register new APScheduler jobs — the per-schedule truck-reminder job is built from the current `schedules` table at startup. Changing schedules via `/api/v1/schedules` triggers a backend re-registration call in `schedules` router; restart is required if jobs were added outside the API.

## Environment

Backend requires a `.env` file (see `.env.example`):

```
JWT_SECRET=your-secret-here
PORT=8000
```

Default seed credentials (created by `seed.py`):
- Admin alias: `admin` / code: `ADMIN0001`
- 10 resident access codes printed to console on first run
