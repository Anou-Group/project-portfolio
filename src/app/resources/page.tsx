import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Library } from "lucide-react";
import { getPortfolio } from "@/server/portfolio";
import { allResources } from "@/domain/portfolio";
import { RESOURCE_TYPE_LABEL } from "@/domain/labels";
import { RESOURCE_TYPES, type ResourceType } from "@/domain/schema";
import { plural } from "@/domain/format";
import { PageHeader } from "@/components/portfolio/page-header";
import { EmptyState } from "@/components/portfolio/empty-state";
import { ResourceRow } from "@/components/portfolio/resource-link";
import { ChipLinks } from "@/components/portfolio/chip-links";
import { UrlSelect } from "@/components/portfolio/filter-controls";
import { FilterBarSkeleton, ListSkeleton } from "@/components/portfolio/skeletons";

export const metadata: Metadata = { title: "Resources" };

export default function ResourcesPage({ searchParams }: PageProps<"/resources">) {
  return (
    <>
      <PageHeader
        title="Resources"
        description="Supporting documents, repositories, designs and links for every project. Links open in a new tab; some require access to the source system."
      />
      <Suspense
        fallback={
          <>
            <FilterBarSkeleton />
            <ListSkeleton />
          </>
        }
      >
        <ResourceResults searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function ResourceResults({ searchParams }: { searchParams: PageProps<"/resources">["searchParams"] }) {
  const [{ projects }, sp] = await Promise.all([getPortfolio(), searchParams]);
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const projectParam = projects.some((p) => p.slug === first(sp.project)) ? first(sp.project) : null;
  const typeParam = (RESOURCE_TYPES as readonly string[]).includes(first(sp.type)) ? (first(sp.type) as ResourceType) : null;

  const all = allResources(projects);
  const inProject = all.filter((r) => !projectParam || r.project.slug === projectParam);
  const shown = inProject.filter((r) => !typeParam || r.type === typeParam);
  const typeOptions = RESOURCE_TYPES.map((t) => ({ value: t, label: RESOURCE_TYPE_LABEL[t], count: inProject.filter((r) => r.type === t).length })).filter(
    (o) => o.count > 0 || o.value === typeParam,
  );
  const grouped = projects
    .map((p) => ({ project: p, resources: shown.filter((r) => r.project.id === p.id) }))
    .filter((g) => g.resources.length > 0);
  const filtered = Boolean(projectParam || typeParam);

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-xs">
        <UrlSelect param="project" label="Project" allLabel="All projects" options={projects.map((p) => ({ value: p.slug, label: p.name }))} />
        <ChipLinks label="Type" pathname="/resources" current={{ project: projectParam, type: typeParam }} param="type" options={typeOptions} />
      </div>

      <div className="mb-3 flex items-center justify-between gap-4 text-sm text-muted-foreground" aria-live="polite">
        <p>{plural(shown.length, "resource")}</p>
        {filtered ? (
          <Link href="/resources" scroll={false} className="font-medium text-primary underline-offset-4 hover:underline">
            Clear filters
          </Link>
        ) : null}
      </div>

      {grouped.length ? (
        <div className="flex flex-col gap-8">
          {grouped.map((g) => (
            <section key={g.project.id} aria-labelledby={`res-${g.project.slug}`}>
              <div className="mb-3 flex items-baseline justify-between gap-4">
                <h2 id={`res-${g.project.slug}`} className="text-base font-semibold tracking-tight">
                  {g.project.name}
                </h2>
                <Link href={`/projects/${g.project.slug}#resources`} className="shrink-0 text-sm font-medium text-primary underline-offset-4 hover:underline">
                  Project details
                </Link>
              </div>
              <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {g.resources.map((r) => (
                  <li key={r.id}>
                    <ResourceRow resource={r} className="h-full" />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <EmptyState icon={Library} title="No resources match these filters" />
      )}
    </>
  );
}
