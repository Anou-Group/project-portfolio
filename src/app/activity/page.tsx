import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { History } from "lucide-react";
import { getPortfolio } from "@/server/portfolio";
import { allActivity, filterActivity, groupByMonth, parseActivityFilters } from "@/domain/portfolio";
import { ACTIVITY_CATEGORY_LABEL } from "@/domain/labels";
import { ACTIVITY_CATEGORIES } from "@/domain/schema";
import { formatMonth, plural } from "@/domain/format";
import { PageHeader } from "@/components/portfolio/page-header";
import { ActivityList } from "@/components/portfolio/activity-list";
import { EmptyState } from "@/components/portfolio/empty-state";
import { ChipLinks } from "@/components/portfolio/chip-links";
import { UrlDate, UrlSelect } from "@/components/portfolio/filter-controls";
import { FilterBarSkeleton, ListSkeleton } from "@/components/portfolio/skeletons";

export const metadata: Metadata = { title: "Activity & Updates" };

export default function ActivityPage({ searchParams }: PageProps<"/activity">) {
  return (
    <>
      <PageHeader title="Activity & Updates" description="What has changed over time across all projects, newest first. Filter by project, category or date." />
      <Suspense
        fallback={
          <>
            <FilterBarSkeleton />
            <ListSkeleton />
          </>
        }
      >
        <ActivityResults searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function ActivityResults({ searchParams }: { searchParams: PageProps<"/activity">["searchParams"] }) {
  const [{ projects }, sp] = await Promise.all([getPortfolio(), searchParams]);
  const filters = parseActivityFilters(sp);
  const all = allActivity(projects);
  const entries = filterActivity(all, filters);
  const groups = groupByMonth(entries);
  const current = { project: filters.project, category: filters.category, from: filters.from, to: filters.to };
  const filtered = Boolean(filters.project || filters.category || filters.from || filters.to);
  const categoryOptions = ACTIVITY_CATEGORIES.map((c) => ({
    value: c,
    label: ACTIVITY_CATEGORY_LABEL[c],
    count: filterActivity(all, { ...filters, category: c }).length,
  })).filter((o) => o.count > 0 || o.value === filters.category);

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <UrlSelect param="project" label="Project" allLabel="All projects" options={projects.map((p) => ({ value: p.slug, label: p.name }))} />
          <div className="grid grid-cols-2 gap-3 sm:flex">
            <UrlDate param="from" label="From" />
            <UrlDate param="to" label="To" />
          </div>
        </div>
        <ChipLinks label="Category" pathname="/activity" current={current} param="category" options={categoryOptions} />
      </div>

      <div className="mb-3 flex items-center justify-between gap-4 text-sm text-muted-foreground" aria-live="polite">
        <p>
          {plural(entries.length, "update")}
          {filtered ? ` of ${all.length}` : ""}
        </p>
        {filtered ? (
          <Link href="/activity" scroll={false} className="font-medium text-primary underline-offset-4 hover:underline">
            Clear filters
          </Link>
        ) : null}
      </div>

      {groups.length ? (
        <div className="flex flex-col gap-4">
          {groups.map((g) => (
            <section key={g.month} aria-labelledby={`m-${g.month}`} className="rounded-xl border bg-card p-5 shadow-xs">
              <h2 id={`m-${g.month}`} className="mb-4 text-sm font-semibold tracking-tight text-foreground">
                {formatMonth(g.month)} <span className="font-normal text-muted-foreground">· {plural(g.entries.length, "update")}</span>
              </h2>
              <ActivityList entries={g.entries} />
            </section>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={History}
          title="No updates match these filters"
          description="Try a different project, category or date range."
          action={
            <Link href="/activity" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
              Clear filters
            </Link>
          }
        />
      )}
    </>
  );
}
