import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, CalendarCheck, FileSearch } from "lucide-react";
import { getPortfolio } from "@/server/portfolio";
import { projectBreakdown, resourcesForTask } from "@/domain/portfolio";
import { ISSUE_KIND_LABEL, TASK_CATEGORY_LABEL } from "@/domain/labels";
import { formatDate } from "@/domain/format";
import type { Issue, Project } from "@/domain/schema";
import { SectionCard } from "@/components/portfolio/section-card";
import { StatusBadge, Tag } from "@/components/portfolio/status-badge";
import { EmptyState } from "@/components/portfolio/empty-state";
import { ResourceRow } from "@/components/portfolio/resource-link";
import { ActiveItem, CompletedItem, OutstandingItem } from "@/components/portfolio/task-items";
import { DetailSkeleton } from "@/components/portfolio/skeletons";
import { ActivityList } from "@/components/portfolio/activity-list";

export async function generateStaticParams() {
  const { projects } = await getPortfolio();
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const project = (await getPortfolio()).projects.find((p) => p.slug === slug);
  return { title: project?.name ?? "Project not found", description: project?.summary };
}

export default function ProjectPage({ params }: PageProps<"/projects/[slug]">) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <ProjectDetail params={params} />
    </Suspense>
  );
}

async function ProjectDetail({ params }: { params: PageProps<"/projects/[slug]">["params"] }) {
  const { slug } = await params;
  const { projects } = await getPortfolio();
  const project = projects.find((p) => p.slug === slug);
  if (!project) notFound();
  const b = projectBreakdown(project);

  const sections = [
    { id: "overview", label: "Overview" },
    { id: "completed", label: "Completed", count: b.counts.completed },
    { id: "in-progress", label: "In progress", count: b.counts.inProgress },
    { id: "outstanding", label: "To be completed", count: b.counts.outstanding },
    { id: "issues", label: "Issues", count: b.counts.issues },
    { id: "resources", label: "Resources", count: b.counts.resources },
    { id: "timeline", label: "Timeline", count: b.counts.timeline },
  ];

  return (
    <article>
      <Link href="/projects" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft aria-hidden className="size-4" />
        All projects
      </Link>

      <header className="mt-4 rounded-xl border bg-card p-5 shadow-xs sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={project.status} />
          <Tag>{project.category}</Tag>
        </div>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-[26px]">{project.name}</h1>
        <p className="mt-2 max-w-3xl text-[15px] leading-relaxed text-muted-foreground">{project.summary}</p>
        <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {project.organisation ? (
            <div className="flex items-center gap-2">
              <Building2 aria-hidden className="size-4 text-muted-foreground" />
              <dt className="sr-only">Organisation</dt>
              <dd>{project.organisation}</dd>
            </div>
          ) : null}
          <div className="flex items-center gap-2">
            <CalendarCheck aria-hidden className="size-4 text-muted-foreground" />
            <dt className="text-muted-foreground">Last updated</dt>
            <dd className="font-medium">{formatDate(project.lastVerifiedAt)}</dd>
          </div>
        </dl>
        <div className="mt-5 rounded-lg bg-accent/60 px-4 py-3">
          <p className="text-xs font-semibold tracking-wide text-accent-foreground uppercase">Current position</p>
          <p className="mt-1 text-sm leading-relaxed text-foreground">{project.progressSummary}</p>
        </div>
        <p className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
          <FileSearch aria-hidden className="mt-px size-3.5 shrink-0" />
          {project.sourceNote}
        </p>
      </header>

      <nav aria-label="Project sections" className="sticky top-14 z-30 -mx-4 mt-4 overflow-x-auto border-b bg-background/95 px-4 py-2 backdrop-blur lg:top-0 lg:mx-0 lg:rounded-lg lg:border lg:px-2">
        <ul className="flex w-max gap-1">
          {sections.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[13px] font-medium whitespace-nowrap text-secondary-foreground hover:bg-muted hover:text-foreground"
              >
                {s.label}
                {s.count !== undefined ? <span className="tabular-nums text-muted-foreground">{s.count}</span> : null}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-4 flex flex-col gap-4">
        <SectionCard id="overview" title="Project overview">
          <OverviewBody project={project} />
        </SectionCard>

        <SectionCard id="completed" title="Completed work" count={b.counts.completed} description="Delivered work with the evidence it is based on.">
          {b.completed.length ? (
            <ul className="divide-y">
              {b.completed.map((t) => (
                <CompletedItem key={t.id} task={t} resources={resourcesForTask(project, t.id)} />
              ))}
            </ul>
          ) : (
            <EmptyState title="No completed work recorded yet" />
          )}
        </SectionCard>

        <SectionCard id="in-progress" title="Currently in progress" count={b.counts.inProgress} description="Active work, including anything blocked or awaiting approval.">
          {b.inProgress.length ? (
            <ul className="flex flex-col gap-3">
              {b.inProgress.map((t) => (
                <ActiveItem key={t.id} task={t} resources={resourcesForTask(project, t.id)} />
              ))}
            </ul>
          ) : (
            <EmptyState title="Nothing is in progress" />
          )}
        </SectionCard>

        <SectionCard id="outstanding" title="Yet to be completed" count={b.counts.outstanding} description="Planned work not yet started. Due dates appear only where documented.">
          {b.outstanding.length ? (
            <div className="flex flex-col gap-6">
              {b.outstanding.map((g) => (
                <div key={g.category}>
                  <h3 className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    {TASK_CATEGORY_LABEL[g.category]} <span className="tabular-nums">({g.tasks.length})</span>
                  </h3>
                  <ul className="divide-y rounded-lg border px-4 py-3">
                    {g.tasks.map((t) => (
                      <OutstandingItem key={t.id} task={t} />
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No outstanding work recorded" />
          )}
        </SectionCard>

        <SectionCard id="issues" title="Issues and dependencies" count={b.counts.issues} description="Blockers, pending decisions, approvals, external dependencies and known risks.">
          {b.openIssues.length ? (
            <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {b.openIssues.map((i) => (
                <IssueItem key={i.id} issue={i} />
              ))}
            </ul>
          ) : (
            <EmptyState title="No known blockers or dependencies" />
          )}
          {b.resolvedIssues.length ? (
            <div className="mt-6">
              <h3 className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Resolved</h3>
              <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {b.resolvedIssues.map((i) => (
                  <IssueItem key={i.id} issue={i} />
                ))}
              </ul>
            </div>
          ) : null}
        </SectionCard>

        <SectionCard id="resources" title="Resources and documents" count={b.counts.resources} description="Supporting documents, repositories and links. External links open in a new tab.">
          {project.resources.length ? (
            <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {project.resources.map((r) => (
                <li key={r.id}>
                  <ResourceRow resource={r} className="h-full" />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No resources linked yet" />
          )}
        </SectionCard>

        <SectionCard id="timeline" title="Activity timeline" count={b.counts.timeline} description="Dated updates, newest first.">
          {b.timeline.length ? (
            <ActivityList
              showProject={false}
              entries={b.timeline.map((u) => {
                const t = u.taskId ? project.tasks.find((x) => x.id === u.taskId) : undefined;
                return { ...u, project: { id: project.id, slug: project.slug, name: project.name }, task: t ? { id: t.id, title: t.title } : null };
              })}
            />
          ) : (
            <EmptyState title="No activity recorded yet" />
          )}
        </SectionCard>
      </div>
    </article>
  );
}

function OverviewBody({ project }: { project: Project }) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="space-y-5 text-sm leading-relaxed">
        <Block title="Description">{project.description}</Block>
        <Block title="Business objective">{project.businessObjective}</Block>
        <Block title="Background">{project.background}</Block>
      </div>
      <div className="space-y-5">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Team responsibilities</h3>
          <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
            {project.responsibilities.map((r) => (
              <li key={r} className="flex gap-2">
                <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-primary/60" />
                {r}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Stakeholders</h3>
          {project.stakeholders.length ? (
            <ul className="mt-2 divide-y rounded-lg border">
              {project.stakeholders.map((s) => (
                <li key={s.id} className="px-3.5 py-2.5 text-sm">
                  <p className="font-medium text-foreground">
                    {s.name}
                    {s.organisation ? <span className="font-normal text-muted-foreground"> · {s.organisation}</span> : null}
                  </p>
                  <p className="text-muted-foreground">{s.role}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">No stakeholders recorded.</p>
          )}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Current status</h3>
          <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <StatusBadge status={project.status} />
            <span>Last updated {formatDate(project.lastVerifiedAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-muted-foreground">{children}</p>
    </div>
  );
}

function IssueItem({ issue }: { issue: Issue }) {
  return (
    <li className="flex h-full flex-col rounded-lg border p-4" data-testid="issue-item">
      <div className="flex flex-wrap items-center gap-2">
        <Tag tone={issue.kind === "blocker" ? "accent" : "neutral"}>{ISSUE_KIND_LABEL[issue.kind]}</Tag>
        {issue.status === "resolved" ? <StatusBadge status="completed" /> : null}
      </div>
      <p className="mt-2 text-sm font-medium text-foreground">{issue.title}</p>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{issue.description}</p>
      <div className="mt-auto flex flex-wrap gap-x-4 gap-y-1 pt-3 text-xs text-muted-foreground">
        {issue.waitingOn ? (
          <span>
            Waiting on: <span className="font-medium text-foreground">{issue.waitingOn}</span>
          </span>
        ) : null}
        {issue.raisedOn ? <span>Raised {formatDate(issue.raisedOn)}</span> : null}
        {issue.resolvedOn ? <span>Resolved {formatDate(issue.resolvedOn)}</span> : null}
      </div>
    </li>
  );
}
