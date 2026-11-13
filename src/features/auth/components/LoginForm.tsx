"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, Check, Eye, EyeOff, Lock, Mail } from "lucide-react";

import { loginSchema, type LoginInput } from "@/shared/schemas/auth.schema";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useMotion } from "@/animations/use-motion";
import { fadeUp, scaleIn, shake } from "@/animations/presets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");

  const { submit } = useAuth();
  const cardRef = React.useRef<HTMLDivElement>(null);
  const [showPassword, setShowPassword] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [succeeded, setSucceeded] = React.useState(false);
  const [shakeSignal, setShakeSignal] = React.useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: "onTouched",
    defaultValues: { email: "", password: "" },
  });

  useMotion(
    () => {
      if (!cardRef.current) return;
      // Intro timeline: card scaleIn, fields stagger, CTA last.
      scaleIn(cardRef.current, { delay: 0.1 });
      const fields = cardRef.current.querySelectorAll("[data-anim='intro']");
      if (fields.length > 0) {
        fadeUp(fields, { stagger: 0.08, delay: 0.25, y: 12 });
      }
    },
    { scope: cardRef },
  );

  // Success: the check icon scales in with a spring (0.6s, back.out).
  useMotion(
    () => {
      if (!succeeded || !cardRef.current) return;
      const check = cardRef.current.querySelector("[data-anim='success']");
      if (check) scaleIn(check, { duration: 0.6, scale: 0.4 });
    },
    { scope: cardRef, dependencies: [succeeded] },
  );

  // Shake when a login attempt fails (driven by the shakeSignal state so the
  // submit handler never touches refs directly).
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

    if (result.message === "Invalid email or password") {
      setError("password", { message: result.message });
    }
    setErrorMessage(result.message ?? "Something went wrong");
    setShakeSignal((count) => count + 1);
  });

  return (
    <div
      ref={cardRef}
      className="w-full max-w-md rounded-dialog border border-border bg-surface p-8 shadow-card"
    >
      <div className="mb-6" data-anim="intro">
        <h1 className="page-title text-foreground">Welcome back</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in to your account to continue
        </p>
      </div>

      {errorMessage ? (
        <div
          role="alert"
          className="mb-5 flex items-start gap-2.5 rounded-input border border-danger/30 bg-danger/8 px-3.5 py-3 text-sm text-danger animate-slide-down"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{errorMessage}</span>
        </div>
      ) : null}

      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <div className="space-y-1.5" data-anim="intro">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              id="email"
              type="email"
              placeholder="you@company.com"
              autoComplete="email"
              autoFocus
              className="pl-9"
              aria-invalid={errors.email ? "true" : "false"}
              aria-describedby={errors.email ? "email-error" : undefined}
              {...register("email")}
            />
          </div>
          {errors.email ? (
            <p
              id="email-error"
              className="caption flex items-center gap-1.5 text-danger animate-slide-down"
            >
              <AlertCircle className="size-3.5" aria-hidden="true" />
              {errors.email.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5" data-anim="intro">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="current-password"
              className="pl-9 pr-10"
              aria-invalid={errors.password ? "true" : "false"}
              aria-describedby={errors.password ? "password-error" : undefined}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {showPassword ? (
                <EyeOff className="size-4" aria-hidden="true" />
              ) : (
                <Eye className="size-4" aria-hidden="true" />
              )}
            </button>
          </div>
          {errors.password ? (
            <p
              id="password-error"
              className="caption flex items-center gap-1.5 text-danger animate-slide-down"
            >
              <AlertCircle className="size-3.5" aria-hidden="true" />
              {errors.password.message}
            </p>
          ) : null}
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          data-anim="intro"
          loading={isSubmitting}
          loadingText="Signing in"
        >
          {succeeded ? (
            <>
              <Check
                className="size-4"
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
