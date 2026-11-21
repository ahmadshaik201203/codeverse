# CodeVerse — Project Audit (Phase 0)

**Audit date:** 2026-11-07
**Audited path:** `C:\Users\shaik\OneDrive\Desktop\claudecodeverse`
**Note on requested path:** the brief named `C:\Users\shaik\Desktop\claudecodeverse-review`. That directory does not exist on this machine. The audited project is the connected workspace above, which contains the described `client/` and `server/` trees. If `claudecodeverse-review` exists elsewhere, this audit must be repeated there.

**Method:** every non-generated source file was read (`find`, 93 files outside `node_modules`/`.next`/`dist`), then the real toolchain was executed. Nothing in this document is claimed as working without a command result in §2 or an explicit "unverified" label.

---

## 1. Inventory

| Area | Count | Notes |
|---|---|---|
| Frontend source files | 45 | Next.js 14 App Router, `client/app` + `client/components` |
| Backend source files | 42 | Express 5, controllers/routes/models/middleware |
| Sequelize/Mongoose models | 4 | `User`, `Domain`, `Project`, `CommunityPost` |
| API route groups | 10 | 27 endpoints total (see `API_MAP.md`) |
| Frontend pages | 20 | 16 static, 4 dynamic (from `next build`) |
| Automated tests | **0** | No test runner installed in either package |
| `page.tsx` files with hardcoded business data | 9 | See §6 |

---

## 2. Verified build & check status (measured)

Commands executed from the project root on 2026-11-07.

| Check | Command | Result | Exit |
|---|---|---|---|
| Backend typecheck | `cd server && npx tsc --noEmit` | No diagnostics | 0 |
| Frontend typecheck | `cd client && npx tsc --noEmit` | No diagnostics | 0 |
| Frontend lint | `cd client && npx next lint` | "No ESLint warnings or errors" | 0 |
| Backend build | `cd server && npm run build` | `tsc` emitted `dist/` | 0 |
| Frontend production build | `cd client && npm run build` | Compiled; 16 static + 4 dynamic routes | 0 |

**Interpretation:** the repo compiles. Type-safety and lint passing does **not** indicate working features — most defects below are runtime, data-integrity, or security defects that a compiler cannot see. There is no test suite to demonstrate that any user flow works end to end.

**Not verified (blocked):**
- No live database was consulted; all data-model claims come from schema definitions and query code.
- No browser session was run against a live server, so login/onboarding/dashboard flows are **unverified at runtime**.
- `client/.env.local` and `server/.env` exist but were not read (secret files). Their contents are unknown to this audit.
- Firebase Auth behaviour (Google/phone) is unverified; there is no project access to the Firebase console.

---

## 3. What genuinely works (code-level, low risk)

These are the only parts with real persistence and no fabricated output:

1. **Local email registration/login** — bcrypt hashing via a Mongoose `pre('save')` hook, JWT issue/verify, generic 401s that do not reveal whether an email exists. Solid foundation.
2. **Project catalogue** — `Project` model + filter/sort/search controller is real, DB-backed, and reasonably written apart from a regex issue (SEC-09).
3. **Domain catalogue** — `Domain` model and list/detail endpoints are real.
4. **Blueprint task checklist UI** — the phase/task checklist in `projects/[projectId]/blueprint` renders model output and toggles locally. (Progress is *not* persisted — see §7.)
5. **Sandboxed preview** — `SandboxedEditor` renders user HTML/CSS/JS into an `iframe sandbox="allow-scripts"`, which is the correct primitive: no `allow-same-origin`, so the frame cannot reach `localStorage` or the parent DOM. It never sends user code to the server. This satisfies "never execute arbitrary user code on the application server."
6. **ProtectedRoute** — redirects unauthenticated users client-side; the API is separately gated on nearly every route.
7. **Seed scripts** — `seedDomains.ts` / `seedProjects.ts` are idempotent upserts (not wired to npm scripts — see §9).

---

## 4. Frontend route → backend API map (actual, as coded)

