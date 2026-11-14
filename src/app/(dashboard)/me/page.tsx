"use client";

import * as React from "react";

import { useSession } from "@/providers/session-provider";
import { PageTitle } from "@/components/common/PageTitle";

export default function MePage() {
  const session = useSession();

  return (
    <div className="space-y-6">
      <header>
        <div className="min-w-0">
          <p className="eyebrow text-muted-foreground">Profile</p>
          <div className="mt-1.5">
            <PageTitle>
              My <em>profile</em>
            </PageTitle>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Your account details and sign-in information.
          </p>
        </div>
        <div className="mt-5 space-y-[3px]" aria-hidden="true">
          <div className="h-px bg-border" />
          <div className="h-px bg-border" />
        </div>
      </header>

      <div className="rounded-card border border-border bg-surface p-6 shadow-card">
        <p className="eyebrow text-muted-foreground">01 / Account</p>
        <dl className="mt-4 divide-y divide-border">
          <div className="grid grid-cols-2 gap-4 py-3">
            <div>
              <dt className="caption text-muted-foreground">Name</dt>
              <dd className="text-sm text-foreground">{session.name}</dd>
            </div>
            <div>
              <dt className="caption text-muted-foreground">Username</dt>
              <dd className="font-mono text-xs text-foreground">
                @{session.username}
              </dd>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 py-3">
            <div>
              <dt className="caption text-muted-foreground">Role</dt>
              <dd className="text-sm text-foreground capitalize">
                {session.role}
              </dd>
            </div>
            <div>
              <dt className="caption text-muted-foreground">
                Must change password
              </dt>
              <dd className="text-sm text-foreground">
                {session.mustChangePassword ? "Yes" : "No"}
              </dd>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 py-3">
            <div>
              <dt className="caption text-muted-foreground">Employee ref</dt>
              <dd className="font-mono text-xs text-foreground">
                {session.employeeRef ?? "—"}
              </dd>
            </div>
          </div>
        </dl>
      </div>
    </div>
  );
}
