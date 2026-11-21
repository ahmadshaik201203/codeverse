# CodeVerse — Architecture

Two documents in one: **§1–§7 describe what exists today** (measured), **§8–§14 describe the target** and how to get there without discarding working code.

---

## 1. Current runtime topology

```
┌────────────────────────────┐        ┌─────────────────────────────┐
│  Next.js 14 (App Router)   │  HTTPS │  Express 5 (TypeScript)     │
│  React 18 · Tailwind       │───────▶│  /api/*  27 endpoints       │
│  port 3000                 │  JWT   │  port 5000                  │
│                            │ Bearer │                             │
│  • 20 routes (16 static)   │        │  • controllers/ (10)        │
│  • AuthContext (local)     │        │  • routes/ (10)             │
│  • ProtectedRoute (client) │        │  • middleware/auth.ts       │
│  • Monaco + iframe sandbox │        │  • models/ (4)              │
└──────────┬─────────────────┘        └──────┬──────────────────────┘
           │                                 │ Mongoose
           │ Firebase JS SDK                 ▼
           ▼                          ┌──────────────┐
┌────────────────────────┐            │  MongoDB     │
│ Firebase Auth          │            │  Atlas       │
│ Google popup · Phone   │            │  codeverse   │
│ (ID token NOT verified)│            └──────────────┘
└────────────────────────┘            ┌──────────────┐
                                      │ Gemini 2.5   │
                                      │ flash        │
                                      └──────────────┘
```

Deployment is undeveloped: no Docker, no CI, no environment contract beyond a stale root `.env.example`, and 11 client files hardcode `http://localhost:5000`.

---

## 2. Request lifecycle (as implemented)

```
Browser
  └─ apiFetch(endpoint, opts)
       ├─ reads token from localStorage
       ├─ sets Content-Type + Authorization
       ├─ fetch(`${API_URL}${endpoint}`)
       └─ throws Error(data.message) on !ok

Express
  ├─ cors()                     ← all origins
  ├─ express.json()             ← no size limit
  ├─ router → controller        ← try/catch in EVERY controller
  │    ├─ read req.body directly (no validation)
  │    ├─ Mongoose query        ← regex built from raw input
  │    └─ res.json(...)         ← ad-hoc shape
  └─ (no error middleware, no request logging)
```

There is **no service layer**: controllers contain business rules, persistence, AI calls and presentation shaping. This is the main structural cost once Phases 4–8 add models — it must be split before the learning engine lands, or every new feature triples a controller.

---

## 3. Current data model

```
User ──────────────┐
  _id              │ completedProjects: [Project._id]   (never written)
  fullName         │
  email (unique)   │
  password (bcrypt)│
  authProvider: local|google    (no 'phone')
  onboarded        │
  careerGoal       │
  experienceLevel  │
  knownTechnologies[]            (no join to a Skill model)
  xp=150 ← FAKE    │
  level=1          │
  streak=3 ← FAKE  │
  badges[] ← 2 pre-unlocked FAKE
  skills[] ← 6 scores FAKE      (embedded, not a Skill reference)
  bio, githubUrl, linkedinUrl, portfolioWebsite

Project          Domain            CommunityPost
  _id              _id               _id
  title            name              title, content
  slug (unique)    slug (unique)     tags[], domainSlug
  domainSlug       category          authorId → User
  difficulty       skills[]          authorName (denormalized)
  technologies[]   technologies[]    authorCollege
  tags[]           difficulty        upvotes / upvotedBy[] (never written)
  popularity       careerRoles[]     replies[] (embedded)
  prerequisites[]                    createdAt
```

**Missing entirely:** `Skill`, `SkillAssessment`, `AssessmentAttempt`, `Roadmap`, `Milestone`, `Progress`, `XpEvent`, `Submission`, `Conversation`, `Notification`, `Role`, `AuditLog`. Six of the brief's ten product capabilities have no storage.

**Schema drift:** client code reads `Project.shortDescription`, `Project.estimatedHours`, `Project.blueprint` — none exist. The client defines hand-written interfaces (`ProjectData`, `DomainData`) that are *not* derived from the server models, so drift is invisible to `tsc`.

---

## 4. Authentication architecture (current)

| Layer | Mechanism | Problem |
|---|---|---|
| Credential login | bcrypt + JWT (`{id,email}`, 7d, HS256) | Secret has a hardcoded fallback (SEC-03) |
| Google login | Firebase popup → POST email to API | **Server never verifies the ID token (SEC-02)** |
| Phone login | Firebase SMS → synthesises an email | Same bypass; provider not modelled in `User.authProvider` |
| Session storage | `localStorage` | XSS-readable (SEC-15) |
| Route protection | `ProtectedRoute` client redirect | Cosmetic; API is the only real gate |
| Authorization | `authenticate` only — "is there a token" | **No ownership/role checks anywhere** |
| Revocation | none | Logout is client-side only |

