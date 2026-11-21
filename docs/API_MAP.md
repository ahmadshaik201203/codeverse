# CodeVerse — API Map

Base URL: `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:5000/api`).
All routes are mounted in `server/src/index.ts`. Every response is JSON.

**Auth legend:** 🔓 public · 🔑 `Authorization: Bearer <jwt>` required (`authenticate` middleware) · ⚠️ auth present but insufficient/incorrect

---

## 1. Implemented endpoints (27)

### Auth — `/api/auth` (`controllers/auth.controller.ts`)

| # | Method | Path | Auth | Request body | Response | Consumer |
|---|---|---|---|---|---|---|
| 1 | POST | `/register` | 🔓 | `fullName, email, password, college, department, year, preferredLanguage?` | `201 {message, token, user}` | `/register` |
| 2 | POST | `/login` | 🔓 | `email, password` | `{message, token, user}` | `/login` |
| 3 | POST | `/google` | 🔓 | `email, fullName, photoUrl, idToken` — **`idToken` ignored** | `{message, token, user, isNewUser}` | `GoogleSignInButton`, `PhoneSignInBox` |
| 4 | GET | `/me` | 🔑 | — | `{user}` | `AuthContext` bootstrap |
| 5 | POST | `/onboard` | 🔑 | `careerGoal, experienceLevel, knownTechnologies[], learningLanguage` | `{message, user}` | `/onboarding` |

Notes:
- `generateToken` signs `{ id, email }`, 7-day expiry, `JWT_SECRET`.
- Password excluded from all responses via `delete userObj.password` or `.select('-password')`.
- **No** `/logout`, `/refresh`, `/forgot-password`, `/reset-password`, `/verify-email`, `/change-password`.
- Endpoint 3 is an authentication bypass (SEC-02).

### Domains — `/api/domains` (`controllers/domain.controller.ts`)

| # | Method | Path | Auth | Query | Response | Consumer |
|---|---|---|---|---|---|---|
| 6 | GET | `/` | 🔑 | `category?` | `{domains[]}` | `/dashboard/domains` |
| 7 | GET | `/:slug` | 🔑 | — | `{domain}` / `404` | `/domains/[slug]` |
| 8 | GET | `/:slug/projects` | 🔑 | — | `{count, projects[]}` | `/domains/[slug]/projects` |

**Gap:** all three require auth, so the public marketing "Domains" section cannot use them — `Domains.tsx` hardcodes its catalogue instead. The homepage and domain detail should read the same source of truth.

### Projects — `/api/projects` (`controllers/project.controller.ts`)

| # | Method | Path | Auth | Query | Response | Consumer |
|---|---|---|---|---|---|---|
| 9 | GET | `/` | 🔑 | `search, difficulty, tag, category, domain, sort` (`new\|popularity\|recommended\|difficulty`) | `{count, projects[]}` | `/dashboard/projects`, `/dashboard/admin` |
| 10 | GET | `/:id` | 🔑 | `:id` = ObjectId **or** slug | `{project}` / `404` | `/projects/[projectId]`, blueprint, workspace, admin |

**Gaps:** no create/update/delete (Phase 8 needs them). `search` builds a `RegExp` from raw input (SEC-09). No pagination — the response returns the entire collection.

### AI — `/api/ai` (`controllers/ai.controller.ts`)

| # | Method | Path | Auth | Body | Response |
|---|---|---|---|---|---|
| 11 | POST | `/project-blueprint` | 🔑 | `projectId` | `{blueprint:{architecture, steps[], bestPractices[]}, generated?}` or fallback with `note` |

Model: `gemini-2.5-flash`. Fallback when `GEMINI_API_KEY` is missing is **honest** (includes a `note`). No rate limit, no persistence (regenerating loses progress), no caching (every visit calls the paid API).

### Mentor — `/api/mentor` (`controllers/mentor.controller.ts`)

| # | Method | Path | Auth | Body | Response |
|---|---|---|---|---|---|
| 12 | POST | `/ask` | 🔑 | `projectId*, taskContext?, codeSnippet?, userMessage*, history?` | `{reply, success}` |
| 13 | POST | `/verify` | 🔑 | `projectId*, taskDescription*, codeSnippet*` | `{isPassed, feedback}` |

Defects:
- `projectId` is required. `GlobalAiCopilot` never sends it → **every global-copilot message returns 400** and the UI shows a generic failure.
- `history` is destructured as `chatSequence` and **never used** — no conversation memory; each turn resends one prompt.
- No key → endpoint 13 returns `isPassed: true` (dishonest, SEC-06 adjacent).
- Output is free Markdown; no schema validation, no max length, no stop conditions.

