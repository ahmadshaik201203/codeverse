# Phase A Implementation Report — Security & Reliability

Date: 2026-11-20 · Scope: Tasks 1–4 only (no Phase B–E work started)

Baseline for every claim in this report: the audit written in `docs/FRONTEND_PROGRESS_REPORT.md`, `docs/BACKEND_PROGRESS_REPORT.md`, `docs/FEATURE_INTEGRATION_REPORT.md`, `docs/REMAINING_WORK.md` and `docs/PROJECT_COMPLETION_SUMMARY.md`.

---

## Task 1 — Client-writable skills (CRITICAL)

### Original problem
`PUT /portfolio/me` accepted an arbitrary `skills[]` array, so any student could publish a profile claiming 100% in any skill without doing any work.

### Root cause
The controller destructured `skills` from the raw request body and wrote it straight into the user document:

```ts
// before (portfolio.controller.ts)
const normalizedSkills = normalizeSkills(skills);
$set: { ...(normalizedSkills !== undefined && { skills: normalizedSkills }) }
```

The only protection was a code comment in `models/User.ts` ("Skill scores are earned from verified work, never seeded"). There was no authorization boundary and no server-owned write path, because nothing in the product wrote skills at all.

### Files changed
- `server/src/controllers/portfolio.controller.ts` — removed `normalizeSkills`; added `SERVER_OWNED_FIELDS` + `rejectServerOwnedFields()`, applied before any write.
- `server/src/services/skillService.ts` — **new**. `recordVerifiedSkill(userId, skillName, points)` is the only writer of skill scores. It accepts an increment (never an absolute score), clamps to 0–100, case-insensitively merges duplicates, and rejects empty names, invalid ids and non-positive/oversized increments.
- `server/src/controllers/mentor.controller.ts` — a *passed* task verification now records skill progress (`VERIFIED_TASK_SKILL_POINTS = 5`) for the project's domain. A failed or unavailable evaluation records nothing.
- `server/src/models/User.ts` — one-line defensive fix in the `pre`-save hook (`this.email` can be absent on a partially loaded document; it previously threw).
- `server/src/__tests__/phase-a.api.test.ts` — coverage (see Task 4).

### Behaviour now
| Request | Before | After |
|---|---|---|
| `PUT /portfolio/me {skills:[...]}` | 200, skills overwritten | **422 `FIELD_NOT_EDITABLE`**, skills untouched |
| `PUT /portfolio/me {xp/role/badges/streak/...}` | silently ignored or partially applied | **422 `FIELD_NOT_EDITABLE`** |
| `PUT /portfolio/me {bio, githubUrl, careerGoal}` | 200 | 200, unchanged behaviour |
| Skill growth | not possible at all | only via `recordVerifiedSkill` (verified work) |

Client-supplied `role`, `email`, `password`, `onboarded`, `firebaseUid`, `authProvider` are rejected by the same guard (defence in depth — none were previously settable through this route).

---

## Task 2 — Fake AI blueprint fallback

### Original problem
`POST /ai/project-blueprint` returned a hardcoded four-phase blueprint with HTTP 200 when `GEMINI_API_KEY` was missing, and the UI presented it as generated.

### Root cause
`ai.controller.ts` had a `getFallbackBlueprint()` branch that the catch-all `try/catch` reached whenever generation failed, and it answered `200 { blueprint, generated: true }`. The client only checked `res.ok`, so fabricated content was indistinguishable from real output.

### Files changed
- `server/src/controllers/ai.controller.ts` — rewritten. No fallback of any kind. Missing key → `503 AI_UNAVAILABLE` ("…No blueprint was generated."). Empty model output → `502 AI_EMPTY_RESPONSE`. Unparseable or structurally incomplete JSON → `502 AI_INVALID_RESPONSE` (shape validated by `isBlueprint`). Errors go through the shared error middleware, so the body is `{ error: { code, message }, requestId }`.
- `client/app/projects/[projectId]/blueprint/page.tsx` — uses the central API client; explicit `initialLoading` / `regenerating` states; a dedicated AI-unavailable state; a "No blueprint was returned" state when the server does not confirm `generated: true`; retry button; a non-retryable "Project not found" state. Nothing is rendered unless the response is confirmed generated.
- `client/__tests__/blueprint.test.tsx` — coverage (Task 4).

### Behaviour now
| Situation | Before | After |
|---|---|---|
| Gemini not configured | 200 + invented 4-phase plan | **503 `AI_UNAVAILABLE`**, no `blueprint` key |
| Model returns bad JSON | 500 "Failed to generate" | 502 `AI_INVALID_RESPONSE` |
| Model returns empty text | 500 | 502 `AI_EMPTY_RESPONSE` |
| UI with no key | showed fake phases + "AI architect plan" | "AI blueprint generation is unavailable … no blueprint was generated" + Try again |

---

