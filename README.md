# Resume builder

Personal **full-stack** project: a **Next.js** wizard uploads a resume (PDF/DOCX), pastes a **job description**, gets **Gemini-powered** tailoring against a **fixed LaTeX base**, then **reviews** a diff + ATS-style hints and **exports** LaTeX / PDF.

**What you’re looking at**

| Layer | Role |
| ----- | ---- |
| **Frontend** | App Router UI under `app/resume/*`, wizard shell in `components/wizard/`, client state in `store/wizard-store.ts` (persisted to `sessionStorage`). |
| **BFF (Next)** | `app/api/resume/*` routes **proxy** parse / tailor / download to the **Python FastAPI** service (`NEXT_PUBLIC_API_URL`, default `http://127.0.0.1:8000`). |
| **Backend** | `backend/` — document parse, Gemini orchestration, PDF pipeline. Runbook: **`backend/README.md`**. |

**Base LaTeX asset:** `public/original-resume.tex` (also mirrored under `e2e/fixtures/resume/` for tests). The backend may ship its own copy for jobs; keep them in sync when the template changes.

---

## User flow (routes)

| Step | Route | What happens |
| ---- | ----- | ------------ |
| 1 | `/resume/upload` | User picks PDF/DOCX → **parse** via API → text stored for tailoring |
| 2 | `/resume/job` | Paste JD → **Generate** → **tailor** API → result stored in session |
| 3 | `/resume/review` | Diff, suggestions, model “ATS-style” style signals |
| 4 | `/resume/export` | Copy `.tex` / download **PDF** (download still goes through Next → backend) |

**`/``** redirects to **`/resume/upload`** (`app/page.tsx`).

Pathnames live in **`config/routes.ts`**. Deeper wizard behaviour, guards, and **E2E inventory**: **`components/wizard/README.md`**.

---

## Requirements

- **Node.js 20+** (see `package.json` `engines`)
- **npm** for the frontend
- **Python 3.11+** and backend deps if you run tailoring/parse/PDF locally — see `backend/README.md`

---

## Environment (frontend)

Create **`.env.local`** for Next (see **`.env.example`** for optional OAuth-related vars used elsewhere in the template).

| Variable | Purpose |
| -------- | ------- |
| **`NEXT_PUBLIC_API_URL`** | Base URL of the FastAPI backend (e.g. `http://127.0.0.1:8000` locally, or your Cloud Run URL in production). Omit only if you rely on the default in code. |

**Gemini / models** for the live tailor path are configured on the **backend** (`GEMINI_API_KEY`, `GEMINI_MODEL` — see `backend/.env.example` and `backend/README.md`). The repo still contains **`lib/tailor-resume.ts`** + **`prompts/tailor-resume.ts`** as TypeScript prompt / schema helpers; production traffic for parse/tailor/download is intended to go through the **proxied FastAPI** stack when the backend is running.

---

## Scripts (frontend)

| Command | Description |
| ------- | ----------- |
| `npm run dev` | Dev server → [http://localhost:3000](http://localhost:3000) (home → upload) |
| `npm run build` / `npm run start` | Production build / server |
| `npm run lint` | ESLint |
| `npm run e2e` | **Playwright** suite (`e2e/specs/`) — Chromium, starts `npm run dev` unless `PLAYWRIGHT_BASE_URL` is set |
| `npm run e2e:ui` / `npm run e2e:headed` / `npm run e2e:report` | Local debugging helpers |

---

## API surface (what the browser calls)

Same-origin **`POST`** handlers under **`/api/resume/*`** (implemented in `app/api/resume/`). They validate input and **forward** to the backend where noted.

| Path | Notes |
| ---- | ----- |
| **`/api/resume/parse`** | Multipart file → proxied parse |
| **`/api/resume/tailor`** | JSON `{ jd, resume_text }` → proxied tailor |
| **`/api/resume/download`** | JSON `{ latex, filename }` → proxied PDF |

---

## Testing (E2E)

- **Framework:** Playwright (`playwright.config.ts`).
- **Important:** Most wizard specs **`page.route`** the same `/api/resume/*` URLs and return **fixtures** from `e2e/mocks/` — they assert **UI + client contracts**, not your live Python service. That keeps CI deterministic without standing up Gemini in GitHub Actions.
- **Fixtures:** `e2e/fixtures/` (resume + JD text), **`e2e/helpers/`** (mocks, shared navigation).

---

## CI / deploy (GitHub Actions)

| Workflow | When it runs | Intent |
| -------- | ------------- | ------ |
| **`e2e-playwright.yml`** | Push to **`main`** (and manual dispatch) | Install deps, run **`npm run e2e`**, upload HTML report artifact |
| **`deploy-frontend.yml`** | After **E2E Playwright** completes **successfully** on `main` (`workflow_run`), plus **manual** `workflow_dispatch` | Vercel production deploy for the **same commit SHA** that passed E2E; path gate skips **backend-only** commits (same idea as the old `paths-ignore`) |
| **`deploy-backend.yml`** | Push to **`main`** when **`backend/**`** (or that workflow file) changes | **Not** gated on Playwright — E2E does not exercise the Python service |

If **Vercel Git integration** also auto-deploys on every push, you can get a **second** deploy channel next to this Action; align dashboard settings with “deploy only after CI” if you want a single front door.

---

## Repo layout (high level)

| Path | Contents |
| ---- | -------- |
| `app/` | App Router: `page.tsx`, `resume/*` wizard, `api/resume/*` proxies |
| `components/` | `wizard/` UI, `resume-tailor/`, shadcn `ui/` |
| `config/` | Routes, stepper config, UI constants |
| `store/` | Zustand wizard store |
| `hooks/` | e.g. `use-wizard-guard` |
| `types/` | Shared TS types (`resume-tailor`, env) |
| `lib/` | Small shared utilities + tailor helpers |
| `prompts/` | Tailor prompt text / schema direction (TS) |
| `e2e/` | Playwright **specs**, **helpers**, **fixtures**, **mocks** |
| `backend/` | FastAPI service (Dockerfile, `requirements.txt`, services) |
| `public/` | Static assets served by Next (`original-resume.tex`, icons) |
| `.github/workflows/` | E2E, Vercel deploy, GCP backend deploy |

---

## Product notes

- **ATS-style numbers** in the UI are **model estimates** vs the JD — not scores from a commercial ATS.
- **Agent / house rules** for this repo: **`AGENTS.md`**.
- **Design docs:** `design.md`, `design-pattern.md`, plus `notion/DESIGN.md` if you use that copy.

---

## Adding a wizard step

1. Add or extend a route under `app/resume/…`.
2. Register the step in **`config/wizard-steps.ts`**.
3. Align **`config/routes.ts`**, guards (`useWizardGuard`), and **`components/wizard/README.md`**.
4. Extend **Playwright** coverage for any new user-visible behaviour.
