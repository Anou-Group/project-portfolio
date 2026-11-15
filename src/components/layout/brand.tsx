import Link from "next/link";

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

export function Brand({ ownerName }: { ownerName: string }) {
  return (
    <Link href="/" className="flex items-center gap-3 rounded-lg">
      <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-[13px] font-semibold tracking-wide text-primary-foreground">
        {initials(ownerName)}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold tracking-tight text-foreground">Project Portfolio</span>
        <span className="block truncate text-xs text-muted-foreground">{ownerName}</span>
      </span>
    </Link>
  );
}
