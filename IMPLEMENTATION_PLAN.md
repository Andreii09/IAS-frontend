# Bantay Cordova — implementation plan

Status: source implementation complete and runtime-verified on this machine. Backend dependencies, database migration/seeding, `audit:verify`, all 38 PHPUnit tests (including chatbox CIA hardening, chat clearing and system-only scope enforcement), frontend install and production build all pass. The Laravel 12 backend lives at `C:\Users\Ricka\OneDrive\Desktop\backend`; the frontend and planning docs remain in `C:\Users\Ricka\OneDrive\Desktop\ias`.

## Guiding principles

1. Backend is the real security boundary. React route guards are display-only.
2. Follow the spec's build order, but fix the contradictions in `SPEC_REVIEW.md` first.
3. Keep the AI read-only and role-aware; never expose the provider key to the browser.
4. Every meaningful write answers who/what/when/where/what-changed through the audit log.

## Build order and mapping

| # | Spec build step | Files / area | Status |
|---|---|---|---|
| 0 | Review spec, resolve contradictions | `SPEC_REVIEW.md`, corrected setup docs | Done |
| 1 | Laravel project, auth, roles | `backend/bootstrap`, `backend/config`, `backend/routes`, `AuthController`, middleware, `User`, migrations, `AdminSeeder`, rate limits | Done |
| 2 | News CRUD, policies, validation, sanitising, soft deletes, revisions | `NewsController`, `NewsPolicy`, Form Requests, `HtmlSanitizer`, observers, `news*` migrations, `news:publish-scheduled` | Done |
| 3 | React screens wired to API | `frontend/src/pages`, `components`, `auth`, `api/client.js`, Tailwind v4 theme | Done |
| 4 | Audit logger, observers, `audit:verify` | `AuditLogger`, `AuditLog`, observers, `AuditVerifyCommand`, admin audit viewer + CSV export | Done |
| 5 | Admin seeder and dashboard | `AdminSeeder`, `Admin/*` controllers, admin React pages | Done |
| 6 | Sanctum tokens with abilities and manager | `TokenController`, token table, ability middleware on write routes | Done |
| 7 | AI chatbox | `ChatContextBuilder`, `GeminiClient`, `ChatController`, `ChatMessage`, `docs/system-knowledge.md`, React `ChatBox` | Done — hardened with CIA controls (`ChatResponseGuard`, `OfflineHelp`, role-aware suggestions, safe rendering); see `CHAT_CIA_TRIAD.md` |
| 8 | Rate limits, lockout, health, testing | `AppServiceProvider` limiters, `ApiInfoController`, `phpunit.xml`, `tests/`, `README.md` verification checklist | Done — 38 tests pass (177 assertions) |

## Verification checklist (completed on this machine)

From `C:\Users\Ricka\OneDrive\Desktop\backend`:

```bash
composer install
cp .env.example .env          # edit DB + ADMIN_EMAIL + GEMINI_* first
php artisan key:generate
php artisan migrate --seed
php artisan audit:verify
php artisan route:list
php artisan test
```

From `frontend/`:

```bash
npm install
npm run build
npm run dev
```

Manual checks from the spec (§15):

- [ ] Reader calling `/manage` or `/admin` endpoints gets 403.
- [ ] Editor cannot edit another editor's story (403 from `NewsPolicy`).
- [ ] Five bad logins lock the account; admin can unlock it.
- [ ] Editing a story creates a `news_revisions` row and an `audit_logs` row; tampering makes `audit:verify` fail.
- [ ] Revoked or expired token returns 401.
- [ ] Reader's chat response context contains no draft titles, user emails or audit data (verify via prompt log/test).
- [ ] Missing AI key or spent budget returns the friendly 503/429 message.
- [ ] Passwords and API keys never appear in logs or API responses.
- [ ] Audit viewer filters, CSV export and "verify chain" work.
- [ ] Plaintext Sanctum token is shown once at creation.
- [ ] `GET /api/health` returns `{status:'ok'}`.

## Known deviations from the literal spec

See `SPEC_REVIEW.md`. Most notable: Laravel 12 instead of 11, Google Gemini instead of Claude/Anthropic, `requested_role` approval flow, database queue instead of Redis, allowlist sanitizer instead of `mews/purifier`, authenticated-only chat, and shared canonical fingerprint for the audit hash chain.
