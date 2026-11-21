# Backend Progress Report

Audit date: 2026-11-20 · Scope: `server/` (Express 5 + Mongoose 9 + TypeScript, 42 source files, 3,426 LOC, 5 models, 11 route modules)

Method: full read of `src/index.ts`, config, middleware, every route module and the controllers behind them; live endpoint tests against `http://localhost:5000/api` using the test account; MongoDB inspected read-only (`domains: 14`, `projects: 6`, `users: 1`).

Legend: **COMPLETE** · **PARTIALLY COMPLETE** · **NOT STARTED** · **BROKEN**

---

## 1. Module status

| # | Area | Status | Evidence |
|---|---|---|---|
| 1 | Server setup, env validation, DB connection | COMPLETE | `src/index.ts`, `config/env.ts` (fail-fast `assertEnv`), `config/db.ts`. `GET /api/health` → `200 {"status":"ok","database":"connected"}`. Boots with plain `npm run dev`. |
| 2 | Registration, login, JWT issue | COMPLETE | `controllers/auth.controller.ts`; `POST /auth/register` 201, `POST /auth/login` 200 (235-char JWT), bad password 401, empty body 422. bcrypt hashing in `models/User.ts`. |
| 3 | `/auth/me` session restore | COMPLETE | 200 with valid token, 401 without. |
| 4 | Onboarding | COMPLETE | `POST /auth/onboard` persisted `careerGoal`, `experienceLevel`, `knownTechnologies`, `onboarded: true`. |
| 5 | Google / phone authentication | PARTIALLY COMPLETE | `POST /auth/google` and `services/firebaseIdToken.ts` exist (ID-token verification, no client-trusted email). **No `FIREBASE_*` variables are set** in `server/.env`, so the path cannot work here. NOT VERIFIED end-to-end. |
| 6 | JWT security | COMPLETE | `middleware/auth.ts`: HS256 pinned, secret required at boot, no fallback; expiry → `TOKEN_EXPIRED`; invalid → `INVALID_TOKEN`. Token role is advisory only. |
| 7 | Role-based access + admin protection | COMPLETE | `requireRole` re-reads the role from MongoDB; `GET /admin/overview` as a student → **403** (tested). |
| 8 | User profile data model | COMPLETE | `models/User.ts`: 25+ fields, bcrypt hook, generated username, sparse unique `firebaseUid`, role enum. |
| 9 | Profile update API | COMPLETE | `PUT /portfolio/me` with URL validation (`isSafeHttpUrl`) and length caps. |
| 10 | Skill management | PARTIALLY COMPLETE | Skills live on the user document and are read by analytics/dashboard. **`PUT /portfolio/me` accepts `skills[]` straight from the client**, so a user can set their own scores to 100 — this contradicts the "scores are earned, never seeded" comment in `models/User.ts:108`. |
| 11 | Domains API | COMPLETE | `GET /domains` 200 (14 docs), `GET /domains/:slug` 200, `GET /domains/:slug/projects` 200, all auth-gated (401 without token). Read-only: no admin CRUD. |
| 12 | Projects API | COMPLETE | `GET /projects` 200 (search/filter/sort, regex escaped), `GET /projects/:idOrSlug` 200, 404 for unknown. Read-only. |
| 13 | AI mentor (Gemini) | PARTIALLY COMPLETE | `mentor.controller.ts` builds a prompt with untrusted-content fencing, parses JSON, guards against injection. Returns **503** when `GEMINI_API_KEY` is missing (verified). The reply is **not stored** (no message history model). |
| 14 | AI blueprint | PARTIALLY COMPLETE | `POST /ai/project-blueprint` → **200 with a canned fallback blueprint** when the key is absent (`ai.controller.ts:5-36`, response carries `note: "...fallback..."`). Workspace/rate limits applied (hourly + daily). |
| 15 | Project evaluation / code review | PARTIALLY COMPLETE | `POST /evaluator/review` validates input, calls Gemini, returns a review; **503 without key** (verified). Reviews are not persisted, and no skill/XP is updated from a review. |
| 16 | Task verification | PARTIALLY COMPLETE | `POST /mentor/verify` returns `{isPassed, feedback}` only. No write-back to `completedProjects`, `skills`, `badges`, `streak` or XP. |
| 17 | Roadmaps / project progress persistence | NOT STARTED | No `Submission`, `Roadmap`, `Milestone` or `Progress` model; no endpoints. Blueprints are generated on request and discarded. |
| 18 | XP ledger | PARTIALLY COMPLETE | `models/XpEvent.ts` + `services/xpService.ts`: server-owned amounts, unique `dedupeKey`, atomic pipeline update, level recomputation, negative clamp. **Only reachable via `POST /gamification/award-xp`, which is admin-only**, so students can never earn XP today. |
| 19 | Badges | NOT STARTED | Schema array on `User`; no code ever grants a badge. |
| 20 | Streaks | NOT STARTED | `streak` field defaults to 0 and is never incremented anywhere. |
| 21 | Leaderboard | COMPLETE | `GET /gamification/leaderboard` 200, sorted by XP, top 20, no padding. |
| 22 | Gamification stats | COMPLETE | `GET /gamification/stats` 200 with xp/level/streak/next-level/badges/skills. |
| 23 | Analytics | PARTIALLY COMPLETE | `GET /analytics/summary` 200 (real XP/level/streak/completed counts), `GET /analytics/radar` 200 (real skills). `weeklyActivity` is returned empty with `weeklyActivityAvailable:false` — honest, but no time-series data exists. |
| 24 | Community posts/replies/upvotes | PARTIALLY COMPLETE | `GET /posts` 200; `POST /posts` 201, `POST /posts/:id/replies` 201, `POST /posts/:id/upvote` with one-vote-per-account guard and `$ne` race protection in code. Write endpoints **NOT executed** in this audit. No edit/delete, no moderation, no pagination (hard `limit(30)`). |
| 25 | Portfolio API | COMPLETE | `GET /portfolio/:identifier` (public, email deliberately excluded), `GET /portfolio/me`, `PUT /portfolio/me`. 404 verified for unknown user. |
| 26 | Validation | COMPLETE | `middleware/validate.ts` used on every write route with per-field types, enums, min/max and array caps. |
| 27 | Rate limiting | COMPLETE (single instance) | `middleware/rateLimit.ts` in-memory fixed window with `Retry-After` + `X-RateLimit-*`; separate buckets for auth IP, auth credential, AI hourly/daily, community writes. Documented limitation: not shared across processes. |
| 28 | CORS | COMPLETE | Explicit allowlist from `CORS_ORIGINS` (dev defaults 3000/3200); no Origin → allowed (server-to-server). |
| 29 | Error handling | COMPLETE | `middleware/error.ts` with `AppError`, stable codes, `requestId`; unknown route → 404 verified; validation → 422 verified. |
| 30 | Security headers | COMPLETE | `middleware/security.ts`: nosniff, DENY framing, no-referrer, CORP, permissions policy, `Cache-Control: no-store`, HSTS in production. |
| 31 | Request logging | COMPLETE | `middleware/requestLog.ts` structured JSON with requestId, path, status, duration, userId. |
| 32 | Data persistence | PARTIALLY COMPLETE | Users, domains, projects, community posts, XP events persist in MongoDB. **Progress-bearing data (submissions, milestones, reviews, badge events, streaks, message history) has no schema at all.** |
| 33 | Seed scripts | COMPLETE | `scripts/seedDomains.ts` (14 domains), `scripts/seedProjects.ts` (6 projects) — both executed for this audit. |
| 34 | Automated tests | NOT STARTED | No test runner, no `*.test.ts`, no CI test script. |