### Evaluator — `/api/evaluator` (`controllers/evaluator.controller.ts`)

| # | Method | Path | Auth | Body | Response |
|---|---|---|---|---|---|
| 14 | POST | `/review` | 🔑 | `projectId*, codeSnippet*` | `{review:{overallScore, verdict, summary, security[], performance[], bestPractices[]}, success}` |

**Critical honesty defect:** with no API key it returns a fabricated `overallScore: 82` / `"Passed"` review. The client (`CodeReviewModal`) does not surface the `fallback: true` flag, so it is indistinguishable from a real review. Unvalidated `JSON.parse` of model output → 500 on malformed output instead of a graceful retry.

### Portfolio — `/api/portfolio` (`controllers/portfolio.controller.ts`)

| # | Method | Path | Auth | Body | Response |
|---|---|---|---|---|---|
| 15 | GET | `/me` | 🔑 | — | `{user}` (+ populated `completedProjects`) |
| 16 | PUT | `/me` | 🔑 | `bio?, githubUrl?, linkedinUrl?, portfolioWebsite?, skills?, careerGoal?` | `{message, user}` |
| 17 | GET | `/:identifier` | 🔓 | `:identifier` = username or ObjectId | `{portfolio{...}}` |

Defects: endpoint 17 exposes `email` publicly (SEC-10); invents `xp/level/streak` defaults and substitutes arbitrary catalogue projects when the user has none; no opt-in privacy flag; no URL validation on `githubUrl`/`linkedinUrl` (a `javascript:` URL stored here becomes an XSS vector on the public page).

### Gamification — `/api/gamification` (`controllers/gamification.controller.ts`)

| # | Method | Path | Auth | Body | Response |
|---|---|---|---|---|---|
| 18 | GET | `/leaderboard` | 🔓 | — | `{leaderboard[]}` (top 20 by XP) |
| 19 | GET | `/stats` | 🔑 | — | `{stats{xp, level, streak, xpForNextLevel, xpProgressInLevel, badges[], skills[]}}` |
| 20 | POST | `/award-xp` | ⚠️ | `actionType` | `{xpEarned, currentXp, currentLevel, streak}` |

Defects: endpoint 18 computes `xp: u.xp || 150 + (20-idx)*35`, `streak: u.streak || max(1,10-idx)`, `badgeCount || 2` — fabricated values ranked into a public leaderboard. Endpoint 20 lets any authenticated user mint XP with no proof (SEC-06). Level formula (`floor(xp/200)+1`) is duplicated in two places and inconsistent with `xpForNextLevel = level*200`.

### Analytics — `/api/analytics` (`controllers/analytics.controller.ts`)

| # | Method | Path | Auth | Response |
|---|---|---|---|---|
| 21 | GET | `/radar` | 🔑 | `{skills[{subject,score,fullMark}]}` — user skills or **6 invented defaults** |
| 22 | GET | `/summary` | 🔑 | `{summary{totalHoursSpent, projectsCompleted, totalAvailableProjects, completionRate, currentStreakDays, totalXp, level, weeklyActivity[]}}` |

`weeklyActivity` is a hardcoded 7-day array of commits/tasks; hours are derived (`completed*14 + level*6`). No activity is recorded anywhere in the system, so these can never be real without new models.

### Community — `/api/community` (`controllers/community.controller.ts`)

| # | Method | Path | Auth | Body | Response |
|---|---|---|---|---|---|
| 23 | GET | `/posts` | 🔓 | `domain?, search?` | `{posts[]}` (max 30, newest first) |
| 24 | POST | `/posts` | 🔑 | `title*, content*, tags[], domainSlug?` | `201 {message, post}` +30 XP |
| 25 | POST | `/posts/:id/replies` | 🔑 | `content*` | `201 {message, post}` +50 XP |
| 26 | POST | `/posts/:id/upvote` | 🔑 | — | `{message, upvotes}` |

Defects: endpoint 23 returns **two invented posts** whenever the collection is empty (with invented authors and vote counts) — indistinguishable from real community content. Upvote increments without bound: `upvotedBy[]` exists in the model but is never consulted or written, so one user can vote unlimited times. XP awards are unconditional (SEC-06). No edit/delete/report/moderation endpoints (Phase 8 needs them).

### System

| # | Method | Path | Auth | Response |
|---|---|---|---|---|
| 27 | GET | `/api/health` | 🔓 | `{status:'ok', message, timestamp}` |

Reports `ok` even when MongoDB is disconnected (SEC-11).

---

## 2. Consumer → endpoint coverage matrix

Every client network call, and what it needs that does not exist.

