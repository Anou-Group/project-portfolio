import Link from "next/link";
import { ArrowRight, Briefcase } from "lucide-react";
import type { Project } from "@/domain/schema";
import { formatDate } from "@/domain/format";
import { projectBreakdown } from "@/domain/portfolio";
import { StatusBadge, Tag } from "./status-badge";

/** The whole card is one link to the project's detail page. */
export function ProjectCard({ project, matches = [] }: { project: Project; matches?: string[] }) {
  const { counts } = projectBreakdown(project);
  return (
    <Link
      href={`/projects/${project.slug}`}
      className="group flex h-full min-w-0 flex-col rounded-xl border bg-card p-5 shadow-xs transition-[border-color,box-shadow] hover:border-primary/30 hover:shadow-sm"
      data-testid="project-card"
    >
      <div className="flex items-start justify-between gap-3">
        <Tag>{project.category}</Tag>
        <StatusBadge status={project.status} />
      </div>
      <h3 className="mt-3.5 text-base leading-snug font-semibold tracking-tight text-foreground group-hover:text-primary">{project.name}</h3>
      <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{project.summary}</p>
      <p className="mt-3 flex items-start gap-2 text-sm text-foreground">
        <Briefcase aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <span>
          <span className="sr-only">Team responsibility: </span>
          {project.responsibilitySummary}
        </span>
      </p>
      <div className="mt-4 rounded-lg bg-muted/70 px-3 py-2.5 text-sm leading-relaxed text-secondary-foreground">{project.progressSummary}</div>
      {matches.length ? (
        <ul className="mt-3 space-y-1 text-xs text-muted-foreground" aria-label="Search matches">
          {matches.map((m) => (
            <li key={m} className="truncate">
              Matches · {m}
            </li>
          ))}
        </ul>
      ) : null}
      <div className="mt-auto flex items-center justify-between gap-3 pt-4 text-xs text-muted-foreground">
        <span className="tabular-nums">
          {counts.completed} completed · {counts.inProgress} active · {counts.outstanding} to do
        </span>
        <span className="inline-flex items-center gap-1 whitespace-nowrap">
          Updated {formatDate(project.lastVerifiedAt)}
          <ArrowRight aria-hidden className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
