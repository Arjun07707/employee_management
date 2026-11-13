"use client";

import * as React from "react";

interface SidebarToggleContextValue {
  collapsed: boolean;
  toggle: () => void;
}

const SidebarToggleContext =
  React.createContext<SidebarToggleContextValue | null>(null);

/**
 * Shared state for the desktop sidebar collapse. It also publishes the width
 * as a CSS variable so the content area can pad itself without a JS layout.
 */
export function SidebarToggleProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = React.useState(false);

  const toggle = React.useCallback(() => setCollapsed((value) => !value), []);

  const value = React.useMemo(
    () => ({ collapsed, toggle }),
    [collapsed, toggle],
  );

  React.useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--sidebar-width", collapsed ? "76px" : "264px");
    return () => {
      root.style.removeProperty("--sidebar-width");
    };
  }, [collapsed]);

  return (
    <SidebarToggleContext.Provider value={value}>
      {children}
    </SidebarToggleContext.Provider>
  );
}

export function useSidebarToggle(): SidebarToggleContextValue {
  const context = React.useContext(SidebarToggleContext);
  if (!context) {
    throw new Error(
      "useSidebarToggle must be used inside <SidebarToggleProvider>",
    );
  }
  return context;
}
