# CodeVerse — Typography, Performance & Section-Visibility Fix Report

Date: 2026-11-12
Scope: `client/` (Next.js 14 App Router). No backend, `.env`, API, MongoDB or auth logic was touched.

---

## 1. Root causes found

| # | Root cause | Evidence | Effect |
|---|---|---|---|
| 1 | `Reveal` shipped every landing section to the browser **with `opacity: 0` in the server HTML** (framer-motion `initial={{ opacity: 0, y }}`), and only became visible after hydration *and* an IntersectionObserver callback | Rendered markup carried inline `style="opacity:0;transform:translateY(14px)"`; probe without JS showed hidden wrappers | Any delay/failure of JS (slow hydration, blocked script, observer edge case) left whole sections permanently invisible — the "only a few sections visible" symptom |
| 2 | framer-motion was pulled into the **homepage** bundle purely for that 14 px fade (`Reveal`) and one `useReducedMotion()` call in `HowItWorks` | Home first-load JS 216 kB, `unused-javascript` 63 KiB | Extra parse/execute before first interaction; delayed reveal timing |
| 3 | Global `input, textarea, select, button { font: inherit }` sits *after* weight rules and **resets font-weight** | Measured `main button => 400` after adding a 600 rule above it | Buttons/nav could never carry the intended weight |
| 4 | The type scale had no hierarchy: **every heading was `font-weight: 400`** | Probe before: `h1=400/73.6px, h2=400/44px, h3=400/20px, nav a=400, button=400` | Thin Bodoni hairlines read as grey and washed out over the artwork |
| 5 | Small text used **`ink-faint` #7C827E (~3.2:1)** and **`sage` #89978A (~2.4:1)** on the veiled ivory | Lighthouse: `color-contrast` score 0, **50 failing nodes** | Accessibility score 87 and genuinely hard-to-read labels |
| 6 | Invalid list markup: `Reveal`'s `<div>` was rendered **between `<ol>` and `<li>`** | Lighthouse `list` + `listitem` score 0 (6 nodes) | Screen readers lose list semantics |
| 7 | Carousel pagination dots were **6 px tall buttons**; logo link and copilot button had accessible names that did not contain their visible text | `target-size` (4 nodes) and `label-content-name-mismatch` (2 nodes) score 0 | Touch targets too small; voice-control name mismatch |

---

## 2. Files changed

