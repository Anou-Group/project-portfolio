import Link from "next/link";
import { ACTIVITY_CATEGORY_LABEL } from "@/domain/labels";
import { formatDate } from "@/domain/format";
import type { ActivityEntry } from "@/domain/portfolio";
import { Tag } from "./status-badge";

/** A vertical timeline of activity entries. */
export function ActivityList({ entries, showProject = true }: { entries: ActivityEntry[]; showProject?: boolean }) {
  return (
    <ol className="relative">
      {entries.map((e, i) => (
        <li key={e.id} className="relative flex gap-4 pb-5 last:pb-0" data-testid="activity-entry">
          <div aria-hidden className="relative flex w-3 shrink-0 justify-center">
            <span className="mt-1.5 size-2.5 rounded-full border-2 border-primary/60 bg-card" />
            {i < entries.length - 1 ? <span className="absolute top-5 bottom-0 w-px bg-border" /> : null}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
              <time dateTime={e.occurredOn} className="font-medium tabular-nums text-foreground/80">
                {formatDate(e.occurredOn)}
              </time>
              <Tag className="h-5 px-1.5 text-[11px]">{ACTIVITY_CATEGORY_LABEL[e.category]}</Tag>
              {showProject ? (
                <Link href={`/projects/${e.project.slug}`} className="font-medium text-primary underline-offset-4 hover:underline">
                  {e.project.name}
                </Link>
              ) : null}
            </div>
            <p className="mt-1 text-sm font-medium text-foreground">{e.title}</p>
            <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{e.description}</p>
            {e.task ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Related: <span className="text-foreground/80">{e.task.title}</span>
              </p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
