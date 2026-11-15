import type { Issue, Profile, Project, ProjectUpdate, Resource, StatusChange, Task } from "@/domain/schema";

/**
 * The only place that knows database column names. Domain objects are camelCase;
 * rows are snake_case and mirror supabase/migrations one-to-one.
 */

export type ProfileRow = { id: number; owner_name: string; owner_role: string | null; organisation: string | null; report_purpose: string };

export type ProjectRow = {
  id: string;
  slug: string;
  name: string;
  summary: string;
  description: string;
  business_objective: string;
  background: string;
  responsibility_summary: string;
  responsibilities: string[];
  status: Project["status"];
  category: string;
  organisation: string | null;
  progress_summary: string;
  source_note: string;
  last_verified_at: string;
  sort_order: number;
  is_published: boolean;
};

export type TaskRow = {
  id: string;
  project_id: string;
  title: string;
  description: string;
  status: Task["status"];
  category: Task["category"];
  priority: Task["priority"];
  latest_progress: string | null;
  dependency: string | null;
  evidence: string | null;
  due_date: string | null;
  completed_at: string | null;
  sort_order: number;
  is_published: boolean;
};

export type IssueRow = {
  id: string;
  project_id: string;
  title: string;
  description: string;
  kind: Issue["kind"];
  status: Issue["status"];
  waiting_on: string | null;
  raised_on: string | null;
  resolved_on: string | null;
  is_published: boolean;
};

export type UpdateRow = {
  id: string;
  project_id: string;
  task_id: string | null;
  title: string;
  description: string;
  category: ProjectUpdate["category"];
  occurred_on: string;
  is_published: boolean;
};

export type ResourceRow = {
  id: string;
  project_id: string;
  task_id: string | null;
  title: string;
  description: string;
  resource_type: Resource["type"];
  url: string;
  access_note: string | null;
  is_published: boolean;
};

export type StakeholderRow = { id: string; project_id: string; name: string; role: string; organisation: string | null; is_published: boolean };

export type StatusHistoryRow = { from_status: StatusChange["fromStatus"]; to_status: StatusChange["toStatus"]; changed_at: string };
export type TaskHistoryRow = StatusHistoryRow & { task_id: string };
export type ProjectHistoryRow = StatusHistoryRow & { project_id: string };

// ---------- domain → rows (publishing) ----------

export function profileToRow(p: Profile): ProfileRow {
  return { id: 1, owner_name: p.ownerName, owner_role: p.ownerRole, organisation: p.organisation, report_purpose: p.reportPurpose };
}

export function projectToRows(p: Project) {
  const project: ProjectRow = {
    id: p.id,
    slug: p.slug,
    name: p.name,
    summary: p.summary,
    description: p.description,
    business_objective: p.businessObjective,
    background: p.background,
    responsibility_summary: p.responsibilitySummary,
    responsibilities: p.responsibilities,
    status: p.status,
    category: p.category,
    organisation: p.organisation,
    progress_summary: p.progressSummary,
    source_note: p.sourceNote,
    last_verified_at: p.lastVerifiedAt,
    sort_order: p.sortOrder,
    is_published: p.isPublished,
  };
  const tasks: TaskRow[] = p.tasks.map((t) => ({
    id: t.id,
    project_id: p.id,
    title: t.title,
    description: t.description,
    status: t.status,
    category: t.category,
    priority: t.priority,
    latest_progress: t.latestProgress,
    dependency: t.dependency,
    evidence: t.evidence,
    due_date: t.dueDate,
    completed_at: t.completedAt,
    sort_order: t.sortOrder,
    is_published: t.isPublished,
  }));
  const issues: IssueRow[] = p.issues.map((i) => ({
    id: i.id,
    project_id: p.id,
    title: i.title,
    description: i.description,
    kind: i.kind,
    status: i.status,
    waiting_on: i.waitingOn,
    raised_on: i.raisedOn,
    resolved_on: i.resolvedOn,
    is_published: i.isPublished,
  }));
  const updates: UpdateRow[] = p.updates.map((u) => ({
    id: u.id,
    project_id: p.id,
    task_id: u.taskId,
    title: u.title,
    description: u.description,
    category: u.category,
    occurred_on: u.occurredOn,
    is_published: u.isPublished,
  }));
  const resources: ResourceRow[] = p.resources.map((r) => ({
    id: r.id,
    project_id: p.id,
    task_id: r.taskId,
    title: r.title,
    description: r.description,
    resource_type: r.type,
    url: r.url,
    access_note: r.accessNote,
    is_published: r.isPublished,
  }));
  const stakeholders: StakeholderRow[] = p.stakeholders.map((s) => ({
    id: s.id,
    project_id: p.id,
    name: s.name,
    role: s.role,
    organisation: s.organisation,
    is_published: s.isPublished,
  }));
  return { project, tasks, issues, updates, resources, stakeholders };
}

