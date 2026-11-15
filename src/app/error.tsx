"use client";

import { RefreshCw } from "lucide-react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto mt-10 max-w-md rounded-xl border bg-card p-8 text-center shadow-xs" role="alert">
      <h1 className="text-lg font-semibold tracking-tight">This page didn&rsquo;t load</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">The report data could not be loaded right now. Please try again in a moment.</p>
      {error.digest ? <p className="mt-3 font-mono text-xs text-muted-foreground">Reference: {error.digest}</p> : null}
      <button
        type="button"
        onClick={reset}
        className="mt-5 inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        <RefreshCw aria-hidden className="size-4" />
        Try again
      </button>
    </div>
  );
}
