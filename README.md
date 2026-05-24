# Gwinya

A gentle, gamified companion for people living with dysphagia (difficulty swallowing).

Gwinya isn't a clinical product. It's a habit-and-confidence layer that sits *on top of* a plan
the user has already agreed with their Speech and Language Therapist (SLT). The app helps
remember strategies, run readiness checks before meals, track patterns over time, and prepare
questions for the next clinical appointment — Duolingo-style, but quieter.

The full product brief lives in [`app_instructions_jordan.md`](./app_instructions_jordan.md).

---

## Stack

| Layer            | Choice                                                                       |
| ---------------- | ---------------------------------------------------------------------------- |
| Framework        | **Next.js 15** (App Router, Turbopack, React 19)                             |
| Language         | TypeScript 5.7 (strict)                                                       |
| Styling          | **Tailwind CSS v4** with native `@theme` tokens                              |
| UI primitives    | **shadcn/ui** (new-york style) on Radix                                       |
| Motion           | `motion` (formerly framer-motion)                                            |
| LLM              | **Anthropic Claude** via Vercel AI SDK + `@ai-sdk/anthropic`                 |
| Fonts            | Fraunces (display, with WONK + SOFT axes) · Instrument Sans · JetBrains Mono |
| Code generators  | `plop` — see `pnpm gen`                                                       |
| Hosting          | Vercel                                                                        |

The whole UI is mobile-first, capped at a 28rem column with a thumb-zone bottom nav and
respect for `prefers-reduced-motion` and safe-area insets.

## Getting started

```bash
pnpm install
cp .env.example .env.local        # then add your ANTHROPIC_API_KEY
pnpm dev                          # http://localhost:3000
```

Useful commands:

| Command               | What it does                                            |
| --------------------- | ------------------------------------------------------- |
| `pnpm dev`            | Turbopack dev server                                    |
| `pnpm build`          | Production build                                        |
| `pnpm typecheck`      | `tsc --noEmit`                                          |
| `pnpm lint`           | Next.js + ESLint                                        |
| `pnpm gen`            | Interactive generator picker (component / lesson / page) |
| `pnpm gen:component`  | New component in `components/<name>/`                   |
| `pnpm gen:lesson`     | New lesson scaffold under `lib/content/lessons/`        |
| `pnpm gen:page`       | New `app/<route>/page.tsx`                              |

## Project layout

```
.
├── app/                      # Next.js App Router
│   ├── layout.tsx            # fonts + viewport + bottom nav
│   ├── page.tsx              # today / streak / next lesson
│   ├── before/page.tsx       # pre-meal readiness checklist
│   ├── learn/                # lesson index + [slug] reader with AI chat
│   ├── progress/page.tsx     # patterns over time (placeholder)
│   └── api/chat/route.ts     # streaming Anthropic route with prompt caching
├── components/
│   ├── ui/                   # shadcn primitives (button, card, badge, …)
│   ├── layout/               # bottom-nav, page-header, section-heading, staggered-reveal
│   ├── chat/                 # chat surface + bubble + input
│   ├── lesson-card/
│   ├── readiness-checklist/
│   ├── red-flag-banner/
│   └── streak-pill/
├── lib/
│   ├── ai/                   # model bindings + system prompts + cache markers
│   ├── content/              # lessons + checklists (typed)
│   ├── domain/               # shared types + red-flag detector
│   ├── format/               # date helpers
│   ├── storage/              # localStorage wrappers (streak, logs)
│   └── utils.ts              # cn helper (shadcn convention)
├── plopfile.mjs              # generators entry
└── plop-templates/           # handlebars templates per generator
```

Every custom component sits in its own folder with an `index.ts` barrel and a kebab-case
implementation file. Shadcn primitives stay flat under `components/ui/` per shadcn convention
so `pnpm dlx shadcn add …` keeps working.

## Prompt engineering

The model is wired up with the patterns that *actually* matter at production cost / latency:

### 1. Anthropic prompt caching

`app/api/chat/route.ts` flags the system prompt (and the per-lesson context block, when
present) with `cache_control: ephemeral`. Once those tokens cross the cache threshold
(~1024 for Sonnet/Opus), every subsequent request reads them at ~10% of input cost and
much lower TTFB.

