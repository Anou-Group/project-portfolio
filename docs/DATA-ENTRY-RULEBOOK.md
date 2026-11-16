# Data entry rulebook

How report data is fed into `content/projects/<slug>.json`. There is no backend, so these
rules are the only thing keeping entries uniform. Follow them exactly; do not improvise
formats. Wording rules live in `.claude/rules/reporting-standards.md` (they still apply).

**Loop (every update):** edit content → `npm run content:check` → fix every error →
read every warning → `npm run content:publish` → `git commit`. Nothing is "done" before
`content:check` shows 0 errors.

## 0. Token economy (strict)

The assistant is only a data-entry backend. Keep usage minimal:
- Read only the project file being changed and this rulebook. Do not scan the repo, read
  other projects, or re-read files after editing.
- Do not run browsers, e2e tests, builds or lint. Run `npm run content:check` once at the
  end (only when content changed).
- Do not research or fix anything outside the update. If information is missing, write
  `Pending confirmation` and ask at most one short question.
- Never watch deployments or pushes. Commit when asked; the owner pushes to GitHub.
- Reply in one or two lines: what changed and any open question.

## 1. Ground rules

1. **Only change what the update is about.** Never reformat, reorder or reword other
   records. Keep the diff small.
2. **Never delete** a task, issue, update or resource. Change `status`, or set
   `"isPublished": false`.
3. **Unknown = `Pending confirmation`** (exact words). Never TBC, N/A, unknown, blank
   placeholders or guessed values. Omit optional fields instead of writing `null`/`""`.
4. **No invented facts** (dates, numbers, links, approvals). If the owner did not say it
   or a source does not show it, leave it out.
5. **One change = one activity entry** (section 5). Do not rewrite old entries.
6. After any change to the project, set `lastVerifiedAt` to today (Melbourne date) and
   update `sourceNote` and `progressSummary` so they match the tasks.

## 2. Formats (fixed)

| Thing | Rule |
|---|---|
| Dates | `YYYY-MM-DD`, never in the future |
| Spelling | Australian English (organisation, colour, catalogue) |
| Numbers in text | Copy from the source. Keep units: `Home mobile PageSpeed 69 → 95` |
| Dates in text | `16 Nov 2026` (day, 3-letter month, year) |
| Tense | Past tense for done work (`Configured…`), present or infinitive for open work (`Configuring the checkout`, `To configure the checkout`); never `Mahesh is…` |
| Voice | Implied first person, action verb first. No "I", "we", "Claude", "AI did…" |
| Title | Sentence case, no full stop, max ~80 characters |
| Description | 1–2 plain sentences, ends with a full stop, says what and why |
| Ampersand / dashes | Use "and"; use a spaced en dash ` – ` only for ranges or breaks |
| Currency | `$49.95`, `$1,200` (AUD, state GST when relevant) |

## 3. Ids

Lowercase, digits and dashes only. Prefix = project short code. Never reuse or rename an
id (history is keyed on it).

| Record | Pattern | Example |
|---|---|---|
| Project | `<slug>` | `scrubness` |
| Task | `<code>-<short-name>` | `sc-page-speed` |
| Issue | `<code>-issue-<short-name>` | `sc-issue-gst-pricing` |
| Activity | `<code>-u-<YYYY-MM-DD>-<short-name>` | `sc-u-2026-11-10-export` |
| Resource | `<code>-r-<short-name>` | `sc-r-go-live-plan` |
| Stakeholder | `<code>-s-<short-name>` | `su-s-owner` |

Older ids that do not match a pattern (for example `sm-limit-shopify`, `ah-u-2026-10-21`) stay as they are; the pattern applies to new ids only.

Codes in use: `ac` Anko Club, `sc` Scrubness, `su` Southern Uniforms, `ah` Anou Hub, `sm` Site Monitor.
A new project picks a 2-letter code and records it here.

## 4. Choosing values

**Task status** (see standards file for evidence): `completed` needs `evidence` (+
`completedAt` if known); `blocked` / `awaiting_approval` need `dependency`; only
`completed` tasks may have `completedAt`. Say the level reached: built, merged to
preview, tested, live, approved.

**Task category:** `development` code/theme/plugin work · `configuration` settings and
set-up · `research` investigation · `testing` · `documentation` · `deployment` going live,
backups, hosting · `business_requirements` decisions and requirements · `other`.

**Priority:** `high` blocks go-live or revenue · `medium` needed but not blocking · `low`
nice to have. Omit if unsure.

**Activity category:** `development`, `research`, `testing`, `deployment`,
`documentation`, `meetings_coordination`, `decisions`, `other`.

**Issue kind:** `blocker` (stops work) · `dependency` (needs someone's input) ·
`decision` (a choice is needed) · `approval` (sign-off needed) · `risk`. Always set
`waitingOn` to a role or name. Resolve with `status: "resolved"` + `resolvedOn`.

**Resource type:** `github_repository`, `github_pull_request`, `figma_design`,
`google_drive`, `notion_page`, `technical_documentation`, `project_brief`,
`strategy_document`, `meeting_notes`, `website`, `other`. URL is `https://…` that was
actually opened, or `/documents/<file>.pdf` for a file in `public/documents/`. Title says
what it is; description is one line with a date; add `accessNote` if login is needed.

**Overview colour (calculated, never typed):** red = a task is blocked; amber = an open
blocker, decision or approval is waiting on someone else; green = nothing waiting. Progress
= completed tasks over published tasks. Keep issue `kind` accurate, because it drives the
colour: use `risk` for known limits that need no one's action.

**sortOrder:** whole numbers, tasks grouped by theme in the order a manager reads them,
ascending. New items take the next free number; do not renumber existing ones.

## 5. Recording a change

| Event | Edit |
|---|---|
| New work item | Add task (`pending` / `in_progress`) + activity entry if work happened |
| Task finished | `status: completed`, `evidence`, `completedAt`, `latestProgress` cleared or final; add one activity entry linked by `taskId` |
| Task progressed | Update `latestProgress` (what is done now, not history); activity entry only for a notable step |
| Blocked / waiting | Task `blocked` or `awaiting_approval` + `dependency`; matching issue with `waitingOn` |
| Issue cleared | Issue `resolved` + `resolvedOn`; unblock the task; one activity entry |
| New document | Put PDF in `public/documents/`, add resource, link it with `taskId` if one fits |
| Section removed from a document | Edit `docs/strategy/*.html`, `npm run docs:pdf`, replace the PDF, update the resource description |

## 6. Intake template (paste this to feed data)

Give any assistant (or fill in yourself) one block per update. Anything missing becomes
`Pending confirmation` or is left out; the assistant must not guess.

```
PROJECT: <slug>
DATE: <YYYY-MM-DD>
DONE:     - <what was finished> | evidence: <where the proof is> | date: <YYYY-MM-DD>
STARTED:  - <what is now in progress> | progress: <where it is up to>
PLANNED:  - <what comes next> | due: <date or none>
WAITING:  - <what is blocked> | on: <person or team> | needs: <decision, approval or item>
CLEARED:  - <issue or blocker now resolved> | date: <YYYY-MM-DD>
LINKS:    - <title> | <url or /documents file> | <what it is>
```

## 7. Final read (30 seconds)

- Every "done" has evidence and is really done, not merely built or merged to preview.
- Nobody else's job is written as Mahesh's task.
- Ids follow section 3; dates are ISO and not in the future.
- No AI, prompt, debugging or chat language; no TBC/N/A.
- Numbers and dates were copied from sources, not estimated.
- `lastVerifiedAt`, `sourceNote` and `progressSummary` are current.
