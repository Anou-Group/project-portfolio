"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, FolderKanban, Info, LayoutDashboard, Library, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export const NAV_ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/projects", label: "All Projects", icon: FolderKanban },
  { href: "/activity", label: "Activity & Updates", icon: Activity },
  { href: "/resources", label: "Resources", icon: Library },
  { href: "/about", label: "About", icon: Info },
];

export function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <ul className="flex flex-col gap-0.5">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <li key={href}>
            <Link
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-10 items-center gap-3 rounded-lg px-3 text-sm transition-colors",
                active
                  ? "bg-accent font-semibold text-accent-foreground"
                  : "font-medium text-sidebar-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon aria-hidden className={cn("size-[18px] shrink-0", active ? "text-primary" : "text-muted-foreground")} strokeWidth={1.9} />
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
