"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, Check, Lock, User } from "lucide-react";

import { loginSchema, type LoginInput } from "@/shared/schemas/account.schema";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useMotion } from "@/animations/use-motion";
import { fadeUp, scaleIn, shake } from "@/animations/presets";
import { Button } from "@/components/ui/button";
import { Controller } from "react-hook-form";
import { UsernameField } from "@/components/forms/UsernameField";
import { PasswordField } from "@/components/forms/PasswordField";
import { cn } from "@/lib/utils";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");

  const { submit } = useAuth();
  const cardRef = React.useRef<HTMLDivElement>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [succeeded, setSucceeded] = React.useState(false);
  const [shakeSignal, setShakeSignal] = React.useState(0);

  const {
    handleSubmit,
    formState: { errors, isSubmitting },
    control,
    setError,
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: "onTouched",
    defaultValues: { username: "", password: "" },
  });

  useMotion(
    () => {
      if (!cardRef.current) return;
      scaleIn(cardRef.current, { delay: 0.1 });
      const fields = cardRef.current.querySelectorAll("[data-anim='intro']");
      if (fields.length > 0) {
        fadeUp(fields, { stagger: 0.08, delay: 0.25, y: 12 });
      }
    },
    { scope: cardRef },
  );

  useMotion(
    () => {
      if (!succeeded || !cardRef.current) return;
      const check = cardRef.current.querySelector("[data-anim='success']");
      if (check) scaleIn(check, { duration: 0.6, scale: 0.4 });
    },
    { scope: cardRef, dependencies: [succeeded] },
  );

  useMotion(
    () => {
      if (shakeSignal === 0 || !cardRef.current) return;
      shake(cardRef.current);
    },
    { scope: cardRef, dependencies: [shakeSignal] },
  );

  const onSubmit = handleSubmit(async (values) => {
    setErrorMessage(null);

    const result = await submit(values);

    if (result.ok) {
      setSucceeded(true);
      window.setTimeout(() => {
        router.replace(next ?? "/dashboard");
        router.refresh();
      }, 450);
      return;
    }

    if (result.message === "Invalid username or password") {
      setError("password", { message: result.message });
    }
    setErrorMessage(result.message ?? "Something went wrong");
    setShakeSignal((count) => count + 1);
  });

  return (
    <div
      ref={cardRef}
      className="w-full max-w-md rounded-card border border-border bg-surface p-8 shadow-card"
    >
      <div className="mb-6" data-anim="intro">
        <h1 className="page-title text-foreground">
          Welcome <em>back</em>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in to your account to continue
        </p>
      </div>

      {errorMessage ? (
        <div
          role="alert"
          className="mb-5 flex items-start gap-2.5 rounded-input border border-border bg-surface-2 px-3.5 py-3 text-sm text-highlight-ink animate-slide-down"
        >
          <AlertCircle
            className="mt-0.5 size-4 shrink-0"
            strokeWidth={1.5}
            aria-hidden="true"
          />
          <span>{errorMessage}</span>
        </div>
      ) : null}

      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <div className="space-y-1.5" data-anim="intro">
          <div className="relative">
            <User
              aria-hidden="true"
              strokeWidth={1.5}
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Controller
              name="username"
              control={control}
              render={({ field }) => (
                <UsernameField
                  id="username"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.username?.message}
                  autoFocus
                  checkAvailability={false}
                />
              )}
            />
            {errors.username ? (
              <p
                id="username-error"
                className="caption flex items-center gap-1.5 text-highlight-ink animate-slide-down"
              >
                <AlertCircle
                  className="size-3.5"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
                {errors.username.message}
              </p>
            ) : null}
          </div>
        </div>

        <div className="space-y-1.5" data-anim="intro">
          <div className="relative">
            <Lock
              aria-hidden="true"
              strokeWidth={1.5}
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <PasswordField
                  id="password"
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="••••••••"
                  error={errors.password?.message}
                />
              )}
            />
            {errors.password ? (
              <p
                id="password-error"
                className="caption flex items-center gap-1.5 text-highlight-ink animate-slide-down"
              >
                <AlertCircle
                  className="size-3.5"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
                {errors.password.message}
              </p>
            ) : null}
          </div>
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          loading={isSubmitting}
          loadingText="Signing in"
        >
          {succeeded ? (
            <>
              <Check
                className="size-4"
                strokeWidth={1.5}
                data-anim="success"
                aria-hidden="true"
              />
              Signed in
            </>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>

      <p className={cn("mt-6 text-center caption text-muted-foreground")}>
        Contact your administrator if you need access.
      </p>
    </div>
  );
}
