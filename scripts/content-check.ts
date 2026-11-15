/**
 * npm run content:check
 * Validates content/ before it is published. Exit code 1 if there are errors.
 */
import { readContentFiles } from "../src/server/portfolio/content-source";
import { validateContent } from "../src/domain/validation";

export function melbourneToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Melbourne" }).format(new Date());
}

async function main() {
  const input = await readContentFiles();
  const report = validateContent(input, melbourneToday());
  for (const e of report.errors) console.log(`✗ ERROR   ${e.path}  [${e.rule}] ${e.message}${e.excerpt ? `\n          "${e.excerpt}"` : ""}`);
  for (const w of report.warnings) console.log(`! WARNING ${w.path}  [${w.rule}] ${w.message}${w.excerpt ? `\n          "${w.excerpt}"` : ""}`);
  const p = report.portfolio;
  if (p) {
    const projects = p.projects;
    const count = (f: (x: (typeof projects)[number]) => number) => projects.reduce((n, x) => n + f(x), 0);
    console.log(
      `\n${p.projects.length} projects · ${count((x) => x.tasks.length)} tasks · ${count((x) => x.issues.length)} issues · ` +
        `${count((x) => x.updates.length)} activity entries · ${count((x) => x.resources.length)} resources`,
    );
  }
  console.log(`${report.errors.length} errors, ${report.warnings.length} warnings (warnings need a human read; see .claude/rules/reporting-standards.md)`);
  if (report.errors.length > 0) process.exit(1);
}

if (process.argv[1]?.endsWith("content-check.ts")) {
  main().catch((e: unknown) => {
    console.error(e);
    process.exit(1);
  });
}
