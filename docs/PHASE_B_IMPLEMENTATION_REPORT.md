# Phase B Implementation Report — Real AI Functionality

Date: 2026-11-20 · Scope: Phase B Tasks 1–6 only (Phase C not started)
Provider: **Google Gemini**, model **`gemini-2.5-flash`** (`GEMINI_MODEL` default)
Database used for verification: isolated `codeverse_phase_b_test`, `codeverse_phase_b_live_test`, `codeverse_phase_b_ui_test`

> **Credential note:** `server/.env` was not modified. The Gemini key the user pointed to lives in `.env.example`; it was exported into the process environment only for the live suite and the temporary API process. No key value is printed, logged, stored in MongoDB, or returned by any endpoint. The only `.env.example` change is a new `GEMINI_TIMEOUT_MS` entry.

---

## Task 1 — Gemini configuration and verification

### What the integration looked like before Phase B
- `server/src/config/env.ts` reads `GEMINI_API_KEY` (optional) and `GEMINI_MODEL` (default `gemini-2.5-flash`). The variable name is exactly **`GEMINI_API_KEY`**.
- Controllers constructed `new GoogleGenerativeAI(env.geminiApiKey)` per request and called `generateContent` directly.
- There was **no request timeout**, **no retry**, **no detection of truncated responses**, and provider errors fell through to the generic 500 handler in some paths.
- Nothing logged the key, but raw upstream failures were not classified.

### What changed
New `server/src/services/aiGateway.ts` is now the only Gemini client:
- reads the key/model in one place and reports `isConfigured()` without exposing values;
- applies `GEMINI_TIMEOUT_MS` (new optional variable, default **45000 ms**) through the SDK's `RequestOptions.timeout`;
- retries transient failures: one retry for 5xx/timeouts, up to three attempts for 429 with bounded `RetryInfo`/`Retry-After` backoff (capped at 15 s per wait);
- detects `finishReason: MAX_TOKENS` and returns `502 AI_TRUNCATED` instead of a vague parse error;
- maps failures to stable codes: `503 AI_UNAVAILABLE`, `429 AI_RATE_LIMITED`, `504 AI_TIMEOUT`, `502 AI_UPSTREAM_ERROR`, `502 AI_INVALID_RESPONSE`;
- logs only `{ scope, attempt, providerStatus, name }` — never the upstream message or key.

Controllers now call the exported `aiGateway` object, which is also the seam used by mocked tests.

**Configuration required to run AI features:** `GEMINI_API_KEY` (server-side). Optional: `GEMINI_MODEL`, `GEMINI_TIMEOUT_MS`.

---

## Task 2 — AI Project Blueprint

### Implementation
- **Persistence model:** `server/src/models/Blueprint.ts` stores `{ userId, projectId, architecture, steps[], bestPractices[], providerModel, generatedAt }`, with a unique `(userId, projectId)` index. Regeneration upserts the learner's saved blueprint.
- **Generation:** `POST /api/ai/project-blueprint` builds a project-specific prompt from title, difficulty, description, problem statement, technologies, target skills and estimated time. The prompt requires 4–7 ordered phases with action-verb tasks, learning objectives and deliverables, plus best practices.
- **Strict validation:** `server/src/services/aiSchemas.ts` validates every field: architecture ≥ 20 chars, 2–10 phases, 1–15 tasks per phase, 1–10 learning objectives, 1–10 deliverables, 1–10 best practices, non-empty strings within length limits. Any missing or malformed field → `502 AI_INVALID_RESPONSE`; nothing is patched with local content.
- **Retrieval:** `GET /api/ai/project-blueprint/:projectId` returns the signed-in learner's saved blueprint or `404 BLUEPRINT_NOT_FOUND`.
- **Slug support:** both endpoints resolve an ObjectId **or project slug**, matching how project pages address projects. (Found during live browser verification: the page used the slug, so a strict ObjectId check made generation fail with “A valid project ID is required.” Fixed and covered by a test.)
- **No fabrication:** no fallback blueprint exists anywhere in the codebase.
- **Frontend:** the blueprint page first loads the saved blueprint, generates only when none exists, shows loading/error/retry states, renders phases, per-phase learning objectives and deliverables, and shows the saved date and model. A one-shot load guard prevents React StrictMode from generating twice in development.

