"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

/** Replace one URL parameter (or remove it when empty), keeping the others. */
function useSetParam() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const set = (key: string, value: string | null) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    const qs = next.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  };
  return { set, pending, params };
}

/** Search box that filters as you type (debounced) and keeps the query in the URL. */
export function UrlSearchInput({ param = "q", label, placeholder }: { param?: string; label: string; placeholder: string }) {
  const { set, params, pending } = useSetParam();
  const [value, setValue] = useState(params.get(param) ?? "");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const urlValue = params.get(param) ?? "";
  const lastUrlValue = useRef(urlValue);

  // Follow the URL when it changes from elsewhere (e.g. the sidebar search or Clear filters).
  useEffect(() => {
    if (urlValue !== lastUrlValue.current) {
      lastUrlValue.current = urlValue;
      setValue(urlValue);
    }
  }, [urlValue]);

  const update = (v: string) => {
    setValue(v);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      lastUrlValue.current = v.trim();
      set(param, v.trim() || null);
    }, 250);
  };

  return (
    <div className="relative w-full sm:max-w-sm">
      <label htmlFor={`filter-${param}`} className="sr-only">
        {label}
      </label>
      <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        id={`filter-${param}`}
        type="search"
        value={value}
        onChange={(e) => update(e.target.value)}
        placeholder={placeholder}
        maxLength={100}
        autoComplete="off"
        aria-busy={pending}
        className="h-10 w-full rounded-lg border border-input bg-card pr-9 pl-9 text-sm placeholder:text-muted-foreground focus-visible:border-ring [&::-webkit-search-cancel-button]:hidden"
      />
      {value ? (
        <button
          type="button"
          onClick={() => update("")}
          className="absolute top-1/2 right-1.5 grid size-7 -translate-y-1/2 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Clear search"
        >
          <X aria-hidden className="size-4" />
        </button>
      ) : null}
    </div>
  );
}

/** A native select bound to a URL parameter. */
export function UrlSelect({
  param,
  label,
  options,
  allLabel,
}: {
  param: string;
  label: string;
  options: { value: string; label: string }[];
  allLabel: string;
}) {
  const { set, params } = useSetParam();
  const value = params.get(param) ?? "";
  return (
    <label className="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">
      {label}
      <select
        value={value}
        onChange={(e) => set(param, e.target.value || null)}
        className={cn(
          "h-10 min-w-[12rem] rounded-lg border border-input bg-card px-3 text-sm text-foreground focus-visible:border-ring",
          value && "border-primary/40 bg-accent/50",
        )}
      >
        <option value="">{allLabel}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/** A date input bound to a URL parameter. */
export function UrlDate({ param, label }: { param: string; label: string }) {
  const { set, params } = useSetParam();
  const value = params.get(param) ?? "";
  return (
    <label className="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">
      {label}
      <input
        type="date"
        value={value}
        onChange={(e) => set(param, e.target.value || null)}
        className={cn(
          "h-10 rounded-lg border border-input bg-card px-3 text-sm text-foreground focus-visible:border-ring",
          value && "border-primary/40 bg-accent/50",
        )}
      />
    </label>
  );
}
