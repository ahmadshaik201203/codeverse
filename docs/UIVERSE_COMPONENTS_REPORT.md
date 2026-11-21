# Uiverse Components Integration Report

Date: 2026-11-12 · Project: CodeVerse (`client/`, Next.js 14 App Router + TypeScript + Tailwind)

Five Uiverse.io components were integrated into the real application — not a demo page. Each keeps the structure and interaction of its reference; colours, shadows and glows were re-skinned to the CodeVerse palette (charcoal `#252827`, secondary `#626966`, warm ivory `#F4F2ED`, forest `#536B58`, muted sage `#89978A`). Error states reuse CodeVerse's existing `--color-danger` token so failures stay distinguishable.

---

## Sources, licences and attribution

| # | Component | Uiverse reference | Author | Licence | Where the code came from |
|---|---|---|---|---|---|
| 1 | Switch | `santhosh_2608/foolish-elephant-3` | Santhosh Reddy (santhosh_2608) | MIT | **Not retrievable** — see note below |
| 2 | Jelly Button | `vinodjangid07/horrible-husky-70` | Vinod Jangid | MIT | Exact HTML/CSS from the `uiverse-io/galaxy` archive (`Buttons/vinodjangid07_horrible-husky-70.html`) |
| 3 | Neumorphic Input | `garerim/bitter-donkey-79` | Matheo GARERI | MIT | Exact HTML/CSS from `uiverse-io/galaxy` (`Inputs/garerim_bitter-donkey-79.html`) |
| 4 | Modern Star Button | `JkHuger/fat-bat-0` | JkHuger · **original creator JHEY** (https://codepen.io/jh3y/pen/LYJMPBL) | MIT | Exact HTML/CSS/SVG from `uiverse-io/galaxy` (`Buttons/JkHuger_fat-bat-0.html`) |
| 5 | Sign In UI | `Smit-Prajapati/swift-liger-76` | Smit Prajapati | MIT | Exact HTML/CSS from `uiverse-io/galaxy` (`Forms/Smit-Prajapati_swift-liger-76.html`) |

**Note on component 1 (honest disclosure).** The Switch source could not be obtained verbatim: `uiverse.io` returns HTTP 403 to direct fetch (Cloudflare), and `santhosh_2608/foolish-elephant-3` is *not* present in the `uiverse-io/galaxy` archive (searched the full 3,815-file tree; zero matches for that author). Component 1 is therefore a **faithful implementation to the published specification** — dark rounded track, circular icon knob that slides on toggle, moss/forest active colour, spring easing — not a verbatim copy. Its MIT attribution is retained in the source comment.

Attribution and MIT notices are retained as header comments in every component file (`Switch.tsx`, `JellyButton.tsx`, `StarButton.tsx`, `SignInCard.tsx`, `uiverse.css`, `signin.css`), including "original creator JHEY" for the star button.

---

## Files changed

**New**

| File | Purpose |
|---|---|
| `client/components/ui/Switch.tsx` | Accessible toggle (`<button role="switch">`, keyboard + SR state) |
| `client/components/ui/JellyButton.tsx` | Primary CTA button (renders `<Link>` or `<button>`) |
| `client/components/ui/StarButton.tsx` | Sparkle AI action button with 20-particle field |
| `client/components/ui/uiverse.css` | Scoped `cv-*` styles for switch, jelly and star buttons |
| `client/components/auth/SignInCard.tsx` | Sign-in card built on the Uiverse form structure |
| `client/components/auth/signin.css` | Scoped `cv-signin__*` styles |
| `client/app/dashboard/settings/page.tsx` | Real Settings page hosting the switches |

**Modified**

| File | Change |
|---|---|
| `client/app/layout.tsx` | Imports `components/ui/uiverse.css` once (no duplicate global CSS) |
| `client/app/globals.css` | `.control` reworked to the neumorphic pill; `[data-motion="reduced"]` kill-switch |
| `client/components/SmoothScroll.tsx` | Listens for `cv:smooth-scroll` and starts/stops Lenis |
| `client/components/Hero.tsx` | "Start building" → `JellyButton` |
| `client/components/CTA.tsx` | "Create your account" → `JellyButton` |
| `client/app/login/page.tsx` | Email/password form replaced by `SignInCard`, auth logic unchanged |
| `client/app/register/page.tsx` | Submit button → `JellyButton` |
| `client/app/projects/[projectId]/workspace/page.tsx` | "Verify task" (AI mentor action) → `StarButton` |
| `client/app/projects/[projectId]/page.tsx` | "Launch architecture blueprint" → `StarButton` |
| `client/components/DashboardLayout.tsx` | Search input uses the neumorphic `.control` |
| `client/components/auth/GoogleSignInButton.tsx` | Added `variant="icon"` (round social button) and extracted the glyph; default button unchanged |
| `client/components/auth/AuthShell.tsx` | Added `bare` prop so the sign-in card supplies its own `<h1>` |

---

## Adaptations per component

### 1. Switch → Settings → Preferences
- Original: dark rounded track, icon knob, pink accent. Adapted: **sage `#89978A` track when off, forest `#536B58` when on**, ivory knob with a check/cross icon, 300 ms spring slide.
- Real behaviour, not cosmetic: **Reduce motion** writes `data-motion="reduced"` on `<html>` (globals.css calms every animation/transition) and **Smooth scrolling** dispatches `cv:smooth-scroll`, which starts/stops the Lenis instance. Both persist in `localStorage` (`cv:reduce-motion`, `cv:smooth-scroll`) and re-apply on reload.
- Keyboard: native `<button>` + `aria-checked`, Space/Enter work; visible `:focus-visible` ring; `prefers-reduced-motion` removes the slide.
- Only these two preferences exist because they are the only ones with real effects — no account-sync settings are faked.

### 2. Jelly Button → primary CTAs
- Original: purple pill, inset gloss shadows, `::before`/`::after` highlight lines, `jello-horizontal` on hover.
- Adapted: **forest base, ivory text, sage-tinted inset highs/lows**; the gloss lines, 45 px radius, 150 px min-width, hover jello keyframes and 0.3 s shadows are kept. No purple/cyan anywhere.
- Used for: hero "Start building", CTA "Create your account", login submit, register submit (loading spinners preserved).

### 3. Neumorphic Input → all forms
- Original: `box-shadow: inset 2px 5px 10px rgb(5,5,5)` pill on a dark card.
- Adapted on the shared `.control` class: ivory-deep ground `#ece9df`, **charcoal inset shadow + ivory inner highlight**, 9999 px radius, forest focus ring (`0 0 0 3px rgba(83,107,88,.22)`), danger border for `aria-invalid`, placeholders at `#626966` (AA). Textareas keep the card radius.
- Because `Input`, `Textarea` and every `<select className="control">` use it, login, registration, profile, settings, search and workspace forms all inherit it — validation, labels, hints and error text are untouched.

### 4. Star Button → AI/project actions
- Original: conic "spark" sweep, three bouncing star paths, 20 floating particle stars randomised by the pen's JS, `:has()` hover activation.
- Adapted: hue `hsl(260)` → **`hsl(140)` forest/sage**, ivory text, `--active` glow retained; particle randomisation ported to a `useEffect`. Reduced motion disables the sweep, particles and bounce.
- Used only where an AI/major action happens (workspace "Verify task", project "Launch architecture blueprint"). Deliberately **not** applied to every button.

### 5. Sign In UI → the real `/login`
- Original: 40 px-radius elevated card, heavy heading, stacked pill inputs whose inline borders light on focus, left-aligned small text action, full-width pill submit with scale hover/press, "Or Sign in with" row of round social buttons, tiny footnote.
- Adapted: ivory card + ivory 5 px edge + forest-tinted shadow; **no gradients or neon**; heading charcoal 730; inputs pill with forest inline focus border; submit solid forest with the original `scale(1.03)`/`scale(0.95)` press behaviour; social buttons round, forest, ivory icons with the original 1.2/0.9 scale.
- Functional: real `apiFetch('/auth/login')`, existing validation, loading state (`aria-busy`, disabled, "Signing in…"), inline error (`role="alert"`, `aria-invalid`, `aria-describedby`), success status before redirect, password show/hide button (`aria-pressed`), Google + phone only when `isFirebaseConfigured` is true (they are hidden otherwise rather than erroring).
- Deliberate omissions, because CodeVerse has no such feature: the original "Forgot Password ?" link (no reset route or endpoint exists — search returned zero matches in `client/` and `server/`) and the "Learn user licence agreement" footnote (no licence page). No dead links were invented to fill those slots.

---

## Tests performed

All runs: production build (`npm run build`), `next start -p 3200`, headless Edge over CDP.

| Test | Result |
|---|---|
| `npx tsc --noEmit` | exit 0 |
| `npx next lint` | no warnings or errors |
| `npm run build` | `✓ Compiled successfully` |
| **Switch** — state change | `aria-checked` `false → true`; knob `translateX(0) → 26px`; `html[data-motion]` `full → reduced`; `localStorage['cv:reduce-motion'] = 'on'`; toggling back restores `full` |
| **Switch** — keyboard | Focused switch responds to Space (native button semantics), visible focus ring |
| **Jelly Button** | Renders as `<Link>` on hero/CTA and `<button type="submit">` on the auth forms; computed `background rgb(83,107,88)`, `color rgb(244,242,237)`, `border-radius 45px`; submits still call the original handlers |
| **Neumorphic Input** | `border-radius 9999px`, `background rgb(236,233,223)`, inset shadow `rgba(37,40,39,.18) 2px 5px 10px`; focus ring forest; `aria-invalid` danger state renders |
| **Star Button** | 20 particles with per-particle CSS vars, 3 sparkle paths; workspace button disabled until a task + code exist, then calls the existing verify handler |
| **Sign-in card structure** | card `rgb(244,242,237)`, radius 40 px, `<h1>` weight 730, submit forest/600, visible labels "Email address" / "Password" |
| **Password visibility** | `type password → text`, `aria-pressed false → true`, value retained, restores to `password` |
| **Empty submit** | `role="alert"` "Enter both your email and password to continue.", `aria-invalid="true"`, stays on `/login` |
| **Invalid credentials** | Loading state observed (`disabled`, `aria-busy="true"`, "Signing in…"), then API error "Incorrect email or password.", no token written |
| **Valid credentials** | Success status "Signed in. Taking you to your dashboard…", token stored, redirect to `/dashboard` |
| **Protected routes** | `/dashboard` renders with a session; redirects to `/login` without one |
| **Social row** | Hidden when Firebase env is absent (verified: `socialRow: false` in this environment) |
| **Mobile 390 px (sign-in)** | No horizontal overflow, card 350 px, eye button inside the card, submit above the fold |
| **Mobile 390 px (home)** | 9 sections, 0 hidden, no horizontal overflow |
| **Reduced motion** | `prefers-reduced-motion: reduce` and the in-app switch both neutralise switch/jelly/star animations |
| **Console** | 0 page exceptions across all probes |

### Not browser-verified (stated plainly)
- Jelly hover jello animation and Star hover sweep were confirmed by CSS inspection, not by a real pointer hover — CDP synthetic `mouseover` does not trigger `:hover`, so `animation-name` read back `none` in that probe.
- Google and phone sign-in could not be exercised end to end (no Firebase credentials in this environment); their code paths are unchanged apart from the icon variant.

---

## Remaining issues

1. **Switch is spec-faithful, not verbatim** (source inaccessible) — documented above.
2. **No forgot-password flow** exists in the product, so neither the link nor a reset endpoint was added.
3. **Settings preferences are device-local** (`localStorage`); there is no settings API, and nothing pretends otherwise.
4. **`/dashboard/settings` was previously a dead sidebar link** and now exists; the other dashboard links listed in `docs/PERFORMANCE_TYPOGRAPHY_FIX_REPORT.md` still point at unbuilt pages.
5. `.cv-switch` uses a 22 px knob and icon; at very small viewports it stays 56×30 px, which meets the 24 px target-size rule but is visually compact.
