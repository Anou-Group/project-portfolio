---
name: project-reporting
description: Update the manager-facing portfolio report — add or change a project's tasks, issues, activity, resources or status from verified evidence, then validate and publish. Use whenever report content in content/ changes.
---

# Project reporting

The report is written by Mahesh Pedapati for his manager. Follow
`.claude/rules/reporting-standards.md` and `docs/DATA-ENTRY-RULEBOOK.md` exactly.
This skill is the procedure.

## 1. Gather information

For the project being updated, collect evidence from its sources (see the project's
`sourceNote` and `docs/project-inventory.md`):

- GitHub: `gh pr list -R <repo> --state all`, commits on the working branch, open PRs.
- Notion: tracker rows (status, owner, waiting on, completed date, evidence link),
  decision log, weekly updates.
- Project plan files in the repository (`docs/PLAN.md` and similar).
- Documents or confirmations supplied by the owner.

Write down the date each source was last updated. Never use an AI conversation as
evidence that something happened.

## 2. Identify actual deliverables

A deliverable is something a manager would recognise as an outcome (a page, a
feature, a document sent, a configuration completed) — not every commit. Group
related PRs into one deliverable and cite them in `evidence`.

## 3. Separate completed, ongoing and pending work

| Evidence says | Status |
|---|---|
| Merged / Done / sent / verified | `completed` (+ `evidence`, + `completedAt` if known) |
| Started, open PR, "Testing" | `in_progress` (say "in testing" if so) |
| Planned, "Not started" | `pending` |
| Cannot move because of something else | `blocked` (+ `dependency`) |
| Waiting for someone's decision or sign-off | `awaiting_approval` (+ `dependency`) |

State the level reached: built / merged to preview / tested / deployed / approved.

## 4. Identify dependencies and blockers

Items owned by other people (business contact, warehouse, a vendor) are `issues`
with `kind` (`blocker`, `dependency`, `decision`, `approval`, `risk`) and
`waitingOn`. Only record what the sources state. If none are documented, leave the
list empty — do not manufacture risks.

## 5. Validate supporting resources

- Every resource URL must have been opened or returned by the source system
  (e.g. `gh pr view`, a Notion fetch, a file in `public/documents/`).
- Give each a meaningful `title`, a `type`, a one-line `description`, and
  `accessNote` if it needs a login ("Private repository — GitHub access required").
- Local documents go in `public/documents/` and are linked as `/documents/<file>`.

## 6. Write manager-facing updates

- Implied first person, action verbs: "Implemented…", "Configured…", "Sent…".
- Plain language first; technical detail only when it helps.
- Unknown values: `Pending confirmation`. No TBC/N/A.
- Activity entries: one change each, dated, categorised; don't repeat the project
  description.
- Update `lastVerifiedAt` (the date you checked the sources) and `sourceNote`.

## 7. Preserve historical information

- Never remove tasks, issues or activity from content. Change status instead; set
  `isPublished: false` only to hide something that should not be shown.
- When a task completes: keep its text, add `evidence` and `completedAt`, add an
  activity entry. The database keeps the status history automatically.
- Resolve issues with `status: "resolved"` and `resolvedOn`.

## 8. Review before publishing

1. `npm run content:check` — fix every **error**. Read every **warning** and either
   fix the text or confirm it is legitimate (e.g. "Claude" as a product name in
   project content is fine; as the person who did the work it is not).
2. Read the changed text as the manager would. Ask:
   - Is every claim backed by the cited evidence?
   - Is "done" really done (merged? tested? live?)?
   - Is anything someone else's responsibility written as Mahesh's task?
   - Is there any AI, prompt, debugging or conversational language?
   - Are dates and numbers copied from sources, not estimated?
3. `npm run content:publish` (needs `SUPABASE_SERVICE_ROLE_KEY` on this machine).
   It upserts by id and never deletes.
4. Open the production site and check the changed project page.
