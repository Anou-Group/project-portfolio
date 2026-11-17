import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import type { Project, Task, WorkStatus } from "@/domain/schema";
import { formatDate } from "@/domain/format";
import { projectHealth, projectProgress, waitingCount, type Health } from "@/domain/portfolio";
import { cn } from "@/lib/utils";

const HEALTH: Record<Health, { label: string; tone: string }> = {
  completed: {
    label: "Completed",
    tone: "bg-[var(--status-progress-bg)] text-[var(--status-progress-fg)] [--dot:var(--status-progress-dot)]",
  },
  on_track: {
    label: "On track",
    tone: "bg-[var(--status-completed-bg)] text-[var(--status-completed-fg)] [--dot:var(--status-completed-dot)]",
  },
  waiting: {
    label: "Waiting on others",
    tone: "bg-[var(--status-awaiting-bg)] text-[var(--status-awaiting-fg)] [--dot:var(--status-awaiting-dot)]",
  },
  blocked: {
    label: "Blocked",
    tone: "bg-[var(--status-blocked-bg)] text-[var(--status-blocked-fg)] [--dot:var(--status-blocked-dot)]",
  },
};

const OPEN: WorkStatus[] = ["in_progress", "blocked", "awaiting_approval"];

function TaskList({ title, tasks }: { title: string; tasks: Task[] }) {
  if (!tasks.length) return null;
  return (
    <div>
      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{title}</p>
      <ul className="mt-1 space-y-1 text-sm text-foreground">
        {tasks.map((t) => (
          <li key={t.id} className="flex gap-2">
            <span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-muted-foreground/60" />
            {t.title}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** One project at a glance: status, progress and task counts. Task titles open on request; the title links to the full page. */
export function ProjectSnapshot({ project, matches = [] }: { project: Project; matches?: string[] }) {
  const health = HEALTH[projectHealth(project)];
  const { done, total, percent } = projectProgress(project);
  const waiting = waitingCount(project);
  const doneTasks = project.tasks.filter((t) => t.status === "completed");
  const openTasks = project.tasks.filter((t) => OPEN.includes(t.status));
  const todoTasks = project.tasks.filter((t) => t.status === "pending");
  return (
    <article
      className="group relative flex h-full min-w-0 flex-col rounded-xl border bg-card p-5 shadow-xs transition-[border-color,box-shadow] hover:border-primary/30 hover:shadow-sm"
      data-testid="project-card"
    >
      <span
        className={cn("inline-flex h-6 w-fit items-center gap-1.5 rounded-full px-2.5 text-xs font-medium whitespace-nowrap", health.tone)}
      >
        <span aria-hidden className="size-1.5 rounded-full bg-[var(--dot)]" />
        {health.label}
      </span>
      <h3 className="mt-3 text-base leading-snug font-semibold tracking-tight text-foreground">
        <Link href={`/projects/${project.slug}`} className="after:absolute after:inset-0 after:rounded-xl group-hover:text-primary">
          {project.name}
        </Link>
      </h3>
      <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{project.summary}</p>
      <div className="mt-4">
        <div
          role="progressbar"
          aria-label={`${project.name} progress`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          className="h-2 w-full overflow-hidden rounded-full bg-muted"
        >
          <div className={cn("h-full rounded-full bg-[var(--dot)]", health.tone)} style={{ width: `${percent}%` }} />
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground tabular-nums">
          {done} of {total} tasks done · {percent}%
        </p>
      </div>
      <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
        {[
          ["Done", doneTasks.length],
          ["In progress", openTasks.length],
          ["To do", todoTasks.length],
        ].map(([label, n]) => (
          <div key={label} className="rounded-lg bg-muted/60 px-2 py-1.5">
            <dd className="text-lg leading-none font-semibold tabular-nums text-foreground">{n}</dd>
            <dt className="mt-1 text-[11px] text-muted-foreground">{label}</dt>
          </div>
        ))}
      </dl>
      <p className="mt-2 text-sm text-foreground">
        {waiting > 0 ? `${waiting} ${waiting === 1 ? "item" : "items"} waiting on others` : "Nothing waiting on others"}
      </p>
      {matches.length ? (
        <ul className="mt-2 space-y-1 text-xs text-muted-foreground" aria-label="Search matches">
          {matches.map((m) => (
            <li key={m}>Matches · {m}</li>
          ))}
        </ul>
      ) : null}
      <details className="relative z-10 mt-4 border-t pt-3">
        <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-foreground marker:hidden">
          Show tasks
          <ChevronDown aria-hidden className="size-4 text-muted-foreground" />
        </summary>
        <div className="mt-3 space-y-3">
          <TaskList title="In progress" tasks={openTasks} />
          <TaskList title="Done" tasks={doneTasks} />
          <TaskList title="To do" tasks={todoTasks} />
          {project.tasks.length ? null : <p className="text-sm text-muted-foreground">No tasks recorded yet.</p>}
        </div>
      </details>
      <div className="mt-auto flex items-center justify-between gap-3 pt-4 text-xs text-muted-foreground">
        <span>Updated {formatDate(project.lastVerifiedAt)}</span>
        <span className="inline-flex items-center gap-1 whitespace-nowrap">
          View details
          <ArrowRight aria-hidden className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </article>
  );
}
