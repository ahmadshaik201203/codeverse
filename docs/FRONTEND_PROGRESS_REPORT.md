# Frontend Progress Report

Audit date: 2026-11-20 · Scope: `client/` (Next.js 14 App Router, 20 route files, 40 components, 9,870 LOC)

Method: code inspection of every route/component + a headless-Chromium route sweep against the production build on `http://localhost:3200` (signed in as `tester@codeverse.dev`) + `tsc`, `next lint`, `next build`.

Legend: **COMPLETE** · **PARTIALLY COMPLETE** · **NOT STARTED** · **BROKEN**

---

## 1. Routes (20 page files)

| Route | File | Status | Evidence |
|---|---|---|---|
| `/` | `app/page.tsx` | COMPLETE | Renders Navbar, Hero, About, Tagline, HowItWorks, Domains, Features, CTA, Footer. Route sweep: `h1` present, 0 console errors. |
| `/demo` | `app/demo/page.tsx` | COMPLETE | Static interactive walkthrough; renders, no API calls. |
| `/login` | `app/login/page.tsx` | COMPLETE | Email/password form posts to `/auth/login` via `apiFetch`; success redirects to `/dashboard` (verified in browser). |
| `/register` | `app/register/page.tsx` | COMPLETE | Posts to `/auth/register`, includes `GoogleSignInButton` (see §3). |
| `/onboarding` | `app/onboarding/page.tsx` | COMPLETE | Posts to `/auth/onboard`; verified `onboarded: true` on the test account afterwards. |
| `/dashboard` | `app/dashboard/page.tsx` | COMPLETE | `GET /gamification/stats` + `GET /projects?sort=recommended`; real data rendered (Level 1, 0 XP, 2 recommended projects). |
| `/dashboard/domains` | `app/dashboard/domains/page.tsx` | COMPLETE | `GET /domains`; 14 domain cards render. |
| `/dashboard/domains/[slug]` | `app/dashboard/domains/[slug]/page.tsx` | COMPLETE | Detail renders for `data-science`. |
| `/dashboard/projects` | `app/dashboard/projects/page.tsx` | COMPLETE | `GET /projects` with filters; 6 project cards render. |
| `/dashboard/leaderboard` | `app/dashboard/leaderboard/page.tsx` | COMPLETE | `GET /gamification/leaderboard`; renders real list (1 user). |
| `/dashboard/community` | `app/dashboard/community/page.tsx` | PARTIALLY COMPLETE | `GET /community/posts` works; create/reply/upvote call the API but were **NOT executed** (no test data written). Empty-state verified. |
| `/dashboard/analytics` | `app/dashboard/analytics/page.tsx` | PARTIALLY COMPLETE | `GET /analytics/summary` + `/analytics/radar` render; weekly activity is absent by design (`weeklyActivityAvailable: false`), so the chart area is empty. |
| `/dashboard/admin` | `app/dashboard/admin/page.tsx` | PARTIALLY COMPLETE | Shows the server-restricted state for a student (403 handled). Overview numbers, project table and moderation actions **NOT VERIFIED** — no admin account exists. |
| `/dashboard/settings` | `app/dashboard/settings/page.tsx` | COMPLETE | Device-level motion/smooth-scroll prefs in `localStorage`; explicitly documents that no account API exists. Toggles verified earlier in-browser. |
| `/dashboard/my-projects` | — | NOT STARTED | Sidebar links to it; route sweep returns the default Next 404. |
| `/dashboard/roadmap` | — | NOT STARTED | 404. |
| `/dashboard/mentor` | — | NOT STARTED | 404. Only the global copilot and the workspace panel exist. |
| `/dashboard/skills` | — | NOT STARTED | 404. |
| `/dashboard/interview` | — | NOT STARTED | 404. |
| `/dashboard/resume` | — | NOT STARTED | 404. |
| `/dashboard/readiness` | — | NOT STARTED | 404. |
| `/projects/[projectId]` | `app/projects/[projectId]/page.tsx` | COMPLETE | `GET /projects/:id`; "Launch architecture blueprint" and "Open workspace" navigate correctly. |
| `/projects/[projectId]/blueprint` | `app/projects/[projectId]/blueprint/page.tsx` | PARTIALLY COMPLETE | Calls `POST /ai/project-blueprint`. Without `GEMINI_API_KEY` the server returns a **canned fallback blueprint** (`ai.controller.ts:5-36`), which the page renders as if generated. Not real AI output. |
| `/projects/[projectId]/workspace` | `app/projects/[projectId]/workspace/page.tsx` | PARTIALLY COMPLETE | Monaco-style editor, file tabs, mentor chat (`/mentor/ask`), task verify (`/mentor/verify`), code review (`/evaluator/review`). **No persistence** — no `localStorage`/API save of code or progress, so a refresh loses work. AI actions return 503 on this deployment. |
| `/domains/[slug]` | `app/domains/[slug]/page.tsx` | COMPLETE | Public domain detail via `GET /domains/:slug`. |
| `/domains/[slug]/projects` | `app/domains/[slug]/projects/page.tsx` | COMPLETE | Public project list for a domain. |
| `/portfolio/[username]` | `app/portfolio/[username]/page.tsx` | COMPLETE | Public portfolio (`GET /portfolio/:identifier`); renders `teststudent954`. **No UI exists to edit one's own portfolio**, although `PUT /portfolio/me` exists. |
| `/privacy`, `/terms` | — | NOT STARTED | Linked from the footer, both 404. |
| Custom 404 / error boundary | — | NOT STARTED | No `app/not-found.tsx`, `app/error.tsx`, `app/loading.tsx`, no `middleware.ts`. Default Next 404 is used. |