| Route | API calls | Auth required? | Real or placeholder |
|---|---|---|---|
| `/` | none | no | Marketing sections use **hardcoded** domain lists |
| `/demo` | none | no | Placeholder — "Click to play" does nothing |
| `/login` | `POST /auth/login`, `POST /auth/google` | no | Real (Google path insecure, SEC-02) |
| `/register` | `POST /auth/register`, `POST /auth/google` | no | Real |
| `/onboarding` | `POST /auth/onboard` | yes | Real, persisted |
| `/dashboard` | none | yes | **Fully hardcoded** metrics/projects/activity |
| `/dashboard/domains` | `GET /domains` | yes | Real, with hardcoded fallback |
| `/dashboard/domains/[slug]` | delegates to `/domains/[slug]` | yes | Double-wrapped layout (§8) |
| `/dashboard/projects` | `GET /projects` | yes | Real |
| `/dashboard/analytics` | `GET /analytics/summary`, `GET /analytics/radar` | yes | **Fabricated** server payloads (§6) |
| `/dashboard/community` | `GET /community/posts`, `POST /community/posts`, `POST .../replies`, `POST .../upvote` | partly | Real writes; **fake seed posts** when empty |
| `/dashboard/leaderboard` | `GET /gamification/leaderboard` | no | **Fabricated** fallback rows + fabricated XP |
| `/dashboard/admin` | `GET /projects` | yes | **No role gate at all** (SEC-05); fake platform stats |
| `/domains/[slug]` | `GET /domains/:slug` | yes | Real detail + **hardcoded** project cards |
| `/domains/[slug]/projects` | `GET /domains/:slug/projects` | yes | Real |
| `/projects/[projectId]` | `GET /projects/:id` | yes | Real |
| `/projects/[projectId]/blueprint` | `GET /projects/:id`, `POST /ai/project-blueprint` | yes | Real; task progress **not persisted** |
| `/projects/[projectId]/workspace` | `GET /projects/:id`, `POST /mentor/ask`, `POST /mentor/verify`, `POST /evaluator/review` | yes | Chat real; verify/review **dishonest fallbacks** (§6) |
| `/portfolio/[username]` | `GET /portfolio/:username` | no | Real, but **fabricates a portfolio** on any 404 |
| `/privacy`, `/terms` | — | — | **Linked in footer, route does not exist (404)** |

---

## 5. Data model audit and schema drift

`User` (`server/src/models/User.ts`) is overloaded into the profile, gamification, portfolio and skill store. Two fields are bought-and-paid-for lies:

- `xp: { default: 150 }`, `level: 1`, `streak: { default: 3 }` — **every new user is created with fabricated XP and a 3-day streak.**
- `badges` defaults include two pre-unlocked badges; `skills` defaults to six 60–85% "skill scores" that no assessment produced.

`Project` schema drift — **code reads fields that do not exist in the model**:

| Referenced by | Field | Exists in `Project`? |
|---|---|---|
| `dashboard/admin` table | `shortDescription`, `estimatedHours` | ❌ |
| `portfolio.controller` `.populate({select: ...})` | `shortDescription`, `estimatedHours`, `blueprint` | ❌ |
| `portfolio/[username]` card | `shortDescription`, `estimatedHours` | ❌ |
| `analytics.controller` | `completedProjects` on User | ✅ (but never written anywhere) |

Result: admin rows and portfolio project cards render `undefined` for those columns. This is silent data corruption of the UI, not a type error, because the client declares its own hand-written interfaces.

**Missing models for the stated product vision:** `Skill`, `SkillAssessment`, `Roadmap`, `Progress`, `Milestone`, `Notification`, `Role/Permission`, `InterviewSession`. Phases 4, 7 and 8 therefore have no persistence layer today.

`User` has **no `role` field**, so role-based authorization (Phase 8) is not merely unenforced — it is unrepresentable.

---

## 6. Fabricated / placeholder data inventory (the "no fake data" violation set)

The brief explicitly forbids fake XP, fake streaks, fake skill scores and fabricated job-readiness statistics. These are present **in the default product experience**, not only as demo fixtures.