| Client file | Calls | Missing requirement |
|---|---|---|
| `context/AuthContext.tsx` | 4 | logout/refresh endpoints |
| `app/login`, `app/register` | 1, 2, 3 | verified ID token |
| `app/onboarding` | 5 | — |
| `app/dashboard/page.tsx` | none | a real dashboard summary endpoint (`/me/dashboard`) |
| `app/dashboard/domains` | 6 | — |
| `app/domains/[slug]` | 7 | public variant, real project list (8) |
| `app/domains/[slug]/projects` | 8 | — |
| `app/dashboard/projects` | 9 | pagination |
| `app/projects/[projectId]` | 10 | — |
| `.../blueprint` | 10, 11 | **progress persistence** (`PUT /projects/:id/progress`) |
| `.../workspace` | 10, 12, 13, 14 | **file persistence**, honest verify |
| `app/dashboard/analytics` | 21, 22 | real activity source |
| `app/dashboard/community` | 23–26 | moderation, dedupe votes |
| `app/dashboard/leaderboard` | 18 | honest XP |
| `app/dashboard/admin` | 9 | **`/api/admin/*` with role gate** |
| `app/portfolio/[username]` | 17 | privacy flag, remove email |
| `components/GlobalAiCopilot.tsx` | 12 (no `projectId`) | general-purpose mentor route |
| `components/auth/GoogleSignInButton` | 3 | ID-token verification |
| `components/auth/PhoneSignInBox` | 3 | ID-token verification, phone provider |

11 client files bypass `apiFetch` and hardcode `http://localhost:5000`, bypassing the configured base URL.

---

## 3. Endpoints required by the stated vision but absent

| Phase | Endpoint(s) | Purpose |
|---|---|---|
| 3 | `POST /auth/logout`, `/auth/refresh`, `/auth/forgot-password`, `/auth/reset-password`, `GET /auth/verify-email` | Complete auth lifecycle |
| 3 | `PATCH /users/me` | Profile editing (settings page is a dead link) |
| 4 | `GET /skills`, `GET /skills/:slug` | Skills catalogue |
| 4 | `POST /skills/:slug/track`, `PATCH /skills/:slug/progress` | Skill tracking |
| 4 | `GET /assessments/:skillId`, `POST /assessments/:id/attempt` | Assessments |
| 4 | `GET /me/skill-gaps`, `GET /me/recommendations` | Gap analysis |
| 4 | `GET /me/roadmap`, `PATCH /me/roadmap/:milestoneId` | Roadmap + progress |
| 5 | `GET/PUT /me/projects/:id/progress`, `GET/PUT /me/projects/:id/files` | Persist blueprint + workspace |
| 5 | `POST /projects/:id/submissions` | Server-verified task submission |
| 6 | `POST /mentor/chat` (general), `POST /mentor/interview`, `POST /mentor/quiz`, `POST /mentor/career` | Mentor modes |
| 6 | `GET/DELETE /conversations/:id` | History |
| 7 | `PATCH /community/posts/:id`, `DELETE`, `POST /report`, `POST /moderate` | Moderation |
| 7 | `GET /me/readiness`, `GET /me/analytics` | Career readiness from real data |
| 8 | `GET /admin/users`, `PATCH /admin/users/:id/role`, `/admin/domains`, `/admin/skills`, `/admin/projects`, `/admin/analytics`, `/admin/reports` | Admin CRUD (all role-gated) |

---

## 4. Contracts to standardize before adding endpoints

Current error shapes are free-form `{ message }` with ad-hoc status codes. Phase 1 introduces:

```ts
// success
{ data: T, meta?: { page, total } }
// error
{ error: { code: string, message: string, details?: FieldError[] }, requestId: string }
```

Rules to enforce:
- `401` unauthenticated, `403` authenticated-but-not-permitted, `404` unknown, `422` validation, `429` rate limited, `503` upstream AI unavailable. **Never** `200` with a fabricated success payload.
- AI endpoints return `503 { error: { code: 'AI_UNAVAILABLE' } }` when the provider is down — no invented scores or passes.
- No response ever contains `password`, another user's `email`, or internal stack traces.
- All list endpoints paginate (`?page=&limit=`, max 50).

---

## 5. Verification status

| Claim | Status |
|---|---|
| Route table above matches `server/src/routes/*.ts` | ✅ read directly |
| Endpoints execute successfully against a live DB | ❌ **unverified** — no database available in this audit |
| Auth middleware actually rejects forged tokens | ❌ unverified; SEC-03 means it cannot be trusted |
| AI endpoints reach Gemini | ❌ unverified — no API key available to this audit |
| Client–server field contracts match | ❌ **known mismatch** (see `PROJECT_AUDIT.md` §5) |
