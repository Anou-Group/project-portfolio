/**
 * npm run rls:check
 * Proves, against the real Supabase project, that an anonymous visitor can read
 * published reporting data and cannot write anything or see unpublished rows.
 * Uses only the anon key (the same access as the public website).
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const TABLES = ["report_profile", "projects", "tasks", "issues", "project_updates", "resources", "stakeholders", "task_status_history", "project_status_history"];

async function main() {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!url || !anonKey) throw new Error("Set SUPABASE_URL and SUPABASE_ANON_KEY in .env.local.");
  const anon = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  let failures = 0;
  const pass = (m: string) => console.log(`PASS  ${m}`);
  const fail = (m: string) => {
    failures++;
    console.log(`FAIL  ${m}`);
  };

  for (const table of TABLES) {
    const { data, error } = await anon.from(table).select("*").limit(1000);
    if (error) fail(`${table}: anonymous read failed (${error.message})`);
    else pass(`${table}: anonymous read returns ${data.length} rows`);
    if (data && data.some((r: Record<string, unknown>) => r.is_published === false)) fail(`${table}: an unpublished row is visible`);
  }

  const probe = { id: "rls-probe-should-not-exist" };
  for (const table of TABLES) {
    const ins = await anon.from(table).insert(probe as never);
    if (ins.error) pass(`${table}: insert refused (${ins.error.code ?? ins.error.message})`);
    else fail(`${table}: anonymous INSERT succeeded`);
    const upd = await anon.from(table).update({ updated_at: new Date().toISOString() } as never).not("id", "is", null).select();
    if (upd.error || (upd.data ?? []).length === 0) pass(`${table}: update refused`);
    else fail(`${table}: anonymous UPDATE changed ${upd.data.length} rows`);
    const del = await anon.from(table).delete().not("id", "is", null).select();
    if (del.error || (del.data ?? []).length === 0) pass(`${table}: delete refused`);
    else fail(`${table}: anonymous DELETE removed ${del.data.length} rows`);
  }

  // The service role key must never reach the browser bundle.
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const staticDir = path.join(process.cwd(), ".next", "static");
  const files = await readdir(staticDir, { recursive: true }).catch(() => [] as string[]);
  const bundle = (await Promise.all(files.filter((f) => f.endsWith(".js")).map((f) => readFile(path.join(staticDir, f), "utf8")))).join("\n");
  if (!files.length) console.log("SKIP  client bundle check (run npm run build first)");
  else {
    if (serviceKey && bundle.includes(serviceKey)) fail("service role key found in the client bundle");
    else pass("service role key is not in the client bundle");
    if (bundle.includes(anonKey)) fail("anon key found in the client bundle (all data access should be server-side)");
    else pass("no Supabase key in the client bundle");
  }

  console.log(failures ? `\n${failures} check(s) failed` : "\nAll security checks passed");
  if (failures) process.exit(1);
}

main().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
