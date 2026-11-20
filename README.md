# Bantay Cordova

Community news platform for Cordova residents. Public visitors browse published news; readers use a system-only Bantay Cordova support assistant; editors manage their own stories; administrators manage users, tokens, audit records, security and AI usage.

- **Frontend:** React (Vite) + React Router + Tailwind CSS v4
- **Backend:** Laravel 12 (PHP 8.2+, tested on PHP 8.5) REST API + Laravel Sanctum (SPA cookie auth + personal access tokens)
- **Database:** MySQL 8 / MariaDB (XAMPP)
- **AI:** Google Gemini via the Gemini API (free tier available), called **only** from Laravel

> The repository contains the complete source tree, including a PHPUnit harness. Backend and frontend dependencies are installed, the database is migrated/seeded, `audit:verify` passes, all 48 PHPUnit tests pass, and the production frontend build succeeds.

See `SPEC_REVIEW.md` for specification corrections, `IMPLEMENTATION_PLAN.md` for build/verification status and `CHAT_CIA_TRIAD.md` for the AI chatbox's response improvements and CIA triad controls.

---

## Current locations

- **Backend (Laravel 12 API):** `C:\Users\Ricka\OneDrive\Desktop\backend`
- **Frontend (React + Vite):** `C:\Users\Ricka\OneDrive\Desktop\ias\frontend`
- **Planning docs:** `C:\Users\Ricka\OneDrive\Desktop\ias`

The backend was moved out of `ias\` so Composer can be run directly in its own folder. Any `backend/...` path below refers to `C:\Users\Ricka\OneDrive\Desktop\backend`. The frontend proxy still targets `http://localhost:8000`, so start the backend with `php artisan serve` from the backend folder.

### Backend layout

```
backend/
├── app/
│   ├── Http/Controllers/         Auth, News, Chat, ApiInfo
│   ├── Http/Controllers/Admin/   Dashboard, Users, Tokens, Audit, AI usage, Security, Content, Settings
│   ├── Http/Middleware/          EnsureRole, ForcePasswordChange
│   ├── Http/Requests/            Auth + news form requests
│   ├── Models/                   User, News, NewsRevision, AuditLog, ChatMessage, Setting
│   ├── Observers/                NewsObserver, UserObserver
│   ├── Policies/                 NewsPolicy, UserPolicy
│   ├── Services/                 AuditLogger, HtmlSanitizer, GeminiClient, ChatContextBuilder,
│   │                             SystemKnowledgeService, AssistantIntentDetector,
│   │                             PublishedNewsRetrievalService, Advisory/Announcement/News/
│   │                             IncidentRetrievalService, SystemDataService,
│   │                             LiveDataAnswer, ChatResponseValidator, ChatScopeGuard
│   └── Console/Commands/         audit:verify, news:publish-scheduled
├── database/migrations/
├── database/seeders/
├── docs/system-knowledge.md      Facts the AI is allowed to use
├── routes/api.php
├── composer.json
└── phpunit.xml
```

### Workspace layout

```
ias/
├── frontend/                React + Vite + Tailwind v4
│   └── src/{api,auth,pages,components,lib}
├── README.md
├── SPEC_REVIEW.md
└── IMPLEMENTATION_PLAN.md
```

---

## Prerequisites

1. **XAMPP** with Apache and MySQL/MariaDB started from the XAMPP Control Panel. Check the bundled PHP version: Laravel 12 needs **PHP 8.2+** (this machine has PHP 8.5.12). If your XAMPP bundles an older PHP, install a compatible PHP separately and point Composer at it. Enable `extension=zip` in `php.ini` so Composer can extract packages.
2. **Composer**
3. **Node.js 20+ and npm**
4. `phpMyAdmin` at `http://localhost/phpmyadmin` to create the database (or use `mysql` CLI).
5. A free Google Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey) for live AI answers. Without it the chatbox returns a friendly "assistant unavailable" message and the rest of the site keeps working. New projects should use `gemini-3.5-flash-lite` or `gemini-3.8-flash`; older `gemini-2.5-*` IDs are restricted or deprecated.

