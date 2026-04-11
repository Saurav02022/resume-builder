# Resume builder

Next.js app that tailors a **fixed LaTeX resume** to a pasted **job description** using **Google Gemini**, then lets you **review changes** (diff + ATS-style analysis) and **export** `.tex` / PDF.

**Base file:** `public/original-resume.tex` (read on the server for each tailor run).

## Flow

| Step | Route | What happens |
| ---- | ----- | ------------ |
| 1 | `/resume/job` | Paste JD → **Generate** calls the tailor API → stores result in session |
| 2 | `/resume/review` | Git-style diff, suggestions, model “ATS-style” before/after scores |
| 3 | `/resume/export` | Download / compile |

`/` redirects to **`/resume/job`**.

State lives in **Zustand** persisted to **`sessionStorage`** (`jd`, `tailorData`). Regenerating **replaces** the current tailored run (no built-in version history).

## Requirements

- Node 18+
- **`NEXT_PUBLIC_GEMINI_API_KEY`** in `.env.local`
- **PDF (compile):** [Puppeteer](https://pptr.dev/) bundles Chromium; first run may download it. The in-app PDF is a **monospace print** of the `.tex` source, not full LaTeX typesetting — for print-perfect PDF use **Overleaf** with the downloaded `.tex`.

## Setup

```bash
npm install
```

Create **`.env.local`**:

```bash
NEXT_PUBLIC_GEMINI_API_KEY=your_key
# optional — see "Gemini model" below
# GEMINI_MODEL=gemini-2.5-pro
```

### Gemini model

Tailoring uses the **Google Generative AI** SDK with **[structured JSON output](https://ai.google.dev/gemini-api/docs/structured-output)** (`responseMimeType: application/json` + `responseSchema`). Generation uses a **low temperature** and **high `maxOutputTokens`** so analysis + full `tailoredTex` are less likely to truncate or drift.

**Default:** **`gemini-2.5-flash`** if `GEMINI_MODEL` is unset.

| Situation | Set `GEMINI_MODEL` to… |
| --------- | ----------------------- |
| **Stronger reasoning / quality** | `gemini-2.5-pro` |
| **Newest Pro preview** (if your key supports it) | `gemini-3.1-pro-preview` |
| **Legacy** | `gemini-2.0-flash` — [deprecated](https://ai.google.dev/gemini-api/docs/deprecations) |

Full list: [Gemini models](https://ai.google.dev/gemini-api/docs/models).

## Scripts

| Command | Description |
| ------- | ----------- |
| `npm run dev` | Dev server ([http://localhost:3000](http://localhost:3000) → `/resume/job`) |
| `npm run build` | Production build |
| `npm run start` | Production server |
| `npm run lint` | ESLint |

## API (internal)

| Method | Path | Body | Notes |
| ------ | ---- | ---- | ----- |
| `POST` | `/api/resume/tailor` | `{ "jd": string }` (min ~40 chars) | Reads `public/original-resume.tex`; returns structured JSON: `tailoredTex`, `comparisonSummary`, `atsScores`, `suggestions`, `issues`, `fixes`, etc. |
| `POST` | `/api/resume/compile` | `{ "tex": string }` | PDF binary (Puppeteer) or JSON error |

All app pathnames (pages + API) are centralized in **`config/routes.ts`**.

## Project layout (short)

| Area | Path |
| ---- | ---- |
| Resume wizard pages | `app/resume/` (`job`, `review`, `export`) + `layout.tsx` (shell / stepper) |
| Tailor + Gemini | `lib/tailor-resume.ts`, `prompts/tailor-resume.ts` |
| PDF rendering | `lib/render-resume-pdf-puppeteer.ts` (and compile route) |
| Client state | `store/wizard-store.ts` |
| Step config (stepper labels) | `config/wizard-steps.ts` |
| Types | `types/resume-tailor.ts` |

## Adding a wizard step

1. Add a route under `app/resume/…` (or extend the flow as needed).
2. Register the step in **`config/wizard-steps.ts`**.
3. Wire navigation / guards if you use `useWizardGuard` patterns.

## Notes

- **ATS scores** in the UI are **model estimates** for keyword/structure fit vs the JD — not scores from a commercial ATS product.
- Repo conventions for agents: see **`AGENTS.md`** (if present).
