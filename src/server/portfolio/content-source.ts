import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

/** Reads the authored content files as raw JSON (validated by the caller). */
export async function readContentFiles(root = path.join(process.cwd(), "content")): Promise<{ profile: unknown; projects: unknown[] }> {
  const profile = JSON.parse(await readFile(path.join(root, "profile.json"), "utf8")) as unknown;
  const dir = path.join(root, "projects");
  const files = (await readdir(dir)).filter((f) => f.endsWith(".json")).sort();
  const projects = await Promise.all(files.map(async (f) => JSON.parse(await readFile(path.join(dir, f), "utf8")) as unknown));
  return { profile, projects };
}
