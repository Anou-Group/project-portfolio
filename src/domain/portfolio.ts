import { ACTIVITY_CATEGORIES, WORK_STATUSES } from "./schema";
import type { ActivityCategory, Issue, Portfolio, Project, ProjectUpdate, Resource, Task, TaskCategory, WorkStatus } from "./schema";
import { ISSUE_KIND_ORDER, TASK_CATEGORY_ORDER } from "./labels";

/**
 * Derived views of the portfolio. Every number on screen comes from here, so the
 * pages can never disagree with each other or with the records.
 */

const PRIORITY_RANK = { high: 0, medium: 1, low: 2 } as const;
const OPEN_TASK_STATUSES: WorkStatus[] = ["in_progress", "blocked", "awaiting_approval", "pending"];

export type ProjectRef = Pick<Project, "id" | "slug" | "name">;
const ref = (p: Project): ProjectRef => ({ id: p.id, slug: p.slug, name: p.name });

// ---------- Overview ----------

export type PortfolioMetrics = {
  activeProjects: number;
  completedProjects: number;
  inProgressProjects: number;
  needsAttention: number;
};

export function portfolioMetrics(projects: Project[]): PortfolioMetrics {
  return {
    activeProjects: projects.filter((p) => p.status !== "completed").length,
    completedProjects: projects.filter((p) => p.status === "completed").length,
    inProgressProjects: projects.filter((p) => p.status === "in_progress").length,
    needsAttention: attentionItems(projects).length,
  };
}

export type AttentionItem =
  | { kind: "issue"; project: ProjectRef; issue: Issue }
  | { kind: "task"; project: ProjectRef; task: Task };

/** Open blockers, decisions and approvals, plus my own tasks that are blocked or awaiting approval. */
export function attentionItems(projects: Project[]): AttentionItem[] {
  const items: AttentionItem[] = [];
  for (const p of projects) {
    for (const issue of p.issues) {
      if (issue.status === "open" && (issue.kind === "blocker" || issue.kind === "decision" || issue.kind === "approval")) {
        items.push({ kind: "issue", project: ref(p), issue });
      }
    }
    for (const task of p.tasks) {
      if (task.status === "blocked" || task.status === "awaiting_approval") items.push({ kind: "task", project: ref(p), task });
    }
  }
  const rank = (i: AttentionItem) =>
    i.kind === "issue" ? ISSUE_KIND_ORDER.indexOf(i.issue.kind) : i.task.status === "blocked" ? 0 : 2;
  return items.sort((a, b) => rank(a) - rank(b) || a.project.name.localeCompare(b.project.name));
}

export type ActivityEntry = ProjectUpdate & { project: ProjectRef; task: Pick<Task, "id" | "title"> | null };

export function allActivity(projects: Project[]): ActivityEntry[] {
  const entries: ActivityEntry[] = [];
  for (const p of projects) {
    const tasks = new Map(p.tasks.map((t) => [t.id, t]));
    for (const u of p.updates) {
      const t = u.taskId ? tasks.get(u.taskId) : undefined;
      entries.push({ ...u, project: ref(p), task: t ? { id: t.id, title: t.title } : null });
    }
  }
  return entries.sort((a, b) => b.occurredOn.localeCompare(a.occurredOn) || a.project.name.localeCompare(b.project.name) || a.id.localeCompare(b.id));
}

export type UpcomingItem = { project: ProjectRef; task: Task };

/** Outstanding high-priority work: in progress first, then by known due date, then priority. */
export function upcomingWork(projects: Project[], limit = 6): UpcomingItem[] {
  const items: UpcomingItem[] = [];
  for (const p of projects) {
    for (const task of p.tasks) {
      if ((task.status === "in_progress" || task.status === "pending") && task.priority === "high") items.push({ project: ref(p), task });
    }
  }
  return items
    .sort(
      (a, b) =>
        (a.task.dueDate ? 0 : 1) - (b.task.dueDate ? 0 : 1) ||
        (a.task.dueDate ?? "").localeCompare(b.task.dueDate ?? "") ||
        (a.task.status === "in_progress" ? 0 : 1) - (b.task.status === "in_progress" ? 0 : 1) ||
        a.task.sortOrder - b.task.sortOrder ||
        a.project.name.localeCompare(b.project.name),
    )
    .slice(0, limit);
}

