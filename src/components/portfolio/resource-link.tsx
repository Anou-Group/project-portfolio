import { ArrowUpRight, Lock } from "lucide-react";
import { RESOURCE_TYPE_LABEL } from "@/domain/labels";
import type { Resource } from "@/domain/schema";
import { RESOURCE_ICON } from "./icons";
import { cn } from "@/lib/utils";

/** A resource as a full-width row link. Always opens in a new tab. */
export function ResourceRow({ resource, projectName, className }: { resource: Resource; projectName?: string; className?: string }) {
  const Icon = RESOURCE_ICON[resource.type];
  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group flex items-start gap-3 rounded-lg border bg-card p-3.5 transition-colors hover:border-primary/30 hover:bg-accent/40",
        className,
      )}
    >
      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-md bg-secondary text-secondary-foreground group-hover:bg-card">
        <Icon aria-hidden className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-2">
          <span className="text-sm font-medium text-foreground break-words group-hover:text-primary">{resource.title}</span>
          <ArrowUpRight aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground group-hover:text-primary" />
        </span>
        <span className="mt-0.5 block text-sm text-muted-foreground">{resource.description}</span>
        <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>{RESOURCE_TYPE_LABEL[resource.type]}</span>
          {projectName ? <span>{projectName}</span> : null}
          {resource.accessNote ? (
            <span className="inline-flex items-center gap-1">
              <Lock aria-hidden className="size-3" />
              {resource.accessNote}
            </span>
          ) : null}
        </span>
      </span>
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}

/** Compact inline link for resources attached to a task. */
export function InlineResourceLink({ resource }: { resource: Resource }) {
  const Icon = RESOURCE_ICON[resource.type];
  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex max-w-full items-center gap-1.5 rounded-md text-sm font-medium text-primary underline-offset-4 hover:underline"
    >
      <Icon aria-hidden className="size-3.5 shrink-0" />
      <span className="truncate">{resource.title}</span>
      <ArrowUpRight aria-hidden className="size-3.5 shrink-0" />
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}
