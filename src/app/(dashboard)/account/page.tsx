"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";

import { changeCredentialsFormSchema } from "@/shared/schemas/account.schema";
import { changeCredentials } from "@/features/auth/api";
import type { z } from "zod";
import { PageTitle } from "@/components/common/PageTitle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AccountPage() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof changeCredentialsFormSchema>>({
    resolver: zodResolver(changeCredentialsFormSchema),
    mode: "onTouched",
    defaultValues: {
      currentPassword: "",
      newUsername: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await changeCredentials(values);
      toast.success("Credentials updated successfully");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update credentials",
      );
    }
  });

  return (
    <div className="space-y-6">
      <header>
        <div className="min-w-0">
          <p className="eyebrow text-muted-foreground">Settings</p>
          <div className="mt-1.5">
            <PageTitle>
              Your <em>account</em>
            </PageTitle>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Change your password and username.
          </p>
        </div>
        <div className="mt-5 space-y-[3px]" aria-hidden="true">
          <div className="h-px bg-border" />
          <div className="h-px bg-border" />
        </div>
      </header>

      <div className="rounded-card border border-border bg-surface p-6 shadow-card">
        <p className="eyebrow text-muted-foreground">01 / Credentials</p>
        <form onSubmit={onSubmit} noValidate className="mt-5 space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="currentPassword">Current password</Label>
            <Input
              id="currentPassword"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              {...register("currentPassword")}
              aria-invalid={errors.currentPassword ? "true" : "false"}
            />
            {errors.currentPassword ? (
              <p className="caption flex items-center gap-1.5 text-highlight-ink">
                <AlertCircle
                  className="size-3.5 shrink-0"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
                {errors.currentPassword.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="newUsername">
              New username{" "}
              <span className="font-normal text-muted-foreground">
                Optional
              </span>
            </Label>
            <Input
              id="newUsername"
              placeholder="@username"
              {...register("newUsername")}
              aria-invalid={errors.newUsername ? "true" : "false"}
            />
            {errors.newUsername ? (
              <p className="caption flex items-center gap-1.5 text-highlight-ink">
                <AlertCircle
                  className="size-3.5 shrink-0"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
                {errors.newUsername.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="newPassword">
              New password{" "}
              <span className="font-normal text-muted-foreground">
                Optional
              </span>
            </Label>
            <Input
              id="newPassword"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              {...register("newPassword")}
              aria-invalid={errors.newPassword ? "true" : "false"}
            />
            {errors.newPassword ? (
              <p className="caption flex items-center gap-1.5 text-highlight-ink">
                <AlertCircle
                  className="size-3.5 shrink-0"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
                {errors.newPassword.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              {...register("confirmPassword")}
              aria-invalid={errors.confirmPassword ? "true" : "false"}
            />
            {errors.confirmPassword ? (
              <p className="caption flex items-center gap-1.5 text-highlight-ink">
                <AlertCircle
                  className="size-3.5 shrink-0"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
                {errors.confirmPassword.message}
              </p>
            ) : null}
          </div>

          <Button type="submit" loading={isSubmitting} className="w-full">
            Save changes
          </Button>
        </form>
      </div>
    </div>
  );
}