/** Latest date the sources were checked across the portfolio. */
export function lastUpdated(projects: Project[]): string | null {
  return projects.reduce<string | null>((max, p) => (max === null || p.lastVerifiedAt > max ? p.lastVerifiedAt : max), null);
}

/** First and last dates of recorded activity. */
export function reportingPeriod(projects: Project[]): { from: string; to: string } | null {
  const dates = projects.flatMap((p) => p.updates.map((u) => u.occurredOn)).sort();
  return dates.length ? { from: dates[0], to: dates[dates.length - 1] } : null;
}

// ---------- Project detail ----------

export type ProjectBreakdown = {
  completed: Task[];
  inProgress: Task[];
  outstanding: { category: TaskCategory; tasks: Task[] }[];
  openIssues: Issue[];
  resolvedIssues: Issue[];
  timeline: ProjectUpdate[];
  counts: { completed: number; inProgress: number; outstanding: number; issues: number; resources: number; timeline: number };
};

const bySortThenTitle = (a: Task, b: Task) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title);

export function projectBreakdown(project: Project): ProjectBreakdown {
  const completed = project.tasks
    .filter((t) => t.status === "completed")
    .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? "") || bySortThenTitle(a, b));
  const statusRank: Record<WorkStatus, number> = { blocked: 0, awaiting_approval: 1, in_progress: 2, pending: 3, completed: 4 };
  const inProgress = project.tasks
    .filter((t) => t.status === "in_progress" || t.status === "blocked" || t.status === "awaiting_approval")
    .sort((a, b) => statusRank[a.status] - statusRank[b.status] || priorityRank(a) - priorityRank(b) || bySortThenTitle(a, b));
  const pending = project.tasks.filter((t) => t.status === "pending");
  const outstanding = TASK_CATEGORY_ORDER.map((category) => ({
    category,
    tasks: pending.filter((t) => t.category === category).sort((a, b) => priorityRank(a) - priorityRank(b) || bySortThenTitle(a, b)),
  })).filter((g) => g.tasks.length > 0);
  const issueRank = (i: Issue) => ISSUE_KIND_ORDER.indexOf(i.kind);
  const openIssues = project.issues.filter((i) => i.status === "open").sort((a, b) => issueRank(a) - issueRank(b) || a.title.localeCompare(b.title));
  const resolvedIssues = project.issues.filter((i) => i.status === "resolved").sort((a, b) => (b.resolvedOn ?? "").localeCompare(a.resolvedOn ?? ""));
  const timeline = [...project.updates].sort((a, b) => b.occurredOn.localeCompare(a.occurredOn) || a.id.localeCompare(b.id));
  return {
    completed,
    inProgress,
    outstanding,
    openIssues,
    resolvedIssues,
    timeline,
    counts: {
      completed: completed.length,
      inProgress: inProgress.length,
      outstanding: pending.length,
      issues: openIssues.length,
      resources: project.resources.length,
      timeline: timeline.length,
    },
  };
}

const priorityRank = (t: Task) => (t.priority ? PRIORITY_RANK[t.priority] : 3);

export function openTaskCount(project: Project): number {
  return project.tasks.filter((t) => OPEN_TASK_STATUSES.includes(t.status)).length;
}

export function resourcesForTask(project: Project, taskId: string): Resource[] {
  return project.resources.filter((r) => r.taskId === taskId);
}

// ---------- Search and filters ----------

export type ProjectFilters = { q: string; status: WorkStatus | null; category: string | null };
export type ProjectSearchResult = { project: Project; matches: string[] };

const normalise = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "");