`authenticate` decodes the token and attaches `req.user`, and every protected controller uses `req.user.id` for its query — so **horizontal** access control (user A cannot read user B's records) is mostly correct by construction. The exceptions are public endpoints that over-share (portfolio email) and admin (no gate). **Vertical** access control does not exist.

---

## 5. AI integration architecture (current)

Three independent controllers each instantiate `new GoogleGenerativeAI(apiKey)` and each implement their own prompt, their own `JSON.parse`, and their own markdown-fence stripping. There is no shared client, no retry, no timeout, no token accounting, no schema validation, and no rate limit.

```
ai.controller      → blueprint     → prompt string → JSON.parse → 500 on malformed
mentor.controller  → ask/verify    → prompt string → (no parse for ask) → auto-pass fallback
evaluator.controller → review      → prompt string → JSON.parse → fake-82 fallback
```

Consequences: triplicated code, inconsistent failure semantics, unvalidated model output trusted enough to produce verdicts, and no way to cap spend.

---

## 6. Design system (current) — root cause of the visual inconsistency

Three incompatible palettes are active at once:

| Source | Palette | Where |
|---|---|---|
| `globals.css` | bg `#132A24`, text `#E8D7B5`, borders `#35564A`, sage `#A9C5A0` | forced on `html`, `body`, `*` with **`!important`** |
| `layout.tsx` | `bg-white`, text `#00684A` | root shell |
| Marketing components | `slate-950` + cyan/indigo/purple gradients, glow blobs | `/`, `/demo`, auth pages |
| Dashboard/portfolio pages | `bg-white` + `#00684A` borders, boxy 3xl cards | admin, analytics, community, leaderboard, portfolio |
| Other dashboard pages | `slate-950` + `glass-card` + cyan accents | dashboard, domains, projects, workspace |

Specific breakage:
- `*, *::before, *::after { border-color: #35564A !important }` **nullifies every Tailwind border utility** in the app.
- `.glass-card { background: #35564A !important }` overrides every `bg-slate-900/…` on the same element, flattening hierarchy.
- `html, body { background: #132A24 !important }` fights `layout.tsx`'s `bg-white`.
- `tailwind.config.ts` exposes only `background`/`foreground` mapped to CSS variables that are never defined; there is no token layer at all.
- Unused tokens (`--c-cream`, `--c-sage`) plus dead classes (`.glass-card-hover` only partially applied).

The brief's palette — charcoal `#252827`, secondary text `#626966`, ivory `#F4F2ED`, forest `#536B58`, sage `#89978A` — **appears nowhere** in the codebase. So Phase 2 is a genuine redesign, not a reskin.

---

## 7. Code execution architecture (current)

```
User edits HTML/CSS/JS in Monaco (client state only)
        │
        ▼
compilePreview() string-concatenates the three files
        │
        ▼
<iframe sandbox="allow-scripts" srcDoc={compiled} />
        │
        └─ console.log/error overridden → postMessage → parent console panel
```

**Correct**: no `allow-same-origin`, so the frame is opaque-origin; it cannot read the parent's `localStorage`, cookies or DOM. Nothing is executed server-side. This meets the brief's constraint.

**Weaknesses:**
- `postMessage` handler in `SandboxedEditor` accepts messages from **any** origin and does not check `event.source === iframe.contentWindow` — a hostile page in another tab could inject console lines (cosmetic, but it is the pattern the project's own seed post lectures about).
- The compile step interpolates user JS into a `<script>` inside a template literal: a user typing `</script>` breaks out of the script tag. Injected code stays inside the sandbox, so impact is limited to confusing the user's own preview.
- No time limit, no memory limit — an infinite loop in user JS freezes only the iframe, which is acceptable, but there is no "kill" affordance.
- No file persistence, no version history.

---

## 8. Target architecture

Principle: **keep what is real** (auth primitives, catalogue, sandbox), **split what will not scale** (controllers → services), **add the missing domain**, **and make every number traceable to a stored event.**

```
┌──────────────────────────────────────────────────────────────┐
│ Next.js App Router (server components where possible)        │
│                                                              │
│  app/(marketing)     app/(auth)      app/(app)               │
│    page, demo         login, register   dashboard/*          │
│    privacy, terms     onboarding        domains, projects     │
│                                         mentor, community     │
│  app/(app)/admin  ────── role-gated ──────┐                   │
│  app/portfolio/[username]  (public, opt-in)                  │
│                                                              │
│  components/ui/  ← NEW design primitives (Phase 2)           │
│  components/domain/ ← feature components                     │
│  lib/api-client.ts ← single typed client (replaces 11 copies) │
└───────────────────────────┬──────────────────────────────────┘
                            │ typed contracts (zod-inferred)
┌───────────────────────────▼──────────────────────────────────┐
│ Express API                                                   │
│  routes/ → middleware/ (auth, role, validate, rateLimit, log) │
│           → controllers/ (HTTP only)                          │
│           → services/   (business rules — NEW)                │
│           → models/     (Mongoose)                            │
│  ai/  ← ONE Gemini gateway: timeouts, retry, schema, budget   │
│  errors/ ← AppError + central handler                         │
└───────────────────────────────────────────────────────────────┘
```

### Request pipeline (target)

```
requestId → cors(allowlist) → helmet → json({limit}) → rateLimit(bucket)
  → log(request, redacted) → authenticate → requireRole → validate(schema)
  → controller → service → model
  → response {data | error{code,message}, requestId}
  → errorHandler (single place; maps AppError → status)
```

---

## 9. Target data model (additions in **bold**)

```
User
  id, email, **firebaseUid**, passwordHash?, authProvider: local|google|phone
  **role: student|faculty|admin**
  onboarded, careerGoal, experienceLevel, preferredLanguage
  **portfolioPublic: boolean = false**
  bio, githubUrl, linkedinUrl, portfolioWebsite
  **createdAt, lastActiveAt**        ← real streak source
  ✗ remove xp/level/streak/badges/skills scalars from defaults
     (keep fields, derive from ledgers)

**UserSkill**      userId, **skillId**, trackedAt, **score** (null until assessed),
                   **assessedAt**, **evidence[]** (attempt ids / project ids)
**Skill**          name, slug, domainSlug, level, prerequisites[], resources[]
**Assessment**     skillId, questions[{prompt, options, correct, weight}], passScore
**AssessmentAttempt** userId, assessmentId, answers[], score, passed, startedAt, submittedAt
**Roadmap**        userId, domainSlug, goal, generatedFrom, **milestones[]**
**Milestone**      roadmapId, title, order, status, completedAt, evidence
**XpEvent**        userId, action, amount, resourceType, resourceId,
                   **idempotencyKey (unique)**, createdAt     ← every XP traceable
**Enrollment**     userId, projectId, status, startedAt, completedAt
**ProjectProgress** userId, projectId, phaseIndex, taskIndex, completedAt
**WorkspaceFile**  userId, projectId, name, language, content, version
**Submission**     userId, projectId, codeSnapshot, evaluatorScore,
                   verdict, feedback, createdAt
**Conversation**   userId, projectId?, mode, messages[{role, content, at}]
**CommunityPost**  + status: published|hidden|removed, **moderationLog[]**
**Notification**   userId, type, payload, readAt
**AuditLog**       actorId, action, targetType, targetId, ip, at
```

Derived, never stored as truth: `xp = sum(XpEvent.amount)`, `level = f(xp)`, `streak = consecutive days with an event`, `skill score = latest passed AssessmentAttempt`.

---

## 10. AI service layer (target)

One gateway module; all four AI features become callers.

```ts
// server/src/ai/gateway.ts
generateStructured<T>({
  feature: 'blueprint'|'mentor'|'review'|'verify'|'quiz'|'interview',
  prompt: string,            // user content wrapped as untrusted
  schema: ZodSchema<T>,      // validated output, no blind JSON.parse
  budget: { userId, perHour, perDay },
  signal: AbortSignal,       // hard timeout
}): Promise<{ ok: true; data: T } | { ok: false; reason: 'UNAVAILABLE'|'RATE_LIMITED'|'INVALID_OUTPUT' }>
```

Non-negotiables:
- **Never fabricate.** `ok:false` → `503 AI_UNAVAILABLE` and an honest UI state. No default scores, no auto-pass.
- Persist every call: feature, user, tokens in/out, latency, outcome (for cost control and Phase 8 analytics).
- User content is delimited and labelled untrusted; model output is schema-validated and clamped (score ∈ [0,100], verdict ∈ allowlist).
- Interview/quiz/career modes reuse the same gateway with different schemas.
- Conversation history is stored (`Conversation`) and summarized, not re-sent verbatim.

---

## 11. Design system architecture (target)

**Token layer** replaces `globals.css` entirely.

```css
/* client/app/globals.css — tokens only, no !important */
:root {
  --ink:        #252827;  /* charcoal — text, dark surfaces */
  --ink-muted:  #626966;  /* secondary text */
  --ivory:      #F4F2ED;  /* page ground */
  --forest:     #536B58;  /* primary action, focus */
  --sage:       #89978A;  /* borders, quiet accents */
  --surface:    rgba(255,255,255,0.62);  /* translucent panel */
  --surface-solid: #FBFAF7;              /* editor/data surfaces */
  --hairline:   rgba(37,40,39,0.12);
}
```

| Layer | Responsibility |
|---|---|
| `components/ui/*` | `Button`, `Card`, `Field`, `Badge`, `Tabs`, `Modal`, `EmptyState`, `Table`, `Progress`, `Toast` — the only place `!important`-free class strings are composed |
| `components/brand/*` | `MountainBackdrop` (the supplied image, fixed, `bg-fixed`, `object-cover`, low-opacity overlay), `InkDivider`, `Seal` |
| Route groups | `(marketing)` uses translucent editorial surfaces over the landscape; `(app)` uses a solid ivory shell for legibility; `(editor)` uses opaque `--surface-solid`; `(admin)` uses a denser table system |
| Motion | one `fade-rise` recipe (200–450ms, `ease-out`), no loops except a single subtle bird/drift animation; `prefers-reduced-motion` disables all |
| Typography | display serif for headings (editorial), system sans for UI, mono for code; scale 12/14/16/20/28/40/56 |

**Contrast rule:** the landscape is decoration behind a max ~12% ink wash; body text always sits on `--ivory` or a ≥85%-opaque surface. Never white blocks over the whole background; never text directly on the image. Data-heavy screens (editor, tables) get solid surfaces — the brief's explicit requirement.

**Migration:** delete the `!important` block first, then introduce tokens, then primitives, then restyle route-by-route. Doing this before Phases 3–8 means feature pages are built once, correctly.

---

## 12. Sandbox evolution

Keep the iframe model (it is the right call for a browser-based learning platform). Add:
1. Origin/source check on `postMessage` (`event.source === iframeRef.current?.contentWindow`).
2. Escape `</script>` in the compiled document (or build the preview with `Blob` + `URL.createObjectURL` and no inline concatenation).
3. Optional server-side execution for **languages other than JS** via an isolated runner — required only if the brief's "safe code execution strategy" must cover Python/Java. If browser-only JS/HTML/CSS is the scope, document that explicitly instead of building a container escape risk.
4. Persist `WorkspaceFile` per user/project; add a "Run history" and version snapshots.

If server execution is ever added: **never** `child_process.exec` on the API host. Use a separate container with no network, read-only FS, CPU/memory/time caps, and no credentials mounted.

---

## 13. Decision records

| # | Decision | Rationale |
|---|---|---|
| ADR-1 | Keep Express + Mongoose, do not migrate | Working, typed, and the audit found no framework-level blocker. Migration would burn the whole budget for no user-visible gain. |
| ADR-2 | Introduce a service layer before Phase 4 | Controllers already mix four concerns; six new models would make them unmaintainable. This is the only "refactor" justified before features. |
| ADR-3 | Derive all gamification from `XpEvent` | The brief forbids fake XP; a ledger is the only way to prove a number. Also gives streaks and analytics for free. |
| ADR-4 | Verify Firebase ID tokens server-side; keep our own JWT | Least disruptive path to secure Google/phone login without rewriting session handling. |
| ADR-5 | Browser iframe sandbox is the execution strategy | Zero RCE surface on the API host; matches the client-only curriculum. |
| ADR-6 | Design tokens + primitives before route restyling | Avoids touching 20 pages twice; removes the `!important` debt at the root. |
| ADR-7 | Route groups `(marketing)`/`(app)`/`(editor)` for surface density | The brief wants airy editorial marketing *and* readable data screens — these need different surface rules, not one global background. |
| ADR-8 | Honest AI failure over fabricated fallback | Product integrity + the brief's explicit prohibition; a labelled demo fixture is acceptable only when the UI says "demo". |

---

## 14. Migration path (no big-bang rewrite)

1. **Foundation (Phase 1):** env validation, central errors, request logging, CORS allowlist, rate limits, validation schemas, roles field. Behaviour-preserving except security.
2. **Design system (Phase 2):** delete `!important`, add tokens + primitives + `MountainBackdrop`, then restyle route by route. No API changes.
3. **Auth/onboarding (Phase 3):** real ID-token verification, session hardening, profile/settings page.
4. **Service extraction (before Phase 4):** move controller logic into `services/` one module at a time with tests pinned to current behaviour.
5. **Learning engine (Phase 4):** new models + endpoints + UI; the first genuinely new domain since the initial build.
6. **Projects/mentor (Phases 5–6):** add persistence and the AI gateway; replace fake review/verify with honest 503 paths.
7. **Community/career (Phase 7):** rebuild leaderboards on `XpEvent`; remove every fabricated fallback.
8. **Admin (Phase 8):** role middleware + CRUD + moderation + real platform analytics.
9. **Release (Phase 9):** test suite, CI, deployment docs, env contract.

**Deletion list (with justification):** the `!important` CSS block, all fabricated fallback payloads (F1–F16), `POST /award-xp`, the public email field, and the 11 hardcoded `localhost:5000` origins. Nothing else is removed; all real functionality is preserved and extended.
