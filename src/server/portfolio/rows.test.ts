import { describe, expect, it } from "vitest";
import { portfolioSchema } from "@/domain/schema";
import { readContentFiles } from "./content-source";
import { profileToRow, projectToRows, rowsToPortfolioInput } from "./rows";

describe("row mapping", () => {
  it("round-trips every content record through database rows unchanged", async () => {
    const portfolio = portfolioSchema.parse(await readContentFiles());
    const all = portfolio.projects.map(projectToRows);
    const back = portfolioSchema.parse(
      rowsToPortfolioInput({
        profile: profileToRow(portfolio.profile),
        projects: all.map((r) => r.project),
        tasks: all.flatMap((r) => r.tasks),
        issues: all.flatMap((r) => r.issues),
        updates: all.flatMap((r) => r.updates),
        resources: all.flatMap((r) => r.resources),
        stakeholders: all.flatMap((r) => r.stakeholders),
        taskHistory: [],
        projectHistory: [],
      }),
    );
    expect(back).toEqual(portfolio);
  });

  it("attaches status history to the right task in time order", async () => {
    const portfolio = portfolioSchema.parse(await readContentFiles());
    const rows = projectToRows(portfolio.projects[0]);
    const taskId = rows.tasks[0].id;
    const input = rowsToPortfolioInput({
      profile: null,
      projects: [rows.project],
      tasks: rows.tasks,
      issues: [],
      updates: [],
      resources: [],
      stakeholders: [],
      taskHistory: [
        { task_id: taskId, from_status: "in_progress", to_status: "completed", changed_at: "2026-11-02T01:00:00Z" },
        { task_id: taskId, from_status: null, to_status: "in_progress", changed_at: "2026-10-30T01:00:00Z" },
        { task_id: "some-other-task", from_status: null, to_status: "pending", changed_at: "2026-10-01T01:00:00Z" },
      ],
      projectHistory: [],
    });
    const task = input.projects[0].tasks.find((t) => t.id === taskId);
    expect(task?.statusHistory.map((h) => h.toStatus)).toEqual(["in_progress", "completed"]);
    expect(input.projects[0].tasks.filter((t) => t.statusHistory.length > 0)).toHaveLength(1);
  });
});
