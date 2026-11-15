import { cn } from "@/lib/utils";
import { STATUS_LABEL } from "@/domain/labels";
import type { WorkStatus } from "@/domain/schema";

const TONE: Record<WorkStatus, string> = {
  completed: "bg-[var(--status-completed-bg)] text-[var(--status-completed-fg)] [--dot:var(--status-completed-dot)]",
  in_progress: "bg-[var(--status-progress-bg)] text-[var(--status-progress-fg)] [--dot:var(--status-progress-dot)]",
  pending: "bg-[var(--status-pending-bg)] text-[var(--status-pending-fg)] [--dot:var(--status-pending-dot)]",
  blocked: "bg-[var(--status-blocked-bg)] text-[var(--status-blocked-fg)] [--dot:var(--status-blocked-dot)]",
  awaiting_approval: "bg-[var(--status-awaiting-bg)] text-[var(--status-awaiting-fg)] [--dot:var(--status-awaiting-dot)]",
};

export function StatusBadge({ status, className }: { status: WorkStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium whitespace-nowrap",
        TONE[status],
        className,
      )}
    >
      <span aria-hidden className="size-1.5 rounded-full bg-[var(--dot)]" />
      {STATUS_LABEL[status]}
    </span>
  );
}

/** Neutral tag for categories, priorities and kinds. */
export function Tag({ children, className, tone = "neutral" }: { children: React.ReactNode; className?: string; tone?: "neutral" | "accent" }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center rounded-md px-2 text-xs font-medium whitespace-nowrap",
        tone === "accent" ? "bg-accent text-accent-foreground" : "bg-secondary text-secondary-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}
