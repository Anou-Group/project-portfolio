import type { Metadata } from "next";
import { getPortfolio } from "@/server/portfolio";
import { lastUpdated, reportingPeriod } from "@/domain/portfolio";
import { formatDate, formatRange } from "@/domain/format";
import { ACTIVITY_CATEGORY_LABEL, ISSUE_KIND_LABEL, ISSUE_KIND_ORDER, PENDING_CONFIRMATION, STATUS_DESCRIPTION } from "@/domain/labels";
import { ACTIVITY_CATEGORIES, WORK_STATUSES } from "@/domain/schema";
import { PageHeader } from "@/components/portfolio/page-header";
import { StatusBadge, Tag } from "@/components/portfolio/status-badge";

export const metadata: Metadata = { title: "About this report" };

export default async function AboutPage() {
  const { profile, projects } = await getPortfolio();
  const updated = lastUpdated(projects);
  const period = reportingPeriod(projects);

  return (
    <>
      <PageHeader title="About this report" description={profile.reportPurpose} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Reporting information">
          <dl className="divide-y text-sm">
            <Row label="Reporting owner" value={profile.ownerName} />
            <Row label="Role" value={profile.ownerRole ?? PENDING_CONFIRMATION} />
            <Row label="Organisation" value={profile.organisation ?? PENDING_CONFIRMATION} />
            <Row label="Last updated" value={updated ? formatDate(updated) : PENDING_CONFIRMATION} />
            <Row label="Activity recorded" value={period ? formatRange(period.from, period.to) : PENDING_CONFIRMATION} />
            <Row label="Projects reported" value={String(projects.length)} />
          </dl>
        </Card>

        <Card title="How information is verified">
          <ul className="space-y-2.5 text-sm leading-relaxed text-muted-foreground">
            <li>Progress is taken from project records: GitHub repositories and pull requests, project trackers and decision logs in Notion, and the project plans kept with each codebase.</li>
            <li>Work is marked Completed only when there is evidence for it, and each completed item states where that evidence is.</li>
            <li>Built, tested, deployed and approved are reported separately. Work merged to a preview environment is not described as live.</li>
            <li>Anything that has not been confirmed is shown as &ldquo;{PENDING_CONFIRMATION}&rdquo;. Dates, figures and links are included only where a source provides them.</li>
            <li>Decisions and inputs owned by other people are listed under Issues and dependencies, with who they are waiting on.</li>
            <li>History is kept: when a status changes, the earlier status and the date of the change are retained.</li>
          </ul>
        </Card>

        <Card title="Status definitions">
          <ul className="space-y-3">
            {WORK_STATUSES.map((s) => (
              <li key={s} className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:gap-3">
                <StatusBadge status={s} className="w-fit sm:w-40 sm:justify-start" />
                <span className="text-sm text-muted-foreground">{STATUS_DESCRIPTION[s]}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Categories used">
          <p className="text-sm font-medium text-foreground">Activity</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {ACTIVITY_CATEGORIES.map((c) => (
              <Tag key={c}>{ACTIVITY_CATEGORY_LABEL[c]}</Tag>
            ))}
          </div>
          <p className="mt-5 text-sm font-medium text-foreground">Issues and dependencies</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {ISSUE_KIND_ORDER.map((k) => (
              <Tag key={k}>{ISSUE_KIND_LABEL[k]}</Tag>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border bg-card p-5 shadow-xs">
      <h2 className="mb-4 text-[15px] font-semibold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium text-foreground">{value}</dd>
    </div>
  );
}
