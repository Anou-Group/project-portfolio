import { portfolioSchema } from "../src/domain/schema";
import { readContentFiles } from "../src/server/portfolio/content-source";
import { allActivity, allResources, portfolioMetrics, projectBreakdown } from "../src/domain/portfolio";

/** Expected figures computed from the same content the site renders, so tests never hard-code numbers. */
export async function expected() {
  const p = portfolioSchema.parse(await readContentFiles());
  // Mirror what the site shows: published projects and published records only.
  const projects = p.projects
    .filter((x) => x.isPublished)
    .map((x) => ({
      ...x,
      tasks: x.tasks.filter((t) => t.isPublished),
      issues: x.issues.filter((i) => i.isPublished),
      updates: x.updates.filter((u) => u.isPublished),
      resources: x.resources.filter((r) => r.isPublished),
      stakeholders: x.stakeholders.filter((s) => s.isPublished),
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder);
  return {
    profile: p.profile,
    projects,
    metrics: portfolioMetrics(projects),
    activity: allActivity(projects),
    resources: allResources(projects),
    breakdown: (slug: string) => projectBreakdown(projects.find((x) => x.slug === slug)!),
  };
}
