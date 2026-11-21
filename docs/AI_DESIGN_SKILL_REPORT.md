# AI Design Skill Report — `landing-page-design`

Date: 2026-11-20 · Project: CodeVerse (`client/` Next.js 14, `server/` Express + MongoDB)

---

## 1. Installation evidence

**Command run** (from the project root):

```bash
npx skills add elayadesign/ai-design-skills --skill landing-page-design -y
```

**Repo inspection first:** `npx skills add elayadesign/ai-design-skills --list` reported two skills — `figma-designer` and `landing-page-design`. Only `landing-page-design` applies to this task (CodeVerse has no Figma file or Figma MCP).

**Freebuff agent target:** the installer's agent list (Antigravity, Claude Code, Codex, Cursor, Gemini CLI, Firebender, Kilo Code, Kimi Code CLI, Loaf, Pi, Sarvam Code, Warp, Zed, PromptScript, …) does **not** contain Freebuff. The CLI therefore installed to the generic project level directory, `.agents/skills/`, which is the documented target for agents without a dedicated entry.

**Verified on disk** (not assumed):

```
.agents/skills/landing-page-design/SKILL.md   22,594 bytes   479 lines   (2026-11-20 15:15)
skills-lock.json
```

`skills-lock.json` pins the source and commit:

```json
{
  "version": 2,
  "skills": {
    "landing-page-design": {
      "source": "elayadesign/ai-design-skills",
      "commit": "456d9e0d3e2d84c748bb143c6ca3d90c45e16213",
      "sourceType": "github",
      "skillPath": "skills/landing-page-design/SKILL.md",
      "computedHash": "98fa8463d5fc56f969d52f24512366d66655271080cb67b43ca0790d8e951bc6"
    }
  }
}
```

`npx skills list` confirms the install and its location:

```
Project Skills

landing-page-design  ~\OneDrive\Desktop\claudecodeverse\.agents\skills\landing-page-design
  Agents: Antigravity, Claude Code, Codex, Cursor, Gemini CLI +2 more
  Source: elayadesign/ai-design-skills
```

The full file was read before any edit: Part A (strategy/structure) and Part B (visual system B1–B11) plus the checklist.

---

## 2. What the skill asks for (summary)

- **A**: one offer → one audience → one primary action; hero must carry headline, subheadline, single primary CTA, one proof signal and a visual; benefits → how it works → proof → FAQ → final CTA; no competing CTAs above the fold.
- **B1 Typography**: one typeface, no italics anywhere, no ultra bold, no hyphens in copy, no orphans (`text-wrap: balance` on headings, `pretty` on body), every size on the Tailwind scale, named text styles (Heading/Title/Body/Button/Caption).
- **B2 Spacing**: only 0/2/4/8/12/16/24/32/40/48/64/80/96 px.
- **B3 Radius**: Tailwind values only, `inner = outer − gap` when nested.
- **B4**: no single-sided card borders, no gradient backgrounds.
- **B5 Hero**: heading and subheading capped at 680px, meaningful line breaks, one gradient allowed on heading text only.
- **B6 Icons**: Phosphor / Solar / Iconamoon.
- **B7 Motion**: `cubic-bezier(0.22,1,0.36,1)`, 500ms layout / 300ms colour, transform+opacity only, reduced-motion respected, floating translucent blurred nav, animated icon swap, full-height mobile menu with staggered links, scroll reveals of 32px / 600–800ms fired once via IntersectionObserver.
- **B9/B10**: full state set (hover, active, focus ring, loading, empty, error), no dead links, 390px check with no overflow.
- **B11**: mandatory tagline reveal section — large type, muted to full colour word by word on scroll.

---

## 3. Rules applied

