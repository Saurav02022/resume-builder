# Wizard Route Notes

Full stack, AI, testing, and DevOps overview: **[`README.md`](../../README.md)** (repository root — architecture diagram, technology matrix, CI gates).

## Route Location and URL
- Upload: `/resume/upload`
- Job: `/resume/job`
- Review: `/resume/review`
- Export: `/resume/export`

## Linked Entry Pages
- `app/resume/upload/page.tsx`
- `app/resume/job/page.tsx`
- `app/resume/review/page.tsx`
- `app/resume/export/page.tsx`

## Problem Statement
The wizard is the product-critical path. It handles upload parsing, JD-based tailoring, diff review, and export. Any regression in guard logic, API contract handling, or session state breaks user outcomes.

## Access and Guards
- `useWizardGuard("review" | "export")` redirects to `/resume/job` when `tailorData` is missing; if parsed resume text is also missing, the job step sends the user to `/resume/upload`.
- Job page redirects to `/resume/upload` when parsed resume text is absent.
- State source is `store/wizard-store.ts`, persisted in `sessionStorage`.

## Data Flow
1. Upload page posts file to `/api/resume/parse`.
2. Parsed text is stored in Zustand.
3. Job page posts `{ resume_text, jd }` to `/api/resume/tailor`.
4. Tailor payload is stored as `tailorData`.
5. Review reads `tailorData`.
6. Export posts `{ latex, filename }` to `/api/resume/download`.

## Container and Presentational File Map
- Container pages:
  - `app/resume/upload/page.tsx`
  - `app/resume/job/page.tsx`
  - `app/resume/review/page.tsx`
  - `app/resume/export/page.tsx`
- Presentational components:
  - `components/wizard/wizard-shell.tsx`
  - `components/wizard/wizard-stepper.tsx`
  - `components/wizard/wizard-input-card.tsx`
  - `components/wizard/review-panel.tsx`
  - `components/wizard/export-panel.tsx`

## Loading, Empty, and Error Behavior
- Upload page shows parse error in destructive alert.
- Job page disables generation under JD length threshold and shows API failure alert.
- Review/export pages return `null` while guard redirection resolves when prerequisites are missing.
- Export panel surfaces download errors in page-level alert.

## E2E Test Coverage
- Framework: Playwright.
- Test root: `e2e/`.
- Current suite status: 34 test cases covering critical flow + hard edge contracts.
- Specs:
  - `e2e/specs/wizard-home.spec.ts` — `/` → upload
  - `e2e/specs/wizard-happy-path.spec.ts` — full wizard smoke
  - `e2e/specs/wizard-guards.spec.ts` — empty-state redirects
  - `e2e/specs/wizard-upload-edge.spec.ts` — upload disabled, parse contract / non-JSON
  - `e2e/specs/wizard-upload-file-hard-edges.spec.ts` — unsupported extension + empty file handling
  - `e2e/specs/wizard-job-boundaries.spec.ts` — JD length + resume length gates
  - `e2e/specs/wizard-tailor-errors.spec.ts` — tailor HTTP error, short JD, parse error
  - `e2e/specs/wizard-tailor-api-contracts.spec.ts` — tailor `success: false` + non-JSON on 200
  - `e2e/specs/wizard-tailor-loading.spec.ts` — in-flight loading + single request
  - `e2e/specs/wizard-review-navigation.spec.ts` — review tabs, Edit JD, export ↔ review
  - `e2e/specs/wizard-session-persistence.spec.ts` — reload keeps review
  - `e2e/specs/wizard-regenerate.spec.ts` — second tailor replaces output
  - `e2e/specs/wizard-export.spec.ts` — PDF download / failure
  - `e2e/specs/wizard-export-contracts.spec.ts` — 200/non-PDF and 200/error-envelope download contracts
  - `e2e/specs/wizard-export-copy.spec.ts` — Copy LaTeX + clipboard
  - `e2e/specs/wizard-multi-jd-regression.spec.ts` — multi-company JD mocks
- Deterministic fixtures:
  - Resume fixture: `e2e/fixtures/resume/original-resume.tex`
  - Multiple company JDs in `e2e/fixtures/jd/`
  - API mock payloads in `e2e/mocks/`

## Safe Extension Notes
- Keep all route paths centralized in `config/routes.ts`.
- Keep guard behavior aligned with `store/wizard-store.ts`.
- For new wizard steps, add route + config entry in `config/wizard-steps.ts` and extend E2E coverage before release.
