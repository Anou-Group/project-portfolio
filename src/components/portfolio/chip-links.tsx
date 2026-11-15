import Link from "next/link";
import { cn } from "@/lib/utils";

type Params = Record<string, string | null>;

export function hrefWith(pathname: string, current: Params, key: string, value: string | null): string {
  const next = new URLSearchParams();
  for (const [k, v] of Object.entries(current)) if (v && k !== key) next.set(k, v);
  if (value) next.set(key, value);
  const qs = next.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

/** A row of filter chips that are plain links (shareable URLs, back button works). */
export function ChipLinks({
  label,
  pathname,
  current,
  param,
  options,
  allLabel = "All",
}: {
  label: string;
  pathname: string;
  current: Params;
  param: string;
  options: { value: string; label: string; count?: number }[];
  allLabel?: string;
}) {
  const selected = current[param] ?? null;
  const chip = (value: string | null, text: string, count?: number) => {
    const active = selected === value;
    return (
      <li key={value ?? "all"}>
        <Link
          href={hrefWith(pathname, current, param, value)}
          scroll={false}
          aria-current={active ? "true" : undefined}
          className={cn(
            "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium whitespace-nowrap transition-colors",
            active
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-secondary-foreground hover:border-primary/40 hover:text-foreground",
          )}
        >
          {text}
          {count !== undefined ? <span className={cn("tabular-nums", active ? "text-primary-foreground/80" : "text-muted-foreground")}>{count}</span> : null}
        </Link>
      </li>
    );
  };
  return (
    <div className="min-w-0">
      <p className="mb-1.5 text-xs font-medium text-muted-foreground">{label}</p>
      <ul className="flex flex-wrap gap-1.5" aria-label={label}>
        {chip(null, allLabel)}
        {options.map((o) => chip(o.value, o.label, o.count))}
      </ul>
    </div>
  );
}
