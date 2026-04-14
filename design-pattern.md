# Design Pattern

## Purpose

This document governs **how UI is composed and extended** in Resume AI Agent: App Router structure, shadcn usage, wizard layout, and where state lives.

**Visual spec:** [`design.md`](./design.md) **§1–§9** is the same text as [`notion/DESIGN.md`](./notion/DESIGN.md). **§10** in `design.md` maps spec → files. Read those before UI work; this file is **architecture** only.

## Core UI Architecture

- **Framework**: Next.js App Router (`app/`). Resume flow uses a **segment layout** (`app/resume/layout.tsx`) that wraps all wizard pages in `WizardShell`.
- **Styling**: Tailwind CSS v4 with theme tokens in `app/globals.css` (`@theme inline` maps semantic colors to CSS variables). Use `cn()` from `@/lib/utils` for conditional classes.
- **Components**: shadcn-style primitives live under `components/ui/` (Button, Card, Alert, Tabs, etc.). Feature UI lives under `components/wizard/` and `components/resume-tailor/`.
- **Client state**: Wizard session state is in Zustand (`store/wizard-store.ts`)—JD text, tailored payload, navigation assumptions. **No React Query** in this repo today; server calls use `fetch` from client route handlers where applicable.

## shadcn/ui Usage

- **Install pattern**: Project uses `shadcn` CLI and `@import "shadcn/tailwind.css"` in `globals.css`. Add new primitives with the CLI; do not copy-paste raw Radix bundles into random folders.
- **Customization**: Prefer **wrapping** primitives in feature components (`ReviewPanel`, `ExportPanel`) rather than forking `components/ui/*` unless the repo intentionally owns a variant.
- **Variants**: Buttons use `class-variance-authority` (`buttonVariants`). Respect existing variants (`default`, `outline`, `secondary`, `destructive`, `ghost`, `link`) and sizes before adding one-offs.
- **Accessibility**: Radix slots and focus rings are part of the kit—do not strip `focus-visible` styles.

## Page Composition

- **`page.tsx` per route**: `app/resume/job`, `review`, `export` each export a **client** `default` page (`"use client"`) because they use hooks (router, store, guards, search params).
- **Layout owns chrome**: `WizardShell` provides sticky header, stepper, and padded main; **pages own step content only** (hero + panels).
- **Redirects**: `app/page.tsx` redirects `/` to `routes.resume.job`—marketing landing is not implemented; the product is the wizard.

## Section Composition

- **Hero block** (each wizard step): Optional **step kicker** (`text-primary`, uppercase tracking) → **`h1`** (serif, `text-3xl`) → **supporting paragraph** (`text-muted-foreground`, `leading-relaxed`) → **optional actions** on the right (`flex` wrap).
- **Separator**: Review/export use `border-b border-border/80 pb-8` under the hero row instead of a floating rule component where that pattern already exists.
- **Primary work area**: One dominant **Card** (job step) or **ReviewPanel** / **ExportPanel** (split inner layouts: diff, ATS cards, export actions).

## Content Hierarchy

1. **Workflow context**: Stepper + kicker tell users where they are.
2. **Task title**: Serif `h1` states the job-to-be-done.
3. **Guidance**: One short paragraph; use `<strong>` sparingly for keywords (e.g. diff vs analytics).
4. **Actions**: Primary button for the main task; outline/sm for back and secondary navigation.

## Navigation Patterns

- **Global wizard**: Header brand links to `/resume/job`; **Start fresh** resets store and returns to job step.
- **Stepper**: `WizardStepper` links to each step path; active step uses **`bg-card`** + soft primary ring (see `design.md`). New steps require updating `config/wizard-steps.ts` and routes.
- **Review sub-steps**: URL query `?step=analysis` vs default diff; switching uses `router.push` with query string—keep query keys and `parseReviewSubStep` in sync when adding sub-steps.

## CTA Patterns

- **Single primary CTA per screen** where possible: e.g. **Generate tailored resume** on job step, **Continue** / export actions on later steps as defined in panels.
- **Placement**: Primary right-aligned or full-width on small screens in footer rows inside cards; destructive or low-frequency actions stay outline or text-style.
- **Loading**: Primary button shows **spinner + label change** (`Loader2`, “Generating…”)—disable duplicate submits.

## Button Patterns