| File | Change |
|---|---|
| `client/components/ui/Reveal.tsx` | Rewritten: CSS-driven reveal, visible by default, hidden state applied only after mount and only below the fold; IntersectionObserver + 4 s safety net; no framer-motion |
| `client/lib/usePrefersReducedMotion.ts` | **New** shared hook (replaces framer-motion's `useReducedMotion` and a duplicate local hook in Hero) |
| `client/components/HowItWorks.tsx` | framer-motion import removed; `<li>` now the direct child of `<ol>`; status text contrast fixed |
| `client/components/Hero.tsx` | Hero `h1` weight 400 → 730; pagination dots given a 24×22 px hit area; shared reduced-motion hook; `text-sage` code labels → `text-forest-deep` |
| `client/app/globals.css` | Body/`p` 500; `h1` 730 / `h2` 680 / `h3` 650 / `h4` 620; nav + button 600; form fields 500 re-applied after `font: inherit`; `.eyebrow` 500 → 600; `.control` 500; `.reveal` CSS; `--ink-300` darkened |
| `client/tailwind.config.ts` | `ink.faint` #7C827E → #656C68 |
| `client/components/ui/Button.tsx` | `font-medium` → `font-semibold` |
| `client/components/Navbar.tsx` | Nav links + mobile nav 600; logo accessible name matches visible text |
| `client/components/Footer.tsx` | Column labels 600 |
| `client/components/TeamCard.tsx` | Role label `text-sage` → `text-forest` (contrast) |
| `client/components/Domains.tsx` | "Launching soon" `text-sage` → `text-forest` |
| `client/components/GlobalAiCopilot.tsx` | FAB accessible name contains its visible label |
| `client/components/ui/uiverse.css` | Jelly button + Star button 500 → 600 |
| `client/components/auth/signin.css` | Sign-in heading 900 → 730, labels 500 → 600, submit 600, inputs 500 |

---

## 3. Font-weight changes

Bodoni Moda is a **variable** font (`wght 400–900`), so 550/620/650/680/730 are real interpolated instances — no extra font files, no synthetic bolding. The same single `woff2` (26,898 B) is served before and after.

| Element | Before | After |
|---|---|---|
| Body / paragraphs / descriptions | 400 | **500** |
| Form fields (`.control`, sign-in inputs) | 400 | **500** |
| Eyebrow labels | 500 | **600** |
| Nav links (desktop + mobile), footer links | 400 | **600** |
| Buttons (`Button`, jelly, star, icon buttons) | 400 (cascade bug) / 500 | **600** |
| `h4`, card titles | 400 | **620** |
| `h3` | 400 | **650** |
| Section headings (`h2`, `SectionHeading`, CTA) | 400 | **680** |
| Page titles (`h1`, hero, sign-in) | 400 / 900 | **730** |

Measured computed values after the change (`/`): `h1=730, h2=680, h3=650, h4=620, nav a=600, button=600, .eyebrow=600, body/paragraph=500`.

---

## 4. Performance optimizations with before/after measurements

### 4.1 Bundle (deterministic — `next build` output)

| Metric | Before | After | Δ |
|---|---|---|---|
| `/` route JS | 61.2 kB | **20.3 kB** | **−40.9 kB (−67 %)** |
| `/` first-load JS | 216 kB | **175 kB** | **−41 kB (−19 %)** |
| Shared first-load JS | 87.5 kB | 87.5 kB | unchanged |

Cause: framer-motion no longer reaches the landing page (`Reveal` is CSS-based; `HowItWorks` uses the shared hook). `WatchDemo` remains lazily imported.

### 4.2 Lighthouse — desktop (1440×900, headless Edge, production build)

| Metric | Before | After |
|---|---|---|
| Performance | 100 | **100** |
| Accessibility | **87** | **100** |
| Best practices | 100 | **100** |
| LCP | 0.3 s | 0.3 s |
| TBT | 0 ms | 0 ms |
| CLS | 0.014 | 0.016 |
| Total transfer | 394 KiB | **354 KiB** (−40 KiB) |
| Unused JS | 63 KiB | **25 KiB** (−38 KiB) |
| `color-contrast` / `list` / `listitem` / `target-size` / `label-content-name-mismatch` | all **0** | all **1** |

### 4.3 Lighthouse — mobile (emulated Moto G Power, 4× CPU)

| Metric | Before | After (3 runs) |
|---|---|---|
| Performance | 95 | **98 / 100 / 86** |
| Accessibility | **87** | **100 / 100** |
| LCP | 0.9 s | 1.3 / 1.2 / **0.9** s |
| TBT | 250 ms | 160 / 30 / 540 ms |
| CLS | 0.019 | 0.023 |
| Total transfer | 386 KiB | **346 KiB** |
| Unused JS | 63 KiB | **25 KiB** |

**Honest reading of the mobile numbers:** LCP and TBT swing run-to-run on this machine because the runs were competing with other headless browsers/builds; the font request alone measured 7 ms in one run and 449 ms in another. The *deterministic* mobile gains are transfer size (386 → 346 KiB) and unused JS (63 → 25 KiB), plus accessibility 87 → 100. I am **not** claiming a mobile LCP/score regression or improvement — it is measurement noise at this sample size. Desktop, measured on an idle machine, is stable and does not regress.

### 4.4 What was deliberately *not* done

- No new packages, no image/CDN changes, no `next.config` caching changes (immutable `/_next/static` and `/backgrounds` headers already existed).
- The fixed mountain background is untouched: same `.global-background` element, same WebP (~18 kB), same veil, same fixed positioning.

---

## 5. Sections / visibility bugs fixed

1. **`Reveal` no longer hides content by default.** Server HTML now renders every section at full opacity; only after mount, and only for elements starting below 92 % of the viewport, is the pending state applied, released on intersection (plus a 4 s safety net).
2. **Reduced motion** is honoured through CSS (`@media (prefers-reduced-motion: reduce)` and the in-app `[data-motion="reduced"]`) — the element is simply never hidden.
3. **List semantics restored** in HowItWorks (`<ol> → <li> → reveal div`), fixing screen-reader navigation of the six steps.
4. **Touch targets**: carousel dots 6 px → 24×22 px buttons with the visual dot inside.
5. **Accessible names**: navbar logo ("CodeVerse Beta home") and copilot button ("Ask copilot — open the CodeVerse copilot") now include their visible text.

### Per-route visibility probe (after scrolling each route, then measuring every section/heading/paragraph)

| Route | Sections rendered | Elements still hidden (`opacity≠1`, `display:none`, `visibility:hidden`) |
|---|---|---|
| `/` | 9 | **0** |
| `/demo` | 4 | **0** |
| `/login` | 1 | **0** |
| `/dashboard` | 1 | **0** |
| `/dashboard/settings` | 1 | **0** |
| `/` at 390 px | 9 | **0** (no horizontal overflow) |

### No-JavaScript proof (the failure mode that produced the original bug)

`Emulation.setScriptExecutionDisabled(true)`, load `/`:

| Metric | Result |
|---|---|
| Sections rendered | 7 (`<section>` + header/footer) |
| Sections with `opacity ≠ 1` or `visibility: hidden` | **0** |
| Visible text characters | **7,159** |

With the old `Reveal`, those sections rendered at `opacity: 0` and stayed blank without JS.

---

## 6. Commands executed and their actual results

| Command | Result |
|---|---|
| `npx tsc --noEmit` | exit 0, no output |
| `npx next lint` | `✔ No ESLint warnings or errors` |
| `npm run build` | `✓ Compiled successfully`, `BUILD_EXIT=0` (one earlier run failed with a transient Next `PageNotFoundError: /_document` during "Collecting page data"; a clean rebuild succeeded and the same command has since passed twice) |
| `npx lighthouse … --preset=desktop` | before 100 / 87 / 100 → after 100 / 100 / 100 |
| `npx lighthouse … (mobile)` | before 95 / 87 → after 98 · 100 · 86 / 100 |
| CDP route probe (6 routes + 390 px + no-JS) | 0 hidden elements everywhere |
| Console/exception capture during probes | 0 page exceptions; only pre-existing `favicon`/API-connection noise when the backend is down |

Production server used for all measurements: `npx next start -p 3200` on the build above. The backend (`localhost:5000`) was **not** running, so data-bearing routes were exercised against a local stub API.

---

## 7. Remaining issues

1. **Mobile Lighthouse variance** — scores 86–100 across three runs on this machine; only transfer size, unused JS and accessibility are stable deltas. A dedicated idle-machine run is needed for a defensible mobile LCP number.
2. **Nine dead internal links (pre-existing, untouched)** — `/dashboard/my-projects`, `/dashboard/roadmap`, `/dashboard/mentor`, `/dashboard/skills`, `/dashboard/interview`, `/dashboard/resume`, `/dashboard/readiness` in `DashboardLayout`, plus `/privacy` and `/terms` in `Footer`. Those pages do not exist, so the links 404. Not removed (that would delete features) and not created (that would invent content).
3. **`/projects/[projectId]` not validated with real data** — the page requires the backend; with the stub it renders its error/empty state, so its sections could not be exercised end to end.
4. **Team avatars are remote Unsplash URLs served with `unoptimized`** — they bypass Next image optimisation and its cache. (Moot for now: the Team section was unmounted on 2026-11-12; `components/Team.tsx` and `TeamCard.tsx` are retained for a future, real team section.)
5. **Background artwork is a CSS background** — discovered after the stylesheet. An explicit `<link rel="preload" as="image">` would shave a little off cold mobile loads, but it touches the "visually unchanged" layer, so it was left alone.
6. **25 KiB unused JS remains** — framework + GSAP + Lenis, which run on every route via the root layout.