---

## 2. Live endpoint results (executed)

```
GET    /api/health                        200
POST   /api/auth/login                    200 (valid) / 401 (wrong password) / 422 (empty body)
GET    /api/auth/me                       200 (with token) / 401 (without)
GET    /api/domains                       200 (14) / 401 (no token)
GET    /api/domains/data-science          200
GET    /api/domains/data-science/projects 200
GET    /api/projects?sort=recommended     200 (6)
GET    /api/projects/ai-ecommerce-platform 200
GET    /api/gamification/stats            200 (xp 0, level 1)
GET    /api/gamification/leaderboard      200
GET    /api/analytics/summary             200
GET    /api/analytics/radar               200
GET    /api/community/posts               200 (empty list)
GET    /api/portfolio/me                  200
GET    /api/portfolio/nobody-here         404
GET    /api/admin/overview    (student)   403
POST   /api/mentor/ask                    503  (AI provider not configured)
POST   /api/evaluator/review              503  (AI provider not configured)
POST   /api/ai/project-blueprint          200  (canned fallback blueprint)
GET    /api/nope                          404
```

Not executed (would create data): `POST /community/posts`, `/replies`, `/upvote`, `PUT /portfolio/me`, `POST /gamification/award-xp`, `POST /auth/register` (already done once, account exists).

---

## 3. Security verification of "Phase 1 / Phase 2" claims

| Claim from earlier phases | Status now | Evidence |
|---|---|---|
| JWT secret has no fallback | HOLDS | `config/env.ts` `readRequired('JWT_SECRET', 32)` → boot refusal. |
| Roles checked in DB, not from token | HOLDS | `middleware/auth.ts` `requireRole` queries `User.findById`. |
| Client cannot mint XP | HOLDS (over-corrected) | `award-xp` requires `admin`; XP amounts come from `XP_AWARD_TABLE`. Consequence: **no user-facing XP path exists**. |
| No fake/seed data for stats | HOLDS for stats/analytics/leaderboard | New account reports 0 XP/0 streak/0 badges; analytics returns empty arrays rather than invented numbers. |
| No fake AI data | **DOES NOT HOLD for blueprints** | `ai.controller.ts` returns a hardcoded four-phase "fallback blueprint" when Gemini is unconfigured; the frontend renders it without a visible warning. |
| Input sanitised before regex | HOLDS | `escapeRegex` in project and community search. |
| Portfolio does not leak email | HOLDS | `getPublicPortfolio` selects an explicit field list without `email`. |
| Rate limiting present | HOLDS | Auth (IP + IP/email), AI (hourly + daily per user), community writes. |
| Env-driven CORS | HOLDS | `env.corsOrigins`. |

New gaps found in this audit (not previously documented): client-writable `skills` scores; no progress persistence; zero automated tests; in-memory rate limiter; CSP is report-only in `client/next.config.mjs`.

---

## 4. Score

| Bucket | Count | Share |
|---|---|---|
| COMPLETE | 7 | 37% |
| PARTIALLY COMPLETE | 8 | 42% |
| BROKEN | 0 | 0% |
| NOT STARTED | 4 | 21% |
| **Total audited modules** | **19** | 100% |

**Backend completion: 37% fully complete; 58% counting partial work.** The auth/authorization/validation foundation is solid and genuinely production-shaped. The learning loop (projects → milestones → submissions → verification → skills/badges/streak) is missing its data model and write paths, which is why the personalised UI has nothing to show.
