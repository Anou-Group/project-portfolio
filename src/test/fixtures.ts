import { projectSchema, type Project, type ProjectInput } from "@/domain/schema";

/** A valid project with overrides, for unit tests. */
export function makeProject(overrides: Partial<ProjectInput> = {}): Project {
  return projectSchema.parse({
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
    ...overrides,
  });
}
