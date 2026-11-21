# CodeVerse — Implementation Roadmap

Derived from `PROJECT_AUDIT.md` (P0–P3 findings), `SECURITY_AUDIT.md` (SEC-01…SEC-20) and `ARCHITECTURE.md` (target design).

**Guiding constraints from the brief:** inspect before modifying · preserve working features and user data · no new dependencies without approval · no commits/pushes · never claim untested work as working.

---

## Baseline facts that shape the plan

- ✅ Both projects typecheck, lint clean, and build (measured — `PROJECT_AUDIT.md` §2).
- ✅ Real functionality worth preserving: local auth, project/domain catalogue, onboarding persistence, iframe sandbox, Gemini blueprint.
- ❌ Zero tests, zero CI.
- ❌ No storage for skills, assessments, roadmaps, progress, submissions, conversations, roles.
- ❌ 8 of 13 sidebar destinations 404.
- ❌ Every "statistic" in the dashboard, leaderboard, analytics and portfolio is fabricated in at least one path.

**Ordering change vs. the brief:** Phase 1 → Phase 2 → Phase 3, but with a **service-layer extraction** inserted before Phase 4, and Phase 2 split so tokens/primitives land before route restyling. Rationale in `ARCHITECTURE.md` ADR-2/ADR-6.

---

## Phase 0 — Audit ✅ complete

**Delivered:** `docs/PROJECT_AUDIT.md`, `docs/ARCHITECTURE.md`, `docs/API_MAP.md`, `docs/SECURITY_AUDIT.md`, this file. Live credentials removed from `.env.example`.

**Exit criteria met:** all source read; every route mapped to its API; models and drift documented; placeholders and dead links enumerated; security issues ranked; build/test reality measured.

**Outstanding owner decisions:** see "Approvals & blockers" at the end.

---

## Phase 1 — Security & foundation

**Goal:** remove the account-takeover class of bugs and create the platform every later phase depends on. Behaviour-preserving apart from security.

| Task | Files | Depends on |
|---|---|---|
| 1.1 Env validation at boot (fail fast, `exit(1)`, no secret in message) | `server/src/config/env.ts` (new), `index.ts` | — |
| 1.2 Delete both JWT secret fallbacks (SEC-03) | `middleware/auth.ts`, `controllers/auth.controller.ts` | 1.1 |
| 1.3 Verify Firebase ID tokens; identity only from verified token (SEC-02) | `controllers/auth.controller.ts`, new `services/firebaseAdmin.ts` | **firebase-admin (approval)** |
| 1.4 CORS allowlist from `CORS_ORIGINS` (SEC-04) | `index.ts`, env | — |
| 1.5 `role` on `User` + `requireRole` middleware (SEC-05) | `models/User.ts`, `middleware/auth.ts` | — |
| 1.6 Rate limiting: auth bucket + per-user AI bucket (SEC-07) | `middleware/rateLimit.ts` (new) | **express-rate-limit (approval)** |
| 1.7 Zod validation on every body/query/param; strip unknown keys (SEC-08) | `schemas/*` (new), all routes | **zod (approval)** |
| 1.8 Escape regex / cap length in search (SEC-09) | `project.controller.ts`, `community.controller.ts` | — |
| 1.9 Remove public `email`; add `portfolioPublic` opt-in (SEC-10) | `portfolio.controller.ts`, model, portfolio page | — |
| 1.10 Fail fast on MongoDB failure; honest `/health` (SEC-11) | `config/db.ts`, `index.ts` | 1.1 |
| 1.11 Central error handler + `AppError` + 404 JSON (SEC-12) | `middleware/error.ts` (new), all controllers | — |
| 1.12 Request logging with redaction + requestId (SEC-13) | `middleware/log.ts` (new) | 1.11 |
| 1.13 Security headers, body-size limit (SEC-14, SEC-17) | `next.config.mjs`, `index.ts` | **helmet (approval)** |
| 1.14 Remove hardcoded Firebase config fallbacks (SEC-18) | `client/lib/firebase.ts` | — |
| 1.15 Delete/fence the generic XP endpoint (SEC-06) — interim | `gamification.routes/controller` | — |
| 1.16 Replace fake review/verify with honest `503` (AI honesty) | `evaluator.controller.ts`, `mentor.controller.ts`, `CodeReviewModal.tsx`, workspace | — |
| 1.17 Complete `.env.example` + `.env.local.example`, rotate-secrets note | root, `server/`, `client/` | — |
| 1.18 Replace 11 hardcoded `localhost:5000` with `apiFetch` | client files (11) | — |