/** Every word of the query must appear somewhere in the project (name, text, tasks, issues, resources). */
export function searchProjects(projects: Project[], filters: ProjectFilters): ProjectSearchResult[] {
  const words = normalise(filters.q).split(/\s+/).filter(Boolean);
  const results: ProjectSearchResult[] = [];
  for (const project of projects) {
    if (filters.status && project.status !== filters.status) continue;
    if (filters.category && project.category !== filters.category) continue;
    if (words.length === 0) {
      results.push({ project, matches: [] });
      continue;
    }
    const fields: { label: string; text: string }[] = [
      { label: "", text: [project.name, project.summary, project.description, project.category, project.organisation ?? ""].join(" ") },
      { label: "", text: [project.businessObjective, project.background, project.responsibilitySummary, ...project.responsibilities].join(" ") },
      ...project.tasks.map((t) => ({ label: `Task: ${t.title}`, text: `${t.title} ${t.description}` })),
      ...project.issues.map((i) => ({ label: `Issue: ${i.title}`, text: `${i.title} ${i.description}` })),
      ...project.resources.map((r) => ({ label: `Resource: ${r.title}`, text: `${r.title} ${r.description}` })),
    ];
    const haystack = normalise(fields.map((f) => f.text).join(" "));
    if (!words.every((w) => haystack.includes(w))) continue;
    const matches = fields
      .filter((f) => f.label && words.some((w) => normalise(f.text).includes(w)))
      .map((f) => f.label)
      .slice(0, 3);
    results.push({ project, matches });
  }
  return results;
}

export function projectCategories(projects: Project[]): string[] {
  return [...new Set(projects.map((p) => p.category))].sort();
}

export type ActivityFilters = { project: string | null; category: ActivityCategory | null; from: string | null; to: string | null };

export function filterActivity(entries: ActivityEntry[], f: ActivityFilters): ActivityEntry[] {
  return entries.filter(
    (e) =>
      (!f.project || e.project.slug === f.project) &&
      (!f.category || e.category === f.category) &&
      (!f.from || e.occurredOn >= f.from) &&
      (!f.to || e.occurredOn <= f.to),
  );
}

/** Group entries (already sorted newest first) by calendar month. */
export function groupByMonth<T extends { occurredOn: string }>(entries: T[]): { month: string; entries: T[] }[] {
  const groups: { month: string; entries: T[] }[] = [];
  for (const e of entries) {
    const month = e.occurredOn.slice(0, 7);
    const last = groups[groups.length - 1];
    if (last && last.month === month) last.entries.push(e);
    else groups.push({ month, entries: [e] });
  }
  return groups;
}

export type ResourceEntry = Resource & { project: ProjectRef };

export function allResources(projects: Project[]): ResourceEntry[] {
  return projects.flatMap((p) => p.resources.map((r) => ({ ...r, project: ref(p) })));
}

// ---------- URL parameter parsing (untrusted input) ----------

type Params = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const isIsoDate = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));

export function parseProjectFilters(sp: Params): ProjectFilters {
  const status = first(sp.status);
  return {
    q: first(sp.q).slice(0, 100),
    status: (WORK_STATUSES as readonly string[]).includes(status) ? (status as WorkStatus) : null,
    category: first(sp.category).slice(0, 60) || null,
  };
}

export function parseActivityFilters(sp: Params): ActivityFilters {
  const category = first(sp.category);
  const from = first(sp.from);
  const to = first(sp.to);
  return {
    project: /^[a-z0-9-]{2,80}$/.test(first(sp.project)) ? first(sp.project) : null,
    category: (ACTIVITY_CATEGORIES as readonly string[]).includes(category) ? (category as ActivityCategory) : null,
    from: isIsoDate(from) ? from : null,
    to: isIsoDate(to) ? to : null,
  };
}

export function findProject(portfolio: Portfolio, slug: string): Project | undefined {
  return portfolio.projects.find((p) => p.slug === slug);
}