// ---------- rows → domain (reading) ----------

export type PortfolioRows = {
  profile: ProfileRow | null;
  projects: ProjectRow[];
  tasks: TaskRow[];
  issues: IssueRow[];
  updates: UpdateRow[];
  resources: ResourceRow[];
  stakeholders: StakeholderRow[];
  taskHistory: TaskHistoryRow[];
  projectHistory: ProjectHistoryRow[];
};

const history = (rows: StatusHistoryRow[]): StatusChange[] =>
  rows
    .map((h) => ({ fromStatus: h.from_status, toStatus: h.to_status, changedAt: h.changed_at }))
    .sort((a, b) => a.changedAt.localeCompare(b.changedAt));

/** Builds the nested, unvalidated portfolio object; the caller parses it with portfolioSchema. */
export function rowsToPortfolioInput(rows: PortfolioRows) {
  const group = <T extends { project_id: string }>(list: T[]) => {
    const m = new Map<string, T[]>();
    for (const r of list) m.set(r.project_id, [...(m.get(r.project_id) ?? []), r]);
    return m;
  };
  const tasksBy = group(rows.tasks);
  const issuesBy = group(rows.issues);
  const updatesBy = group(rows.updates);
  const resourcesBy = group(rows.resources);
  const stakeholdersBy = group(rows.stakeholders);
  const taskHistoryBy = new Map<string, TaskHistoryRow[]>();
  for (const h of rows.taskHistory) taskHistoryBy.set(h.task_id, [...(taskHistoryBy.get(h.task_id) ?? []), h]);
  const projectHistoryBy = group(rows.projectHistory);

  return {
    profile: rows.profile
      ? { ownerName: rows.profile.owner_name, ownerRole: rows.profile.owner_role, organisation: rows.profile.organisation, reportPurpose: rows.profile.report_purpose }
      : null,
    projects: rows.projects.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      summary: p.summary,
      description: p.description,
      businessObjective: p.business_objective,
      background: p.background,
      responsibilitySummary: p.responsibility_summary,
      responsibilities: p.responsibilities,
      status: p.status,
      category: p.category,
      organisation: p.organisation,
      progressSummary: p.progress_summary,
      sourceNote: p.source_note,
      lastVerifiedAt: p.last_verified_at,
      sortOrder: p.sort_order,
      isPublished: p.is_published,
      statusHistory: history(projectHistoryBy.get(p.id) ?? []),
      tasks: (tasksBy.get(p.id) ?? []).map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        status: t.status,
        category: t.category,
        priority: t.priority,
        latestProgress: t.latest_progress,
        dependency: t.dependency,
        evidence: t.evidence,
        dueDate: t.due_date,
        completedAt: t.completed_at,
        sortOrder: t.sort_order,
        isPublished: t.is_published,
        statusHistory: history(taskHistoryBy.get(t.id) ?? []),
      })),
      issues: (issuesBy.get(p.id) ?? []).map((i) => ({
        id: i.id,
        title: i.title,
        description: i.description,
        kind: i.kind,
        status: i.status,
        waitingOn: i.waiting_on,
        raisedOn: i.raised_on,
        resolvedOn: i.resolved_on,
        isPublished: i.is_published,
      })),
      updates: (updatesBy.get(p.id) ?? []).map((u) => ({
        id: u.id,
        taskId: u.task_id,
        title: u.title,
        description: u.description,
        category: u.category,
        occurredOn: u.occurred_on,
        isPublished: u.is_published,
      })),
      resources: (resourcesBy.get(p.id) ?? []).map((r) => ({
        id: r.id,
        taskId: r.task_id,
        title: r.title,
        description: r.description,
        type: r.resource_type,
        url: r.url,
        accessNote: r.access_note,
        isPublished: r.is_published,
      })),
      stakeholders: (stakeholdersBy.get(p.id) ?? []).map((s) => ({
        id: s.id,
        name: s.name,
        role: s.role,
        organisation: s.organisation,
        isPublished: s.is_published,
      })),
    })),
  };
}
