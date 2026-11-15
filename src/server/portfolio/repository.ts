import "server-only";
import { createClient } from "@supabase/supabase-js";
import { portfolioSchema, type Portfolio } from "@/domain/schema";
import { readContentFiles } from "./content-source";
import { rowsToPortfolioInput, type PortfolioRows } from "./rows";

/**
 * Loads the published portfolio.
 *
 * - `supabase` (default, and always in production): reads with the anon key, so row-level
 *   security decides what is visible — only published rows.
 * - `content` (tests and local development): reads the content files and applies the same
 *   "published only" rule.
 */
export async function loadPortfolio(): Promise<Portfolio> {
  const source = process.env.PORTFOLIO_DATA_SOURCE === "content" ? "content" : "supabase";
  if (source === "content") {
    if (process.env.VERCEL_ENV === "production") throw new Error("The content-file data source is not allowed in production.");
    return publishedOnly(await loadFromContent());
  }
  return sortProjects(await loadFromSupabase());
}

async function loadFromContent(): Promise<Portfolio> {
  return portfolioSchema.parse(await readContentFiles());
}

async function loadFromSupabase(): Promise<Portfolio> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_ANON_KEY must be set.");
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  const select = async <T>(table: string, columns = "*"): Promise<T[]> => {
    const { data, error } = await db.from(table).select(columns);
    if (error) throw new Error(`Could not read ${table}: ${error.message}`);
    return (data ?? []) as T[];
  };

  const [profiles, projects, tasks, issues, updates, resources, stakeholders, taskHistory, projectHistory] = await Promise.all([
    select<NonNullable<PortfolioRows["profile"]>>("report_profile"),
    select<PortfolioRows["projects"][number]>("projects"),
    select<PortfolioRows["tasks"][number]>("tasks"),
    select<PortfolioRows["issues"][number]>("issues"),
    select<PortfolioRows["updates"][number]>("project_updates"),
    select<PortfolioRows["resources"][number]>("resources"),
    select<PortfolioRows["stakeholders"][number]>("stakeholders"),
    select<PortfolioRows["taskHistory"][number]>("task_status_history", "task_id, from_status, to_status, changed_at"),
    select<PortfolioRows["projectHistory"][number]>("project_status_history", "project_id, from_status, to_status, changed_at"),
  ]);

  const input = rowsToPortfolioInput({
    profile: profiles[0] ?? null,
    projects,
    tasks,
    issues,
    updates,
    resources,
    stakeholders,
    taskHistory,
    projectHistory,
  });
  if (!input.profile) throw new Error("The report profile has not been published.");
  return portfolioSchema.parse(input);
}

function publishedOnly(p: Portfolio): Portfolio {
  return sortProjects({
    profile: p.profile,
    projects: p.projects
      .filter((x) => x.isPublished)
      .map((x) => ({
        ...x,
        tasks: x.tasks.filter((t) => t.isPublished),
        issues: x.issues.filter((i) => i.isPublished),
        updates: x.updates.filter((u) => u.isPublished),
        resources: x.resources.filter((r) => r.isPublished),
        stakeholders: x.stakeholders.filter((s) => s.isPublished),
      })),
  });
}

function sortProjects(p: Portfolio): Portfolio {
  return { ...p, projects: [...p.projects].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)) };
}
