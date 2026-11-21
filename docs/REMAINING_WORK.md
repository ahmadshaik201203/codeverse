# Remaining Work — Prioritised

Audit date: 2026-11-20. Every item below is a gap found in the current code, not a roadmap wish.
Effort is for one focused engineer: **S** ≤ 0.5 day · **M** ≈ 1–2 days · **L** ≈ 3–5 days · **XL** > 1 week.

---

## P0 — Blocks launch or is a security / data-integrity problem

### P0-1. Client can write its own skill scores
- **Missing:** `PUT /portfolio/me` accepts `skills[]` from the request body, so any signed-in user can claim 100% in every skill. Skills are supposed to be earned from verified work (`User.ts:108`).
- **Files:** `server/src/controllers/portfolio.controller.ts` (`normalizeSkills`, `updateMyPortfolio`), `server/src/routes/portfolio.routes.ts`.
- **Side:** backend. **Deps:** none. **Effort:** S. **Fix:** drop `skills` from the user-updatable set (keep bio/links), expose skills read-only until a verification write path exists.

### P0-2. Blueprint endpoint serves a fake blueprint
- **Missing:** without `GEMINI_API_KEY`, `POST /ai/project-blueprint` returns a hardcoded 4-phase blueprint with `note: "...fallback..."`, and the UI renders it as if generated.
- **Files:** `server/src/controllers/ai.controller.ts` (delete `getFallbackBlueprint`), `client/app/projects/[projectId]/blueprint/page.tsx` (show a clear "AI is not configured" state instead of content).
- **Side:** both. **Deps:** Gemini key for a real run. **Effort:** S.

### P0-3. Production API base URL is unset and hardcoded in 15 places
- **Missing:** `NEXT_PUBLIC_API_URL` is empty in `client/.env.local`; 15 call sites hardcode `http://localhost:5000` (community, dashboard projects, domain projects, portfolio, project detail, blueprint, workspace, global copilot).
- **Files:** those 7 pages + `components/GlobalAiCopilot.tsx`; `client/lib/api.ts` stays the single client.
- **Side:** frontend (+ deployment env). **Deps:** deployed API origin + CORS entry. **Effort:** S (mechanical) — blocks any non-local deploy.

### P0-4. No persistence for any learning progress
- **Missing:** no `Submission`, `Roadmap`, `Milestone`, `Review` or `BadgeEvent` models, and no write path from verify/review to `skills`, `completedProjects`, `badges`, `streak` or XP. A user can "verify" a task and nothing changes; workspace code is lost on refresh.
- **Files:** `server/src/models/*` (new), `controllers/mentor.controller.ts`, `evaluator.controller.ts`, `gamification/*`, `services/xpService.ts`; `client/app/projects/[projectId]/workspace/page.tsx`.
- **Side:** both. **Deps:** P0-2 (AI must be real before verified work is meaningful). **Effort:** L–XL.

### P0-5. No automated tests at all
- **Missing:** zero test files, no test runner, no CI script in either `package.json`.
- **Files:** both packages' `package.json`, new `*.test.ts` suites (auth, roles, XP idempotency, validation, integration).
- **Side:** both. **Deps:** none. **Effort:** M for a meaningful first suite.

---

## P1 — Core functionality that must work before launch

### P1-1. Seven empty product pages
- **Missing:** `/dashboard/my-projects`, `/roadmap`, `/mentor`, `/skills`, `/interview`, `/resume`, `/readiness` are linked in the sidebar but 404.
- **Files:** new `client/app/dashboard/{my-projects,roadmap,mentor,skills,interview,resume,readiness}/page.tsx`; `components/DashboardLayout.tsx` (until built, hide or mark "soon").
- **Side:** frontend (+ APIs for most). **Deps:** P0-4. **Effort:** L (XL with real interview/resume features).

### P1-2. AI features are unusable on this deployment
- **Missing:** `GEMINI_API_KEY` is absent from `server/.env`, so mentor ask/verify and code review all return 503, and the copilot only shows an error.
- **Files:** config only (`server/.env`), plus graceful UI states (`GlobalAiCopilot`, workspace panels).
- **Side:** ops + minor frontend. **Deps:** a Gemini key. **Effort:** S. *Not verified: no key available in this audit.*

