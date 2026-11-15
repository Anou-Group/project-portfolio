import Link from "next/link";
import { ArrowRight, CalendarDays, CircleAlert, Clock, UserRound } from "lucide-react";
import { getPortfolio } from "@/server/portfolio";
import { allActivity, attentionItems, lastUpdated, portfolioMetrics, reportingPeriod, upcomingWork } from "@/domain/portfolio";
import { formatDate, formatRange } from "@/domain/format";
import { ISSUE_KIND_LABEL, PENDING_CONFIRMATION, TASK_CATEGORY_LABEL } from "@/domain/labels";
import { PageHeader, SectionHeading } from "@/components/portfolio/page-header";
import { ProjectCard } from "@/components/portfolio/project-card";
import { ActivityList } from "@/components/portfolio/activity-list";
import { EmptyState } from "@/components/portfolio/empty-state";
import { StatusBadge, Tag } from "@/components/portfolio/status-badge";

export default async function OverviewPage() {
  const { profile, projects } = await getPortfolio();
  const metrics = portfolioMetrics(projects);
  const updated = lastUpdated(projects);
  const period = reportingPeriod(projects);
  const recent = allActivity(projects).slice(0, 6);
  const upcoming = upcomingWork(projects, 6);
  const attention = attentionItems(projects);

  const tiles = [
    { label: "Active projects", value: metrics.activeProjects, hint: "Not yet completed", href: "/projects" },
    { label: "Completed projects", value: metrics.completedProjects, hint: "Finished and verified", href: "/projects?status=completed" },
    { label: "Projects in progress", value: metrics.inProgressProjects, hint: "Work under way", href: "/projects?status=in_progress" },
    { label: "Blocked or awaiting approval", value: metrics.needsAttention, hint: "Decisions and inputs needed", href: "#attention" },
  ];

  return (
    <>
      <PageHeader title="Project Portfolio" description="An overview of current projects, responsibilities, progress and upcoming deliverables.">
        <dl className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <div className="flex items-center gap-2">
            <UserRound aria-hidden className="size-4 text-muted-foreground" />
            <dt className="text-muted-foreground">Reporting owner</dt>
            <dd className="font-medium">{profile.ownerName}</dd>
          </div>
          <div className="flex items-center gap-2">
            <Clock aria-hidden className="size-4 text-muted-foreground" />
            <dt className="text-muted-foreground">Last updated</dt>
            <dd className="font-medium">{updated ? formatDate(updated) : PENDING_CONFIRMATION}</dd>
          </div>
          {period ? (
            <div className="flex items-center gap-2">
              <CalendarDays aria-hidden className="size-4 text-muted-foreground" />
              <dt className="text-muted-foreground">Reporting period</dt>
              <dd className="font-medium">{formatRange(period.from, period.to)}</dd>
            </div>
          ) : null}
        </dl>
      </PageHeader>

      <section aria-label="Summary" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((t) => (
          <Link
            key={t.label}
            href={t.href}
            className="group rounded-xl border bg-card p-4 shadow-xs transition-colors hover:border-primary/30 sm:p-5"
            data-testid="metric"
          >
            <p className="text-[13px] font-medium text-muted-foreground">{t.label}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums text-foreground">{t.value}</p>
            <p className="mt-1 text-xs text-muted-foreground group-hover:text-primary">{t.hint}</p>
          </Link>
        ))}
      </section>

      <section aria-labelledby="projects-heading" className="mt-10">
        <SectionHeading
          id="projects-heading"
          title="Projects"
          action={
            <Link href="/projects" className="inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline">
              All projects <ArrowRight aria-hidden className="size-3.5" />
            </Link>
          }
        />
        {projects.length ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-2">
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        ) : (
          <EmptyState title="No projects published yet" description="Projects appear here once they have been verified and published." />
        )}
      </section>

      <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <section aria-labelledby="recent-heading" className="rounded-xl border bg-card p-5 shadow-xs">
          <SectionHeading
            id="recent-heading"
            title="Recent activity"
            action={
              <Link href="/activity" className="inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline">
                All activity <ArrowRight aria-hidden className="size-3.5" />
              </Link>
            }
          />
          {recent.length ? <ActivityList entries={recent} /> : <EmptyState title="No activity recorded yet" />}
        </section>

        <section aria-labelledby="upcoming-heading" className="rounded-xl border bg-card p-5 shadow-xs">
          <SectionHeading id="upcoming-heading" title="Upcoming work" />
          <p className="-mt-1 mb-4 text-sm text-muted-foreground">High-priority deliverables not yet completed. Dates are shown only where they are documented.</p>
          {upcoming.length ? (
            <ul className="divide-y">
              {upcoming.map(({ project, task }) => (
                <li key={task.id} className="py-3 first:pt-0 last:pb-0">
                  <Link href={`/projects/${project.slug}#${task.status === "pending" ? "outstanding" : "in-progress"}`} className="group block rounded-md">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-medium text-foreground group-hover:text-primary">{task.title}</p>
                      <StatusBadge status={task.status} />
                    </div>
                    <p className="mt-1 flex flex-wrap gap-x-2 text-xs text-muted-foreground">
                      <span>{project.name}</span>
                      <span aria-hidden>·</span>
                      <span>{TASK_CATEGORY_LABEL[task.category]}</span>
                      {task.dueDate ? (
                        <>
                          <span aria-hidden>·</span>
                          <span>Due {formatDate(task.dueDate)}</span>
                        </>
                      ) : null}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No outstanding high-priority work" />
          )}
        </section>
      </div>

      <section id="attention" aria-labelledby="attention-heading" className="mt-10">
        <SectionHeading id="attention-heading" title="Blocked or awaiting approval" />
        <p className="-mt-1 mb-4 text-sm text-muted-foreground">Decisions, approvals and inputs that other people need to provide before work can continue.</p>
        {attention.length ? (
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {attention.map((item) => {
              const title = item.kind === "issue" ? item.issue.title : item.task.title;
              const description = item.kind === "issue" ? item.issue.description : (item.task.dependency ?? item.task.description);
              const waitingOn = item.kind === "issue" ? item.issue.waitingOn : null;
              const id = item.kind === "issue" ? item.issue.id : item.task.id;
              return (
                <li key={id} data-testid="attention-item">
                  <Link
                    href={`/projects/${item.project.slug}#${item.kind === "issue" ? "issues" : "in-progress"}`}
                    className="group flex h-full flex-col rounded-xl border bg-card p-4 shadow-xs transition-colors hover:border-primary/30"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      {item.kind === "issue" ? <Tag>{ISSUE_KIND_LABEL[item.issue.kind]}</Tag> : <StatusBadge status={item.task.status} />}
                      <span className="text-xs text-muted-foreground">{item.project.name}</span>
                    </div>
                    <p className="mt-2 flex items-start gap-2 text-sm font-medium text-foreground group-hover:text-primary">
                      <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-[var(--status-awaiting-dot)]" />
                      {title}
                    </p>
                    <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{description}</p>
                    {waitingOn ? <p className="mt-auto pt-2 text-xs text-muted-foreground">Waiting on: <span className="font-medium text-foreground">{waitingOn}</span></p> : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState title="Nothing is blocked or awaiting approval" />
        )}
      </section>
    </>
  );
}