| Rule | Implementation in CodeVerse |
|---|---|
| B1 type scale | Every arbitrary `text-[Npx]` in the landing components snapped to the nearest Tailwind step (e.g. `text-[13.5px]`→`text-xs`, `text-[15px]`→`text-sm`, `text-[17px]`→`text-base`, `text-[19px]`→`text-lg`, `text-[22px]`→`text-xl`). Result: 65 replacements across Hero, About, HowItWorks, Domains, Features, CTA, Navbar, Footer, SectionHeading, Button. |
| B1 no italics | `em, i { font-style: normal }` in `globals.css` base, plus removal of 6 `italic` utility classes. Verified in-browser: **0 elements compute to `font-style: italic`**. |
| B1 no ultra bold | Hero heading `font-[730]` → `font-semibold` (600), matching *Heading 1*; other headings stay ≤ 700. |
| B1 orphans | `text-balance` on hero h1, section headings, CTA heading, tagline; `text-pretty` on every body paragraph in the landing sections. |
| B2 spacing | Only the skill's spacing steps remain in landing components (e.g. `gap-7`→`gap-6`, `gap-3.5`→`gap-3`, `py-3.5`→`py-3`, `mt-7`→`mt-6`). 58 replacements. |
| B3 radius | Arbitrary radii mapped to Tailwind steps and the project's existing radius tokens: `rounded-[6px]/[7px]`→`rounded-md`, `[8px]`→`rounded-lg`, `[10px]`→`rounded-control` (10px), `[20px]`→`rounded-card`. |
| B5 hero | `h1` and subheading capped at `max-w-[680px]` (measured 680px wide in-browser), heading set to `text-5xl sm:text-6xl` (60px / 60px line-height at 1440px), fluid `clamp()` removed. |
| B7 motion | Reveal distance 14px → **32px**, duration 600ms → **700ms**, existing `cubic-bezier(0.22,1,0.36,1)` kept; buttons/nav moved to the base curve at 300ms; nav underline changed from animating `width` to `scaleX` (transform only). |
| B7 navigation | The bar is now a **floating, centred, translucent, blurred panel** (`rounded-panel`, `backdrop-blur-xl`, 60% surface at rest, 90% + shadow after scroll) instead of a full-bleed bar. The menu icon morphs between burger and close (rotate + scale + opacity) rather than swapping instantly. The mobile menu is a **full-height panel** whose links arrive one after another (24px rise + fade, 60ms steps, capped at 400ms). |
| B9 states | `Button` gained a global `active:translate-y-px` press state; focus rings were already present (`focus-visible:ring-2 ring-forest`). Hover/active/disabled retained. |
| B11 tagline reveal | New section `components/Tagline.tsx` between About and Method: the existing product statement ("A career goal becomes a blueprint…") set in 36/48px Bodoni, words dimmed to 32% and lit in reading order by a per-word IntersectionObserver, 700ms base-curve opacity, 40ms cascade. Under `prefers-reduced-motion` the words are full colour immediately, and if the script never runs the words stay solid (dimming is only armed client-side). |
| B8/B10 | Untouched where already correct: real copy, specific names and no placeholder Latin; skip link, favicon, metadata and alt text already shipped. Correction (2026-11-20 audit): a **custom 404 page does not exist** — Next's default is used; see `docs/FRONTEND_PROGRESS_REPORT.md`. |

### Deliberate exceptions (user instruction wins)

| Skill rule | Why not applied |
|---|---|
| Approved fonts (Geist / Manrope / Poppins) | The brief requires keeping CodeVerse's existing direction and the palette; the site uses **Bodoni Moda** as a single global family. Swapping the typeface would be a redesign, not an improvement. |
| Hero heading gradient (`#000`→`#666`) | Brand direction is flat editorial ink; a gradient would fight the ink-wash background the brief protects. Kept flat. |
| Icon set (Phosphor/Solar/Iconamoon) | The project uses `lucide-react` in ~100 files; a wholesale icon-library swap is out of scope for a UI improvement pass. |
| No background gradients | The fixed ink-wash veil (`linear-gradient` over the painting) is explicitly required to stay by the brief, so it is preserved. No *new* gradients were added. |
| Main button padding 8/12px | CodeVerse buttons use fixed heights (`h-9/h-11/h-12`) with horizontal padding from the spacing scale; converting to vertical padding would change every control height across the dashboard too. Left as is. |
| "One typeface, no second font" | Already satisfied — `font-sans`, `font-serif` and `font-mono` all alias Bodoni Moda. |

---

## 4. Files changed

**Installed skill**
- `.agents/skills/landing-page-design/SKILL.md` (new, installed by the CLI)
- `skills-lock.json` (new, generated by the CLI)