Git is optional but recommended. Commit only `.env.example` files — never `.env`.

---

## 1. Database

In phpMyAdmin create a database named `bantay_cordova` (utf8mb4). Note the MySQL username/password (XAMPP default: `root` / empty password).

## 2. Backend

```bash
cd "C:/Users/Ricka/OneDrive/Desktop/backend"
composer install
cp .env.example .env
php artisan key:generate
```

> On this machine PHP, Composer and Node are installed but not on `PATH`. Prepend the tool directories in PowerShell:
> `$env:Path='C:\xampp\php;C:\ProgramData\ComposerSetup\bin;C:\Program Files\nodejs;'+$env:Path`, or invoke the executables by full path.

Edit `backend/.env` in the new backend folder:

```env
APP_NAME="Bantay Cordova"
APP_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=bantay_cordova
DB_USERNAME=root
DB_PASSWORD=

SANCTUM_STATEFUL_DOMAINS=localhost:5173,127.0.0.1:5173
SESSION_DOMAIN=localhost
SESSION_SAME_SITE=lax
SESSION_DRIVER=file
CACHE_STORE=file
QUEUE_CONNECTION=database

ADMIN_NAME="System Admin"
ADMIN_EMAIL=admin@yourdomain.example
ADMIN_PASSWORD=            # empty = generate a one-time password, printed once in the console

GEMINI_API_KEY=            # free key from https://aistudio.google.com/apikey; never in frontend/.env
GEMINI_MODEL=gemini-3.5-flash-lite
AI_DAILY_TOKEN_BUDGET=20000
```

Then:

```bash
php artisan migrate --seed
php artisan audit:verify        # should report a valid chain
php artisan serve               # http://localhost:8000
```

The seeder creates the first administrator from `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env` (no password is hard-coded). If `ADMIN_PASSWORD` is empty, a one-time password is printed once in the console. First sign-in forces a password change. **Do not commit credentials or the generated password.**

### Middleware registration check

`bootstrap/app.php` must register these aliases (they are part of this source tree; verify after any Laravel upgrade):

```php
$middleware->alias([
    'role'                => \App\Http\Middleware\EnsureRole::class,
    'must-change-password'=> \App\Http\Middleware\ForcePasswordChange::class,
    'ability'             => \Laravel\Sanctum\Http\Middleware\CheckForAnyAbility::class,
    'abilities'           => \Laravel\Sanctum\Http\Middleware\CheckAbilities::class,
]);
$middleware->statefulApi(); // registers /sanctum/csrf-cookie and stateful SPA auth
```

## 3. Frontend

```bash
cd "C:/Users/Ricka/OneDrive/Desktop/ias/frontend"
npm install
npm run dev                   # http://localhost:5173
```

`vite.config.js` proxies `/api` and `/sanctum` to `http://localhost:8000`, so the browser sees one origin: CSRF cookies and Sanctum session cookies work without cross-site cookie problems. `src/api/client.js` calls `GET /sanctum/csrf-cookie` before state-changing requests and sends `withCredentials: true`.

Open `http://localhost:5173`.

---

## 4. Cloud deployment

Frontend and backend are separate GitHub repositories:

- Backend API: `https://github.com/Andreii09/IAS-backend`
- Frontend + docs: `https://github.com/Andreii09/IAS-frontend`

Each repo contains a production `Dockerfile`, a Render `render.yaml` blueprint and a `DEPLOYMENT.md` guide. Deploy the **backend first**, then set the frontend's `API_ORIGIN` to the backend URL. The frontend Nginx proxies `/api` and `/sanctum` to that URL, so the browser still sees a single origin and Sanctum cookies work without CORS changes.

