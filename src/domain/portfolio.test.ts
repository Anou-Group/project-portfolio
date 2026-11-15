import { describe, expect, it } from "vitest";
import { makeProject } from "@/test/fixtures";
import {
  allActivity,
  attentionItems,
  filterActivity,
  groupByMonth,
  lastUpdated,
  parseActivityFilters,
  parseProjectFilters,
  portfolioMetrics,
  projectBreakdown,
  reportingPeriod,
  searchProjects,
  upcomingWork,
} from "./portfolio";
import { formatDate, formatRange } from "./format";
import type { WorkStatus } from "./schema";

const t = (id: string, status: WorkStatus, extra: Record<string, unknown> = {}) => ({
  id,
  title: `Task ${id}`,
  description: `Description ${id}`,
  status,
  category: "development" as const,
  ...(status === "completed" ? { evidence: "PR merged." } : {}),
  ...(status === "blocked" || status === "awaiting_approval" ? { dependency: "Business input." } : {}),
  ...extra,
});

const alpha = makeProject({
  tasks: [
    t("a-done-1", "completed", { completedAt: "2026-10-22" }),
    t("a-done-2", "completed", { completedAt: "2026-11-03" }),
    t("a-done-3", "completed"),
    t("a-wip", "in_progress", { priority: "high" }),
    t("a-blocked", "blocked"),
    t("a-todo-test", "pending", { category: "testing", priority: "high" }),
    t("a-todo-dev", "pending", { priority: "low", title: "Redirects from the old site" }),
  ],
  issues: [
    { id: "a-i1", title: "Go-live date", description: "Not set.", kind: "decision", waitingOn: "Ashwin" },
    { id: "a-i2", title: "Limitation", description: "No status API.", kind: "risk" },
    { id: "a-i3", title: "Old blocker", description: "Fixed.", kind: "blocker", status: "resolved", resolvedOn: "2026-11-01" },
  ],
  updates: [
    { id: "a-u1", title: "Built homepage", description: "Merged.", category: "development", occurredOn: "2026-10-22", taskId: "a-done-1" },
    { id: "a-u2", title: "Decided platform", description: "Shopify.", category: "decisions", occurredOn: "2026-11-03" },
  ],
});
const beta = makeProject({
  id: "beta",
  slug: "beta",
  name: "Beta monitor",
  category: "Internal tool",
  status: "completed",
  lastVerifiedAt: "2026-11-12",
  tasks: [t("b-review", "awaiting_approval")],
  updates: [{ id: "b-u1", title: "Shipped", description: "Live.", category: "deployment", occurredOn: "2026-09-30" }],
});
const projects = [alpha, beta];

describe("overview figures", () => {
  it("counts projects by status from the records", () => {
    expect(portfolioMetrics(projects)).toEqual({ activeProjects: 1, completedProjects: 1, inProgressProjects: 1, needsAttention: 3 });
  });

  it("lists open blockers, decisions and approvals plus blocked or awaiting tasks — never risks or resolved issues", () => {
    const items = attentionItems(projects);
    expect(items.map((i) => (i.kind === "issue" ? i.issue.id : i.task.id)).sort()).toEqual(["a-blocked", "a-i1", "b-review"]);
  });

  it("orders activity newest first with its project and task", () => {
    const a = allActivity(projects);
    expect(a.map((e) => e.id)).toEqual(["a-u2", "a-u1", "b-u1"]);
    expect(a[1].task?.title).toBe("Task a-done-1");
    expect(a[1].project.slug).toBe("alpha");
  });

  it("shows only open high-priority work as upcoming, in-progress first", () => {
    expect(upcomingWork(projects).map((u) => u.task.id)).toEqual(["a-wip", "a-todo-test"]);
  });

  it("derives last updated and the reporting period from records", () => {
    expect(lastUpdated(projects)).toBe("2026-11-12");
    expect(reportingPeriod(projects)).toEqual({ from: "2026-09-30", to: "2026-11-03" });
    expect(lastUpdated([])).toBeNull();
    expect(reportingPeriod([])).toBeNull();
  });
});

describe("projectBreakdown", () => {
  const b = projectBreakdown(alpha);
  it("separates completed, in-progress and outstanding work", () => {
    expect(b.completed.map((x) => x.id)).toEqual(["a-done-2", "a-done-1", "a-done-3"]);
    expect(b.inProgress.map((x) => x.id)).toEqual(["a-blocked", "a-wip"]);
    expect(b.outstanding.map((g) => g.category)).toEqual(["development", "testing"]);
  });
  it("splits open and resolved issues", () => {
    expect(b.openIssues.map((i) => i.id)).toEqual(["a-i1", "a-i2"]);
    expect(b.resolvedIssues.map((i) => i.id)).toEqual(["a-i3"]);
    expect(b.counts).toMatchObject({ completed: 3, inProgress: 2, outstanding: 2, issues: 2, timeline: 2 });
  });
});

describe("search and filters", () => {
  it("matches every word across project text and tasks, case-insensitively", () => {
    expect(searchProjects(projects, { q: "REDIRECTS old", status: null, category: null }).map((r) => r.project.id)).toEqual(["alpha"]);
    expect(searchProjects(projects, { q: "redirects", status: null, category: null })[0].matches).toEqual(["Task: Redirects from the old site"]);
    expect(searchProjects(projects, { q: "nothing-like-this", status: null, category: null })).toEqual([]);
  });
  it("filters by status and category", () => {
    expect(searchProjects(projects, { q: "", status: "completed", category: null }).map((r) => r.project.id)).toEqual(["beta"]);
    expect(searchProjects(projects, { q: "", status: null, category: "E-commerce" }).map((r) => r.project.id)).toEqual(["alpha"]);
  });
  it("filters activity by project, category and inclusive date range", () => {
    const all = allActivity(projects);
    expect(filterActivity(all, { project: "alpha", category: null, from: null, to: null })).toHaveLength(2);
    expect(filterActivity(all, { project: null, category: "decisions", from: null, to: null }).map((e) => e.id)).toEqual(["a-u2"]);
    expect(filterActivity(all, { project: null, category: null, from: "2026-10-22", to: "2026-10-22" }).map((e) => e.id)).toEqual(["a-u1"]);
  });
  it("groups activity by month", () => {
    expect(groupByMonth(allActivity(projects)).map((g) => [g.month, g.entries.length])).toEqual([["2026-11", 1], ["2026-10", 1], ["2026-09", 1]]);
  });
  it("ignores invalid URL parameters", () => {
    expect(parseProjectFilters({ status: "bogus", q: ["a", "b"] })).toEqual({ q: "a", status: null, category: null });
    expect(parseActivityFilters({ project: "../etc", category: "nope", from: "2026-13-45", to: "2026-11-01" })).toEqual({
      project: null,
      category: null,
      from: null,
      to: "2026-11-01",
    });
  });
});

describe("format", () => {
  it("formats dates without time-zone drift", () => {
    expect(formatDate("2026-10-22")).toBe("22 Oct 2026");
    expect(formatRange("2026-10-20", "2026-11-10")).toBe("20 Oct – 10 Nov 2026");
    expect(formatRange("2025-12-30", "2026-01-02")).toBe("30 Dec 2025 – 2 Jan 2026");
  });
});