## Task 3 — API base URL configuration

### Original problem
`client/.env.local` had an empty `NEXT_PUBLIC_API_URL`, `lib/api.ts` fell back to `http://localhost:5000/api` in every environment, and 14 call sites bypassed `apiFetch` with hardcoded `http://localhost:5000/api/...`.

### Root cause
The base URL was an implicit default rather than configuration, and several pages used `fetch()` directly with a manually attached token.

### Files changed
- `client/lib/api.ts` — single source of truth: `getApiBaseUrl()`, `isApiConfigured()`, `apiUrl()`, `apiFetchRaw()`, plus the existing `apiFetch()` now built on `apiFetchRaw()`. Validation: non-URL values throw `API_CONFIG_INVALID`; a production build with no value throws `API_NOT_CONFIGURED`; development falls back to `http://localhost:5000/api` with one console warning.
- Call sites migrated to `apiFetchRaw` (all hardcoded URLs removed):
  - `client/app/dashboard/projects/page.tsx`
  - `client/app/dashboard/community/page.tsx` (create post, reply, upvote)
  - `client/app/domains/[slug]/projects/page.tsx`
  - `client/app/portfolio/[username]/page.tsx`
  - `client/app/projects/[projectId]/page.tsx`
  - `client/app/projects/[projectId]/blueprint/page.tsx`
  - `client/app/projects/[projectId]/workspace/page.tsx` (project, mentor ask, verify, review)
  - `client/components/GlobalAiCopilot.tsx`
- `client/lib/api.ts` also maps mentor/copilot failure bodies to their real server message instead of a generic "make sure the server is running" (workspace + copilot).
- `.env.example` — comment clarifying that the value must include `/api` and is **required** for production builds. No real `.env` file was touched.

### Behaviour now
| Context | Result |
|---|---|
| Dev, variable unset | `http://localhost:5000/api` (warning logged) |
| Dev/prod with valid value | that value, trailing slashes trimmed |
| Prod build, variable unset | requests fail with `API_NOT_CONFIGURED` (no silent localhost) |
| Invalid value | `API_CONFIG_INVALID` |

`grep -rn "localhost:5000" client/app client/components client/lib client/context` now returns only the documented development fallback and its test.

---

## Task 4 — Automated tests

### Framework choice and rationale
- **Backend:** Node's built-in `node:test` runner driven by the already-installed `ts-node`. No new runtime or HTTP-test dependency was added.
- **Frontend:** `vitest` + `jsdom` + `@testing-library/react` + `@testing-library/user-event` as dev dependencies (the client had no test tooling at all). Vitest shares the project's TypeScript/esbuild pipeline and supports the `@/` alias.
- To make the API testable without a live process, the Express app was extracted into `server/src/app.ts` (`createApp()`); `server/src/index.ts` now only owns configuration, database connection and `listen`.

### Isolation
Tests never touch the development database. The suite connects to `mongodb://127.0.0.1:27017/codeverse_phase_a_test` (override with `TEST_MONGODB_URI`), **refuses to start unless the database name ends in `_test`**, and drops that database between tests.

`client/.env.local` and `server/.env` were not modified; the AI tests delete `GEMINI_API_KEY` from the process environment so the "provider not configured" path is deterministic.

### Tests added
`server/src/__tests__/phase-a.api.test.ts` (19 tests):
- registration success, duplicate email 409, weak password 422 (no account created), identical 401 for wrong password and unknown email, `/auth/me` 401 unauthenticated and 200 authenticated, empty login body 422;
- student blocked from `GET /admin/overview` (403);
- skills manipulation blocked (422 + stored score unchanged + bio unchanged), `xp`/`role`/`badges`/`streak` blocked, legitimate profile edit still works and preserves earned skills, unsafe URL rejected;
- `recordVerifiedSkill` increments instead of setting, merges case-insensitively, caps at 100, rejects 0/empty/invalid ids;
- blueprint without a provider → 503 `AI_UNAVAILABLE` with no `blueprint` key, malformed request 422, unauthenticated 401;
- unknown route 404, health 200.

`client/lib/__tests__/api.test.ts` (9 tests): configured URL and slash trimming, dev fallback, invalid URL error, production `API_NOT_CONFIGURED`, token header, server error message/code propagation, 401 clears the stored token, network error mapping, raw response passthrough.

`client/__tests__/blueprint.test.tsx` (6 tests): loading state, AI-unavailable state with no phases/architecture/progress bar, retry triggers a new request, successful blueprint rendered only when `generated: true`, unconfirmed response refused, 404 project state.

`client/__tests__/auth.test.tsx` (4 tests): empty-field validation without an API call, successful sign-in storing the session and routing to `/dashboard`, not-onboarded routing to `/onboarding`, server rejection message with no session started.

`client/__tests__/auth-context.test.tsx` (3 tests): session restore from the stored token, expired session dropped, sign-out clears the token.

