# Deploying the Bantay Cordova frontend

This React/Vite SPA is served by Nginx. The same Nginx process proxies `/api` and `/sanctum` to the Laravel backend, so the browser only ever talks to one origin and Sanctum cookie auth works without CORS changes.

Backend deployment files are in the separate repo: `https://github.com/Andreii09/IAS-backend`.

## What is included

- `Dockerfile` — multi-stage Vite build + Nginx runtime
- `docker/nginx.conf.template` — React Router fallback and API/Sanctum reverse proxy
- `docker/entrypoint.sh` — renders the Nginx config from `PORT` and `API_ORIGIN`
- `render.yaml` — Render blueprint for the web service
- `.dockerignore` — keeps `node_modules/`, `dist/` and `.env` out of the image

## Deploy to Render

1. Deploy the backend first and copy its public URL (e.g. `https://bantay-cordova-api.onrender.com`).
2. Push this repo to GitHub.
3. In Render, choose **Blueprint → New Blueprint Instance** and select this repository.
4. Set `API_ORIGIN` to the backend URL **without a trailing slash**.
5. Deploy, then open the frontend URL. Check `/api/health` through the frontend proxy to confirm the connection.

## Required backend settings

The backend must know the **frontend hostname** (not the backend hostname) for Sanctum:

```env
APP_URL=https://<your-frontend-host>
FRONTEND_URL=https://<your-frontend-host>
SESSION_DOMAIN=<your-frontend-host>
SANCTUM_STATEFUL_DOMAINS=<your-frontend-host>
SESSION_SECURE_COOKIE=true
```

Use bare hostnames — no `https://` and no port in `SESSION_DOMAIN` / `SANCTUM_STATEFUL_DOMAINS`. If the frontend and backend are on different subdomains of the same site, use `SESSION_DOMAIN=.example.com` and list both hostnames in `SANCTUM_STATEFUL_DOMAINS`.

## Local Docker test

```powershell
docker build -t bantay-cordova-frontend .
docker run --rm -e API_ORIGIN=http://host.docker.internal:8000 -p 5173:80 bantay-cordova-frontend
```

Open <http://localhost:5173>. The container's Nginx forwards `/api` and `/sanctum` to your local Laravel server.

## No frontend secrets

The API base URL stays relative (`/api`) in the source. The only deployment value is `API_ORIGIN`, used by the proxy. Never put the Gemini key or database URL in a frontend environment variable.
