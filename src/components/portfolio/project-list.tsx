import Link from "next/link";
import { SearchX } from "lucide-react";
import { getPortfolio } from "@/server/portfolio";
import { allActivity, parseProjectFilters, projectCategories, searchProjects } from "@/domain/portfolio";
import { PERIODS, inRange, periodRange, todayInMelbourne } from "@/domain/period";
import { formatRange } from "@/domain/format";
import { ActivityList } from "@/components/portfolio/activity-list";
import { STATUS_LABEL } from "@/domain/labels";
import { WORK_STATUSES } from "@/domain/schema";
import { plural } from "@/domain/format";
import { ProjectBoard } from "@/components/portfolio/board";
import { EmptyState } from "@/components/portfolio/empty-state";
import { ChipLinks } from "@/components/portfolio/chip-links";
import { UrlSearchInput } from "@/components/portfolio/filter-controls";

export async function ProjectList({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [{ projects }, sp] = await Promise.all([getPortfolio(), searchParams]);
  const filters = parseProjectFilters(sp);
  const results = searchProjects(projects, filters);
  const periodParam = typeof sp.period === "string" ? sp.period : null;
  const period = periodRange(periodParam, todayInMelbourne());
  const current = { q: filters.q || null, status: filters.status, category: filters.category, period: period?.key ?? null };
  const happened = period ? allActivity(results.map((r) => r.project)).filter((a) => inRange(a.occurredOn, period)) : [];
  const statusOptions = WORK_STATUSES.map((s) => ({ value: s, label: STATUS_LABEL[s], count: projects.filter((p) => p.status === s).length })).filter(
    (o) => o.count > 0 || o.value === filters.status,
  );
  const categoryOptions = projectCategories(projects).map((c) => ({ value: c, label: c, count: projects.filter((p) => p.category === c).length }));
  const filtered = Boolean(filters.q || filters.status || filters.category || period);

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-xs">
        <UrlSearchInput label="Search projects" placeholder="Search projects, tasks, issues…" />
        <div className="flex flex-col gap-4 md:flex-row md:gap-8">
          <ChipLinks label="Status" pathname="/" current={current} param="status" options={statusOptions} />
          <ChipLinks label="Category" pathname="/" current={current} param="category" options={categoryOptions} />
          <ChipLinks label="Period" pathname="/" current={current} param="period" options={PERIODS.map((p) => ({ value: p.value, label: p.label }))} allLabel="All time" />
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between gap-4 text-sm text-muted-foreground" aria-live="polite">
        <p>
          {plural(results.length, "project")}
          {filtered ? " match" + (results.length === 1 ? "es" : "") + " the filters" : ""}
        </p>
        {filtered ? (
          <Link href="/" scroll={false} className="font-medium text-primary underline-offset-4 hover:underline">
            Clear filters
          </Link>
        ) : null}
      </div>

      {results.length ? (
        <>
          <ProjectBoard rows={results} period={period} />
          {period ? (
            <section aria-labelledby="happened-heading" className="mt-10">
              <h2 id="happened-heading" className="text-lg font-semibold text-foreground">
                What happened · {period.label}
              </h2>
              <p className="mb-4 text-sm text-muted-foreground">{formatRange(period.from, period.to)}</p>
              {happened.length ? <ActivityList entries={happened} /> : <p className="text-sm text-muted-foreground">Nothing was recorded in this period.</p>}
            </section>
          ) : null}
        </>
      ) : (
        <EmptyState
          icon={SearchX}
          title="No projects match"
          description={filters.q ? `Nothing matches "${filters.q}" with the selected filters.` : "No projects have the selected status or category."}
          action={
            <Link href="/" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
              Clear filters
            </Link>
          }
        />
      )}
    </>
  );
}
