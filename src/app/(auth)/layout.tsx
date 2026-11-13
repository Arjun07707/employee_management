import { redirect } from "next/navigation";

import { getSession } from "@/server/auth/session";
import { BrandPanel } from "@/features/auth/components/BrandPanel";
import { Logo } from "@/components/common/Logo";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Left brand panel */}
      <BrandPanel className="w-1/2" />

      {/* Right form area */}
      <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 flex justify-center lg:hidden">
            <Logo size={40} withName nameClassName="text-lg" />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