| # | Location | Fabrication |
|---|---|---|
| F1 | `models/User.ts` | New users seeded with `xp 150`, `streak 3`, 2 badges, 6 skill scores |
| F2 | `dashboard/page.tsx` | Job Readiness `42%`, 4 skill bars, 2 recommended projects, activity feed, "Phase 1/8" capstone — all literals |
| F3 | `gamification.controller.ts` | `xp: u.xp \|\| 150 + (20-idx)*35`, `streak: u.streak \|\| max(1, 10-idx)`, `badgeCount \|\| 2` — rank-based invented values |
| F4 | `analytics.controller.ts` | `weeklyActivity` is a constant array of commits/tasks; `totalHoursSpent = completed*14 + level*6`; `|| 5` streaks |
| F5 | `analytics/page.tsx` | `|| 38`, `|| 3`, `|| 5`, `|| 450` fallbacks render invented numbers when the API returns nothing |
| F6 | `community.controller.ts` | Returns two invented posts by "Ahmad Shaik"/"Priya Sharma" when the collection is empty |
| F7 | `leaderboard/page.tsx` | Invented leaderboard rows (1,850 XP etc.) on any API failure |
| F8 | `portfolio/[username]/page.tsx` | On 404, invents a complete portfolio for *any* username (with fake badges/projects) |
| F9 | `portfolio.controller.ts` | Falls back to 2 arbitrary catalogue projects as the user's "showcase"; `xp \|\| 350`, `level \|\| 2`, `streak \|\| 5` |
| F10 | `evaluator.controller.ts` | No API key → returns **overallScore 82 / verdict "Passed"** with invented security findings, surfaced as a real review |
| F11 | `mentor.controller.ts` `verifyTask` | No API key → `{ isPassed: true, feedback: "Auto-passed due to offline AI API." }` |
| F12 | `dashboard/admin` | "1,420 Enrolled Students", "99.9% Sandbox Uptime", `projects.length \|\| 8` |
| F13 | `domains/[slug]` | `availableProjects` hardcoded, ignores `GET /domains/:slug/projects` |
| F14 | `Hero.tsx` | "18+ Domains", "100% Real-World Projects", "Zero Fake Placeholders" — while F1–F12 are fake |
| F15 | `Team.tsx` | Four personas with stock photos and `https://github.com` links as the team of the product |
| F16 | `User` badge list | `unlockedAt: Date.now()` at module import — two badges appear "earned" at signup |

`getFallbackBlueprint` (F-adjacent) is the one honest fallback: it includes `note: "This is a fallback ... because GEMINI_API_KEY is not configured."` Keep that pattern; apply it to F10/F11.

---

## 7. Broken navigation, dead controls, non-persistent state

**Sidebar links to routes that do not exist** (verified against the `next build` route table):

| Link target | Exists? |
|---|---|
| `/dashboard/roadmap` | ❌ 404 (linked twice from `/dashboard`) |
| `/dashboard/my-projects` | ❌ 404 |
| `/dashboard/mentor` | ❌ 404 (AI Mentor CTA on dashboard is dead) |
| `/dashboard/skills` | ❌ 404 (linked as "Analyze") |
| `/dashboard/interview` | ❌ 404 |
| `/dashboard/resume` | ❌ 404 |
| `/dashboard/readiness` | ❌ 404 |
| `/dashboard/settings` | ❌ 404 (linked from sidebar footer + profile menu) |
| `/privacy`, `/terms` | ❌ 404 |

That is 8 of 13 sidebar destinations plus 2 footer legal links dead. The "AI Tools" group is entirely dead links, which is the product's headline feature set.

**Dead / non-functional controls:**
- `/demo` — the "Click to play video" surface has no handler.
- Dashboard header **search input** — no state, no submit, no results.
- Dashboard **bell icon** — decorative, no notifications exist.
- Logout — clears `localStorage` only; no server revocation (JWT is stateless).
- Blueprint **task checkboxes** — local `useState` only; a refresh loses all progress, and no XP/level is awarded despite the UI implying tracked progress.
- Workspace code edits — local state only; nothing is saved to MongoDB.

---

## 8. Duplicated logic and structural defects