**Landing page**
- `client/app/globals.css` — non-italic `em/i`, eyebrow 11px → 12px on scale, reveal 32px/700ms, `.tagline-word` states, `.nav-item-enter` + its keyframes
- `client/app/page.tsx` — renders `<Tagline />` between About and Method
- `client/components/Navbar.tsx` — rewritten: floating blurred panel, morphing menu icon, full-height staggered mobile menu (link list, hrefs, escape handling and aria attributes unchanged)
- `client/components/Tagline.tsx` — **new** tagline section
- `client/components/ui/TaglineReveal.tsx` — **new** word-by-word reveal
- `client/components/Hero.tsx` — heading scale + 680px cap, `text-balance`/`text-pretty`, type/radius/spacing tokens, italics removed
- `client/components/About.tsx`, `HowItWorks.tsx`, `Domains.tsx`, `Features.tsx`, `CTA.tsx`, `Footer.tsx` — type/radius/spacing tokens, balance/pretty, italic removal, body copy restored to the `text-sm` minimum
- `client/components/ui/SectionHeading.tsx` — `lg:text-5xl` (was an off-scale `2.75rem`), balance + 680px description
- `client/components/ui/Button.tsx`, `ui/Reveal.tsx`, `ui/Container.tsx` — token/motion alignment

**Not touched:** routing, authentication, API calls, database models/seeds, `.env`, secrets, the fixed ink-wash background layer, dashboard pages, the header/footer information architecture, the palette.

---

## 5. Verification

**Static checks (from `client/`)**

```
npx tsc --noEmit          → exit 0
npx next lint             → ✔ No ESLint warnings or errors
npm run build             → ✓ Compiled successfully
                            / (home)  13.5 kB page · 169 kB first load
```

**Browser checks (headless Chromium via CDP, production build on `http://localhost:3200`)**

| Check | Result |
|---|---|
| Desktop 1440px page height | 6,378 px (6,082 before + 296 for the new tagline section) |
| Desktop horizontal overflow | none (`scrollWidth − innerWidth = −15`, scrollbar only) |
| Tablet 834px overflow | 0 |
| Mobile 390px overflow | 0, primary CTA visible in the first screen |
| Hero `h1` computed | 60px / 60px line-height, box width 680px |
| Italic elements | 0 |
| Eyebrow size | 12px (was 11px, off-scale) |
| Smallest paragraph font | 12px (caption scale), no body text below it |
| Tagline words | 19 words; with motion enabled all arm and light on scroll; with `prefers-reduced-motion: reduce` they render at full colour immediately |
| Floating nav | present (`header > div.rounded-panel`), mobile panel covers ≥ 80% of the viewport, 6 links |
| Nav anchor click | `Capabilities` → `#features` at viewport top |
| Watch demo | dialog opens, `Escape` closes |
| Blueprint carousel | 4 slides, next advances 0 → 1 |
| Hero CTA | `a.cv-jelly` → `/register` |
| Login | `tester@codeverse.dev` → `/dashboard`, "Welcome back, Test" |
| Console exceptions | 0 |

**Screenshots**

| File | Content |
|---|---|
| `screenshots/skill-home-desktop.png` | full landing page, desktop 1440px |
| `screenshots/skill-home-mobile.png` | full landing page, 390px |
| `screenshots/skill-tagline-mid-reveal.png` | tagline at its muted start state |
| `screenshots/skill-mobile-menu.png` | full-height mobile menu open |
| `screenshots/after-home-desktop.png` (earlier) | pre-skill baseline for comparison |

---

## 6. Known gaps / follow-ups

- `screenshots/skill-home-tablet.png` exists but was not opened for visual review; the tablet pass was checked numerically (overflow 0) only.
- Icon library, hero gradient, button padding and typeface are the documented exceptions above.
- Legacy non-landing components outside the landing scope still contain arbitrary sizes (`text-[13.5px]`, `rounded-[8px]`) — the skill applies to them too, but they were left for a separate pass so this change stays reviewable.
- Footer links to `/privacy` and `/terms` still 404 (pre-existing, flagged before this pass).
