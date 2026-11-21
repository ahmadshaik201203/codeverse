# Feature Integration Report

Audit date: 2026-11-20 · Frontend `client/` ↔ Backend `server/` ↔ MongoDB (`codeverse`)

Method: for every feature, the UI entry point, the API module it calls, the Mongoose model it lands in, plus a live route/endpoint run. "Verified" means executed in this audit; "code only" means inspected but not run.

Legend: **CONNECTED** · **PARTIAL** · **FAKE** · **DISCONNECTED** · **MISSING**

---

## 1. Matrix

| Feature | Frontend | Backend API | Database | Integration status |
|---|---|---|---|---|
| Register | `app/register/page.tsx` → `apiFetch('/auth/register')` | `POST /auth/register` | `User` (bcrypt) | **CONNECTED** — account created and reused all audit |
| Login | `app/login/page.tsx` | `POST /auth/login` | `User` | **CONNECTED** — verified 200 → `/dashboard` |
| Session restore | `context/AuthContext.tsx` | `GET /auth/me` | `User` | **CONNECTED** — token cleared on 401 |
| Logout | `context/AuthContext.tsx` | none (stateless JWT) | — | **CONNECTED** |
| Onboarding | `app/onboarding/page.tsx` | `POST /auth/onboard` | `User` | **CONNECTED** — `onboarded:true` confirmed |
| Google / phone sign-in | `auth/GoogleSignInButton.tsx`, `auth/PhoneSignInBox.tsx` | `POST /auth/google` | `User` (`firebaseUid`) | **DISCONNECTED** — `NEXT_PUBLIC_FIREBASE_API_KEY` empty, no `FIREBASE_*` on the server → button reports "not configured" |
| Dashboard stats | `app/dashboard/page.tsx` | `GET /gamification/stats` | `User` | **CONNECTED** — 0 XP / Level 1 for new account |
| Dashboard recommended | `app/dashboard/page.tsx` | `GET /projects?sort=recommended` | `Project` | **CONNECTED** — 2 cards |
| Domains listing | `app/dashboard/domains/page.tsx` | `GET /domains` | `Domain` | **CONNECTED** — 14 cards |
| Domain detail (dashboard + public) | `app/dashboard/domains/[slug]`, `app/domains/[slug]` | `GET /domains/:slug` | `Domain` | **CONNECTED** |
| Domain projects | `app/domains/[slug]/projects` | `GET /domains/:slug/projects` | `Project` | **CONNECTED** |
| Project library | `app/dashboard/projects/page.tsx` | `GET /projects` | `Project` | **CONNECTED** — 6 cards |
| Project detail | `app/projects/[projectId]/page.tsx` | `GET /projects/:id` | `Project` | **CONNECTED** |
| Architecture blueprint | `app/projects/[projectId]/blueprint` | `POST /ai/project-blueprint` | `Project` (read) | **FAKE without a Gemini key** — server returns a canned 4-phase blueprint; UI presents it as generated. No blueprint is stored. |
| Workspace editor + files | `app/projects/[projectId]/workspace` | none | none | **DISCONNECTED** — code lives in React state only; refresh loses everything |
| Mentor chat (workspace) | workspace page panel | `POST /mentor/ask` | none (no message store) | **PARTIAL** — 503 on this deployment; replies not persisted |
| Mentor chat (global copilot) | `components/GlobalAiCopilot.tsx` | `POST /mentor/ask` | none | **PARTIAL** — same 503, generic error surfaced |
| Task verification | workspace "Verify task" | `POST /mentor/verify` | none | **PARTIAL** — 503 here; even on success the result is not written to `skills`, `completedProjects`, `badges`, `streak` or XP |
| Code review | workspace "Code review" modal | `POST /evaluator/review` | none | **PARTIAL** — 503 here; review not stored |
| Analytics summary | `app/dashboard/analytics/page.tsx` | `GET /analytics/summary` | `User`, `Project` | **PARTIAL** — real counts; weekly activity unavailable by design, chart empty |
| Skill radar | same page | `GET /analytics/radar` | `User.skills` | **PARTIAL** — empty until skills exist, and skills can only be set by the user themselves via `PUT /portfolio/me` |
| Leaderboard | `app/dashboard/leaderboard/page.tsx` | `GET /gamification/leaderboard` | `User` | **CONNECTED** |
| XP earning | none | `POST /gamification/award-xp` (admin only) | `User`, `XpEvent` | **DISCONNECTED** — no UI, and no student-facing path exists |
| Badges | dashboard stat card | read-only via stats | `User.badges` | **MISSING** — nothing ever grants one |
| Streak | dashboard stat card | read-only via stats | `User.streak` | **MISSING** — never incremented |
| Community read | `app/dashboard/community/page.tsx` | `GET /community/posts` | `CommunityPost` | **CONNECTED** (empty state verified) |
| Community write (post / reply / upvote) | same page | `POST /community/posts`, `/replies`, `/upvote` | `CommunityPost` | **PARTIAL** — code complete (idempotent upvote, rate limited); not executed in this audit |
| Public portfolio | `app/portfolio/[username]/page.tsx` | `GET /portfolio/:identifier` | `User` (+populated `completedProjects`) | **CONNECTED** — `teststudent954` renders; no email leaked |
| Edit own portfolio | — | `PUT /portfolio/me` | `User` | **MISSING UI** — endpoint exists, no screen calls it |
| Admin overview | `app/dashboard/admin/page.tsx` | `GET /admin/overview` | all collections | **PARTIAL** — 403 state verified for a student; admin data path NOT VERIFIED (no admin account) |
| Settings | `app/dashboard/settings/page.tsx` | none | `localStorage` | **BY DESIGN device-only**, documented in the file |
| My projects / roadmap / mentor / skills / interview / resume / readiness | sidebar links | none | none | **MISSING** — 7 dead routes (404) |
| Privacy / Terms | footer links | none | none | **MISSING** — 404 |

