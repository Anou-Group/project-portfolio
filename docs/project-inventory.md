# Project inventory

Last verified: 16 Nov 2026. Produced with the `project-discovery` skill. The dashboard
shows only projects confirmed in scope by the owner.

## In scope (confirmed by the owner, 16 Nov 2026)

| Project | Status | Main evidence | Last source update |
|---|---|---|---|
| Southern Uniforms — Shopify store | In Progress | GitHub `Anou-Group/southern-uniforms-theme` (143 PRs, release PR #9 open); Notion "Southern Uniforms — Go-live hub" (Phase 1 tracker, decision log, weekly update); platform recommendation and admin setup documents; storefront `0j1jbh-w8.myshopify.com` | GitHub 8 Nov 2026; Notion 27 Oct 2026 |
| Anou Hub — digital spend tracker | In Progress | `docs/PLAN.md` in `~/Public/www/next/anouhub`; GitHub `mahesh-anouconcept/anouhub` | 10 Nov 2026 |
| Site Monitor — website uptime monitoring | In Progress | GitHub `Anou-Group/site-monitor` (PRs #1–#2 merged, #3 open); `docs/PLAN.md` | 5 Nov 2026 |
| Anko Club — membership management platform | In Progress | Owner confirmation, 16 Nov 2026 (includes the Gift Avenue event); no repository or tracker linked yet | 16 Nov 2026 |
| Scrubness — online store and product data | In Progress | `~/Public/scrubness-assets` (live exports 10–11 Nov, barcode import, 2026 price list); site backup 6 Nov; scrubness.com | 11 Nov 2026 |

Full details per project are in `content/projects/<slug>.json`.

## Excluded

| Candidate | Reason |
|---|---|
| IFOTA portal data extraction (`~/Public/www/portal-scrape`) | Not selected as a project. Its keyword research (30 Oct 2026) is cited as a source in the strategy documents. Do not attribute the extraction to a project without confirmation. |

## Requires confirmation

Southern Uniforms
- Whether the Returns page rules (online only, 30 days, PR #98) are confirmed by the business.
- Whether shipping rates ($11 Standard, $15 Express, free from $150) are confirmed.
- Billing arrangement for the Shopify Grow plan (yearly or monthly), and costs of Shipit, the wishlist app and the current Botble hosting.
- Who owns the platform decision ("decided by: to confirm" in the decision log).
- Status changes since the Notion tracker's last update (27 Oct 2026).
- Social media accounts and owners.

Anou Hub
- Production URL and whether it is live on Vercel.
- Who verifies the email sending domain.
- Current automated test counts (the plan records 359 unit and route tests and 181 browser checks).
- Whether the code should move from the personal GitHub account to the empty `Anou-Group/anouhub` repository.

Site Monitor
- Whether the Cloudflare deployment is live, and its dashboard URL.
- Results of verification on live infrastructure (email delivery, outage alert timing, access control).

Scrubness
- Whether the barcode and SKU import has been applied to the live store.
- Whether website retail prices include GST.
- Brand owner, decision-maker, and the wider scope of responsibility for the store.
- Hosting, domain, plugin licences and payment gateway costs.

Reporting owner
- Job title (shown as Pending confirmation on the About page).
