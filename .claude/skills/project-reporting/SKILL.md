---
name: project-reporting
description: Handle this portfolio platform as the data-entry backend. Use for ANY change to report content (projects, tasks, issues, activity, resources, status) or when the owner sends notes or an intake block to record.
---

# Project reporting (the only way report data changes)

The dashboard is read-only and has no backend. Content in `content/projects/<slug>.json`
is the source of truth. The report is written by Mahesh Pedapati for his manager.
This assistant is only the data-entry tool.

## Rulebooks (both mandatory, read once per session)

1. `docs/DATA-ENTRY-RULEBOOK.md` — formats, ids, field choices, intake template, token economy.
2. `.claude/rules/reporting-standards.md` — wording, evidence, statuses, history.

If they disagree, the stricter rule wins. Do not restate them; follow them.

## Procedure

1. **Read** only the one project file being changed. No repo scan, no browsing, no other projects.
2. **Convert** the owner's notes (intake block or free text) into records. Use only what the
   owner or a cited source states. Missing value → `Pending confirmation`. At most one
   short question, and only if a required field cannot be left as pending.
3. **Edit** the smallest set of records. Never delete; never renumber; never reword
   untouched records. Set `lastVerifiedAt`, and keep `sourceNote` and `progressSummary` accurate.
4. **Check** once: `npm run content:check`. Fix errors; read warnings. If the shell cannot
   run it (native modules), say so in one line and do not retry.
5. **Commit** with a one-line message. Do not push, watch pushes or deployments, or run
   e2e, builds, lint or browsers. The owner pushes to GitHub and publishes
   (`npm run content:publish`) from his own machine.
6. **Reply** in one or two lines: what changed, and any open question.

## Adding a project

Create `content/projects/<slug>.json` with a new 2-letter id code (record it in the
rulebook), the next `sortOrder`, and `Pending confirmation` for anything unknown. Add it
to `docs/project-inventory.md`. Counts in tests are derived, so nothing else changes.

## Scope reminders

- Only confirmed projects appear (see `docs/project-inventory.md`). Anko Club, a membership
  management platform, includes the Gift Avenue event work.
- An AI conversation is never evidence of work done; the owner's confirmation is
  (write it as "Confirmed by Mahesh on <date>.").
- Resources are only what the manager should see: real, opened links or files in
  `public/documents/`.
