# Project Portfolio — working rules

@AGENTS.md

A read-only web dashboard in which **Mahesh Pedapati** reports his projects,
responsibilities, progress, blockers and supporting resources **to his manager**.
It is a professional reporting product. Accuracy beats completeness, every time.

Read these before changing anything:

- `docs/DATA-ENTRY-RULEBOOK.md` — exact formats, ids and steps for every content update (mandatory).
- `.claude/rules/reporting-standards.md` — what may be written in the report and how (mandatory).
- `.claude/rules/application-architecture.md` — layers, data flow, database and security.
- `.claude/rules/ui-design-standards.md` — the design system and interaction rules.
- Skills: `project-reporting` (updating content) and `project-discovery` (finding projects and evidence).

**Token economy:** this assistant is only the data-entry backend. Follow section 0 of
`docs/DATA-ENTRY-RULEBOOK.md`: minimal reads, no extra checks, short replies, never watch pushes.

## Reporting identity and audience

- **Author:** Mahesh Pedapati (the employee). **Reader:** his manager.
- Every manager-facing sentence is written as an employee reporting his own work:
  "Implemented enquiry forms…", never "Claude implemented…" or "I helped Mahesh…".
- The assistant maintaining this repository is a tool. It is never the subject of
  the report and the development process is never visible in the product.

## Non-negotiable reporting rules

1. No AI self-references, internal reasoning, scratchpads, prompts, conversations,
   debugging commentary or conversational filler in any manager-facing content.
2. Only report what evidence supports (GitHub, Notion, project plans, documents the
   owner confirms). A conversation with an AI is **not** evidence that work was done.
3. Never invent project names, dates, percentages, achievements, deliverables,
   approvals, stakeholders, links or statuses. Unknown → `Pending confirmation`.
4. Keep "implemented", "tested", "deployed" and "approved" distinct. Merged to a
   preview branch is not live. Built is not tested.
5. Never delete or overwrite history. Status changes are recorded automatically
   (`*_status_history`); deletes of reporting records are blocked by the database.
   To hide something, set `isPublished: false`.
6. Other people's responsibilities (e.g. a business contact's decisions) are
   reported as dependencies or issues, not as Mahesh's tasks.
7. `npm run content:check` must pass with zero errors before content is published.

## Technology stack

Next.js 16 (App Router, Cache Components, Partial Prefetching) · React 19 ·
TypeScript strict · Tailwind CSS 4 · shadcn/ui (Base UI) · Lucide icons ·
Supabase PostgreSQL (read with the anon key, server-side only) · Zod 4 ·
Vitest · Playwright · Vercel. Node 24.

This Next.js version differs from older ones — read `node_modules/next/dist/docs/`
before using an API you have not checked (see AGENTS.md). Data reads use
`'use cache'` + `cacheLife`; anything reading `params`/`searchParams` sits inside
`<Suspense>`.

## Project structure

```
content/                 Authored report content (JSON) — the source of truth
  profile.json           Reporting owner details
  projects/<slug>.json   One project with its tasks, issues, updates, resources, stakeholders
docs/                    Project inventory and confirmation list, handover
scripts/                 content-check, content-publish, rls-check (run with tsx)
supabase/migrations/     SQL migrations (schema, RLS, history triggers)
src/domain/              Pure types, Zod schemas, validation, view logic (unit tested)
src/server/portfolio/    Repository: loads records from Supabase or content files
src/components/          UI: layout/, portfolio/ (feature), ui/ (shadcn primitives)
src/app/                 Routes: / , /projects, /projects/[slug], /activity, /resources, /about
e2e/                     Playwright journeys and layout checks
```

## Database conventions

- Text primary keys (`^[a-z0-9][a-z0-9-]{1,79}$`) authored in content, so publishing
  is an idempotent upsert. snake_case columns; camelCase in TypeScript; the only
  mapping lives in `src/server/portfolio/rows.ts`.
- Every table has RLS. Anonymous users may only `SELECT` rows with
  `is_published = true` (and a published parent project). No anonymous writes.
- New fields need: migration → Zod schema → row mapping → content → UI → tests.
- Never edit an applied migration; add a new one.

## Coding conventions

- No project information in components. Components receive data from
  `getPortfolio()`; derived figures come from `src/domain/portfolio.ts`.
- No `any`. Validate everything crossing a boundary with Zod.
- Server Components by default; `'use client'` only for interaction
  (filters, collapsibles, mobile nav).
- Never render a control that does nothing.

## Design principles

Calm, premium internal-portal look: strong typography, generous spacing, one
accent colour, status colours only for meaning, consistent cards. Details in
`.claude/rules/ui-design-standards.md`.

## Testing requirements

- `npm run check` — typecheck, lint, unit tests, content check. Must pass.
- `npm run e2e` — Playwright journeys at 390 / 900 / 1440 px (uses the content
  files, no database). Must pass before handing over.
- `npm run rls:check` — proves anonymous users cannot write or read unpublished data.

## Deployment requirements

- Vercel. Env vars: `SUPABASE_URL`, `SUPABASE_ANON_KEY` (runtime). The
  `SUPABASE_SERVICE_ROLE_KEY` is for `content:publish` on a trusted machine only —
  never in Vercel, never in client code, never committed.
- Production must read from Supabase; the content-file data source is for tests and
  local development only.
- Do not claim a deployment works until the production URL has been tested.
- No pushes to remote repositories, paid services or destructive database changes
  without the owner's approval.
