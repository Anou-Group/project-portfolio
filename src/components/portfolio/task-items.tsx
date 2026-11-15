import { CircleCheck, History } from "lucide-react";
import type { Resource, StatusChange, Task } from "@/domain/schema";
import { PRIORITY_LABEL, STATUS_LABEL } from "@/domain/labels";
import { formatDate } from "@/domain/format";
import { StatusBadge, Tag } from "./status-badge";
import { InlineResourceLink } from "./resource-link";

function StatusTrail({ history }: { history: StatusChange[] }) {
  if (history.length < 2) return null;
  return (
    <p className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted-foreground">
      <History aria-hidden className="size-3.5" />
      <span className="sr-only">Status history:</span>
      {history.map((h, i) => (
        <span key={`${h.changedAt}-${i}`}>
          {i > 0 ? <span aria-hidden>→ </span> : null}
          {STATUS_LABEL[h.toStatus]} <span className="tabular-nums">({formatDate(h.changedAt)})</span>
        </span>
      ))}
    </p>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <p className="mt-2 text-sm leading-relaxed">
      <span className="font-medium text-foreground">{label}: </span>
      <span className="text-muted-foreground">{children}</span>
    </p>
  );
}

export function CompletedItem({ task, resources }: { task: Task; resources: Resource[] }) {
  return (
    <li className="flex gap-3 py-4 first:pt-0 last:pb-0" data-testid="completed-item">
      <CircleCheck aria-hidden className="mt-0.5 size-[18px] shrink-0 text-[var(--status-completed-dot)]" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <p className="text-sm font-medium text-foreground">{task.title}</p>
          <p className="shrink-0 text-xs text-muted-foreground tabular-nums">
            {task.completedAt ? (
              <time dateTime={task.completedAt}>{formatDate(task.completedAt)}</time>
            ) : (
              "Date not recorded"
            )}
          </p>
        </div>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{task.description}</p>
        {task.evidence ? <Detail label="Evidence">{task.evidence}</Detail> : null}
        {resources.length ? (
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {resources.map((r) => (
              <InlineResourceLink key={r.id} resource={r} />
            ))}
          </div>
        ) : null}
        <StatusTrail history={task.statusHistory} />
      </div>
    </li>
  );
}

export function ActiveItem({ task, resources }: { task: Task; resources: Resource[] }) {
  return (
    <li className="rounded-lg border p-4" data-testid="active-item">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <p className="text-sm font-semibold text-foreground">{task.title}</p>
        <div className="flex shrink-0 flex-wrap gap-1.5">
          {task.priority ? <Tag>{PRIORITY_LABEL[task.priority]}</Tag> : null}
          <StatusBadge status={task.status} />
        </div>
      </div>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{task.description}</p>
      {task.latestProgress ? <Detail label="Latest progress">{task.latestProgress}</Detail> : null}
      {task.dependency ? <Detail label="Depends on">{task.dependency}</Detail> : null}
      {task.dueDate ? <Detail label="Expected completion">{formatDate(task.dueDate)}</Detail> : null}
      {resources.length ? (
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          {resources.map((r) => (
            <InlineResourceLink key={r.id} resource={r} />
          ))}
        </div>
      ) : null}
      <StatusTrail history={task.statusHistory} />
    </li>
  );
}

export function OutstandingItem({ task }: { task: Task }) {
  return (
    <li className="py-3 first:pt-0 last:pb-0" data-testid="outstanding-item">
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <p className="text-sm font-medium text-foreground">{task.title}</p>
        {task.priority ? <Tag className="self-start">{PRIORITY_LABEL[task.priority]}</Tag> : null}
      </div>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{task.description}</p>
      {task.dependency ? <Detail label="Depends on">{task.dependency}</Detail> : null}
      {task.dueDate ? <Detail label="Due">{formatDate(task.dueDate)}</Detail> : null}
    </li>
  );
}
