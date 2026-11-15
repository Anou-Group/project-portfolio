import Form from "next/form";
import { Search } from "lucide-react";

/** Searches across projects; submits to All Projects with ?q= (works without JavaScript). */
export function SearchBox({ id = "global-search" }: { id?: string }) {
  return (
    <Form action="/projects" role="search" className="relative">
      <label htmlFor={id} className="sr-only">
        Search projects
      </label>
      <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        id={id}
        name="q"
        type="search"
        placeholder="Search projects"
        autoComplete="off"
        maxLength={100}
        className="h-10 w-full rounded-lg border border-input bg-card pr-3 pl-9 text-sm placeholder:text-muted-foreground focus-visible:border-ring"
      />
    </Form>
  );
}
