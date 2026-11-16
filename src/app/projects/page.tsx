import { redirect } from "next/navigation";

/** Old address: the project list now lives on the home page. Search and filters carry over. */
export default async function ProjectsPage({ searchParams }: PageProps<"/projects">) {
  const sp = await searchParams;
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) for (const x of Array.isArray(v) ? v : v ? [v] : []) qs.append(k, x);
  redirect(qs.size ? `/?${qs}` : "/");
}
