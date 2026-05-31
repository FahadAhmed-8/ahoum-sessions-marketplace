# Ahoum — Sessions Marketplace

A full-stack sessions marketplace where users sign in via OAuth (Google or GitHub),
browse a public catalog of sessions, and book them. Creators can publish and manage
their own sessions and see who booked. Built with React, Django REST Framework,
PostgreSQL, and Docker behind an Nginx reverse proxy.

The entire stack runs locally with **one command**.

## Live demo

| | URL |
|---|---|
| Frontend (app, Vercel) | _add your Vercel URL here_ |
| Backend (API, Render) | _add your Render backend URL here_ |

> Just open the frontend URL and click **Sign in** — OAuth is configured on the
> live deployment, so no setup is needed to try it.

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite, React Router, Tailwind CSS, Axios |
| Backend | Django 5 + Django REST Framework, SimpleJWT |
| Database | PostgreSQL 16 |
| Auth | OAuth 2.0 (Google / GitHub) → JWT issued by backend |
| Infra | Docker Compose: frontend, backend, db, nginx (reverse proxy) |

## Architecture

```
                    ┌─────────────────────────────┐
  Browser  ──:80──▶ │           nginx             │
                    │  / → frontend   /api → backend
                    └──────┬───────────────┬──────┘
                           │               │
                  ┌────────▼─────┐  ┌───────▼────────┐
                  │  frontend    │  │   backend      │
                  │ (React/Vite) │  │ (Django/DRF)   │
                  └──────────────┘  └───────┬────────┘
                                            │
                                    ┌───────▼────────┐
                                    │   PostgreSQL   │
                                    └────────────────┘
```

Locally, the browser only talks to Nginx on port 80. Nginx routes `/api/*`,
`/admin/`, and `/static/` to Django and everything else to the React app — a single
origin, which keeps cookies/CORS simple.

---

## Quick start (local, one command)

### 1. Prerequisites
- Docker and Docker Compose installed.

### 2. Clone
```bash
git clone <your-repo-url>
cd "Fullstack Project"
```

### 3. Configure environment
```bash
cp .env.example .env
```
Edit `.env` and set at minimum:
- `DJANGO_SECRET_KEY` — any long random string
- `POSTGRES_PASSWORD` — a strong password
- OAuth credentials for at least one provider (see below)

### 4. Run
```bash
docker-compose up --build
```
Open **http://localhost**. On first boot the backend waits for Postgres, runs
migrations, collects static files, and **seeds a demo catalog** (5 sessions from
3 creators) so the app isn't empty.

> Different port? Set `APP_PORT` in `.env` (e.g. `8080`) and update `FRONTEND_URL`,
> `BACKEND_BASE_URL`, `CORS_ALLOWED_ORIGINS`, and your OAuth redirect URIs to match.

---

## OAuth client setup

You need at least one provider. Register the redirect URIs exactly as below.