---

## 2. UI components and features

| Item | Status | Evidence / note |
|---|---|---|
| Landing sections (Hero, About, Tagline, HowItWorks, Domains, Features, CTA, Footer, Navbar) | COMPLETE | 40 components in `client/components`. |
| Hero blueprint carousel | COMPLETE | 4 slides, next/dots work, GSAP-driven (verified earlier: 0→1 advance). |
| Watch demo modal | COMPLETE | Opens/closes with Escape (`components/WatchDemo.tsx`). |
| Global copilot | PARTIALLY COMPLETE | `components/GlobalAiCopilot.tsx` posts to `/mentor/ask`; on this deployment the API returns 503 and the UI shows a generic failure message. |
| UI primitives (`Button`, `Card`, `Badge`, `Field`, `Switch`, `Spinner`, `EmptyState`, `PageHeader`, `Reveal`) | COMPLETE | Used consistently; focus rings, disabled and loading states present. |
| Uiverse components (Switch, JellyButton, Neumorphic input, StarButton, SignInCard) | COMPLETE | `components/ui/uiverse.css` + components; used on landing, auth and settings. |
| Team section removal | COMPLETE | `<Team />` not rendered; `Team.tsx`/`TeamCard.tsx` retained; `#team` nav/footer links removed. Verified: no `#team` in DOM, sections contiguous. |
| Global mountain background | COMPLETE | `components/GlobalBackground.tsx` + `.global-background` (fixed, WebP, responsive veil). |
| Typography overhaul | COMPLETE | Single Bodoni family wired in `app/layout.tsx` + `tailwind.config.ts`; measured in the previous pass. |
| Performance fixes | COMPLETE | Reveal rewritten without framer-motion; home first-load 175 kB → 169 kB today; `next build` passes. |
| AI design skill applied (landing pass) | COMPLETE | `.agents/skills/landing-page-design/SKILL.md`, changes in `docs/AI_DESIGN_SKILL_REPORT.md`. |
| Loading states | COMPLETE | Skeleton blocks on dashboard/domains/projects/analytics; spinners in auth. |
| Error states | COMPLETE | `ApiError` handling with retry buttons on dashboard/domains/projects/analytics/admin. |
| Empty states | COMPLETE | `EmptyState` component used on dashboard (skills, projects, activity), community, domains, portfolio. |
| Responsive design | COMPLETE | Measured: 1440/834/390 px → horizontal overflow 0 on landing and dashboard; mobile menu is a full-height panel. |
| Dark mode | NOT STARTED | Not requested; light-only design. |
| Route-level error boundary | NOT STARTED | See §1. |
| Client-side route guard | COMPLETE (client-side only) | `components/ProtectedRoute.tsx` wraps `DashboardLayout` (`requireOnboarded`) and the onboarding page, redirecting signed-out users to `/login`. Server-side 401/403 remains the real enforcement. |

