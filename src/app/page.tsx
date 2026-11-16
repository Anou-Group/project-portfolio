import Link from "next/link";
import { Suspense, type ComponentProps } from "react";
import { CalendarDays, Clock, UserRound } from "lucide-react";
import { getPortfolio } from "@/server/portfolio";
import { lastUpdated, portfolioMetrics, reportingPeriod } from "@/domain/portfolio";
import { formatDate, formatRange } from "@/domain/format";
import { PENDING_CONFIRMATION } from "@/domain/labels";
import { PageHeader } from "@/components/portfolio/page-header";
import { ProjectList } from "@/components/portfolio/project-list";
import { CardGridSkeleton, FilterBarSkeleton } from "@/components/portfolio/skeletons";

/** A tile links to a filtered list when it has somewhere to go; otherwise it is a plain box. */
function Wrapper({ href, children, ...rest }: { href: string | null } & Omit<ComponentProps<"div">, "ref">) {
  return href ? (
    <Link href={href} {...(rest as object)}>
      {children}
    </Link>
  ) : (
    <div {...rest}>{children}</div>
  );
}

export default async function OverviewPage({ searchParams }: PageProps<"/">) {
  const { profile, projects } = await getPortfolio();
  const metrics = portfolioMetrics(projects);
  const updated = lastUpdated(projects);
  const period = reportingPeriod(projects);

  const tiles = [
    { label: "Active projects", value: metrics.activeProjects, hint: "Not finished yet", href: "/" },
    { label: "Finished projects", value: metrics.completedProjects, hint: "Done and verified", href: "/?status=completed" },
    { label: "In progress", value: metrics.inProgressProjects, hint: "Work under way", href: "/?status=in_progress" },
    { label: "Waiting on others", value: metrics.needsAttention, hint: "Decisions and inputs needed", href: null },
  ];

  return (
    <>
      <PageHeader title="Project Portfolio" description="Every project at a glance: where it stands, how far along it is, and what is waiting on others.">
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
          <Wrapper
            key={t.label}
            href={t.href}
            className="group rounded-xl border bg-card p-4 shadow-xs transition-colors hover:border-primary/30 sm:p-5"
            data-testid="metric"
          >
            <p className="text-[13px] font-medium text-muted-foreground">{t.label}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums text-foreground">{t.value}</p>
            <p className="mt-1 text-xs text-muted-foreground group-hover:text-primary">{t.hint}</p>
          </Wrapper>
        ))}
      </section>

      <section aria-label="Projects" className="mt-8">
        <Suspense
          fallback={
            <>
              <FilterBarSkeleton />
              <CardGridSkeleton />
            </>
          }
        >
          <ProjectList searchParams={searchParams} />
        </Suspense>
      </section>
    </>
  );
}