The key discipline: **per-user state lives in the message list, never in the system prompt.**
The cache stays warm if the prefix is stable.

### 2. A safety-first system prompt

`lib/ai/prompts.ts` encodes the clinical guardrails from the product brief verbatim — the
model is told what it must **not** do (diagnose, prescribe thickeners, modify exercises,
override a clinician's plan) and what it **can** do, with style examples for both.

### 3. Defence-in-depth red-flag detection

`lib/domain/red-flags.ts` runs a deterministic client-side keyword check on the user's
current draft. If it matches choking / can't-breathe / blue-lips / stuck-food patterns, the
UI surfaces a banner with the correct emergency number *before* the model has finished
streaming. The model is also instructed to escalate independently — belt and braces.

### 4. Streaming with Vercel AI SDK

`useChat` from `@ai-sdk/react` handles the streaming, status, and history. Errors render
inline; the input disables while streaming.

### Model selection

| Use case                                      | Model               |
| --------------------------------------------- | ------------------- |
| Coaching / Q&A (default)                      | Claude Opus 4.7     |
| "Rephrase / tag / single-shot" (`fastModel`)  | Claude Haiku 4.5    |

Both are configurable via `ANTHROPIC_MODEL` / `ANTHROPIC_MODEL_FAST`.

## Design notes

The aesthetic is deliberately **not** generic SaaS. Key choices:

- **Linen background + clay primary + moss for "safe" + honey for streak.** Grounded,
  herbal-tea warm rather than tech-neon. Reads as *embodied*, which matters for an app about
  eating and drinking.
- **Hand-drawn squiggle underline** on one display word per screen (`.squiggle` utility in
  `app/globals.css`). It's the screen's signature personality moment — a print marker, not
  a CSS border.
- **The streak chip is a sticker**, tilted three degrees off-axis with a tiny drop shadow,
  rather than a centred pill.
- **A single orchestrated page-load reveal** (`StaggeredReveal`) per screen — children rise
  in a soft spring stagger — rather than scattered micro-animations everywhere.
- **Tactile press buttons** with a `box-shadow: 0 4px 0 …` that compresses on `:active`, so
  taps feel physical.
- **3.25rem minimum tap targets** — exceeds the typical 44px floor for an audience with
  potentially reduced fine-motor control.

All colours, fonts, and radii live as CSS variables in `app/globals.css` (`@theme` block).

## Accessibility

- Honours `prefers-reduced-motion` (all animations clamp to ~0ms).
- Bottom nav uses `aria-current` for the active route, `aria-label` for screen-reader names.
- All form-style controls have visible labels.
- Touch targets ≥ 44 × 44 px.
- Type defaults to 16 px+ for body, 1.6 line-height.
- The red-flag banner is `role="alert"` so it announces immediately on appearance.

## Deploying to Vercel

```bash
pnpm dlx vercel link
pnpm dlx vercel env add ANTHROPIC_API_KEY
pnpm dlx vercel --prod
```

The included `vercel.json` pins the runtime to `nextjs` and the region to `lhr1` (London) —
edit that if your users are elsewhere.

## What's intentionally **not** in this scaffold

- No auth. Add Clerk / Auth.js / Supabase Auth when you're ready.
- No backend persistence — streak + logs live in `localStorage` via `lib/storage/local.ts`.
- No analytics. Add Vercel Analytics or Plausible when you've decided what you'd measure.
- No PWA / service worker. The viewport meta + apple-web-app metadata are set; wire up
  `next-pwa` when you want offline install.
- No CMS. Lessons are typed objects in `lib/content/lessons.ts` — move them to Sanity / a
  database when the editorial volume justifies it.

These are deliberate omissions, not oversights. Add them when you have the constraints
to make a real choice.

## Safety posture

Gwinya is **not** a medical device. The product brief lists the things this app must never
do (diagnose, set diet level, prescribe thickeners or exercises, tell anyone to keep eating
through distress). Those constraints are encoded in three places — the product copy, the
system prompt at `lib/ai/prompts.ts`, and the client-side red-flag detector at
`lib/domain/red-flags.ts` — so a regression in any one layer is caught by the others.

If you change the model, the prompt, or the safety rules, re-read `app_instructions_jordan.md`
first.
