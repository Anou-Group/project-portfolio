/**
 * npm run content:publish
 * Validates content/ and upserts it into Supabase with the service role key.
 * It never deletes: records missing from content are reported, not removed.
 * Run only on a trusted machine (needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local).
 */
import { createClient } from "@supabase/supabase-js";
import { readContentFiles } from "../src/server/portfolio/content-source";
import { validateContent } from "../src/domain/validation";
import { profileToRow, projectToRows } from "../src/server/portfolio/rows";
import { melbourneToday } from "./content-check";

async function main() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local (never commit them).");

  const report = validateContent(await readContentFiles(), melbourneToday());
  if (!report.portfolio || report.errors.length > 0) {
    for (const e of report.errors) console.log(`✗ ${e.path} [${e.rule}] ${e.message}`);
    throw new Error("Content has errors. Run npm run content:check and fix them before publishing.");
  }
  if (report.warnings.length) console.log(`${report.warnings.length} warnings — make sure each has been read (npm run content:check).`);

  const db = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const upsert = async (table: string, rows: object[]) => {
    if (rows.length === 0) return;
    const { error } = await db.from(table).upsert(rows, { onConflict: "id" });
    if (error) throw new Error(`Upsert into ${table} failed: ${error.message}`);
    console.log(`  ${table}: ${rows.length} upserted`);
  };

  const all = report.portfolio.projects.map(projectToRows);
  await upsert("report_profile", [profileToRow(report.portfolio.profile)]);
  await upsert("projects", all.map((r) => r.project));
  await upsert("tasks", all.flatMap((r) => r.tasks));
  await upsert("issues", all.flatMap((r) => r.issues));
  await upsert("project_updates", all.flatMap((r) => r.updates));
  await upsert("resources", all.flatMap((r) => r.resources));
  await upsert("stakeholders", all.flatMap((r) => r.stakeholders));

  // Records in the database that are no longer in content are left untouched (history is never deleted).
  const tables: [string, string[]][] = [
    ["projects", all.map((r) => r.project.id)],
    ["tasks", all.flatMap((r) => r.tasks.map((t) => t.id))],
    ["issues", all.flatMap((r) => r.issues.map((t) => t.id))],
    ["project_updates", all.flatMap((r) => r.updates.map((t) => t.id))],
    ["resources", all.flatMap((r) => r.resources.map((t) => t.id))],
    ["stakeholders", all.flatMap((r) => r.stakeholders.map((t) => t.id))],
  ];
  for (const [table, ids] of tables) {
    const { data, error } = await db.from(table).select("id, is_published");
    if (error) throw new Error(`Could not read ${table}: ${error.message}`);
    const extra = (data ?? []).filter((r: { id: string; is_published: boolean }) => !ids.includes(r.id) && r.is_published);
    for (const r of extra) console.log(`  ! ${table}.${r.id} is published in the database but missing from content. Not deleted — add it back with isPublished: false to hide it.`);
  }
  console.log("Published. The site shows the changes within a few minutes.");
}

main().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
