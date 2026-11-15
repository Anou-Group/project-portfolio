import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { SearchX } from "lucide-react";
import { getPortfolio } from "@/server/portfolio";
import { parseProjectFilters, projectCategories, searchProjects } from "@/domain/portfolio";
import { STATUS_LABEL } from "@/domain/labels";
import { WORK_STATUSES } from "@/domain/schema";
import { plural } from "@/domain/format";
import { PageHeader } from "@/components/portfolio/page-header";
import { ProjectCard } from "@/components/portfolio/project-card";
import { EmptyState } from "@/components/portfolio/empty-state";
import { ChipLinks } from "@/components/portfolio/chip-links";
import { UrlSearchInput } from "@/components/portfolio/filter-controls";
import { CardGridSkeleton, FilterBarSkeleton } from "@/components/portfolio/skeletons";

export const metadata: Metadata = { title: "All Projects" };

export default function ProjectsPage({ searchParams }: PageProps<"/projects">) {
  return (
    <>
      <PageHeader title="All Projects" description="Every project with its status, my responsibility and current position. Search covers project details, tasks, issues and resources." />
      <Suspense
        fallback={
          <>
            <FilterBarSkeleton />
            <CardGridSkeleton />
          </>
        }
      >
        <ProjectResults searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function ProjectResults({ searchParams }: { searchParams: PageProps<"/projects">["searchParams"] }) {
  const [{ projects }, sp] = await Promise.all([getPortfolio(), searchParams]);
  const filters = parseProjectFilters(sp);
  const results = searchProjects(projects, filters);
  const current = { q: filters.q || null, status: filters.status, category: filters.category };
  const statusOptions = WORK_STATUSES.map((s) => ({ value: s, label: STATUS_LABEL[s], count: projects.filter((p) => p.status === s).length })).filter(
    (o) => o.count > 0 || o.value === filters.status,
  );
  const categoryOptions = projectCategories(projects).map((c) => ({ value: c, label: c, count: projects.filter((p) => p.category === c).length }));
  const filtered = Boolean(filters.q || filters.status || filters.category);

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-xs">
        <UrlSearchInput label="Search projects" placeholder="Search projects, tasks, issues…" />
        <div className="flex flex-col gap-4 md:flex-row md:gap-8">
          <ChipLinks label="Status" pathname="/projects" current={current} param="status" options={statusOptions} />
          <ChipLinks label="Category" pathname="/projects" current={current} param="category" options={categoryOptions} />
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between gap-4 text-sm text-muted-foreground" aria-live="polite">
        <p>
          {plural(results.length, "project")}
          {filtered ? " match" + (results.length === 1 ? "es" : "") + " the filters" : ""}
        </p>
        {filtered ? (
          <Link href="/projects" scroll={false} className="font-medium text-primary underline-offset-4 hover:underline">
            Clear filters
          </Link>
        ) : null}
      </div>

      {results.length ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {results.map((r) => (
            <ProjectCard key={r.project.id} project={r.project} matches={r.matches} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={SearchX}
          title="No projects match"
          description={filters.q ? `Nothing matches "${filters.q}" with the selected filters.` : "No projects have the selected status or category."}
          action={
            <Link href="/projects" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
              Clear filters
            </Link>
          }
        />
      )}
    </>
  );
}