**Exit criteria**
- Server refuses to boot without `JWT_SECRET` / `MONGODB_URI`; message names the missing var only.
- Forged `POST /auth/google {email}` returns **401** (verified with a live request).
- A student JWT gets **403** from every admin route.
- `npm audit` clean of high/critical; all suites still pre-existing build/lint/tsc green.
- `.env.example` contains no real values (verified by inspection).

**Risk:** 1.3 requires the owner's Firebase project access; without it, Google/phone login must be **disabled** with a clear UI message rather than left insecure. That is the correct fallback.

---

## Phase 2 — Design system & global redesign

**Goal:** one coherent editorial identity using the supplied landscape; delete the `!important` debt; make data screens readable.

| Task | Notes |
|---|---|
| 2.1 Place the mountain asset | Owner must supply the file. Suggested `client/public/brand/mountains.jpg`. **Blocked until provided** — I can build the layout with a placeholder and swap the file without code changes. |
| 2.2 Rewrite `globals.css` as tokens | Remove the `!important` block and `.glass-card` overrides. Define `--ink/--ivory/--forest/--sage/--surface` tokens. |
| 2.3 Extend `tailwind.config.ts` | Map tokens; add typography scale, radii, shadows; add `prefers-reduced-motion`-aware keyframes. |
| 2.4 Build `components/ui/*` primitives | Button, Card, Field, Badge, Tabs, Modal, Table, Progress, EmptyState, Toast, Skeleton. |
| 2.5 Build `components/brand/MountainBackdrop` + shell | Fixed backdrop, ink wash overlay, hairline dividers, responsive. |
| 2.6 Route-group layouts | `(marketing)`, `(auth)`, `(app)`, `(editor)`, `(admin)` with appropriate surface density. |
| 2.7 Restyle marketing home | Hero copy **exactly** as specified: "Learn with Purpose. Build with Confidence." / the given description / CTAs **Begin Your Journey**, **Explore Learning Paths**. Remove cyan-purple gradients and all fabricated proof numbers. |
| 2.8 Restyle auth + onboarding | Consistent with marketing; keep form logic untouched. |
| 2.9 Restyle dashboard + catalogue + project/blueprint | Translucent cards over landscape where content is light; solid where dense. |
| 2.10 Restyle workspace + review modal | Solid surfaces, high contrast, mono type; Monaco theme aligned to palette. |
| 2.11 Restyle community, portfolio, admin | Portfolio must look like a shareable public artifact. |
| 2.12 Contrast audit | Verify body text ≥ 4.5:1 on every surface; keyboard focus visible everywhere. |

**Exit criteria:** no `!important` in `globals.css`; one palette across all 20 routes; hero copy matches the brief verbatim; editor and tables readable; `next build` green; no layout regressions on the 5 route groups at 375/768/1440px.

**Note:** the brief's palette appears nowhere in the current code, so this is a full redesign of presentation only — no logic changes in this phase.

---

## Phase 3 — Authentication & onboarding

| Task | Status today |
|---|---|
| 3.1 Email register/login | ✅ works — keep, harden with 1.7/1.6 |
| 3.2 Google auth (verified) | ⚠️ works insecurely — fix in 1.3 |
| 3.3 Phone auth | ⚠️ works insecurely; requires Firebase phone quota/billing — **owner decision**; hide the option if unsupported |
| 3.4 Session management | ⚠️ localStorage JWT; move to HttpOnly cookie + refresh (or document accepted risk) |
| 3.5 Logout | ⚠️ client-only; add server invalidation or short-lived tokens |
| 3.6 Protected routes | ⚠️ client-only; add `middleware.ts` for UX + rely on API |
| 3.7 Profile & settings | ❌ `/dashboard/settings` 404s — build `PATCH /users/me` + page |
| 3.8 Onboarding | ✅ works — preserve; add validation and skill seeding that is **honest** (empty, not fake scores) |
| 3.9 Error messaging | ⚠️ improve field-level errors; no success UI before server confirmation |

