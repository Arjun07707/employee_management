"use client";

import * as React from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

import { passwordSchema, usernameSchema } from "@/shared/schemas/account.schema";
import type { AccountDTO } from "@/shared/types/account";
import { ApiError } from "@/lib/api-client";
import { generatePassword } from "@/lib/generate-password";
import {
  useUpdateAccount,
  type UpdateAccountInput,
} from "@/features/employee-access/hooks/use-update-account";
import { UsernameField } from "@/components/forms/UsernameField";
import { PasswordField } from "@/components/forms/PasswordField";
import { PasswordStrength } from "@/components/forms/PasswordStrength";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const manageFormSchema = z.object({
  username: usernameSchema,
  newPassword: z
    .string()
    .max(72, "Password must be at most 72 characters")
    .superRefine((value, ctx) => {
      if (!value) return;
      const parsed = passwordSchema.safeParse(value);
      if (!parsed.success) {
        ctx.addIssue({
          code: "custom",
          message: parsed.error.issues[0]!.message,
        });
      }
    }),
  isActive: z.boolean(),
});

type ManageFormValues = z.infer<typeof manageFormSchema>;

export interface ManageLoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
  account: AccountDTO;
}

export function ManageLoginDialog({
  open,
  onOpenChange,
  employeeId,
  account,
}: ManageLoginDialogProps) {
  const mutation = useUpdateAccount(employeeId);

  const {
    control,
    handleSubmit,
    setValue,
    setError,
    formState: { errors },
  } = useForm<ManageFormValues>({
    resolver: zodResolver(manageFormSchema),
    mode: "onTouched",
    defaultValues: {
      username: account.username,
      newPassword: "",
      isActive: account.isActive,
    },
  });

  const newPassword = useWatch({ control, name: "newPassword" });

  const onGenerate = () => {
    setValue("newPassword", generatePassword(14), {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const onSubmit = handleSubmit(async (values) => {
    const input: UpdateAccountInput = {};

    if (values.username !== account.username) input.username = values.username;
    if (values.newPassword) input.newPassword = values.newPassword;
    if (values.isActive !== account.isActive) input.isActive = values.isActive;

    if (Object.keys(input).length === 0) {
      toast.info("No changes to save");
      return;
    }

    try {
      await mutation.mutateAsync(input);
      onOpenChange(false);
    } catch (error) {
      if (error instanceof ApiError) {
        for (const [field, message] of Object.entries(error.fieldErrors())) {
          if (field === "username" || field === "newPassword") {
            setError(field, { message });
          }
        }
      }
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage login</DialogTitle>
          <DialogDescription>
            Change the username, reset the password, or disable sign-in.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <Controller
            name="username"
            control={control}
            render={({ field }) => (
              <UsernameField
                id="manage-login-username"
                value={field.value}
                onChange={field.onChange}
                forEmployeeId={employeeId}
                error={errors.username?.message}
              />
            )}
          />

          <div className="space-y-1.5">
            <div className="flex items-end justify-between gap-2">
              <Label htmlFor="manage-login-password">
                New password{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={onGenerate}
              >
                <Sparkles
                  className="size-3.5"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
                Generate
              </Button>
            </div>
            <Controller
              name="newPassword"
              control={control}
              render={({ field }) => (
                <PasswordField
                  id="manage-login-password"
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Leave blank to keep current password"
                  error={errors.newPassword?.message}
                />
              )}
            />
            <PasswordStrength password={newPassword} />
          </div>

          <div className="flex items-center gap-2">
            <Controller
              name="isActive"
              control={control}
              render={({ field }) => (
                <input
                  id="manage-login-active"
                  type="checkbox"
                  checked={field.value}
                  onChange={(event) => field.onChange(event.target.checked)}
                  className="rounded border-input bg-surface text-primary"
                />
              )}
            />
            <Label htmlFor="manage-login-active" className="text-sm">
              Sign-in enabled
            </Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" loading={mutation.isPending}>
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
