"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { NavLinks } from "./nav";
import { Brand } from "./brand";

/** Below the desktop breakpoint: a top bar with a menu button that opens the same navigation. */
export function MobileNav({ ownerName, search }: { ownerName: string; search: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b bg-card/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-card/80 lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          aria-label="Open navigation menu"
          className="-ml-2 grid size-10 place-items-center rounded-lg text-foreground hover:bg-muted"
        >
          <Menu aria-hidden className="size-5" />
        </SheetTrigger>
        <SheetContent side="left" className="w-[18rem] gap-0 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SheetDescription className="sr-only">Pages of the project portfolio</SheetDescription>
          <div className="border-b px-4 py-4">
            <Brand ownerName={ownerName} />
          </div>
          <div className="px-3 py-3">{search}</div>
          <nav aria-label="Main" className="px-3">
            <NavLinks onNavigate={() => setOpen(false)} />
          </nav>
        </SheetContent>
      </Sheet>
      <Link href="/" className="text-sm font-semibold tracking-tight">
        Project Portfolio
      </Link>
    </header>
  );
}