**Important data decision:** new users must start with `xp: 0`, `streak: 0`, `badges: []`, `skills: []`. Existing users created with fabricated defaults need a **one-time migration** to zero them out — this mutates user data and therefore requires explicit approval.

---

## Phase 4 — Learning engine (largest scope)

| Module | New models | Endpoints |
|---|---|---|
| Domain explorer | reuse `Domain` | public `GET /domains` (currently auth-only) |
| Skills catalog | `Skill` | `GET /skills`, `GET /skills/:slug` |
| Skill tracking | `UserSkill` | `POST /skills/:id/track`, `DELETE`, `PATCH /progress` |
| Assessments | `Assessment`, `AssessmentAttempt` | `GET /assessments/:skillId`, `POST /assessments/:id/attempt` |
| Results | — | `GET /me/assessments` |
| Gap analysis | derived | `GET /me/skill-gaps` (tracked vs required, computed) |
| Recommendations | derived | `GET /me/recommendations` |
| Roadmap | `Roadmap`, `Milestone` | `GET /me/roadmap`, `PATCH /me/roadmap/:milestoneId` |
| Progress | `XpEvent`, `Milestone` | derived from events |

**Exit criteria:** a user can track a skill, take an assessment, see a real score persisted across reload, view a computed gap list, and tick a roadmap milestone that survives logout. No hardcoded percentages anywhere; every number queryable from Mongo.

**This is greenfield** — roughly the size of the entire current backend. Plan accordingly.

---

## Phase 5 — Project building

- Persist blueprint progress (`ProjectProgress`) — currently lost on refresh.
- Persist workspace files (`WorkspaceFile`) — currently lost entirely.
- `Enrollment` + `Submission`; server-verified task completion feeding `XpEvent`.
- Blueprint caching (one Gemini call per project/user, regenerate on demand) to control cost.
- Keep and harden the iframe sandbox (origin-check `postMessage`, escape `</script>`, add "stop preview").
- Code review: schema-validated, honest failure, persisted as `Submission`.

**Exit criteria:** reload keeps code and progress; review/verify never fabricate; XP only from a server-side verified submission.

---

## Phase 6 — AI mentor

Modes required: **Explain · Debug · Learn · Quiz Me · Interview Me · Project Help · Career Help.**

- One gateway (`server/src/ai/gateway.ts`) with timeout, retry, schema validation, per-user budget.
- `Conversation` persistence so history is real (today `history` is ignored).
- New `/dashboard/mentor` page with mode switch (currently a dead link).
- Fix `GlobalAiCopilot` (no `projectId` → always 400): give it a general route.
- Honest unavailability: `503 AI_UNAVAILABLE`, never a canned reply presented as model output.
- Log usage for cost visibility and Phase 8 analytics.

**Exit criteria:** each of the 7 modes returns validated output; provider outage yields a labelled offline state; two users cannot read each other's conversations; per-user cap returns 429.

---

## Phase 7 — Community & career

- Remove the two invented seed posts; show a genuine empty state.
- Enforce one-vote-per-user (`upvotedBy`) and make votes idempotent.
- Leaderboard strictly from `XpEvent`; streaks from `lastActiveAt` days.
- Public portfolio: opt-in, no email, only verified submissions/projects.
- Career readiness score = documented formula over assessments + submissions + interview practice. **No invented percentages.**
- Interview prep + GitHub/LinkedIn links (validated URLs).
- Moderation hooks (report, hide) ahead of Phase 8.

**Exit criteria:** fresh install shows an empty leaderboard/community (honest), and a user's public portfolio contains only their real data.

