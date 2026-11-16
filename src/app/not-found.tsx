import Link from "next/link";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="mx-auto mt-10 max-w-md rounded-xl border bg-card p-8 text-center shadow-xs">
      <FileQuestion aria-hidden className="mx-auto size-6 text-muted-foreground" />
      <h1 className="mt-3 text-lg font-semibold tracking-tight">Page not found</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">This page or project does not exist, or it is no longer part of the report.</p>
      <div className="mt-5 flex justify-center gap-3">
        <Link href="/" className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          All projects
        </Link>
        <Link href="/" className="inline-flex h-9 items-center rounded-lg border px-4 text-sm font-medium hover:bg-muted">
          Overview
        </Link>
      </div>
    </div>
  );
}
