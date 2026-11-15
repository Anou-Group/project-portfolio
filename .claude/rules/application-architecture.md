# Application architecture

## Data flow

```
content/*.json ──content:check──▶ content:publish (service role, trusted machine)
                                         │ upsert, never delete
                                         ▼
                          Supabase Postgres (RLS: anon SELECT published only)
                                         │ anon key, server-side
                                         ▼
   src/server/portfolio/repository.ts ── Zod parse ──▶ getPortfolio() ('use cache')
                                         │
                                         ▼
          src/domain/portfolio.ts (metrics, search, filters, grouping — pure)
                                         │
                                         ▼
                         Server Components in src/app (+ small client islands)
```

- **Source of truth for authored content:** `content/`. It is versioned, reviewed
  and validated before it reaches the database.
- **Source of truth for what the manager sees:** Supabase. Production always reads
  Supabase. `PORTFOLIO_DATA_SOURCE=content` (tests and local development only)
  reads the content files through the same Zod parsing and mapping.
- **History** lives in the database: `task_status_history` and
  `project_status_history` are written by triggers; delete triggers stop history
  from being lost. Publishing is an upsert by id.

## Layers

| Layer | Path | Rules |
|---|---|---|
| Domain | `src/domain/` | Pure TypeScript. Types, Zod schemas, validation, labels, derived views. No I/O. Unit tested. |
| Server | `src/server/portfolio/` | Loads records (Supabase or content), maps rows ↔ domain, validates with Zod. Only place that knows about Supabase. |
| UI | `src/components/` | Presentational. `layout/` (shell, nav), `portfolio/` (feature components), `ui/` (shadcn primitives, do not add business logic). |
| Routes | `src/app/` | Compose server data with components. Read `params`/`searchParams` inside `<Suspense>`. |
| Scripts | `scripts/` | `content-check`, `content-publish`, `rls-check`. Run with `tsx`. |

## Caching

`getPortfolio()` uses `'use cache'`, `cacheLife('minutes')` and
`cacheTag('portfolio')`. Published changes appear within minutes without a deploy.
The dataset is small (a handful of projects), so one cached load serves every page.

## Database

Tables: `report_profile`, `projects`, `tasks`, `task_status_history`,
`project_status_history`, `issues`, `project_updates`, `resources`, `stakeholders`.
Enums for every status and category. Foreign keys with `on delete restrict`;
indexes on foreign keys and on `project_updates.occurred_on`.

Security:
- RLS enabled on every table; `anon`/`authenticated` get `SELECT` only on published
  rows whose project is published. Write privileges are revoked from both roles.
- The service role key is used only by `scripts/content-publish.ts` from a trusted
  machine. It is never set in Vercel and never imported by app code.
- No secrets, passwords or private notes are stored. Unpublished rows exist only for
  history and are invisible to anonymous users.

## Extending (future features)

- **Auth / private reporting:** add Supabase Auth, change policies from `anon` to
  role-based; `is_published` already separates public from private rows.
- **Editable records / manager comments / approvals:** add tables keyed to
  `projects`/`tasks`; writes go through server actions with Zod validation; history
  triggers already exist.
- **Weekly report / PDF export:** build from `src/domain/portfolio.ts` views.
- **GitHub / Notion / Drive integrations:** produce content JSON or draft updates
  for review; they must still pass `content:check` and human review before publish.

Do not build these until asked.
