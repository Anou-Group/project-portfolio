import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Project } from "@/domain/schema";
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

/** The short, plain-language card used on the Overview. The whole card links to the full project page. */
export function ProjectSnapshot({ project }: { project: Project }) {
  const health = HEALTH[projectHealth(project)];
  const { done, total, percent } = projectProgress(project);
  const waiting = waitingCount(project);
  return (
    <Link
      href={`/projects/${project.slug}`}
      className="group flex h-full min-w-0 flex-col rounded-xl border bg-card p-5 shadow-xs transition-[border-color,box-shadow] hover:border-primary/30 hover:shadow-sm"
      data-testid="project-card"
    >
      <span
        className={cn("inline-flex h-6 w-fit items-center gap-1.5 rounded-full px-2.5 text-xs font-medium whitespace-nowrap", health.tone)}
      >
        <span aria-hidden className="size-1.5 rounded-full bg-[var(--dot)]" />
        {health.label}
      </span>
      <h3 className="mt-3 text-base leading-snug font-semibold tracking-tight text-foreground group-hover:text-primary">{project.name}</h3>
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
      <p className="mt-3 text-sm text-foreground">
        {waiting > 0 ? `${waiting} ${waiting === 1 ? "item" : "items"} waiting on others` : "Nothing waiting on others"}
      </p>
      <div className="mt-auto flex items-center justify-between gap-3 pt-4 text-xs text-muted-foreground">
        <span>Updated {formatDate(project.lastVerifiedAt)}</span>
        <span className="inline-flex items-center gap-1 whitespace-nowrap">
          View details
          <ArrowRight aria-hidden className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
