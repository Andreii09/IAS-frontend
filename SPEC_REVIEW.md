# Bantay Cordova — specification review

Review of `Bantay_Cordova_Project_Specification_XAMPP.md`. The spec is a good blueprint (clear screens, roles, CIA model and API map), but it contains contradictions and starter-code gaps that were corrected during implementation. Findings are ordered by impact.

## Blocking contradictions / broken instructions

| # | Location | Finding | Resolution in this implementation |
|---|---|---|---|
| 1 | § "Local Development Environment (XAMPP)" | "The project will use **XAMPP instead of XAMPP** because XAMPP cannot be installed on the development laptop." The sentence is self-contradictory; it looks like an automated replacement of "Docker" with "XAMPP". | Chose the XAMPP-style local stack described by the spec (Apache/MySQL from XAMPP Control Panel, `php artisan serve`, Vite on :5173). The wording in the spec should be fixed to say what is actually installed. |
| 2 | §13 Setup | `XAMPP exec app composer require ...`, `XAMPP exec frontend npm install ...` are mangled `docker compose exec ...` commands and will not run. | Replaced with plain `composer` / `npm` commands in `README.md`. |
| 3 | Environment | The development machine has PHP, Composer and Node installed but not on `PATH`, and XAMPP was added later. | Used full executable paths (or a prepended `PATH`). Backend dependencies, database migration/seeding, `audit:verify`, all 16 PHPUnit tests, frontend `npm install` and `npm run build` now run successfully. |

## Security / correctness gaps in the starter snippets

| # | Finding | Resolution |
|---|---|---|
| 4 | `AdminSeeder` uses `env()` directly. `env()` returns `null` once `php artisan config:cache` is used, so seeding breaks in a cached deployment. | Added `backend/config/admin.php`; seeder reads `config('admin.*')`. |
| 5 | Re-running `migrate --seed` re-hashes and overwrites the admin password even after the forced first-login change. | Seeder only sets the password when creating the admin (or when `ADMIN_PASSWORD` is explicitly set for a reset). |
| 6 | Screen 7 lets a visitor register as `editor`, which contradicts the role table ("only admin manages users and roles") and is a privilege-escalation path. | Added a `requested_role` column; self-registration always creates a `reader`. An admin promotes the account from `/admin/users`. |
| 7 | Audit hash chain: `hash('sha256', $prev . json_encode($row))` serialises a Carbon `created_at` object and relies on array key order. Verification can silently disagree with recording. | Both recording and `audit:verify` now use one shared `AuditLogger::fingerprint()` with fixed field order and string timestamps. |
| 8 | "AuditLog has no update or delete methods" is not sufficient — Eloquent/query builder can still mutate rows. | Model-level guard added **and** `README.md` documents the required DB-user `SELECT/INSERT`-only grant on `audit_logs` for production. |
| 9 | The chat controller persists messages only after a successful provider call, so failed/flagged attempts leave no accountability trail. | Failed attempts are stored (masked) and flagged; `ai.chat.flagged` is audit-logged. |
| 10 | PII masking happens **after** the user text is sent to the AI provider. This matches the spec but means unmasked values still leave the server. | Kept as specified, but documented in the README as a privacy consideration requiring user disclosure/consent before real resident data is used. Google's free tier may also use prompts to improve products, so it is unsuitable for confidential resident data. |
| 11 | `throttle:login` and `throttle:chat` are referenced by the route snippet but never defined. | Defined in `AppServiceProvider::boot()` (login 5/min by IP+email, chat 20/min by user, api 60/min). |
| 12 | Laravel's built-in `health: '/up'` gives `/up`, not the spec's `GET /api/health`. | Explicit `/api/health` route added. |
| 13 | `status = scheduled` has no mechanism that actually publishes a story. | Added `php artisan news:publish-scheduled` plus cron instructions. |
| 14 | `visibility = residents` is never defined. | Defined as "any authenticated user"; anonymous visitors get 404 for residents-only stories. |
| 15 | Password-reset email would link to the backend by default, but the reset form lives in React. | Custom `ResetPasswordNotification` builds `{FRONTEND_URL}/reset-password/{token}?email=...`. |
| 16 | Redis queues are specified, but XAMPP has no Redis service. | Default `QUEUE_CONNECTION=database` with a jobs table; Redis remains an optional production upgrade. |
| 17 | `mews/purifier` is suggested "for example". Adding it increases dependency/version risk for a hand-built skeleton. | Replaced with a small allowlist `HtmlSanitizer` service (DOMDocument). Still blocks stored XSS; documented as a deliberate deviation. |
| 18 | Chatbox is described as "Everyone", but the controller requires `auth:sanctum`, and anonymous context is undefined. | Chose the spec's explicit alternative: widget is visible to all, signed-in users can chat, guests see a sign-in prompt. |
| 19 | SPA CSRF details are missing from the setup notes. | Documented `GET /sanctum/csrf-cookie`, `withCredentials`, `SANCTUM_STATEFUL_DOMAINS=localhost:5173`, `SESSION_DOMAIN=localhost`, Vite proxy. |
| 20 | Laravel does not guarantee the `ability` middleware alias exists in a fresh `bootstrap/app.php`. | Alias must be registered explicitly (see integration checklist in `README.md`). |
| 21 | Section numbering jumps from 11 to 13; no section 12. | Cosmetic only; no code impact. |
| 22 | "Add two-factor authentication and email verification before launch" is listed as a next step, yet the launch checklist assumes production readiness. | Kept as an explicit pre-launch gap in `README.md`. |
| 23 | Spec requires Laravel 11, but Composer now blocks all Laravel 11 releases because they are affected by security advisories (11.x is end-of-life). | Upgraded the backend to Laravel 12 (`^12.73.0` locked) with user approval. Source tree is compatible; this is a deliberate, security-driven deviation from the spec. |
| 24 | Spec names Claude/Anthropic as the AI provider. | Replaced with Google Gemini at the user's request so a free-tier API key can be used. Backend-only key boundary, role-aware context, token accounting, masking, audit trail and friendly fallback are unchanged. Default model is `gemini-3.5-flash-lite`; note that free-tier prompts may be used to improve Google's products. |

## Things the spec got right (kept unchanged)

- AI provider called **only** from Laravel; key stays in backend `.env`.
- Role-aware prompt context: no drafts/emails/audit data for readers and editors.
- Hash-chained, append-only audit log with `audit:verify`.
- News revisions + soft deletes for integrity and recovery.
- Least-privilege Sanctum token abilities with one-time plaintext display.
- Rate limiting, account lockout, daily AI token budget and friendly AI fallback.
- Tailwind v4 design tokens and the white/ocean-blue palette.

## Open items for the project owner (cannot be decided from the spec)

1. Real `ADMIN_EMAIL` / temporary `ADMIN_PASSWORD` delivery mechanism.
2. Valid `GEMINI_API_KEY` and `GEMINI_MODEL` (free key from Google AI Studio; live AI cannot be activated by source code alone).
3. Who the "contact office" is for the AI knowledge file (placeholder used).
4. Whether to add 2FA, email verification and an IP allow-list before storing real resident data.
5. Whether guests should eventually get anonymous chat with public-only context.
