"use client";

import { ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

/** A titled card whose body can be collapsed. Open by default. */
export function SectionCard({
  id,
  title,
  count,
  description,
  defaultOpen = true,
  children,
}: {
  id: string;
  title: string;
  count?: number;
  description?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="rounded-xl border bg-card shadow-xs">
      <Collapsible defaultOpen={defaultOpen}>
        <CollapsibleTrigger
          className={cn(
            "group flex w-full items-center gap-3 rounded-xl px-5 py-4 text-left transition-colors hover:bg-muted/50",
            "focus-visible:outline-2 focus-visible:outline-offset-[-2px]",
          )}
        >
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <h2 id={`${id}-title`} className="text-[15px] font-semibold tracking-tight text-foreground">
                {title}
              </h2>
              {count !== undefined ? (
                <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium tabular-nums text-secondary-foreground">{count}</span>
              ) : null}
            </span>
            {description ? <span className="mt-0.5 block text-sm text-muted-foreground">{description}</span> : null}
          </span>
          <ChevronDown aria-hidden className="size-4 shrink-0 text-muted-foreground transition-transform group-data-[panel-open]:rotate-180" />
          <span className="sr-only">Show or hide {title}</span>
        </CollapsibleTrigger>
        <CollapsibleContent className="border-t px-5 py-5">{children}</CollapsibleContent>
      </Collapsible>
    </section>
  );
}