---

## Phase 8 — Admin & faculty

- `requireRole('admin'|'faculty')` on every route (dependency: Phase 1.5).
- Users: list, search, role change, deactivate — with audit log.
- Domains/skills/projects CRUD.
- Content moderation queue.
- Platform analytics computed from real collections (replace "1,420 students" / "99.9% uptime").
- Faculty view: cohort progress from `Enrollment`/`XpEvent`.

**Exit criteria:** student JWT → 403 on every admin route (tested); role changes audited; admin UI shows only queryable numbers.

---

## Phase 9 — Testing & release

| Check | Tool | Status |
|---|---|---|
| Frontend typecheck | `tsc --noEmit` | ✅ passes today |
| Backend typecheck | `tsc --noEmit` | ✅ passes today |
| ESLint | `next lint` | ✅ passes today |
| Frontend build | `next build` | ✅ passes today |
| Backend build | `tsc` | ✅ passes today |
| Auth integration tests | vitest + supertest | ❌ **needs approval** |
| API/authorization tests | vitest + supertest | ❌ needs approval |
| AI failure tests | mocked provider | ❌ needs approval |
| DB persistence tests | `mongodb-memory-server` (already a dependency) | ❌ needs runner |
| Responsive/navigation crawl | Playwright | ❌ **needs approval** |

Deliverables: `docs/TEST_REPORT.md` (with real command output, including failures), `docs/DEPLOYMENT.md`, rewritten `README.md`, final `.env.example`.

**Minimum test set before calling this production-ready:**
1. Forged-email Google login → 401.
2. Login → me → logout → me → 401.
3. Two users: A cannot GET/PUT B's portfolio/progress (403/404).
4. Student → admin route → 403.
5. AI unavailable → 503 with honest UI, never a fabricated score.
6. Rate limit: 6th login attempt → 429.
7. Assessment score and milestone progress survive reload (DB assertion).
8. Every sidebar/footer link resolves (no 404) — a crawl, not a manual click.

---

## Approvals & blockers (need the owner)

| # | Item | Why it blocks |
|---|---|---|
| A1 | **Rotate Atlas password + Gemini key** | Leaked in `.env.example`. I removed them from the tree; only the owner can revoke. |
| A2 | **Dependency approval:** `zod`, `express-rate-limit`, `helmet`, `firebase-admin` | Required by Phase 1 (rules 7 of the brief). |
| A3 | **Dependency approval:** `vitest`, `supertest`, `@playwright/test` | Required by Phase 9; without them "tested" claims are impossible. |
| A4 | **Firebase project ownership/access** | Real Google/phone auth and `firebase-admin` verification. Without it, disable those providers. |
| A5 | **Mountain image file** | Phase 2 visual identity; not present in the repo. |
| A6 | **Permission to migrate existing user data** (zero out fabricated XP/skills/badges) | Mutates user records; the brief forbids destroying user data without justification. |
| A7 | **Rotate/scrub git history** for the leaked secrets | Destructive (`filter-repo`); not done. |
| A8 | **Scope confirmation for server-side execution** | Phase 5's "safe code execution" is satisfied by the browser iframe for HTML/CSS/JS. Python/Java execution needs an isolated container service — a large scope addition. |

---

## Sequencing summary

```
Phase 0  audit                        ✅ done, awaiting decisions
Phase 1  security foundation          ← start here after A1/A2
Phase 2  design system + redesign     ← needs A5
Phase 3  auth/onboarding hardening    ← needs A4, A6
── service-layer extraction ──
Phase 4  learning engine              ← largest scope, greenfield
Phase 5  project building persistence
Phase 6  AI mentor (7 modes)
Phase 7  community & career
Phase 8  admin & faculty
Phase 9  tests, docs, release         ← needs A3
```

**Realistic expectation:** this is a multi-session build, not a single pass. Phase 4 alone (8 modules, 6 models, ~14 endpoints, plus UI) exceeds the entire current backend in size. Each phase will be delivered with its own verification output and an updated test report.
