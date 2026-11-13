import * as React from "react";
import { redirect } from "next/navigation";

import { getSession } from "@/server/auth/session";
import { LoginForm } from "@/features/auth/components/LoginForm";

export const metadata = { title: "Sign in" };

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <React.Suspense fallback={null}>
      <LoginForm />
    </React.Suspense>
  );
}
