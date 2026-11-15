# Technical handover — Project Portfolio

## What was built

A read-only, manager-facing web dashboard reporting Mahesh Pedapati's projects:
Overview (summary figures, project cards, recent activity, upcoming work, blocked or
awaiting-approval items), All Projects (search and filters), a detail page per project
(overview, completed, in progress, to be completed, issues and dependencies, resources,
timeline), Activity & Updates (filters by project, category and dates), Resources, and
About (how the report is verified, status definitions).

Two strategy documents are attached to their projects under Resources:
- `/documents/southern-uniforms-business-marketing-strategy.pdf`
- `/documents/scrubness-business-marketing-strategy.pdf`

Their editable sources are `docs/strategy/*.html`; `npm run docs:pdf` rebuilds the PDFs.

## Architecture

```
content/*.json  ─content:check─▶ content:publish ─upsert─▶ Supabase Postgres (RLS)
                                                               │ anon key, server-side
src/server/portfolio (Zod-validated load, 'use cache' for minutes) ─▶ src/domain (pure views)
                                                               ─▶ src/app (Server Components)
```

- Next.js 16 (App Router, Cache Components, Partial Prefetching), React 19, TypeScript
  strict, Tailwind CSS 4, shadcn/ui (Base UI), Lucide, Zod 4, Vitest, Playwright.
- All data access is server-side; no Supabase key is sent to the browser (checked by
  `npm run rls:check`).
- Published changes appear within minutes (`cacheLife('minutes')`), with no redeploy.
- Details: `.claude/rules/application-architecture.md`.

## Database

Supabase project `project-portfolio` (ref `hdduuyzkfazspysxbzod`, Sydney), organisation
Anouconcept. Migration: `supabase/migrations/20261116000000_portfolio_schema.sql`.

| Table | Purpose |
|---|---|
| `report_profile` | Reporting owner (single row) |
| `projects` | One row per project |
| `tasks` | Mahesh's deliverables: status, category, priority, progress, dependency, evidence, dates |
| `task_status_history`, `project_status_history` | Every status change, written by triggers; append-only |
| `issues` | Blockers, decisions, approvals, dependencies and risks owned by others |
| `project_updates` | Dated activity entries |
| `resources` | Verified links and documents |
| `stakeholders` | People and roles per project |

Integrity and security:
- Enums for every status and category; check constraints (e.g. a completion date only
  on completed work; blocked work needs a dependency); foreign keys `on delete restrict`.
- Delete triggers block removal of projects, tasks, issues, updates and history. To hide a
  record, set `isPublished: false`.
- RLS on every table: `anon` may only SELECT published rows of published projects. All
  write privileges are revoked from `anon` and `authenticated`. Verified with
  `npm run rls:check` (all insert, update and delete attempts refused).

## Deployment

- Vercel project: see "Deployment URL" below.
- Environment variables in Vercel (Production and Preview): `SUPABASE_URL`, `SUPABASE_ANON_KEY`.
  Nothing else. The service role key and database password stay on the trusted
  machine in `.env.local` (git-ignored, mode 600).
- Deployment URL: _see the latest handover note in the conversation; update this line when final._

## Repository

Local: `/Users/mahesh/Public/www/next/projectManager` (git initialised, nothing
committed or pushed). Pushing to GitHub requires the owner's approval.

## Environment variables

See `.env.example`.

| Variable | Where | Purpose |
|---|---|---|
| `SUPABASE_URL` | Vercel + local | Project URL |
| `SUPABASE_ANON_KEY` | Vercel + local | Read-only public key (RLS enforced) |
| `SUPABASE_SERVICE_ROLE_KEY` | Local only | `content:publish` |
| `SUPABASE_DB_PASSWORD` | Local only | `supabase db push --remote` |
| `PORTFOLIO_DATA_SOURCE=content` | Tests/dev only | Read `content/` instead of Supabase (refused in Vercel production) |

## How project information is updated

1. Gather evidence (GitHub, Notion, project plans). Follow `.claude/skills/project-reporting/SKILL.md`.
2. Edit `content/projects/<slug>.json`: change a task's `status`, add `evidence` and
   `completedAt`, add an entry to `updates`, add `resources` with real URLs, and update
   `lastVerifiedAt` and `sourceNote`.
3. `npm run content:check`: fix every error and read every warning.
4. `npm run content:publish`: upserts by id, never deletes; status history is recorded
   automatically.
5. Check the live page after a few minutes.

## How to add a new project

1. Confirm with the owner that it is in scope; record it in `docs/project-inventory.md`
   (use `.claude/skills/project-discovery/SKILL.md`).
2. Copy an existing file in `content/projects/` to `<new-slug>.json`. Give every id a
   unique prefix (e.g. `xy-…`), set `sortOrder`, and fill only verified information.
3. `npm run content:check`, then `npm run content:publish`. The project page is created on
   first visit; no deploy is needed.

## How to maintain the reporting rules

- Rules: `CLAUDE.md` and `.claude/rules/reporting-standards.md`.
- Automated enforcement: `src/domain/validation.ts` (structure, evidence, dates,
  references, resource labels) and `src/domain/language.ts` (prohibited-language lint).
  Every rule has unit tests in `src/domain/*.test.ts`; add a test case with each new
  rule, including a "legitimate content" case so real project text is never rejected.
- The browser tests also lint every rendered page for prohibited language.

## Testing

- `npm run check`: typecheck, ESLint, 48 unit tests, content check.
- `npm run e2e`: 21 Playwright journeys at 1440 and 390 px, plus a layout sweep of every
  page at 390/900/1440 px (no sideways scroll, no console errors). Point it at a deployed
  site with `E2E_BASE_URL=https://… npx playwright test`.
- `npm run rls:check`: live database security.

## Known limitations

- V1 has no sign-in. Anyone with the URL can read the report and open the strategy PDFs.
  Pages are marked `noindex`; Vercel Deployment Protection or Supabase Auth would make it private.
- Hosted on Vercel's Hobby plan at the owner's choice. Vercel limits Hobby to personal,
  non-commercial use; move it to a company team if that becomes a concern.
- Some links point to private systems (GitHub, Notion); the manager needs access to open them.
- Content reflects sources as of 16 Nov 2026; the Southern Uniforms Notion tracker was last
  updated 27 Oct 2026. Open questions are listed in `docs/project-inventory.md`.
- Strategy PDFs are static files; rebuild and redeploy after editing their HTML sources.

## Future improvements (not built)

Authentication and private reporting; editable records through an admin page; manager
comments and approvals; weekly report and PDF export of the dashboard; drafting updates
from GitHub and Notion activity for human review.
