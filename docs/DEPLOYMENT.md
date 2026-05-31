# Deployment Guide — Frontend on Vercel, Backend on Render

The app is split for hosting:
- **Frontend** (React/Vite) → **Vercel** (static site).
- **Backend** (Django, Docker) + **PostgreSQL** → **Render** (via `render.yaml`).

The local `docker-compose` still runs everything together in one command; this split
is only for the live deployment.

---

## Prerequisites
- Code pushed to GitHub (see "Push to GitHub" below).
- Free accounts: [Render](https://render.com) and [Vercel](https://vercel.com),
  both connected to your GitHub.

## Push to GitHub
From the project folder on your machine:
```bash
git init
git add .
git commit -m "Ahoum sessions marketplace"
git branch -M main
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

---

## Part A — Backend + Database on Render

1. Render dashboard → **New → Blueprint** → pick your repo. Render reads `render.yaml`.
2. Click **Apply**. It creates `ahoum-db` and `ahoum-backend`.
3. Wait for the build. Note the backend URL, e.g.
   `https://ahoum-backend.onrender.com`. (It will error until OAuth is set — fine.)

Leave these for now; you'll set `FRONTEND_URL` and `CORS_ALLOWED_ORIGINS` after the
Vercel step, and the OAuth secrets after creating the OAuth apps.

---

## Part B — Frontend on Vercel

1. Vercel dashboard → **Add New → Project** → pick your repo.
2. **Root Directory:** set to `frontend`. (Vercel auto-detects Vite via `vercel.json`.)
3. **Environment Variables:** add
   `VITE_API_BASE_URL = https://ahoum-backend.onrender.com/api`
   (use your actual backend URL).
4. **Deploy.** Note the frontend URL, e.g. `https://ahoum.vercel.app`.

> If you change `VITE_API_BASE_URL` later, you must redeploy — Vite bakes it into
> the bundle at build time.

---

## Part C — Wire the two together

On **Render → ahoum-backend → Environment**, set:
- `FRONTEND_URL = https://ahoum.vercel.app`  (your Vercel URL)
- `CORS_ALLOWED_ORIGINS = https://ahoum.vercel.app`

Save — the backend redeploys.

---

## Part D — OAuth for production

Register these **redirect URIs** on your OAuth apps (you can add them next to the
local `http://localhost/...` ones on the same app):
- Google: `https://ahoum-backend.onrender.com/api/auth/google/callback`
- GitHub: `https://ahoum-backend.onrender.com/api/auth/github/callback`

Then on **Render → ahoum-backend → Environment**, set the four secrets:
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`

Save. Backend redeploys with OAuth enabled.

---

## Part E — Verify
1. Open the Vercel URL → seeded catalog loads.
2. **Sign in → Continue with Google/GitHub** → approve → land on the dashboard.
3. Become a creator → create a session → book it.

The examiner can do exactly this with **no setup** — they just visit the Vercel URL.

---

## Flow recap (who talks to whom)
```
Browser → Vercel (React)  ──API calls──▶  Render (Django + Postgres)
                          ◀─ JSON / JWT ─
OAuth: Browser → Render /api/auth/<p>/login → Google/GitHub →
       Render callback → redirect to Vercel /auth/callback (with tokens)
```

## Gotchas
- **Cold starts:** Render free services sleep after ~15 min idle; first request
  after that takes ~30–50s. Tell the examiner.
- **`redirect_uri_mismatch`:** provider callback must equal
  `BACKEND_BASE_URL` + `/api/auth/<provider>/callback` exactly.
- **CORS errors:** `CORS_ALLOWED_ORIGINS` on Render must be the exact Vercel origin
  (no trailing slash).
- **SPA refresh 404s on Vercel:** handled by the `rewrites` rule in
  `frontend/vercel.json`.
- **Admin styling:** `/admin` is unstyled in this minimal setup (works fine); add
  `whitenoise` if you want it styled.
```
