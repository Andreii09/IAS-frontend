# Bantay Cordova — React frontend

White + ocean-blue community news platform built with React 18, Vite, React Router,
axios and **Tailwind CSS v4**.

## Run locally

```bash
cd frontend
npm install
npm run dev
```

Vite prints the local URL (by default <http://localhost:5173>).

The **Laravel backend must be running on <http://localhost:8000>**. The Vite dev server
proxies two path prefixes to it:

| Frontend request | Proxied to |
| --- | --- |
| `/api/...` | `http://localhost:8000/api/...` |
| `/sanctum/...` | `http://localhost:8000/sanctum/...` |

This means the browser only ever talks to the Vite origin. Same-origin cookies
(Sanctum SPA authentication) therefore work without CORS configuration.

**No environment variables are needed.** The API base URL is `/api` and the CSRF
cookie endpoint is `/sanctum/csrf-cookie`; both are relative to the Vite origin and
resolved by the proxy. Do not put an API URL in `.env`.

Authentication is cookie-based: every state-changing request first calls
`GET /sanctum/csrf-cookie`, and axios is configured with `withCredentials: true`.
No tokens are stored in `localStorage`. The chat session id lives in
`sessionStorage` only.

## Build

```bash
npm run build
npm run preview
```

## Production deployment

The production image uses Nginx instead of the Vite dev proxy, but keeps the
same one-origin behaviour: `/api` and `/sanctum` are proxied to the Laravel
backend. Set `API_ORIGIN` to the backend origin (no trailing slash).

```powershell
docker build -t bantay-cordova-frontend .
docker run --rm -e API_ORIGIN=https://api.example.com -p 5173:80 bantay-cordova-frontend
```

A `render.yaml` blueprint and full instructions are in `DEPLOYMENT.md`.
Deploy the backend first: `https://github.com/Andreii09/IAS-backend`.

## Project structure

```
src/
  api/client.js          axios instance, CSRF handling, interceptors, CSV helper
  auth/                  AuthContext, ProtectedRoute
  components/            Layout, Header, Sidebar, Footer, ChatBox, UI primitives
  lib/format.js          date/text/label/status helpers
  pages/                 public pages, story editor, auth pages
  pages/admin/           admin pages (users, tokens, audit, AI usage, security, content)
  App.jsx                route table
  main.jsx               app bootstrap
  index.css              Tailwind v4 entry + ocean theme tokens
```

## Roles

- **Guests** read published public news and see a sign-in prompt in the assistant.
- **Readers** may use the AI assistant.
- **Editors** create and manage only their own stories.
- **Admins** manage users, personal access tokens, the audit log, AI usage/budget,
  security and deleted content.

Editor registration is a request: a newly registered editor still requires admin
approval before editor routes are available.
