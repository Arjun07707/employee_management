"use client";

import * as React from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Sparkles } from "lucide-react";

import {
  passwordSchema,
  usernameSchema,
} from "@/shared/schemas/account.schema";
import { ApiError } from "@/lib/api-client";
import { generatePassword } from "@/lib/generate-password";
import { suggestUsername } from "@/lib/suggest-username";
import { useCreateAccount } from "@/features/employee-access/hooks/use-create-account";
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
import { CredentialsReveal } from "@/features/employee-access/components/CredentialsReveal";

const createFormSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
  mustChangePassword: z.boolean(),
});

type CreateFormValues = z.infer<typeof createFormSchema>;

export interface CreateLoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
  employeeName: string;
}

export function CreateLoginDialog({
  open,
  onOpenChange,
  employeeId,
  employeeName,
}: CreateLoginDialogProps) {
  const mutation = useCreateAccount(employeeId);
  const [created, setCreated] = React.useState<{
    username: string;
    password: string;
  } | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    setError,
    formState: { errors },
  } = useForm<CreateFormValues>({
    resolver: zodResolver(createFormSchema),
    mode: "onTouched",
    defaultValues: {
      username: suggestUsername(employeeName),
      password: "",
      mustChangePassword: true,
    },
  });

  const password = useWatch({ control, name: "password" });

  const onGenerate = () => {
    setValue("password", generatePassword(14), {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const onSubmit = handleSubmit(async (values) => {
    try {
      const account = await mutation.mutateAsync(values);
      setCreated({ username: account.username, password: values.password });
    } catch (error) {
      if (error instanceof ApiError) {
        for (const [field, message] of Object.entries(error.fieldErrors())) {
          if (field === "username" || field === "password") {
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
          <DialogTitle>Create login</DialogTitle>
          <DialogDescription>
            Provision a username and password so {employeeName} can sign in.
          </DialogDescription>
        </DialogHeader>

        {created ? (
          <div className="space-y-4">
            <CredentialsReveal
              username={created.username}
              password={created.password}
            />
            <DialogFooter>
              <Button type="button" onClick={() => onOpenChange(false)}>
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate className="space-y-4">
            <Controller
              name="username"
              control={control}
              render={({ field }) => (
                <UsernameField
                  id="create-login-username"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.username?.message}
                />
              )}
            />

            <div className="space-y-1.5">
              <div className="flex items-end justify-between gap-2">
                <Label htmlFor="create-login-password">Password</Label>
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
                name="password"
                control={control}
                render={({ field }) => (
                  <PasswordField
                    id="create-login-password"
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.password?.message}
                  />
                )}
              />
              <PasswordStrength password={password} />
            </div>

            <div className="flex items-center gap-2">
              <Controller
                name="mustChangePassword"
                control={control}
                render={({ field }) => (
                  <input
                    id="create-login-mcp"
                    type="checkbox"
                    checked={field.value}
                    onChange={(event) => field.onChange(event.target.checked)}
                    className="rounded border-input bg-surface text-primary"
                  />
                )}
              />
              <Label htmlFor="create-login-mcp" className="text-sm">
                Require password change on first sign-in
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
                Create login
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
