import Link from "next/link";
import type { Project, Task, WorkStatus } from "@/domain/schema";
import { formatDate } from "@/domain/format";
import { attentionItems, projectProgress, type AttentionItem } from "@/domain/portfolio";
import { PENDING_CONFIRMATION } from "@/domain/labels";
import { inRange, type PeriodRange } from "@/domain/period";
import { TASK_CATEGORY_LABEL } from "@/domain/labels";
import { cn } from "@/lib/utils";

/** monday.com-style status cells: a solid colour block with a short plain label. */
export const CELL: Record<WorkStatus, { label: string; bg: string }> = {
  completed: { label: "Done", bg: "bg-[#00c875]" },
  in_progress: { label: "Working on it", bg: "bg-[#fdab3d]" },
  blocked: { label: "Stuck", bg: "bg-[#df2f4a]" },
  awaiting_approval: { label: "Waiting approval", bg: "bg-[#a25ddc]" },
  pending: { label: "Not started", bg: "bg-[#c4c4c4]" },
};
const ORDER: WorkStatus[] = ["completed", "in_progress", "awaiting_approval", "blocked", "pending"];

export function StatusCell({ status }: { status: WorkStatus }) {
  const c = CELL[status];
  return (
    <span className={cn("flex h-9 w-full min-w-[120px] items-center justify-center px-2 text-[13px] font-medium whitespace-nowrap text-white", c.bg)}>
      {c.label}
    </span>
  );
}

/** Battery bar: one coloured segment per task status, like monday.com's progress column. */
export function Battery({ tasks, label }: { tasks: Task[]; label: string }) {
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "completed").length;
  const percent = total ? Math.round((done / total) * 100) : 0;
  return (
    <div className="flex min-w-[150px] items-center gap-2">
      <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} className="flex h-5 flex-1 overflow-hidden rounded-sm bg-muted">
        {ORDER.map((s) => {
          const n = tasks.filter((t) => t.status === s).length;
          return n ? <span key={s} title={`${CELL[s].label}: ${n}`} className={CELL[s].bg} style={{ width: `${(n / total) * 100}%` }} /> : null;
        })}
      </div>
      <span className="w-9 text-right text-xs tabular-nums text-muted-foreground">{percent}%</span>
    </div>
  );
}

const TH = "h-9 border-b px-2 text-center text-xs font-normal text-muted-foreground whitespace-nowrap";
const TD = "h-10 border-b border-l p-0 text-center text-sm";

/** Plain-language box at the top of a project: what is holding it up, why, and who we are waiting for. */
function waitingFor(item: AttentionItem): string {
  return item.kind === "issue" ? item.issue.waitingOn || PENDING_CONFIRMATION : PENDING_CONFIRMATION;
}