1. **Three competing design systems** (detailed in `ARCHITECTURE.md` §6): marketing = `slate-950` + cyan/purple gradients; four dashboard pages + portfolio = white + `#00684A`; `globals.css` = `#132A24`/`#E8D7B5` with `!important` on `html, body`, `*` borders and `.glass-card`. The `!important` rules override page-level Tailwind classes, so page styling is partly inert. This is the root cause of the inconsistent look the brief complains about.
2. **Nested layouts:** `app/dashboard/domains/[slug]/page.tsx` renders `app/domains/[slug]/page.tsx`, which itself wraps `DashboardLayout` (which wraps `ProtectedRoute`). Visiting it mounts two sidebars and two auth guards.
3. **`DomainDetailPage` is a dashboard page** living at a public URL `/domains/[slug]` — it always renders dashboard chrome and requires auth.
4. **Hardcoded API origin:** `http://localhost:5000` is written literally in **11 client files** instead of using `apiFetch`/`NEXT_PUBLIC_API_URL`. Cross-cutting: production deployment will call the user's own machine.
5. **Three parallel fetch styles:** `apiFetch`, raw `fetch` with manual `localStorage` token, and `fetch` with no auth header — inconsistent error handling and no redirect-to-login on 401.
6. **Duplicated project-card markup** in `dashboard/page.tsx`, `domains/[slug]/page.tsx`, `ProjectCard.tsx`.
7. **`ProjectCard`/`DomainCard` declare their own field shapes**, decoupled from the Mongoose schema — the mechanism behind §5 drift.
8. **`availableProjects` duplicated** between `domains/[slug]` and `dashboard/page.tsx`.

---

## 9. Environment & configuration

- **CRITICAL: `.env.example` shipped with live credentials** (a MongoDB Atlas URI containing a password, and a Gemini API key). These must be rotated — see `SECURITY_AUDIT.md` SEC-01. The file has been rewritten to placeholders during this audit.
- `server/.env` exists (contents unread). `client/.env.local` exists (contents unread).
- **Inconsistent env variable names:** root template advertises `NEXT_PUBLIC_API_URL`, while the client ignores it in 11 files.
- `client/lib/firebase.ts` hardcodes a full Firebase web config as `||` fallbacks (project `codeverse-5f4da`). Firebase web keys are public by design, but hardcoding them means environment mistakes cannot be detected — a missing env var silently uses production Firebase.
- **Seed scripts are unreachable:** `server/package.json` has no `seed` script; running them requires manual `ts-node`.
- `mongodb-memory-server` is a **production dependency** but is never imported by application code.
- No `next.config` security headers, no `server` `helmet`, no `compression`, no `trust proxy`.
- No CI workflow, no test runner, no formatter config.
- `.env.example` names no `CORS_ORIGINS`, `NODE_ENV`, or Firebase variables — the template is not a usable setup contract.

---

## 10. Product-vision completeness matrix

| # | Vision capability | Status | Evidence |
|---|---|---|---|
| 1 | Discover career direction | 🟡 Partial | Onboarding career-goal step only; no discovery guidance |
| 2 | Explore technical domains | 🟢 Basic | Real `Domain` model; 8 seeded domains |
| 3 | Assess current skills | 🔴 Absent | No assessment model/route; skills are fabricated defaults |
| 4 | Identify skill gaps | 🔴 Absent | `/dashboard/skills` 404s |
| 5 | Personalized roadmaps | 🔴 Absent | `/dashboard/roadmap` 404s; no `Roadmap` model |
| 6 | Build real-world projects | 🟡 Partial | Catalogue + details real; progress not persisted |
| 7 | AI project blueprints | 🟡 Partial | Gemini call works; fallback is honest; not persisted |
| 8 | AI mentor | 🟡 Partial | `/mentor/ask` real; no history; global copilot **always 400s** (no `projectId`) |
| 9 | Practice coding + code review | 🟡 Partial | Sandbox real; review can return a fake 82 |
| 10 | Portfolio & job prep | 🟡 Partial | Public portfolio real but invents data; interview/resume/readiness pages absent |

`GlobalAiCopilot` defect detail: it POSTs `{taskContext, codeSnippet, userMessage}` to `/api/mentor/ask`, which requires `projectId` and returns 400. The user always sees "Sorry, I encountered an issue."

---

## 11. Prioritized findings

### P0 — Security, fix before anything else
| ID | Finding | File |
|---|---|---|
| SEC-01 | Live MongoDB password + Gemini key committed in `.env.example` | `.env.example` |
| SEC-02 | `POST /auth/google` mints a JWT for **any email** without verifying `idToken` → full account takeover | `controllers/auth.controller.ts` |
| SEC-03 | Hardcoded JWT secret fallback (`codeverse_default_jwt_secret_key_2026`) → forged tokens on any env without `JWT_SECRET` | `middleware/auth.ts`, `controllers/auth.controller.ts` |
| SEC-04 | `cors()` with no origin allowlist → any site can call the API with a stolen/leaked token | `index.ts` |
| SEC-05 | `/dashboard/admin` has no role check; `User` has no `role` field | `app/dashboard/admin/page.tsx` |