The backend image runs PHP-FPM, Nginx, the queue worker and the scheduler under Supervisor. It needs an external MySQL/PostgreSQL URL (`DATABASE_URL`), a Gemini key and the **frontend hostname** in `SESSION_DOMAIN` / `SANCTUM_STATEFUL_DOMAINS`. Set `RUN_MIGRATIONS=true` for the first deploy and `RUN_SEED=true` once to create the admin account; then turn seeding off.

Full steps: `backend/DEPLOYMENT.md` and `frontend/DEPLOYMENT.md`.

---

## Optional production-hardening steps

- Set `APP_ENV=production`, `APP_DEBUG=false`, force HTTPS, and use real `Secure` cookies (`SESSION_SECURE_COOKIE=true`).
- Grant the application's DB user only `SELECT, INSERT` on `audit_logs` (plus `SELECT, INSERT, UPDATE, DELETE` on other tables). The hash chain plus DB privileges make the audit log genuinely append-only.
- Use Redis for queues/cache (`REDIS_*`, `QUEUE_CONNECTION=redis`, `CACHE_STORE=redis`) and run a queue worker: `php artisan queue:work`.
- Schedule recurring work in cron:

  ```cron
  * * * * * cd /path/to/backend && php artisan schedule:run >> /dev/null 2>&1
  ```

  `news:publish-scheduled` is registered there, so add this cron entry for scheduled stories.
- Back up the database nightly (`mysqldump`) and **test the restore**. XAMPP is for local development only.
- Before storing real resident data: add 2FA for admins, email verification, and consider an IP allow-list for `/admin`.
- Chat transcripts are logged for accountability. Disclose this in the UI (already done) and check local privacy rules before collecting resident data. PII is now masked **before both the provider call and storage**, but prompts still leave the server — account for that in your consent/privacy notice. Google's free tier may use prompts and responses to improve its products; do not send confidential resident data on the free tier.

---

## Authentication and app entry

The React app is authentication-first: `GET /` shows the full-screen **Sign in** page for guests. Internal routes (news, manage and admin screens) sit behind `ProtectedRoute`, so typing a dashboard URL manually cannot render it before login. After a successful Laravel login, users land on `/admin` (admin), `/manage` (editor) or `/` news feed (reader); a forced password change takes precedence. `Sign out` calls `POST /api/logout`, invalidates the Sanctum session and returns to the login page. Guest-only screens are login, register, forgot-password and reset-password.

## Roles

| Capability | reader | editor | admin |
|---|---|---|---|
| Read published news | yes | yes | yes |
| Create stories | no | yes | yes |
| Edit/delete own stories | no | yes | yes |
| Edit/delete any story | no | no | yes |
| Manage users and roles | no | no | yes |
| Tokens | no | no (admin-managed) | all |
| Audit log | own actions | own actions | all |
| AI chat logs | own | own | all |

Self-registration always creates a `reader`. Choosing "editor request" sets `requested_role`; an admin approves by changing the role in `/admin/users`.

## API endpoints

See `backend/routes/api.php`. Highlights:

```
POST   /api/register|login|logout|forgot-password|reset-password
GET    /api/me, /api/health
POST   /api/change-password
GET    /api/news, /api/news/{id}
POST   /api/news, PUT /api/news/{id}, DELETE /api/news/{id}       (editor/admin)
GET    /api/news/{id}/revisions, POST /api/news/{id}/restore
POST   /api/chat                                                  (auth, 20/min, daily budget)
DELETE /api/chat/session                                          (auth, clears one chat session's transcript/context)
GET    /api/admin/{overview,users,tokens,audit,ai-usage,security,settings}
GET    /api/admin/content/{revisions,revisions/raw,deleted}
```

Personal access tokens use least-privilege abilities (`news:read`, `news:write`) and an optional expiry. The plaintext token is displayed once at creation; only its hash is stored. Password or role changes revoke existing tokens.

## AI assistant

