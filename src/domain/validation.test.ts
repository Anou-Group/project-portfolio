import { describe, expect, it } from "vitest";
import { validateContent } from "./validation";
import { readContentFiles } from "@/server/portfolio/content-source";

const profile = { ownerName: "Mahesh Pedapati", ownerRole: null, organisation: "Anou Group", reportPurpose: "Project progress for my manager." };
const baseProject = {
  id: "alpha",
  slug: "alpha",
  name: "Alpha store",
  summary: "An online store.",
  description: "Builds an online store.",
  businessObjective: "Sell online.",
  background: "Started in October.",
  responsibilitySummary: "Developer",
  responsibilities: ["Theme development"],
  status: "in_progress",
  category: "E-commerce",
  progressSummary: "Theme built.",
  sourceNote: "GitHub to 5 Nov 2026.",
  lastVerifiedAt: "2026-11-10",
};
const task = { id: "alpha-t1", title: "Homepage", description: "Built the homepage.", category: "development", status: "pending" };
const run = (project: Record<string, unknown>) => validateContent({ profile, projects: [{ ...baseProject, ...project }] }, "2026-11-16");
const rules = (project: Record<string, unknown>) => run(project).errors.map((e) => e.rule);

describe("validateContent", () => {
  it("accepts a minimal valid portfolio", () => {
    expect(run({}).errors).toEqual([]);
  });

  it("rejects invalid statuses and missing required fields", () => {
    const r = validateContent({ profile, projects: [{ ...baseProject, status: "done", summary: "" }] }, "2026-11-16");
    expect(r.portfolio).toBeNull();
    expect(r.errors.map((e) => e.path)).toEqual(expect.arrayContaining(["projects[0].status", "projects[0].summary"]));
  });

  it("rejects a completed task with no evidence (unsupported completion claim)", () => {
    expect(rules({ tasks: [{ ...task, status: "completed", completedAt: "2026-11-01" }] })).toContain("unsupported-completion");
  });

  it("accepts a completed task with evidence, and only warns when its date is unknown", () => {
    const r = run({ tasks: [{ ...task, status: "completed", evidence: "PR #4 merged." }] });
    expect(r.errors).toEqual([]);
    expect(r.warnings.map((w) => w.rule)).toContain("completion-date");
  });

  it("accepts a completed task whose evidence is a linked resource", () => {
    const r = run({
      tasks: [{ ...task, status: "completed", completedAt: "2026-11-01" }],
      resources: [{ id: "alpha-r1", taskId: "alpha-t1", title: "Pull request #4", description: "Merged.", type: "github_pull_request", url: "https://github.com/acme/alpha/pull/4" }],
    });
    expect(r.errors).toEqual([]);
  });

  it("requires a dependency on blocked or awaiting-approval work", () => {
    expect(rules({ tasks: [{ ...task, status: "blocked" }] })).toContain("missing-dependency");
    expect(rules({ tasks: [{ ...task, status: "awaiting_approval" }] })).toContain("missing-dependency");
  });

  it("rejects completion dates on open tasks and dates in the future", () => {
    expect(rules({ tasks: [{ ...task, status: "in_progress", completedAt: "2026-11-01" }] })).toContain("completed-at-on-open-task");
    expect(rules({ tasks: [{ ...task, status: "completed", evidence: "x", completedAt: "2027-01-01" }] })).toContain("future-date");
  });

  it("rejects duplicate ids and references to unknown tasks", () => {
    expect(rules({ tasks: [task, { ...task }] })).toContain("duplicate-id");
    expect(rules({ updates: [{ id: "alpha-u1", taskId: "nope", title: "Did it", description: "Done.", category: "development", occurredOn: "2026-11-01" }] })).toContain("unknown-task");
  });

  it("checks resource labels, types and URLs", () => {
    const resource = { id: "alpha-r1", description: "Repo.", type: "github_repository", url: "https://github.com/acme/alpha" };
    expect(rules({ resources: [{ ...resource, title: "Link" }] })).toContain("resource-label");
    expect(rules({ resources: [{ ...resource, title: "Repo", url: "https://gitlab.com/acme/alpha" }] })).toContain("resource-type");
    expect(rules({ resources: [{ ...resource, title: "PR", type: "github_pull_request" }] })).toContain("resource-type");
    expect(run({ resources: [{ ...resource, title: "Repo", url: "http://github.com/acme" }] }).portfolio).toBeNull();
    expect(run({ resources: [{ ...resource, title: "Strategy", type: "strategy_document", url: "/documents/plan.pdf" }] }).errors).toEqual([]);
  });

  it("rejects prohibited language anywhere in manager-facing text", () => {
    const r = run({ tasks: [{ ...task, status: "in_progress", latestProgress: "Claude implemented the hero section." }] });
    expect(r.errors[0]).toMatchObject({ rule: "ai-as-actor", path: "projects[alpha].tasks[alpha-t1].latestProgress" });
  });

  it("passes on the real content with zero errors", async () => {
    const r = validateContent(await readContentFiles(), "2026-11-16");
    expect(r.errors).toEqual([]);
  });
});
