# Work Intelligence and Reporting System — implementation plan

Date: 17 November 2026
Owner: Mahesh Pedapati
Repository: Anou-Group/project-portfolio

## Verified current state

- Next.js 16 App Router, React 19, TypeScript, Tailwind 4, Supabase JS, Zod, Vitest and Playwright.
- The application already has overview metrics, a Monday-style project board, task board, project details, activity, filters, and resources.
- There are no API route handlers or server actions. The dashboard has no real user accounts; stakeholders are reporting data, not users.
- Production reads the portfolio from Supabase. Project updates are still authored in `content/*.json` and sequentially upserted by `scripts/content-publish.ts`; JSON remains the editing source.
- The linked database has one applied migration and contains 5 projects, 132 tasks, 142 task status-history rows, 5 project status-history rows, 25 issues, 43 updates, 17 resources, 14 stakeholders and 1 profile.
- History captures status changes only. General record edits, approval provenance and actor identity are not audited. There is no optimistic locking.
- There is no document-ingestion workflow or private document-storage setup. Existing PDF files are static public assets.
- A private, git-ignored data export was saved at `supabase/backups/20261117-before-work-intelligence-data.json` (mode 0600). Local and remote migration `20261116000000` match. A CLI SQL dump was attempted but requires Docker, which is unavailable.
- The user-supplied URL `project-manager-omega-orcin.vercel.app` does not match this checkout's Vercel project name `project-portfolio`. Confirm project identity before production release.

## Product and interaction principles

- Keep the single-owner model. Do not create simulated users, user tables or a dashboard login.
- PostgreSQL is the authoritative store for approved work records. JSON is not the production editing source.
- AI/MCP may read authorized context and submit validated proposals with source references. It must not directly change canonical project/task records.
- The owner reviews a proposal and explicitly approves it. The backend applies it transactionally with an expected-version check; stale proposals cannot overwrite newer work.
- Preserve the existing Monday-style project and task board.
- Use progressive disclosure:
  1. **At a glance:** a two-minute portfolio scan: current status, what changed, what is next, and what is waiting.
  2. **Project layer:** project board and concise project snapshot.
  3. **Work layer:** tasks, dates, dependencies and milestones.
  4. **Evidence layer:** source excerpts, resources, decision rationale and change history, opened only for the relevant item.
- Avoid turning the first screen into a dense report. Deeper detail should be available on demand.

## Phases

### 0. Baseline and recovery — in progress
- Preserve the existing schema and project data.
- Retain the private data export and applied migration as the recovery baseline.
- Before the first remote schema change, verify the export counts and record the restore procedure.
- Keep implementation on a feature branch until the target Vercel project is verified.

### 1. Database-first records and history
- Add append-only audit events and full record versions for project, task, issue, decision and update changes.
- Add optimistic version fields and an atomic database operation for applying an approved change set.
- Move approved create/edit/status changes behind validated server services and SQL transactions.
- Import/check existing records from the JSON files, compare content and counts, then stop using JSON as the production editing source. Keep a reviewed JSON export only if useful.
- Preserve current published read-only dashboard behavior.

### 2. Evidence and secure documents
- Add source records for uploaded documents, pasted notes and conversation artifacts, with source type, timestamp, hash and provenance.
- Store original documents in a private Supabase Storage bucket with type/size limits; keep extraction output linked to the original.
- Provide time-limited document links only where needed.
- Link tasks, decisions and proposals to exact source records and excerpts.

### 3. Approval queue and conversation tools
- Add typed proposals for tasks, dates, dependencies, decisions and recurring work.
- Validate proposals server-side with Zod and database constraints.
- Show the source, proposed changes and current record versions for owner review.
- Approval is a separate explicit action; application updates and audit events commit atomically.
- Add an MCP endpoint with read tools and proposal-only tools. It can create proposals, never apply canonical changes by itself.
- Keep a separate explicit approval action in the connected conversation or owner workflow. Do not add dashboard user accounts.

### 4. Planning and decision history
- Add recurring-work definitions and schedule instances with cadence, next date and status.
- Add decision records with rationale, source links, supersession and revised direction.
- Compare planned versus completed work using dated snapshots, not reconstructed history.
- Support daily, weekly, monthly and project-level snapshots from approved data.

### 5. Manager-facing layers and release
- Refine the overview for a two-minute scan and keep project/task detail progressively deeper.
- Keep the manager view read-only; only approved information appears there.
- Check manager-visible resources and documents for appropriate exposure.
- Verify the intended Vercel project before any release.

## Acceptance checks per phase

- Existing routes and records remain usable after additive migrations.
- No AI/MCP tool can alter canonical records without the separate owner approval action.
- Applying an approved change updates records, audit events and versions atomically.
- A concurrent edit returns a clear stale-proposal result, not an overwrite.
- Anonymous visitors cannot read proposals, private sources or unapproved content.
- Backup restoration reproduces expected row counts and a usable portfolio.
- Typecheck, lint, unit tests, browser journeys and RLS checks pass for each relevant phase.

## Initial implementation order

1. Confirm the supplied Vercel URL maps to this repository/project.
2. Add the append-only audit/version and proposal schema in a new migration.
3. Implement the validated, transaction-safe proposal service while keeping the current UI read-only.
4. Add the owner-facing review/approval experience without creating user accounts.
5. Add secure document sources and the MCP proposal tools.
6. Improve the overview and project detail layering without replacing the existing board.