---

## 2. Implemented backend APIs with no frontend consumer

| API | Note |
|---|---|
| `PUT /portfolio/me` | No editor screen; bio/links/skills cannot be changed from the UI |
| `POST /gamification/award-xp` | Admin-only by design, no admin UI calls it |
| `POST /mentor/verify` | Called by the workspace, but its result has no persistence path |
| `POST /evaluator/review` | Called, result discarded after the modal closes |
| `POST /auth/google` | Consumer exists but is disabled by missing Firebase config |

## 3. Frontend features using hardcoded or fake data

1. **Blueprint page** — renders the server's canned fallback blueprint when Gemini is absent. This is the only true fake-data path found (`server/src/controllers/ai.controller.ts:5-36`).
2. **Watch demo** (`components/WatchDemo.tsx`) — a scripted illustration of the product. Clearly labelled as a demo, not a data claim.
3. **Landing content** — marketing copy and the 18-domain grid are static by nature; domain links resolve to real API-backed pages.
4. **Workspace starter code** — placeholder file contents that are never saved.

No `MOCK_*` / `mockData` / `Math.random()` data generation exists in app code (only a particle position helper in `ui/StarButton.tsx`).

## 4. Buttons and forms that do nothing or cannot succeed

| Element | Behaviour |
|---|---|
| Sidebar: My projects, Active roadmap, AI mentor, Skill gap, Mock interview, Resume analyser, Job readiness | Navigate to 404 |
| Footer: Privacy, Terms | 404 |
| Google / phone sign-in | Visible, always fails with "not configured" |
| Workspace: Verify task / Code review | 503 on this deployment (no AI key) |
| Global copilot send | 503 on this deployment |
| Admin portal (for a student) | Correctly shows the server's 403 restriction |
| Dashboard "Pick a project" / "View all" | Navigate to `/dashboard/projects`, which works |

## 5. API endpoints returning errors

| Endpoint | Status | Cause |
|---|---|---|
| `POST /api/mentor/ask` | 503 | `GEMINI_API_KEY` absent |
| `POST /api/mentor/verify` | 503 | `GEMINI_API_KEY` absent |
| `POST /api/evaluator/review` | 503 | `GEMINI_API_KEY` absent |
| `POST /api/auth/google` | would 503/500 | Firebase Admin not configured |
| `GET /api/portfolio/nobody-here` | 404 | correct behaviour |

## 6. Integration score

| Bucket | Count |
|---|---|
| CONNECTED | 8 |
| PARTIAL | 5 |
| FAKE | 0 counted separately (1 FAKE path: blueprint fallback) |
| DISCONNECTED / MISSING | 3 + 7 dead routes |

**Integration completion: 50% fully connected; 66% counting partial work.**

Two systemic risks for any deployment: (a) `NEXT_PUBLIC_API_URL` is empty and 15 call sites hardcode `http://localhost:5000`, so a deployed client cannot reach a hosted API; (b) the learning loop has no persistence layer, so verified work never changes XP, skills, badges, streaks or the portfolio.
