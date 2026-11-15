import { portfolioSchema, type Portfolio } from "./schema";
import { lintText, type LintSeverity } from "./language";

export type ValidationIssue = { severity: LintSeverity; path: string; rule: string; message: string; excerpt?: string };
export type ValidationReport = { portfolio: Portfolio | null; errors: ValidationIssue[]; warnings: ValidationIssue[] };

/** Fields shown to the manager that are free text (ids, urls, enums and dates are checked structurally). */
const PROJECT_TEXT = ["name", "summary", "description", "businessObjective", "background", "responsibilitySummary", "category", "organisation", "progressSummary", "sourceNote"] as const;
const TASK_TEXT = ["title", "description", "latestProgress", "dependency", "evidence"] as const;
const ISSUE_TEXT = ["title", "description", "waitingOn"] as const;
const UPDATE_TEXT = ["title", "description"] as const;
const RESOURCE_TEXT = ["title", "description", "accessNote"] as const;
const STAKEHOLDER_TEXT = ["name", "role", "organisation"] as const;

/**
 * Validates authored content before it is published. Structural problems and
 * prohibited language are errors (publishing stops); anything needing a human read
 * is a warning.
 */
export function validateContent(input: unknown, today: string): ValidationReport {
  const parsed = portfolioSchema.safeParse(input);
  if (!parsed.success) {
    return {
      portfolio: null,
      warnings: [],
      errors: parsed.error.issues.map((i) => ({ severity: "error", path: formatPath(i.path), rule: "schema", message: i.message })),
    };
  }
  const portfolio = parsed.data;
  const issues: ValidationIssue[] = [];
  const add = (severity: LintSeverity, path: string, rule: string, message: string) => issues.push({ severity, path, rule, message });
  const lint = (path: string, text: string | null | undefined) => {
    if (!text) return;
    for (const f of lintText(text)) issues.push({ severity: f.severity, path, rule: f.rule, message: f.message, excerpt: f.excerpt });
  };
  const notFuture = (path: string, date: string | null) => {
    if (date && date > today) add("error", path, "future-date", `Date ${date} is in the future; only record dates that have happened.`);
  };

  lint("profile.reportPurpose", portfolio.profile.reportPurpose);

  const allIds = new Map<string, string>();
  const claim = (id: string, path: string) => {
    const prior = allIds.get(id);
    if (prior) add("error", path, "duplicate-id", `Id "${id}" is already used at ${prior}. Ids must be unique across the report.`);
    else allIds.set(id, path);
  };
  const slugs = new Set<string>();

  portfolio.projects.forEach((p) => {
    const pp = `projects[${p.slug}]`;
    claim(p.id, pp);
    if (slugs.has(p.slug)) add("error", pp, "duplicate-slug", `Slug "${p.slug}" is used twice.`);
    slugs.add(p.slug);
    for (const f of PROJECT_TEXT) lint(`${pp}.${f}`, p[f]);
    p.responsibilities.forEach((r, i) => lint(`${pp}.responsibilities[${i}]`, r));
    notFuture(`${pp}.lastVerifiedAt`, p.lastVerifiedAt);

    const taskIds = new Set(p.tasks.map((t) => t.id));

    for (const t of p.tasks) {
      const tp = `${pp}.tasks[${t.id}]`;
      claim(t.id, tp);
      for (const f of TASK_TEXT) lint(`${tp}.${f}`, t[f]);
      notFuture(`${tp}.completedAt`, t.completedAt);
      if (t.status === "completed") {
        const hasResource = p.resources.some((r) => r.taskId === t.id);
        if (!t.evidence && !hasResource) add("error", tp, "unsupported-completion", "Marked Completed with no evidence and no linked resource.");
        if (!t.completedAt) add("warning", tp, "completion-date", "Completed without a completion date (shown as \"Date not recorded\"). Add it if a source gives one.");
      } else if (t.completedAt) {
        add("error", tp, "completed-at-on-open-task", "Only Completed tasks can have a completion date.");
      }
      if ((t.status === "blocked" || t.status === "awaiting_approval") && !t.dependency) {
        add("error", tp, "missing-dependency", "Blocked or Awaiting Approval needs a dependency saying what or who it is waiting on.");
      }
    }

    for (const i of p.issues) {
      const ip = `${pp}.issues[${i.id}]`;
      claim(i.id, ip);
      for (const f of ISSUE_TEXT) lint(`${ip}.${f}`, i[f]);
      notFuture(`${ip}.raisedOn`, i.raisedOn);
      notFuture(`${ip}.resolvedOn`, i.resolvedOn);
      if (i.status === "resolved" && !i.resolvedOn) add("warning", ip, "resolution-date", "Resolved without a resolution date.");
      if (i.status === "open" && i.resolvedOn) add("error", ip, "resolved-on-open-issue", "An open issue cannot have a resolution date.");
    }

    for (const u of p.updates) {
      const up = `${pp}.updates[${u.id}]`;
      claim(u.id, up);
      for (const f of UPDATE_TEXT) lint(`${up}.${f}`, u[f]);
      notFuture(`${up}.occurredOn`, u.occurredOn);
      if (u.taskId && !taskIds.has(u.taskId)) add("error", up, "unknown-task", `Refers to task "${u.taskId}", which is not in this project.`);
    }

    for (const r of p.resources) {
      const rp = `${pp}.resources[${r.id}]`;
      claim(r.id, rp);
      for (const f of RESOURCE_TEXT) lint(`${rp}.${f}`, r[f]);
      if (r.taskId && !taskIds.has(r.taskId)) add("error", rp, "unknown-task", `Refers to task "${r.taskId}", which is not in this project.`);
      if (/^(?:untitled|link|here|click here|document|resource)$/i.test(r.title.trim())) add("error", rp, "resource-label", "Give the resource a meaningful title.");
      if ((r.type === "github_repository" || r.type === "github_pull_request") && !r.url.startsWith("https://github.com/")) {
        add("error", rp, "resource-type", "GitHub resources must link to github.com.");
      }
      if (r.type === "github_pull_request" && !/\/pull\/\d+$/.test(r.url)) add("error", rp, "resource-type", "A pull request link must end in /pull/<number>.");
      if (r.type === "notion_page" && !/^https:\/\/(?:app\.notion\.com|www\.notion\.so|[\w-]+\.notion\.site)\//.test(r.url)) {
        add("error", rp, "resource-type", "Notion resources must link to Notion.");
      }
    }

    for (const s of p.stakeholders) {
      const sp = `${pp}.stakeholders[${s.id}]`;
      claim(s.id, sp);
      for (const f of STAKEHOLDER_TEXT) lint(`${sp}.${f}`, s[f]);
    }
  });

  return {
    portfolio,
    errors: issues.filter((i) => i.severity === "error"),
    warnings: issues.filter((i) => i.severity === "warning"),
  };
}

function formatPath(path: PropertyKey[]): string {
  return path.map((p) => (typeof p === "number" ? `[${p}]` : `.${String(p)}`)).join("").replace(/^\./, "") || "(root)";
}
