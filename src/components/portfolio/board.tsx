import Link from "next/link";
import type { Project, Task, WorkStatus } from "@/domain/schema";
import { formatDate } from "@/domain/format";
import { projectProgress, waitingCount } from "@/domain/portfolio";
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

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}
const AVATAR = ["bg-[#579bfc]", "bg-[#ff7575]", "bg-[#9cd326]", "bg-[#ffcb00]", "bg-[#784bd1]", "bg-[#66ccff]"];

export function People({ names }: { names: string[] }) {
  if (!names.length) return <span className="text-xs text-muted-foreground">—</span>;
  const shown = names.slice(0, 3);
  return (
    <span className="flex items-center justify-center -space-x-1.5" title={names.join(", ")}>
      <span className="sr-only">{names.join(", ")}</span>
      {shown.map((n, i) => (
        <span key={n} aria-hidden className={cn("flex size-7 items-center justify-center rounded-full border-2 border-card text-[10px] font-semibold text-white", AVATAR[i % AVATAR.length])}>
          {initials(n)}
        </span>
      ))}
      {names.length > 3 ? (
        <span aria-hidden className="flex size-7 items-center justify-center rounded-full border-2 border-card bg-muted text-[10px] font-semibold text-muted-foreground">
          +{names.length - 3}
        </span>
      ) : null}
    </span>
  );
}

const TH = "h-9 border-b px-2 text-center text-xs font-normal text-muted-foreground whitespace-nowrap";
const TD = "h-10 border-b border-l p-0 text-center text-sm";

/** The portfolio board: one row per project, grouped like a monday.com board. */
export function ProjectBoard({ rows }: { rows: { project: Project; matches: string[] }[] }) {
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
                  <th className={TH}>People</th>
                  <th className={TH}>Status</th>
                  <th className={TH}>Progress</th>
                  <th className={TH}>Tasks done</th>
                  <th className={TH}>Waiting on others</th>
                  <th className={TH}>Last updated</th>
                </tr>
              </thead>
              <tbody>
                {g.rows.map(({ project, matches }) => {
                  const { done, total } = projectProgress(project);
                  const waiting = waitingCount(project);
                  return (
                    <tr key={project.id} data-testid="project-card" className="hover:bg-muted/40">
                      <td className="h-10 border-b px-3 py-2 text-left">
                        <Link href={`/projects/${project.slug}`} className="font-medium text-foreground hover:text-primary hover:underline">
                          {project.name}
                        </Link>
                        {matches.map((m) => (
                          <p key={m} className="text-xs text-muted-foreground">
                            Matches · {m}
                          </p>
                        ))}
                      </td>
                      <td className={cn(TD, "px-2")}>
                        <People names={project.stakeholders.map((s) => s.name)} />
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
                      <td className={cn(TD, "tabular-nums", waiting ? "font-medium text-[#df2f4a]" : "text-muted-foreground")}>{waiting || "—"}</td>
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
