---
name: project-discovery
description: Find Mahesh's projects and the evidence behind them across GitHub, Notion, local project folders and documents, and record them in docs/project-inventory.md with a list of items needing confirmation. Use before adding a new project or when asked what is being worked on.
---

# Project discovery

Goal: an inventory of real projects with evidence, separating confirmed facts from
assumptions. Output goes to `docs/project-inventory.md`; nothing reaches the
dashboard until the owner confirms the project is in scope.

## 1. Sweep the sources

| Source | How |
|---|---|
| GitHub | `gh repo list <user>`; `gh api user/orgs`; `gh repo list <org>`; per repo: branches, `gh pr list --state all`, recent commits, README, `docs/` |
| Local folders | `~/Public/www/**` project folders: `CLAUDE.md`, `README.md`, `docs/PLAN.md`, git log and remotes |
| Notion | search by project and client names; fetch hubs, trackers, decision logs, weekly updates |
| Documents | owner-supplied PDFs/DOCX (e.g. plan recommendations, company profiles, price lists) |
| Public sites | the project's live or preview URL as confirmed by the owner |
| Figma / Drive | only if connected; record file URLs exactly as returned |

## 2. Classify what you find

- **Project vs task:** a project has a business purpose, multiple deliverables and a
  lifespan (e.g. "Southern Uniforms Shopify migration"). A single PR, page or data
  import is a task within a project.
- **Active vs completed:** active if work, open PRs or open tracker items exist in
  the last weeks; completed only if the source says so.
- **Mine vs others':** Mahesh's work is what his commits, PRs and tracker rows with
  `Owner: Mahesh` show. Rows owned by others become dependencies/issues.
- **Employment vs other engagements:** include only work the owner confirms as part
  of this employment. Record exclusions (e.g. work for another client) in the
  inventory, not the dashboard.
- **Confirmed vs assumed:** every fact gets a source. Anything inferred goes on the
  "Requires confirmation" list.

## 3. Rules

- A conversation with an AI is not proof that work was completed.
- Do not assume a project mentioned earlier is still active.
- Never construct URLs, names, dates or numbers.
- Do not read credential stores or private inboxes; ask the owner instead.

## 4. Record the inventory

For each project: name, description, business purpose, current status, Mahesh's
responsibilities, completed deliverables, current activities, outstanding work,
dependencies and blockers, supporting links, last verified date, sources. Then a
"Requires confirmation" list and an "Excluded" list with the reason.

Ask the owner to confirm scope before writing content files for a new project.