`backend/docs/system-knowledge.md` is the authorized knowledge base injected into the system prompt. **Update it whenever screens, routes, permissions or workflows change.** `SystemKnowledgeService` adds a short verified fact sheet; `AssistantIntentDetector` recognises short/informal questions; and Laravel retrieval services query only published, visible `news` rows. Advisories are `notice`/`public_safety` posts, announcements are `announcement` posts, and news is every published visible post. Drafts, future scheduled posts, soft-deleted rows and unauthorized records never reach the assistant.

The assistant is read-only and data-aware: it returns real titles, categories, dates and summaries, uses exact empty/error replies, and validates provider output with `ChatResponseValidator` so invented records are replaced by a verified listing. Incident/report questions are answered honestly: the verified system has no incident, report-status, emergency or disaster module. PII is masked before the provider call and before storage; replies are length-capped and checked for leaked secrets or hidden instructions before display or storage. When the provider is offline, verified records are still returned deterministically and common how-to questions get a grounded local answer (`AI_OFFLINE_HELP`, default on). Per-user daily budgets come from config (reader 20k, editor 40k, admin 60k) with an admin override in `/admin/ai`.

The assistant is a dedicated **Bantay Cordova System Assistant**, not a general chatbot. `ChatScopeGuard` verifies every question in Laravel **before** answer generation: prompt-injection attempts are rejected, clearly documented system topics (including short/informal wording) use a local fast path, and everything else is classified contextually with Gemini. Unrelated, unverifiable or injection questions receive the exact standard refusal about features, functionality, advisories, incident reporting or usage; they are stored as `scope-guard` exchanges and audited as `ai.chat.scope.refused`, with an "Out of scope" badge in the UI. The system currently has no incident-reporting, report-status, emergency or disaster module, so the assistant says so rather than inventing one. Controls are configurable via `AI_SCOPE_GUARD`, `AI_SCOPE_LOCAL_CHECK`, `AI_SCOPE_CLASSIFIER_MODEL` and `AI_SCOPE_MAX_TOKENS`.

The full Confidentiality / Integrity / Availability mapping, changed files and verification steps are in `CHAT_CIA_TRIAD.md`.

## Useful commands

```bash
php artisan audit:verify                 # verify hash chain; reports the first broken row
php artisan news:publish-scheduled       # publish scheduled stories whose time has passed
php artisan route:list
php artisan test                         # PHPUnit tests (once dependencies are installed)
npm run build                            # production React bundle
```

## Automated tests

`backend/phpunit.xml` runs tests against an in-memory SQLite database with array cache/session/mail drivers, so no XAMPP database is needed for `php artisan test`:

```bash
cd "C:/Users/Ricka/OneDrive/Desktop/backend"
php artisan test
```

Coverage added:

- PII masking and prompt-injection flagging (`tests/Unit/PiiMaskingTest.php`).
- Audit hash-chain recording, verification and tamper detection (`tests/Feature/AuditChainTest.php`).
- Five-strike lockout and reader-only self-registration (`tests/Feature/AuthLockoutTest.php`).
- Role/policy 403s, draft visibility, token abilities and plaintext non-storage (`tests/Feature/RolesAndPoliciesTest.php`, `tests/Feature/TokenAbilitiesTest.php`).
- Reader chat-context isolation, friendly provider fallback and masked transcript storage (`tests/Feature/ChatContextTest.php`).
- Intent detection, real advisory/announcement retrieval, exact empty/retrieval-error replies, publication/visibility filtering, provider fabrication fallback, verified multi-part answers and honest incident responses (`tests/Feature/AssistantIntelligenceTest.php`).
- Revision/audit creation on story edits, HTML sanitizing and public health check (`tests/Feature/NewsWorkflowTest.php`, `tests/Feature/HealthTest.php`).

These automated checks supplement, but do not replace, the manual runtime checklist in `IMPLEMENTATION_PLAN.md`.
