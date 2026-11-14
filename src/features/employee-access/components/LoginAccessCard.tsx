"use client";

import * as React from "react";
import { KeyRound, ShieldOff } from "lucide-react";

import { useAccount } from "@/features/employee-access/hooks/use-account";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DotBadge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/format";
import { CreateLoginDialog } from "@/features/employee-access/components/CreateLoginDialog";
import { ManageLoginDialog } from "@/features/employee-access/components/ManageLoginDialog";

export interface LoginAccessCardProps {
  employeeId: string;
  employeeName: string;
}

export function LoginAccessCard({
  employeeId,
  employeeName,
}: LoginAccessCardProps) {
  const { data: account, isPending, isError, refetch, isFetching } =
    useAccount(employeeId);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [manageOpen, setManageOpen] = React.useState(false);

  return (
    <>
      <Card>
        <CardHeader>
          <div>
            <CardTitle className="text-base">Login access</CardTitle>
            <CardDescription>
              Sign-in credentials for this employee.
            </CardDescription>
          </div>
          {account ? (
            <DotBadge
              variant={account.isActive ? "default" : "muted"}
              dotClassName={account.isActive ? "bg-foreground" : "border border-current bg-transparent"}
            >
              {account.isActive ? "Active" : "Disabled"}
            </DotBadge>
          ) : null}
        </CardHeader>

        <CardContent>
          {isPending ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-56" />
            </div>
          ) : isError ? (
            <div className="flex flex-col items-start gap-3">
              <p className="text-sm text-muted-foreground">
                Could not load the login status for this employee.
              </p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => void refetch()}
                loading={isFetching}
              >
                Retry
              </Button>
            </div>
          ) : account ? (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="caption text-muted-foreground">Username</p>
                <p className="mt-0.5 font-mono text-sm text-foreground">
                  {account.username}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {account.lastLoginAt
                    ? `Last signed in ${formatDate(account.lastLoginAt)}`
                    : "Has not signed in yet"}
                  {account.mustChangePassword
                    ? " · Must change password on next sign-in"
                    : ""}
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setManageOpen(true)}
              >
                <KeyRound className="size-4" strokeWidth={1.5} aria-hidden="true" />
                Manage login
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-surface-2">
                  <ShieldOff
                    className="size-4 text-muted-foreground"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    No login yet
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    This employee cannot sign in until you create a login.
                  </p>
                </div>
              </div>
              <Button type="button" onClick={() => setCreateOpen(true)}>
                Create login
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {createOpen ? (
        <CreateLoginDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          employeeId={employeeId}
          employeeName={employeeName}
        />
      ) : null}

      {account && manageOpen ? (
        <ManageLoginDialog
          open={manageOpen}
          onOpenChange={setManageOpen}
          employeeId={employeeId}
          account={account}
        />
      ) : null}
    </>
  );
}
