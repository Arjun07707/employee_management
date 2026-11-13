import { redirect } from "next/navigation";

import { getSession } from "@/server/auth/session";
import { SessionProvider } from "@/providers/session-provider";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { SidebarToggleProvider } from "@/components/layout/sidebar-toggle-context";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <SessionProvider user={session}>
      <SidebarToggleProvider>
        <div className="min-h-screen bg-background">
          <Sidebar user={session} />

          <div className="transition-[padding] duration-300 lg:pl-[var(--sidebar-width,264px)]">
            <Navbar user={session} />

            <main className="mx-auto w-full max-w-[1280px] px-4 py-6 sm:px-6">
              {children}
            </main>
          </div>
        </div>
      </SidebarToggleProvider>
    </SessionProvider>
  );
}