### P1 — Integrity of the product's central claims
| ID | Finding |
|---|---|
| P1-1 | Fake XP/streaks/skills/badges at signup (F1) and rank-derived XP in leaderboard (F3) |
| P1-2 | Fake code-review score 82 (F10) and auto-pass task verification (F11) — AI dishonesty |
| P1-3 | Client-claimable XP via `POST /gamification/award-xp` with no server verification |
| P1-4 | 8 sidebar routes + 2 legal routes 404 |
| P1-5 | Analytics "weekly activity" is a constant; dashboard is 100% literal |
| P1-6 | No rate limiting on auth or AI endpoints → credential stuffing + API-cost abuse |
| P1-7 | `Project` schema drift breaks admin + portfolio rendering |

### P2 — Architecture & UX
| ID | Finding |
|---|---|
| P2-1 | Three conflicting themes; `globals.css` `!important` overrides page styles |
| P2-2 | 11 hardcoded `localhost:5000` origins |
| P2-3 | Nested `DashboardLayout` / double auth guard on `/dashboard/domains/[slug]` |
| P2-4 | No global API error handling, no 401→login redirect, no error boundaries |
| P2-5 | AI mentor ignores `history` (no conversation memory); workspace is the only chat surface |
| P2-6 | No persistence for blueprint progress or workspace files |
| P2-7 | `completedProjects` is never written, so analytics/portfolio have no source of truth |

### P3 — Hygiene
| ID | Finding |
|---|---|
| P3-1 | No tests, no CI, no formatter |
| P3-2 | Unused prod dependency `mongodb-memory-server`; seed scripts not wired |
| P3-3 | Duplicated card markup and fetch patterns |
| P3-4 | `.env.example` incomplete (no CORS/Firebase/NODE_ENV) |
| P3-5 | No accessibility pass (no focus states on custom buttons, icon-only controls without labels in places) |

---

## 12. Recommended sequencing (why)

The brief's phase order is close to correct, with one change: **Phase 1 must come before the redesign**, because the redesign touches every page and doing it on top of `globals.css` `!important` debt would require touching every page twice.

1. **Phase 1 (security)** — SEC-01…SEC-05 are one-to-two-day fixes that remove account takeover and forged sessions. Everything else is built on top of the auth boundary.
2. **Phase 2 (design system)** — replace `globals.css` with tokens + primitives *first*, so later feature pages are designed once.
3. **Phase 3 (auth/onboarding)** — make Google/phone real by verifying Firebase ID tokens server-side; add role to `User`.
4. **Phase 4 (learning engine)** — greenfield models; largest scope; depends on Phase 3 identity and Phase 2 primitives.
5. **Phases 5–6 (projects, mentor)** — extend existing catalogue/workspace; add persistence.
6. **Phase 7 (community/career)** — must come *after* P1-1/P1-3 are fixed, otherwise leaderboards amplify fabricated data.
7. **Phase 8 (admin)** — after `role` exists and content models are stable.
8. **Phase 9 (testing/release)** — test runner is a **new dependency** requiring approval.

---

## 13. Open questions for the owner

1. **Rotate the leaked credentials now?** The MongoDB password and Gemini key were in version control. Rotation must happen in Atlas and AI Studio; I can only remove them from the working tree.
2. **Is there existing production user data?** The brief says preserve it. If the fake-XP defaults have shipped, remediation needs a data migration (reset fabricated XP/skills) that I should not run without confirmation.
3. **May I add dependencies?** Phases 1/4/9 need, at minimum: input validation (`zod`), rate limiting (`express-rate-limit`), security headers (`helmet`), and a test runner (`vitest` + `supertest`). Rule 7 of the brief requires asking first.
4. **Is the Firebase project (`codeverse-5f4da`) one you control?** Real Google/phone auth requires the admin SDK and authorized domains.
5. **Which image asset is the mountain landscape?** The brief references "the image supplied by the owner"; no file exists in the repo. I need it placed in `client/public/` (suggested: `client/public/brand/mountains.png`) before Phase 2 can honour the visual identity.