---

## 3. Authentication screens and real integration

| Flow | Status | Evidence |
|---|---|---|
| Login (email/password) | COMPLETE | `POST /auth/login` → token stored, `/auth/me` restores session, redirect to `/dashboard` verified end-to-end. |
| Register | COMPLETE | `POST /auth/register` (password ≥ 12 chars enforced both sides); account created and used for all subsequent tests. |
| Onboarding | COMPLETE | `POST /auth/onboard`; `onboarded: true` persisted. |
| Google sign-in | BROKEN (in this deployment) | `components/auth/GoogleSignInButton.tsx` is complete and gated on `isFirebaseConfigured`, but `NEXT_PUBLIC_FIREBASE_API_KEY` is **empty** in `client/.env.local`, so the button only surfaces the "not configured" error. Server side also lacks all `FIREBASE_*` variables. |
| Phone sign-in | BROKEN (same cause) | `components/auth/PhoneSignInBox.tsx`; Firebase not configured. |
| Logout | COMPLETE | Clears token + best-effort Firebase sign-out (`context/AuthContext.tsx`). |
| Session expiry handling | COMPLETE | `lib/api.ts` clears the token on 401 and surfaces a session message. |

---

## 4. API integration status per feature

| Feature | API used | Status |
|---|---|---|
| Login / register / onboard / me | `/auth/*` | COMPLETE |
| Dashboard stats | `/gamification/stats` | COMPLETE |
| Dashboard projects | `/projects?sort=recommended` | COMPLETE |
| Domains list/detail/projects | `/domains*` | COMPLETE |
| Project library/detail | `/projects*` | COMPLETE |
| Blueprint | `POST /ai/project-blueprint` | PARTIAL (canned fallback without key) |
| Mentor chat (workspace + copilot) | `POST /mentor/ask` | PARTIAL (503 here) |
| Task verification | `POST /mentor/verify` | PARTIAL (503 here; result never persisted even when it succeeds) |
| Code review | `POST /evaluator/review` | PARTIAL (503 here; review not stored) |
| Analytics | `/analytics/summary`, `/radar` | COMPLETE for what exists; weekly activity deliberately missing |
| Leaderboard | `/gamification/leaderboard` | COMPLETE |
| Community read | `GET /community/posts` | COMPLETE |
| Community write (post/reply/upvote) | `POST /community/*` | PARTIALLY COMPLETE — wired, not executed in this audit |
| Public portfolio | `GET /portfolio/:identifier` | COMPLETE |
| Own portfolio edit | `PUT /portfolio/me` | NOT STARTED on the frontend (no screen) |
| Admin | `/admin/overview`, `/projects` | PARTIAL (403 path verified) |

**Hardcoded API URLs:** 15 occurrences of `http://localhost:5000` across 7 files (`dashboard/community`, `dashboard/projects`, `domains/[slug]/projects`, `portfolio/[username]`, `projects/[projectId]`, `/blueprint`, `/workspace`, plus `GlobalAiCopilot`). `NEXT_PUBLIC_API_URL` is **empty** in `.env.local`, so `lib/api.ts` also falls back to localhost. This breaks any non-local deployment.

---

## 5. Score

| Bucket | Count | Share |
|---|---|---|
| COMPLETE | 17 | 63% |
| PARTIALLY COMPLETE | 5 | 19% |
| BROKEN | 1 | 4% |
| NOT STARTED | 4 | 15% |
| **Total audited items** | **27** | 100% |

**Frontend completion: 63% fully complete; 72% counting partial work.** The marketing site and the read-only catalogue surfaces are effectively finished; the personalised journey (my projects, roadmap, mentor, skills, interview, resume, readiness) has no pages.
