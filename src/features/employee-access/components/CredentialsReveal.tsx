"use client";

import { CopyButton } from "@/components/common/CopyButton";

export interface CredentialsRevealProps {
  username: string;
  password?: string;
  hint?: string;
}

function CredentialRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-input border border-border bg-surface px-3 py-2">
      <div className="min-w-0">
        <p className="caption text-muted-foreground">{label}</p>
        <p
          className={
            mono
              ? "truncate font-mono text-sm text-foreground"
              : "truncate text-sm font-medium text-foreground"
          }
        >
          {value}
        </p>
      </div>
      <CopyButton value={value} label={`Copy ${label.toLowerCase()}`} />
    </div>
  );
}

export function CredentialsReveal({
  username,
  password,
  hint = "Share these credentials with the employee privately. The password is shown only once.",
}: CredentialsRevealProps) {
  return (
    <div className="space-y-2.5 rounded-card border border-border bg-surface-2 p-4">
      <p className="caption text-muted-foreground">{hint}</p>
      <CredentialRow label="Username" value={username} mono />
      {password ? <CredentialRow label="Password" value={password} mono /> : null}
    </div>
  );
}
