"use client";

import * as React from "react";

import type { SessionUserDTO } from "@/shared/types/account";

const SessionContext = React.createContext<SessionUserDTO | null>(null);

/**
 * Provides the server-resolved session to client components. The dashboard
 * layout reads the cookie on the server (and redirects when there is none),
 * then hands the user down through this provider.
 */
export function SessionProvider({
  user,
  children,
}: {
  user: SessionUserDTO;
  children: React.ReactNode;
}) {
  return (
    <SessionContext.Provider value={user}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionUserDTO {
  const context = React.useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used inside <SessionProvider>");
  }
  return context;
}
