# Project Portfolio

A read-only dashboard in which Mahesh Pedapati reports his projects, responsibilities,
progress, blockers and supporting resources to his manager.

- Rules for anyone (or any tool) changing this repository: [CLAUDE.md](CLAUDE.md)
- Handover, architecture and how-tos: [docs/HANDOVER.md](docs/HANDOVER.md)
- Project inventory and open questions: [docs/project-inventory.md](docs/project-inventory.md)

## Quick start

```sh
npm install
cp .env.example .env.local      # fill in Supabase values
npm run dev                     # reads Supabase
npm run dev:content             # reads content/ instead (no database needed)
```

## Common tasks

| Task | Command |
|---|---|
| Validate report content | `npm run content:check` |
| Publish content to Supabase | `npm run content:publish` |
| All checks (types, lint, unit tests, content) | `npm run check` |
| Browser tests (390 / 1440 px journeys, 390 / 900 / 1440 px layout) | `npm run e2e` |
| Prove database security | `npm run rls:check` |
| Rebuild the strategy PDFs | `npm run docs:pdf` |
| Apply database migrations | `npx supabase db push --remote` |