- **Primary (`variant="default"`)**: Main forward action (generate, confirm export if applicable).
- **Outline (`variant="outline"`)**: Start fresh, back, cancel-style navigation, header utilities.
- **Secondary / ghost**: Use sparingly; outline is the default secondary in this app.
- **Destructive**: Reserved for true failure/undo semantics—not for “go back.”
- **Sizes**: `size="sm"` for header and inline navigation; default/lg for main form actions as already used in pages.

## Card Patterns

- **Job step**: `Card` with `CardHeader` (title + icon in tinted square) + `CardDescription` + `CardContent` (textarea, alerts, footer row).
- **Analysis**: `AtsScoreCard`-style blocks use **rounded-2xl**, **border**, optional **gradient ring** for “tailored” variant—keep parity between original vs tailored cards for scannability.
- **Elevation**: Prefer `shadow-sm` + `ring-1` for emphasis rather than heavy drop shadows.

## Form Patterns

- **Large text capture**: Single `Textarea` for JD with **fixed height class** from `config/wizard-ui.ts` so preview columns can align elsewhere.
- **Labels**: Always associate `Label` + `id` for paste fields.
- **Inline validation**: Character count and minimum length hints before submit; **API errors** in `Alert` below the field area.
- **Monospace**: Raw input/output that looks like source code uses `font-mono`—not for marketing copy.

## Table and List Patterns

- No standard **data table** in the wizard. Lists of tips, bullets, and metrics use **stacked cards** or **vertical lists** with `Separator` where needed.
- **Diff UIs**: Use dedicated diff components (`ResumeDiffPanel`, `MiniGitDiff`)—do not force HTML tables unless the diff renderer requires it.

## State Patterns

- **Loading**: Button-level spinners; full-page **Skeleton** only where `Suspense` wraps async UI (e.g. review skeleton).
- **Error**: `Alert` + destructive variant; optional `font-mono` for stack-like messages.
- **Empty / guard**: `useWizardGuard` + conditional `null` when store lacks data—ensure UX stays coherent if redirect timing changes (prefer explicit empty state if guard loosens).
- **Success**: Stepper “done” state uses Notion **Green** `#1aae39` (`notion/DESIGN.md` §2); no toast spam.

## Route-Level Consistency Rules

- All resume routes share **`WizardShell`** padding and max width.
- **Step labels** follow the same kicker typography across job, review, export.
- **Back** actions point to the **previous logical step** (export → review → job), not browser history unless explicitly documented.

## Presentational vs Container Guidance

- **Pages** (`app/resume/*/page.tsx`): Orchestrate router, store selectors, guards, and compose **panels**. Keep them thin—no giant JSX trees duplicated across steps.
- **Panels** (`ReviewPanel`, `ExportPanel`, `WizardShell`, `WizardStepper`): Own layout, subcomponents, and local UI state (e.g. tab-like sub-step UI inside review).
- **Presentational leaf components**: Small pieces like `ScoreMeter`, static cards—receive data via props; no direct Zustand access unless the file is clearly a smart module.

## Preferred Reusable Components

- **Shell & flow**: `WizardShell`, `WizardStepper`, `useWizardGuard` (`hooks/use-wizard-guard.ts`).
- **Config**: `routes` / `apiRoutes` from `config/routes.ts`; step list from `config/wizard-steps.ts`; shared heights from `config/wizard-ui.ts`.
- **Resume-specific**: `ResumeDiffPanel`, `MiniGitDiff`, `ExportPanel`, ATS helpers from `@/lib/tailor-ats`.

## Anti-Patterns

- Hardcoded paths instead of `routes` / `apiRoutes`.
- New wizard steps without stepper config and `design.md` updates.
- **Purple / neon “AI” gradients** or heavy animated backgrounds on content (contradicts product intent).
- Pasting `fetch` in many components instead of a single hook/helper if the API surface grows—today minimal fetches are OK; refactor when duplicated.
- Stripping focus styles or alert roles for aesthetics.

## Safe Extension Guidance

- **New wizard step**: Add route under `app/resume/`, entry in `config/routes.ts` and `config/wizard-steps.ts`, link from `WizardStepper`, extend guard types if needed, document in `design.md` and the route’s `README.md` when you add one.
- **New panel section**: Follow existing **Card** + **Separator** stacking; reuse kicker/heading patterns from `ReviewPanel`.
- **Theming**: Change **CSS variables** in `globals.css` rather than sprinkling new palette hex across components—update `design.md` Color System when tokens change.
