import { getPortfolio } from "@/server/portfolio";
import { lastUpdated } from "@/domain/portfolio";
import { formatDate } from "@/domain/format";
import { NavLinks } from "./nav";
import { Brand } from "./brand";
import { MobileNav } from "./mobile-nav";
import { SearchBox } from "./search-box";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const portfolio = await getPortfolio();
  const updated = lastUpdated(portfolio.projects);
  const owner = portfolio.profile.ownerName;
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <div className="px-5 pt-6 pb-5">
          <Brand ownerName={owner} />
        </div>
        <div className="px-3 pb-3">
          <SearchBox id="sidebar-search" />
        </div>
        <nav aria-label="Main" className="flex-1 px-3">
          <NavLinks />
        </nav>
        <div className="border-t border-sidebar-border px-5 py-4 text-xs text-muted-foreground">
          <p>Reporting owner</p>
          <p className="font-medium text-foreground">{owner}</p>
          {updated ? <p className="mt-2">Last updated {formatDate(updated)}</p> : null}
        </div>
      </aside>
      <div className="min-w-0">
        <MobileNav ownerName={owner} search={<SearchBox id="mobile-search" />} />
        <main id="main" tabIndex={-1} className="mx-auto w-full max-w-[1152px] px-4 pt-6 pb-16 outline-none sm:px-6 lg:px-8 lg:pt-10">
          {children}
        </main>
      </div>
    </div>
  );
}