### Test commands (added to package scripts)
- `server/package.json`: `"test": "node --require ts-node/register --test src/__tests__/*.test.ts"`
- `client/package.json`: `"test": "vitest run"`, `"test:watch": "vitest"`

---

## Commands executed and results

| Command | Result |
|---|---|
| `cd server && npm test` | **PASS** — 19 tests, 0 fail (~7.7 s) |
| `cd server && npx tsc --noEmit` | **PASS** (exit 0) |
| `cd server && npm run build` | **PASS** (exit 0) |
| `cd client && npm test` | **PASS** — 22 tests, 4 files (one `act()` warning in the loading-state test; no failure) |
| `cd client && npx tsc --noEmit` | **PASS** (exit 0) |
| `cd client && npx next lint` | **PASS** — "No ESLint warnings or errors" |
| `cd client && npm run build` | **PASS** (exit 0), blueprint route 6.38 kB / 117 kB first load |

### Live integration checks (running API on `:5000`, `next dev` on `:3200`)

| Check | Evidence |
|---|---|
| Student cannot modify verified skills | `PUT /api/portfolio/me {skills:[{name:"Hacked",score:100}]}` → **422 `FIELD_NOT_EDITABLE`**, `GET /portfolio/me` still `skills: []` |
| Legitimate profile edit still works | `PUT` with `bio` → 200, then reverted to its previous empty value |
| Missing Gemini produces an honest error | `POST /api/ai/project-blueprint` → **503 `AI_UNAVAILABLE`**, `'blueprint' in body === false` |
| Blueprint UI shows no fake content | Browser check on `/projects/ai-ecommerce-platform/blueprint`: page text is the unavailable notice, `Phase 1` absent, `[role=progressbar]` absent, "Try again" present |
| Requests use the configured base URL | All pages render data through `apiFetchRaw`; `/dashboard/projects` loaded 6 project links; no `localhost:5000` string remains outside the dev fallback |
| Localhost development still works | Dev fallback warning observed in the browser console, then successful login and project list |
| Email/password login still works | Browser login `tester@codeverse.dev` → redirected to `/dashboard`; API tests cover 200/401/422 |

---

## What is only partially complete (honest list)

1. **Skill progression has no reachable student path yet.** `recordVerifiedSkill` is wired to `mentor/verify`, which still returns 503 without a Gemini key. So the *manipulation* is fixed, but skills cannot grow in this deployment — this is Phase B/C work (progress persistence), not a silent claim of completion.
2. **Backend tests need a local MongoDB.** `mongodb-memory-server` is installed but its binary is not cached (`mongodb-binaries/*.zip.downloading`), so the suite targets an isolated database on the local server instead. Running `npm test` on a machine without MongoDB fails at connect — no CI configuration exists.
3. **`server/src/__tests__` is type-checked and emitted by `tsc`** into `dist/__tests__`. Harmless for runtime, but the build output is not pristine.
4. **No end-to-end suite.** Browser verification of the blueprint page was manual; there is no Playwright/Cypress coverage, and admin/faculty data paths remain untested (no admin account).
5. **`next start` with an unset API URL now fails by design.** Local production-mode previews need `NEXT_PUBLIC_API_URL` set in the shell (or in `client/.env.local`, which this task deliberately did not modify). `next dev` is unaffected.
6. **One React `act()` warning** remains in the blueprint loading-state test; it does not affect the assertion.
7. In-memory rate limiting, `Content-Security-Policy-Report-Only`, and the 7 missing dashboard routes are untouched — they belong to later phases.

## Files created / changed

**Created:** `server/src/app.ts`, `server/src/services/skillService.ts`, `server/src/__tests__/phase-a.api.test.ts`, `client/vitest.config.ts`, `client/lib/__tests__/api.test.ts`, `client/__tests__/blueprint.test.tsx`, `client/__tests__/auth.test.tsx`, `client/__tests__/auth-context.test.tsx`, `docs/PHASE_A_IMPLEMENTATION_REPORT.md`.

**Changed:** `server/src/index.ts`, `server/src/controllers/ai.controller.ts`, `server/src/controllers/portfolio.controller.ts`, `server/src/controllers/mentor.controller.ts`, `server/src/models/User.ts`, `server/package.json`, `client/lib/api.ts`, `client/package.json`, `client/app/dashboard/projects/page.tsx`, `client/app/dashboard/community/page.tsx`, `client/app/domains/[slug]/projects/page.tsx`, `client/app/portfolio/[username]/page.tsx`, `client/app/projects/[projectId]/page.tsx`, `client/app/projects/[projectId]/blueprint/page.tsx`, `client/app/projects/[projectId]/workspace/page.tsx`, `client/components/GlobalAiCopilot.tsx`, `.env.example`.

No `.env`, credential, database record or user account was modified, and nothing was committed or pushed.
