/**
 * App pathnames — kebab-case, intent-first (`/resume/job` not `/wizard/jd`).
 * Import from here only.
 */
export const routes = {
  home: "/",
  /** Resume flow: job posting → review → export */
  resume: {
    upload: "/resume/upload",
    job: "/resume/job",
    review: "/resume/review",
    export: "/resume/export",
  },
  api: {
    resume: {
      parse: "/api/resume/parse",
      tailor: "/api/resume/tailor",
      download: "/api/resume/download",
    },
  },
} as const;

/** Alias for API-only imports — same as `routes.api` */
export const apiRoutes = routes.api;
