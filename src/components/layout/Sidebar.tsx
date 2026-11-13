"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";

import { useMotion } from "@/animations/use-motion";
import { gsap } from "@/animations/gsap";
import { EASE, DUR } from "@/animations/presets";
import { useSidebarToggle } from "@/components/layout/sidebar-toggle-context";
import { Logo } from "@/components/common/Logo";
import { Avatar } from "@/components/common/Avatar";
import { Tooltip } from "@/components/ui/tooltip";
import { DotBadge } from "@/components/ui/badge";
import type { SessionUser } from "@/shared/types/auth";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const SECTIONS: NavSection[] = [
  {
    title: "Overview",
    items: [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    title: "People",
    items: [
      { href: "/employees", label: "All Employees", icon: Users },
      { href: "/employees/new", label: "Add Employee", icon: UserPlus },
    ],
  },
];

/** Hides mutating entries (Add Employee) from viewers. */
function visibleSections(role: SessionUser["role"]): NavSection[] {
  if (role === "admin") return SECTIONS;
  return SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => item.href !== "/employees/new"),
  }));
}

export interface SidebarProps {
  user: SessionUser;
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/employees/new") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const { collapsed, toggle: onToggleCollapse } = useSidebarToggle();
  const ref = React.useRef<HTMLElement>(null);
  const indicatorRef = React.useRef<HTMLSpanElement>(null);

  // Mount stagger for nav items.
  useMotion(
    () => {
      const items = ref.current?.querySelectorAll("[data-anim='nav-item']");
      if (items && items.length > 0) {
        gsap.from(items, {
          autoAlpha: 0,
          x: -16,
          duration: DUR.base,
          ease: EASE.smooth,
          stagger: 0.05,
          clearProps: "transform",
        });
      }
    },
    { scope: ref },
  );

  // Width tween + label fade on collapse. Labels stay mounted and fade out
  // (then hide) rather than unmounting instantly.
  useMotion(
    () => {
      const el = ref.current;
      if (!el) return;

      gsap.to(el, {
        width: collapsed ? 76 : 264,
        duration: DUR.base,
        ease: EASE.smooth,
      });

      const labels = el.querySelectorAll("[data-anim='label']");
      if (labels.length === 0) return;

      if (collapsed) {
        gsap.to(labels, {
          autoAlpha: 0,
          duration: DUR.base * 0.75,
          ease: EASE.smooth,
          onComplete: () => gsap.set(labels, { display: "none" }),
        });
      } else {
        gsap.set(labels, { display: "" });
        gsap.to(labels, {
          autoAlpha: 1,
          duration: DUR.base,
          ease: EASE.smooth,
        });
      }
    },
    { scope: ref, dependencies: [collapsed] },
  );

  // Move the active indicator pill to the active link.
  React.useLayoutEffect(() => {
    const indicator = indicatorRef.current;
    if (!indicator) return;

    const activeEl = ref.current?.querySelector<HTMLElement>(
      "[data-active='true']",
    );
    if (!activeEl) {
      gsap.to(indicator, { autoAlpha: 0, duration: DUR.fast });
      return;
    }

    const container = activeEl.offsetParent as HTMLElement | null;
    if (!container) return;

    gsap.to(indicator, {
      autoAlpha: 1,
      top: activeEl.offsetTop,
      height: activeEl.offsetHeight,
      width: collapsed ? 40 : 196,
      duration: DUR.base,
      ease: EASE.smooth,
    });
  }, [pathname, collapsed]);

  return (
    <aside
      ref={ref}
      style={{ width: collapsed ? 76 : 264 }}
      className="fixed inset-y-0 left-0 z-30 hidden shrink-0 flex-col border-r border-border bg-surface lg:flex"
    >
      {/* Logo */}
      <div
        className={cn(
          "flex h-16 shrink-0 items-center gap-2.5 border-b border-border px-5",
          collapsed && "justify-center px-0",
        )}
      >
        <Logo size={28} withName={!collapsed} nameClassName="text-sm" />
      </div>

      {/* Navigation */}
      <nav
        aria-label="Primary"
        className="relative flex-1 overflow-y-auto overflow-x-hidden px-3 py-5 scrollbar-slim"
      >
        {/* Animated active indicator pill */}
        <span
          ref={indicatorRef}
          aria-hidden="true"
          className="pointer-events-none absolute left-3 rounded-input bg-primary-soft"
          style={{ top: 0, height: 40, width: collapsed ? 40 : 196 }}
        />

        {visibleSections(user.role).map((section) => (
          <div key={section.title} className="mb-5 last:mb-0">
            <p
              data-anim="label"
              className="caption mb-2 px-3 font-semibold uppercase tracking-wider text-muted-foreground"
            >
              {section.title}
            </p>
            <div
              className={cn(
                "mx-3 mb-2 h-px bg-border transition-opacity duration-300",
                collapsed ? "opacity-100" : "opacity-0",
              )}
            />

            <ul className="space-y-1">
              {section.items.map((item) => {
                const active = isActive(pathname, item.href);
                const Icon = item.icon;

                const link = (
                  <Link
                    key={item.href}
                    href={item.href}
                    data-anim="nav-item"
                    data-active={active}
                    aria-current={active ? "page" : undefined}
                    aria-label={collapsed ? item.label : undefined}
                    className={cn(
                      "relative flex h-10 items-center gap-3 rounded-input px-3 text-sm font-medium transition-colors duration-200",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      active
                        ? "text-primary"
                        : "text-muted-foreground hover:bg-surface-2 hover:text-foreground",
                      collapsed && "justify-center px-0",
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span
                      data-anim="label"
                      className="min-w-0 truncate"
                      aria-hidden={collapsed || undefined}
                    >
                      {item.label}
                    </span>
                  </Link>
                );

                return (
                  <li key={item.href}>
                    {collapsed ? (
                      <Tooltip label={item.label} side="right">
                        {link}
                      </Tooltip>
                    ) : (
                      link
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User card */}
      <div
        className={cn(
          "shrink-0 border-t border-border p-3",
          collapsed && "flex justify-center px-0",
        )}
      >
        <div
          className={cn(
            "flex items-center gap-3 rounded-input bg-surface-2 p-2.5",
            collapsed && "bg-transparent p-0",
          )}
        >
          <Avatar name={user.name} size="sm" />
          <div data-anim="label" className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              {user.name}
            </p>
            <DotBadge
              variant={user.role === "admin" ? "primary" : "muted"}
              className="mt-1 px-1.5 py-0 text-[11px] capitalize"
            >
              {user.role}
            </DotBadge>
          </div>
        </div>
      </div>

      {/* Collapse toggle */}
      <button
        type="button"
        onClick={onToggleCollapse}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className={cn(
          "absolute -right-3 top-20 hidden size-6 items-center justify-center rounded-full border border-border bg-surface text-muted-foreground shadow-card transition-colors hover:text-foreground lg:inline-flex",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        )}
      >
        {collapsed ? (
          <PanelLeft className="size-3.5" aria-hidden="true" />
        ) : (
          <PanelLeftClose className="size-3.5" aria-hidden="true" />
        )}
      </button>
    </aside>
  );
}