### Live evidence (real provider)
- Live suite: `HTTP 200`, 5 phases, persisted, then retrieved from MongoDB with identical architecture.
- Browser (isolated UI database): generated **6 phases / 30 tasks**, each with learning objectives and deliverables, architecture and 6 best practices; header showed `SAVED AI BLUEPRINT`, `NOV 20, 2026 · GEMINI-2.5-FLASH`.
- Reloading the page produced only `GET /project-blueprint/... → 200`; no new generation call.
- Database record: `{ phases: 5, tasks: 25, objectives: 4, deliverables: 3, model: "gemini-2.5-flash", hasUser: true, architectureChars: 907 }` (a second dev-mode generation completed after the rendered one before the StrictMode guard was added; the displayed and saved blueprints now come from a single request).

---

## Task 3 — AI Mentor

### Implementation
- **All seven modes** are implemented in `server/src/services/mentorModes.ts` and accepted by `POST /api/mentor/ask` as `mode`: `learn`, `debug`, `explain`, `quiz`, `interview`, `project-help`, `career-help`. Each mode has specific behaviour instructions (Socratic hints, root-cause debugging, one-question-at-a-time quiz/interview, project unblocking, career guidance).
- **Conversation context:** the client sends up to 20 prior turns (`history: [{ role: 'user' | 'mentor', content }]`); the server validates the shape, maps roles to Gemini's `user`/`model`, drops a leading model turn, and sends the full thread with a mode-specific system instruction.
- **Input safety:** project text, task context, code and the learner message are wrapped in `<untrusted_*>` blocks; the system instruction forbids following instructions inside them. Modes are enum-validated; history entries are whitelisted by `validateBody`.
- **Honest failure:** missing provider → `503 AI_UNAVAILABLE`; empty reply → `502 AI_EMPTY_RESPONSE`; never a simulated answer.
- **Frontend:** new `/dashboard/mentor` page (the sidebar link previously 404'd) with seven mode buttons, empty state with per-mode suggested prompts, conversation log, mode labels on answers, loading indicator, error alert and a retry that resends the same question without duplicating it. The workspace mentor now sends `project-help` mode plus conversation history and shows an inline error with retry.

### Live evidence (real provider)
| Mode | Result | Latency | Reply length |
|---|---|---|---|
| learn | 200 | 4.6 s | 215 chars |
| debug | 200 | 6.7 s | 3405 chars |
| explain | 200 | 2.2 s | 417 chars |
| quiz | 200 | 1.9 s | 486 chars |
| interview | 200 | 3.1 s | 367 chars |
| project-help | 200 | 3.2 s | 530 chars |
| career-help | 200 | 9.5 s | 3307 chars |

Browser: the mentor page rendered all seven modes; during a later browser check the provider returned 429 quota, and the UI displayed the server message with a working **Try again** button and no fabricated reply. Successful reply rendering is covered by the UI test; real replies for every mode are proven by the live API suite above.

---

## Task 4 — Code Evaluator

### Implementation
- `POST /api/evaluator/review` accepts `{ projectId, codeSnippet, taskDescription?, language? }`.
- **Languages:** `javascript`, `typescript`, `python`, `java`, `cpp`, `go`, `rust`, `html`, `css`, `sql`, `mixed` — the languages advertised in onboarding plus the workspace's mixed HTML/CSS/JS. The selected language is included in the prompt and echoed in the response.
- **Validation:** `parseCodeReview` requires a finite score in 0–100, an exact verdict (`Passed`/`Needs Improvement`/`Failed` — no inference from the score), a summary of at least 10 characters, well-formed security findings (severity + issue + recommendation), performance observations (category + observation + suggestion), and at least one actionable item. Otherwise `502 AI_INVALID_RESPONSE`; no invented score or automatic pass.
- **Prompt:** analyses correctness, security, performance and quality, must reference only code actually shown, and must not claim execution.
- **Frontend:** the review modal opens immediately with a loading state, shows the server error with a new **Try review again** button, and displays results only from the server's validated `review` payload. The workspace sends `language: 'mixed'`.

### Live evidence
- Real evaluator run on deliberately unsafe code (`innerHTML` from `location.hash`) returned `HTTP 200`, score **10**, verdict **Failed**, 1 security finding, 1 performance observation, 3.4 s.
- Browser: loading state then honest `429` error with **Try review again**; success rendering is covered by server validation and the live API 200 (the browser retry hit the same provider quota).

---

## Task 5 — Verified skill progression

- `recordVerifiedSkill()` remains the only writer of skill scores; it accepts an increment only, merges case-insensitively, clamps to **100**, and rejects invalid ids/names/points.
- Progression is wired **only** to `mentor/verify` when the validated AI verdict is `isPassed: true` (+5 to the project domain skill). A failed verdict, provider failure, or code review awards nothing.
- New tests prove: passing verification awards exactly 5; failed verification leaves skills empty; provider-unavailable verification returns 503 and leaves skills empty; a 100/100 “Passed” code review does not touch skills; a pre-seeded 98 is capped at 100; client-supplied skills remain rejected with 422 (Phase A).
- Live verification: real task submission returned `passed=true`, skills went `0 → 1` row with a score in 1–100.

---

## Task 6 — Frontend integration

| Surface | Loading | Error | Retry | Empty state | Verified |
|---|---|---|---|---|---|
| Blueprint page | yes | 503/502/404/truncated | yes | “no blueprint yet” | live 6-phase render, saved reload, mobile 390 / desktop 1440 |
| Mentor page (new) | yes | yes | yes, no duplicate turn | seven mode prompts | live modes render; live 429 error + retry; mobile/desktop |
| Code review modal | yes | yes | yes (new) | “no findings” branches | live loading + 429 error + retry; result rendering from validated payload |
| Workspace mentor | yes | inline alert | yes | prompt chips | build + unit tests (live call blocked by provider quota) |

Layout checks used `document.documentElement.scrollWidth` at 390 px (374 < 390, no overflow) and 1440 px (1423 < 1440), with all seven mode controls and the composer present. No screenshots were taken.

All AI content is rendered only after the server confirms a parsed/validated payload (`generated: true` for blueprints, `reply` for mentor, `review` for evaluator).

---

## Testing

### Mocked suites (no network, no credentials)
| Check | Command | Result |
|---|---|---|
| Backend tests | `cd server && npm test` | **36/36 pass**, 13 suites (19 Phase A + 17 Phase B) |
| Backend types | `cd server && npx tsc --noEmit` | exit 0 |
| Backend build | `cd server && npm run build` | exit 0 |
| Frontend tests | `cd client && npm test` | **26/26 pass**, 5 files |
| Frontend types | `cd client && npx tsc --noEmit` | exit 0 |
| Frontend lint | `cd client && npx next lint` | no warnings or errors |
| Frontend build | `cd client && npm run build` | exit 0; `/dashboard/mentor` 6.36 kB / 117 kB; blueprint 6.77 kB / 117 kB |

Phase B mocked coverage: blueprint generation + persistence + saved retrieval, slug support, malformed/incomplete output rejection, provider-error sanitisation, gateway error classification, 404 for no saved blueprint; mentor mode + history forwarding, empty reply, invalid mode/history; evaluator valid review, invalid score/verdict/summary/no-actionable rejection; skill awards for pass only, no award on fail/unavailable/review, cap at 100.

### Real Gemini suite (billable, credentials required)
Command: `GEMINI_API_KEY=... npm run test:gemini` (file `server/src/__tests__/phase-b.gemini.live.ts`, excluded from `npm test`).

| Check | Result |
|---|---|
| Blueprint generation + validation + MongoDB persistence + retrieval | **PASS** — 200, 5 phases, 24.8 s |
| All seven mentor modes | **PASS** — 7/7 200 with non-empty real replies |
| Code evaluator | **PASS** (isolated rerun after quota) — 200, score 10, Failed, actionable findings |
| Task verification + skill award | **PASS** — passed=true, skill row created |
| Full-suite run with all 10 cases | 9/10 on the first two runs; the only failure was provider quota/truncation (see blockers), and the evaluator case passed when re-run after the quota window. No assertion ever failed for our validation or persistence logic. |

### Browser verification (isolated API on :5100 with the real key, client on :3300, dedicated `_ui_test` database)
- Email/password login and 4-step onboarding completed.
- Blueprint: real generation rendered; saved metadata shown; reload used only the saved copy; database record confirmed.
- Mentor: seven modes rendered; provider 429 surfaced honestly with retry (quota exhausted during the session).
- Code review: loading state and 429 error with retry confirmed.
- Mobile (390×844) and desktop (1440×900): no horizontal overflow.

---

## Files changed

**Created**
- `server/src/services/aiGateway.ts`
- `server/src/services/aiSchemas.ts`
- `server/src/services/mentorModes.ts`
- `server/src/models/Blueprint.ts`
- `server/src/__tests__/phase-b.api.test.ts`
- `server/src/__tests__/phase-b.gemini.live.ts`
- `client/app/dashboard/mentor/page.tsx`
- `client/__tests__/mentor.test.tsx`
- `docs/PHASE_B_IMPLEMENTATION_REPORT.md`

**Changed**
- `server/src/controllers/ai.controller.ts`
- `server/src/controllers/mentor.controller.ts`
- `server/src/controllers/evaluator.controller.ts`
- `server/src/routes/ai.routes.ts`
- `server/src/routes/mentor.routes.ts`
- `server/src/routes/evaluator.routes.ts`
- `server/src/middleware/validate.ts` (`chatHistory` field type)
- `server/src/config/env.ts` (`GEMINI_TIMEOUT_MS`)
- `server/package.json` (`test:gemini`)
- `client/app/projects/[projectId]/blueprint/page.tsx`
- `client/app/projects/[projectId]/workspace/page.tsx`
- `client/components/workspace/CodeReviewModal.tsx`
- `client/__tests__/blueprint.test.tsx`
- `.env.example` (timeout variable and comment only)

No `.env` file, credential, existing API contract or user record was modified; nothing was committed or pushed.

---

## Remaining blockers and limitations

1. **Provider quota limits the browser run.** The Gemini key in use is subject to a low free-tier rate limit. During verification the mentor/reviewer returned `429`; the API retries with bounded backoff and the UI shows an honest error, but a live browser success for those two surfaces depends on quota headroom. Real 200 responses for every mentor mode and for the evaluator were captured by the live suite.
2. **One full green live run is not recorded in a single invocation.** The two full attempts each failed only the evaluator case (first `MAX_TOKENS` truncation, then `429`); after raising output budgets and adding truncation detection, the evaluator passed when re-run alone. All ten live cases have passed across runs, but not in one continuous pass.
3. **No CI and no Playwright/E2E suite.** Browser checks were manual. Backend tests require a local MongoDB and refuse any database whose name does not end in `_test`.
4. **Dev-mode double generation** was observed and fixed with a one-shot load guard; production builds were unaffected.
5. **Live test files are type-checked and emitted** by `tsc` into `dist/__tests__` (same harmless behaviour as Phase A).
6. **`.env.example` contains a live-looking Gemini key.** It should be rotated and replaced with a placeholder; the key should live only in `server/.env` or the deployment secret store. No value was printed here.
7. **AI content is not moderated or cached per project across users**; each learner’s blueprint is stored per user as required, but no content-review pipeline exists.
8. **Phase C was not started.**