### P1-3. Google / phone sign-in cannot succeed
- **Missing:** `NEXT_PUBLIC_FIREBASE_API_KEY` empty and no `FIREBASE_*` on the server.
- **Files:** env only; `lib/firebase.ts` and `services/firebaseIdToken.ts` are complete.
- **Side:** ops. **Deps:** Firebase project. **Effort:** S. *Not verified end-to-end.*

### P1-4. Verified work must award XP / badges / streak
- **Missing:** `award-xp` is admin-only and nothing else calls `grantXp`. Badges and streaks have no write path at all.
- **Files:** `server/src/services/xpService.ts`, `controllers/mentor.controller.ts`, new `services/streakService.ts`, `services/badgeService.ts`.
- **Side:** backend. **Deps:** P0-4. **Effort:** M–L.

### P1-5. No portfolio editor
- **Missing:** `PUT /portfolio/me` exists but no screen uses it; users cannot set bio, links or career goal.
- **Files:** new `client/app/dashboard/portfolio/page.tsx` (or a section in settings) + link in `DashboardLayout.tsx`.
- **Side:** frontend. **Deps:** P0-1 (so skills are not editable there). **Effort:** M.

### P1-6. No route guards, 404, error or loading boundaries
- **Missing:** no `middleware.ts`, no `app/not-found.tsx`, `error.tsx`, `loading.tsx`; `ProtectedRoute` exists but no page uses it.
- **Files:** `client/app/*`, `client/middleware.ts` (new).
- **Side:** frontend. **Deps:** none. **Effort:** S–M.

### P1-7. Rate limiting is per-process
- **Missing:** in-memory buckets break under multiple API instances and reset on restart.
- **Files:** `server/src/middleware/rateLimit.ts`.
- **Side:** backend. **Deps:** Redis or equivalent. **Effort:** M.

---

## P2 — Important improvements

| # | Task | Missing | Files | Side | Deps | Effort |
|---|---|---|---|---|---|---|
| P2-1 | Enforce CSP | `Content-Security-Policy-Report-Only` only | `client/next.config.mjs` | frontend | none | S |
| P2-2 | Community moderation & pagination | no edit/delete/report, hard `limit(30)` | `controllers/community.controller.ts`, `routes/community.routes.ts`, community page | both | none | M |
| P2-3 | Admin capabilities | overview counters only; no user/role management, no content moderation | `admin.controller.ts`, `admin.routes.ts`, `dashboard/admin/page.tsx` | both | an admin account, role assignment path | L |
| P2-4 | Analytics time series | `weeklyActivity` deliberately empty | new event collection or derived XP events; `analytics.controller.ts`, analytics page | both | P0-4 | M |
| P2-5 | Admin CRUD for domains/projects | catalogue is read-only and seed-driven | new routes/controllers, admin UI | both | P2-3 | L |
| P2-6 | Auth hardening | no email verification, no password reset, no refresh tokens, no account lockout beyond rate limits | `auth.controller.ts`, mail provider | backend | mail service | L |
| P2-7 | Legal pages | `/privacy`, `/terms` 404 while linked in footer | `client/app/privacy/page.tsx`, `terms/page.tsx` | frontend | copy | S |
| P2-8 | Accessibility sweep of dashboards | landmarks/labels not audited page by page | dashboard pages | frontend | none | M |

---

## P3 — Future / optional

| # | Task | Note | Effort |
|---|---|---|---|
| P3-1 | Automated E2E (Playwright) for the 5 critical flows | complements P0-5 | M |
| P3-2 | Real code sandbox execution | workspace currently has no run/execute backend | XL |
| P3-3 | Interview simulator & resume analyser | the two largest missing product areas | XL each |
| P3-4 | Remove the 4.8 MB `project-structure.txt` at repo root | audit artefact, not needed (no secrets found in it) | S |
| P3-5 | Dark theme | not designed, not requested | L |
| P3-6 | Horizontal scaling plan | depends on P1-7 + stateless session review | M |

---

## Dependency graph (short)

```
P0-2 (real AI) ─┐
P0-4 (progress models) ─┼─> P1-4 (XP/badges/streak) ─> P1-1 (product pages) ─> P2-4 (analytics time series)
P0-1 (skills lock) ─────┘
P0-3 (API URL) ─> any deployment
P1-2 / P1-3 (keys) ─> AI + social login become usable
```