### Google
1. [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials.
2. Configure the **OAuth consent screen** (External; app name + your email).
3. **Create Credentials → OAuth client ID → Web application.**
4. Add **Authorized redirect URI**:
   - Local: `http://localhost/api/auth/google/callback`
   - Production: `https://<your-backend>.onrender.com/api/auth/google/callback`
5. Copy the Client ID + Secret into `.env` (local) or the Render dashboard (prod).

### GitHub
1. GitHub → Settings → Developer settings → **OAuth Apps → New OAuth App**.
2. **Authorization callback URL**:
   - Local: `http://localhost/api/auth/github/callback`
   - Production: `https://<your-backend>.onrender.com/api/auth/github/callback`
3. Copy the Client ID + generated Secret into `.env` (local) or Render (prod).

> You can add both the local and production callback URLs to the same OAuth app,
> so one set of credentials works in both places. A provider left blank simply
> returns an error when its button is clicked — configure whichever you want to demo.

---

## Example demo flow

1. **Browse (no login):** open the app — the catalog of active sessions is public.
2. **Log in:** *Sign in* → *Continue with Google/GitHub* → approve → you land on
   your dashboard. New accounts start with the **user** role.
3. **Become a creator:** dashboard sidebar (or avatar menu) → *Become a Creator*
   (`POST /api/me/become-creator`).
4. **Create a session:** Creator Dashboard → *New Session* → fill in details → create.
5. **Book a session:** open a session from the catalog → *Book Now* → *Confirm Booking*.
6. **Manage:** see it under *My Bookings* (upcoming/past), cancel and re-book freely.
   As a creator, view who booked under *Bookings Overview*.

---

## Deployment (Vercel + Render)

The live app is split for hosting: the **frontend** runs on **Vercel** (static Vite
build, see `frontend/vercel.json`) and the **backend + PostgreSQL** run on **Render**
(via the `render.yaml` blueprint). The local `docker-compose` still runs everything
together in one command. Step-by-step instructions — including the production OAuth
redirect URIs — are in [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

---

## API overview

Base path `/api`. Auth via `Authorization: Bearer <access>`.

| Method | Endpoint | Auth | Notes |
|--------|----------|------|-------|
| GET | `/auth/<provider>/login` | – | Start OAuth (google/github) |
| GET | `/auth/<provider>/callback` | – | OAuth return → issues JWT, redirects to frontend |
| POST | `/auth/refresh` | – | Exchange refresh for new access |
| POST | `/auth/logout` | ✓ | Blacklist refresh token |
| GET / PATCH | `/me` | ✓ | Get / update profile (email & role read-only) |
| POST | `/me/become-creator` | ✓ | Upgrade role to creator |
| GET | `/sessions` | – | Public catalog (`?search=&ordering=&price=`) |
| GET | `/sessions/:id` | – | Session detail |
| POST | `/sessions` | creator | Create |
| PATCH / DELETE | `/sessions/:id` | owner | Edit / delete own |
| GET | `/sessions/mine` | creator | Creator's own sessions |
| GET | `/sessions/:id/bookings` | owner | Who booked this session |
| POST | `/bookings` | ✓ | Book a session |
| GET | `/bookings/mine` | ✓ | My bookings (`?status=upcoming\|past`) |
| PATCH | `/bookings/:id/cancel` | owner | Cancel a booking |

Status codes: `401` not authenticated, `403` wrong role / not owner, `409`
double-booking or session full.

---

## Design decisions

- **Custom user model from day one.** `AUTH_USER_MODEL` is set before the first
  migration. Accounts are matched on `(oauth_provider, provider_uid)` — not email —
  because GitHub users may hide their email. Email is stored but nullable.
- **Roles.** Everyone signs up as a `user`; becoming a `creator` is an explicit,
  protected action. Any authenticated user can **book**; the creator role only
  unlocks session create/edit/delete. Non-creators hitting a creator endpoint get `403`.
- **No double-booking, no overbooking.** A partial unique constraint
  (`unique(user, session) where status='confirmed'`) prevents duplicate active
  bookings while allowing re-booking after cancellation. Capacity is enforced inside
  a transaction with `select_for_update()` to prevent races.
- **Upcoming vs past** is derived from `start_time + duration`, not a stored status.

## Bonus features

- **Rate limiting** on auth and booking endpoints (DRF scoped throttles,
  configurable via `THROTTLE_AUTH` / `THROTTLE_BOOKING`).

Not implemented (optional extra credit): payment gateway, MinIO/S3 uploads.

---

## Project structure

```
.
├── docker-compose.yml      # 4 services, one-command local boot
├── render.yaml             # Render blueprint (backend + db)
├── .env.example            # all required env vars (placeholders)
├── backend/                # Django + DRF (accounts, catalog, bookings)
├── frontend/               # React + Vite + Tailwind (vercel.json for Vercel)
├── nginx/                  # reverse proxy config
└── docs/
    └── DEPLOYMENT.md       # Vercel + Render deployment guide
```

## Local development (without Docker)

```bash
# Backend
cd backend && pip install -r requirements.txt
python manage.py migrate && python manage.py seed && python manage.py runserver

# Frontend (new terminal)
cd frontend && npm install
VITE_API_BASE_URL=http://localhost:8000/api npm run dev
```