export function WaitingBox({ project }: { project: Project }) {
  const items = attentionItems([project]);
  if (!items.length)
    return (
      <section aria-label="What is holding this up" className="mt-6 rounded-md border border-l-[6px] border-l-[#00c875] bg-card p-4">
        <p className="font-medium text-foreground">Nothing is holding this project up right now.</p>
      </section>
    );
  return (
    <section aria-labelledby="waiting-heading" className="mt-6 rounded-md border border-l-[6px] border-l-[#df2f4a] bg-card p-4">
      <h2 id="waiting-heading" className="text-lg font-semibold text-foreground">
        What is holding this up ({items.length})
      </h2>
      <ul className="mt-3 divide-y">
        {items.map((i) => {
          const id = i.kind === "issue" ? i.issue.id : i.task.id;
          const what = i.kind === "issue" ? i.issue.title : i.task.title;
          const why = i.kind === "issue" ? i.issue.description : (i.task.dependency ?? i.task.description);
          return (
            <li key={id} data-testid="attention-item" className="grid gap-1 py-3 first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_200px] sm:gap-4">
              <div>
                <p className="font-medium text-foreground">{what}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Why: </span>
                  {why}
                </p>
              </div>
              <p className="text-sm sm:text-right">
                <span className="text-muted-foreground">Waiting for </span>
                <span className="font-semibold text-[#df2f4a]">{waitingFor(i)}</span>
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** The portfolio board: one row per project, grouped like a monday.com board. */
export function ProjectBoard({ rows, period = null }: { rows: { project: Project; matches: string[] }[]; period?: PeriodRange | null }) {
  const groups = [
    { title: "Active projects", color: "#579bfc", rows: rows.filter((r) => r.project.status !== "completed") },
    { title: "Finished projects", color: "#00c875", rows: rows.filter((r) => r.project.status === "completed") },
  ].filter((g) => g.rows.length);
  return (
    <div className="space-y-8">
      {groups.map((g) => (
        <section key={g.title} aria-label={g.title}>
          <h2 className="mb-2 text-base font-semibold" style={{ color: g.color }}>
            {g.title} <span className="font-normal text-muted-foreground">· {g.rows.length}</span>
          </h2>
          <div className="overflow-x-auto rounded-md border bg-card" style={{ borderLeft: `6px solid ${g.color}` }}>
            <table className="w-full min-w-[860px] border-collapse">
              <thead>
                <tr>
                  <th className={cn(TH, "text-left")}>Project</th>
                  <th className={TH}>Status</th>
                  <th className={TH}>Progress</th>
                  <th className={TH}>Tasks done</th>
                  {period ? <th className={TH}>Done {period.label.toLowerCase()}</th> : null}
                  <th className={TH}>Waiting</th>
                  <th className={TH}>Last updated</th>
                </tr>
              </thead>
              <tbody>
                {g.rows.map(({ project, matches }) => {
                  const { done, total } = projectProgress(project);
                  const waiting = attentionItems([project]).length;
                  return (
                    <tr key={project.id} data-testid="project-card" className="hover:bg-muted/40">
                      <td className="h-10 border-b px-3 py-2 text-left">
                        <Link href={`/projects/${project.slug}`} className="font-medium text-foreground hover:text-primary hover:underline">
                          {project.name}
                        </Link>
                        <p className="mt-0.5 line-clamp-2 max-w-md text-xs leading-relaxed text-muted-foreground">{project.progressSummary}</p>
                        {matches.map((m) => (
                          <p key={m} className="text-xs text-muted-foreground">
                            Matches · {m}
                          </p>
                        ))}
                      </td>
                      <td className={TD}>
                        <StatusCell status={project.status} />
                      </td>
                      <td className={cn(TD, "px-3")}>
                        <Battery tasks={project.tasks} label={`${project.name} progress`} />
                      </td>
                      <td className={cn(TD, "tabular-nums")}>
                        {done} / {total}
                      </td>
                      {period ? (
                        <td className={cn(TD, "font-semibold tabular-nums")}>
                          {project.tasks.filter((t) => t.status === "completed" && inRange(t.completedAt, period)).length || "—"}
                        </td>
                      ) : null}
                      <td className={cn(TD, "px-2 text-xs")}>
                        {waiting ? <span className="font-medium whitespace-nowrap text-[#df2f4a]">{waiting} {waiting === 1 ? "item" : "items"}</span> : <span className="text-muted-foreground">None</span>}
                      </td>
                      <td className={cn(TD, "px-2 text-xs whitespace-nowrap text-muted-foreground")}>{formatDate(project.lastVerifiedAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}

/** A project's tasks as a monday.com board, grouped by where they stand. */
export function TaskBoard({ project }: { project: Project }) {
  const groups: { title: string; color: string; statuses: WorkStatus[] }[] = [
    { title: "Working on it", color: "#fdab3d", statuses: ["in_progress", "awaiting_approval", "blocked"] },
    { title: "To do", color: "#c4c4c4", statuses: ["pending"] },
    { title: "Done", color: "#00c875", statuses: ["completed"] },
  ];
  return (
    <section aria-labelledby="board-heading" className="mt-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 id="board-heading" className="text-lg font-semibold">
          Tasks
        </h2>
        <div className="w-full max-w-xs">
          <Battery tasks={project.tasks} label={`${project.name} task progress`} />
        </div>
      </div>
      <div className="space-y-6">
        {groups.map((g) => {
          const tasks = project.tasks.filter((t) => g.statuses.includes(t.status));
          if (!tasks.length) return null;
          return (
            <div key={g.title}>
              <h3 className="mb-1.5 text-sm font-semibold" style={{ color: g.color === "#c4c4c4" ? "#7a7a7a" : g.color }}>
                {g.title} <span className="font-normal text-muted-foreground">· {tasks.length}</span>
              </h3>
              <div className="overflow-x-auto rounded-md border bg-card" style={{ borderLeft: `6px solid ${g.color}` }}>
                <table className="w-full min-w-[640px] border-collapse">
                  <thead>
                    <tr>
                      <th className={cn(TH, "text-left")}>Task</th>
                      <th className={TH}>Status</th>
                      <th className={TH}>Type</th>
                      <th className={TH}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((t) => (
                      <tr key={t.id} className="hover:bg-muted/40">
                        <td className="border-b px-3 py-2 text-left text-sm text-foreground">{t.title}</td>
                        <td className={cn(TD, "w-[150px]")}>
                          <StatusCell status={t.status} />
                        </td>
                        <td className={cn(TD, "px-2 text-xs text-muted-foreground")}>{TASK_CATEGORY_LABEL[t.category]}</td>
                        <td className={cn(TD, "px-2 text-xs whitespace-nowrap text-muted-foreground")}>
                          {t.completedAt ? formatDate(t.completedAt) : t.dueDate ? `Due ${formatDate(t.dueDate)}` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
