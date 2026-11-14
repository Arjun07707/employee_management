"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, UserPlus, Menu } from "lucide-react";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "@/components/common/Logo";
import { Avatar } from "@/components/common/Avatar";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import type { SessionUserDTO } from "@/shared/types/account";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/employees", label: "All Employees", icon: Users },
  { href: "/employees/new", label: "Add Employee", icon: UserPlus },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/employees/new") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Hides mutating entries (Add Employee) from viewers. */
function visibleItems(role: SessionUserDTO["role"]): NavItem[] {
  if (role === "admin") return NAV_ITEMS;
  return NAV_ITEMS.filter((item) => item.href !== "/employees/new");
}

export function MobileNav({ user }: { user: SessionUserDTO }) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Open navigation"
          className="inline-flex size-10 items-center justify-center rounded-input text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
        >
          <Menu className="size-5" strokeWidth={1.5} aria-hidden="true" />
        </button>
      </SheetTrigger>

      <SheetContent aria-label="Navigation">
        <div className="flex items-center gap-2.5">
          <Logo size={28} withName nameClassName="text-sm" />
        </div>

        <nav aria-label="Primary" className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {visibleItems(user.role).map((item, index) => {
              const active = isActive(pathname, item.href);
              const Icon = item.icon;

              return (
                <li
                  key={item.href}
                  style={{ animationDelay: `${index * 60}ms` }}
                  className="animate-slide-down"
                >
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex h-11 items-center gap-3 rounded-input px-3 text-sm font-medium transition-colors",
                      active
                        ? "bg-surface-2 text-foreground"
                        : "text-muted-foreground hover:bg-surface-2 hover:text-foreground",
                    )}
                  >
                    <Icon
                      className="size-4 shrink-0"
                      strokeWidth={1.5}
                      aria-hidden="true"
                    />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center justify-between gap-3 border-t border-border p-3">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar name={user.name} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {user.name}
              </p>
              <Badge
                variant={user.role === "admin" ? "default" : "muted"}
                className="mt-0.5 px-1.5 py-0 text-[11px] capitalize"
              >
                {user.role}
              </Badge>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </SheetContent>
    </Sheet>
  );
}
