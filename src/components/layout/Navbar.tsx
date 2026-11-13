"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";

import { useMotion } from "@/animations/use-motion";
import { gsap } from "@/animations/gsap";
import { EASE, DUR } from "@/animations/presets";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { MobileNav } from "@/components/layout/MobileNav";
import { UserMenu } from "@/components/layout/UserMenu";
import type { SessionUser } from "@/shared/types/auth";
import { cn } from "@/lib/utils";

const TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/employees": "All Employees",
  "/employees/new": "Add Employee",
};

function titleForPath(pathname: string): string {
  if (TITLES[pathname]) return TITLES[pathname]!;
  if (pathname.startsWith("/employees/") && pathname.endsWith("/edit")) {
    return "Edit Employee";
  }
  if (pathname.startsWith("/employees/")) return "Employee Details";
  return "Dashboard";
}

function breadcrumbForPath(pathname: string): string[] {
  const title = titleForPath(pathname);
  if (pathname === "/dashboard") return ["Overview", title];
  if (pathname.startsWith("/employees")) return ["People", title];
  return [title];
}

export function Navbar({ user }: { user: SessionUser }) {
  const pathname = usePathname();
  const ref = React.useRef<HTMLElement>(null);
  const [scrolled, setScrolled] = React.useState(false);

  // Passive scroll listener -> shadow + border fade in after 8px.
  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Shadow tween driven by the scrolled state.
  useMotion(
    () => {
      const el = ref.current;
      if (!el) return;
      gsap.to(el, {
        boxShadow: scrolled
          ? "0 8px 24px -12px rgba(15,21,48,0.18)"
          : "0 0px 0px 0px rgba(15,21,48,0)",
        duration: DUR.fast,
        ease: EASE.snappy,
      });
    },
    { scope: ref, dependencies: [scrolled] },
  );

  const crumbs = breadcrumbForPath(pathname);

  return (
    <header
      ref={ref}
      className={cn(
        "sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-surface/80 px-4 backdrop-blur-md transition-colors sm:px-6",
        scrolled ? "border-border" : "border-transparent",
      )}
    >
      <div className="lg:hidden">
        <MobileNav user={user} />
      </div>

      <div className="min-w-0 flex-1">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5">
          {crumbs.map((crumb, index) => (
            <React.Fragment key={crumb}>
              {index > 0 ? (
                <span aria-hidden="true" className="text-muted-foreground/50">
                  /
                </span>
              ) : null}
              <span
                className={cn(
                  "truncate",
                  index === crumbs.length - 1
                    ? "text-sm font-semibold text-foreground"
                    : "text-sm text-muted-foreground",
                )}
              >
                {crumb}
              </span>
            </React.Fragment>
          ))}
        </nav>
        <p className="caption hidden text-muted-foreground sm:block">
          {titleForPath(pathname)}
        </p>
      </div>

      {/* Search hint ("/" focuses the search on the employees page) */}
      <div className="hidden items-center gap-2 rounded-input border border-border bg-surface-2 px-3 py-1.5 text-muted-foreground md:flex">
        <Search className="size-3.5" aria-hidden="true" />
        <span className="caption">Press</span>
        <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[11px]">
          /
        </kbd>
        <span className="caption">to search</span>
      </div>

      <ThemeToggle />
      <UserMenu user={user} />
    </header>
  );
}
