"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Briefcase,
  CalendarDays,
  CreditCard,
  Mail,
  Pencil,
  Phone,
  Tag,
  Trash2,
} from "lucide-react";

import { useMotion } from "@/animations/use-motion";
import { fadeUp, scaleIn, slideInX } from "@/animations/presets";
import { Avatar } from "@/components/common/Avatar";
import { CopyButton } from "@/components/common/CopyButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DEPARTMENT_COLORS } from "@/shared/constants";
import { formatDate, formatINR, tenure } from "@/lib/format";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/features/employees/components/StatusBadge";
import type { Employee } from "@/shared/types/employee";

export interface EmployeeDetailsProps {
  employee: Employee;
  canEdit: boolean;
  onDelete: () => void;
}

function InfoRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-surface-2">
        <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <dt className="caption text-muted-foreground">{label}</dt>
        <dd className="mt-0.5 text-sm font-medium text-foreground">
          {children}
        </dd>
      </div>
    </div>
  );
}

export function EmployeeDetails({
  employee,
  canEdit,
  onDelete,
}: EmployeeDetailsProps) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const heroRef = React.useRef<HTMLDivElement>(null);
  const cardsRef = React.useRef<HTMLDivElement>(null);

  useMotion(
    () => {
      scaleIn(heroRef.current, { duration: 0.4 });
      fadeUp(
        heroRef.current?.querySelectorAll("[data-anim='hero-text']") ?? [],
        { stagger: 0.06, delay: 0.1 },
      );
    },
    { scope: rootRef },
  );

  useMotion(
    () => {
      const cards = cardsRef.current?.querySelectorAll(
        "[data-anim='info-card']",
      );
      if (cards && cards.length > 0) {
        slideInX(Array.from(cards), 24, { stagger: 0.08, delay: 0.15 });
      }
    },
    { scope: rootRef },
  );

  return (
    <div ref={rootRef} className="space-y-5">
      {/* Hero */}
      <div
        ref={heroRef}
        className="relative overflow-hidden rounded-card border border-border bg-surface p-6 shadow-card"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-24 size-64 rounded-full opacity-40 blur-3xl"
          style={{
            backgroundImage:
              "linear-gradient(135deg, #5B5BD6 0%, #8B5CF6 50%, #14B8A6 100%)",
          }}
        />

        <div className="relative flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <Avatar name={employee.name} size="xl" />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="page-title text-foreground">{employee.name}</h1>
              <StatusBadge status={employee.status} />
            </div>

            <div
              data-anim="hero-text"
              className="mt-1 flex flex-wrap items-center gap-2"
            >
              <p className="text-sm text-muted-foreground">
                {employee.designation}
              </p>
              <span aria-hidden="true" className="text-muted-foreground/40">
                ·
              </span>
              <span
                className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-medium"
                style={{ color: DEPARTMENT_COLORS[employee.department] }}
              >
                <span
                  aria-hidden="true"
                  className="size-1.5 rounded-full"
                  style={{
                    backgroundColor: DEPARTMENT_COLORS[employee.department],
                  }}
                />
                {employee.department}
              </span>
            </div>

            <div
              data-anim="hero-text"
              className="mt-3 inline-flex items-center gap-1"
            >
              <code className="rounded-md bg-surface-2 px-2 py-1 font-mono text-xs text-foreground">
                {employee.employeeId}
              </code>
              <CopyButton
                value={employee.employeeId}
                label="Copy employee ID"
              />
            </div>
          </div>

          {canEdit ? (
            <div className="flex shrink-0 gap-2">
              <Button asChild variant="outline">
                <Link href={`/employees/${employee.id}/edit`}>
                  <Pencil className="size-4" aria-hidden="true" />
                  Edit
                </Link>
              </Button>
              <Button variant="danger" onClick={onDelete}>
                <Trash2 className="size-4" aria-hidden="true" />
                Delete
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      {/* Info cards */}
      <div
        ref={cardsRef}
        className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
      >
        <Card data-anim="info-card">
          <CardHeader>
            <CardTitle className="text-base">Contact</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="divide-y divide-border">
              <InfoRow icon={Mail} label="Email">
                <a
                  href={`mailto:${employee.email}`}
                  className="break-all text-primary underline-offset-4 hover:underline"
                >
                  {employee.email}
                </a>
              </InfoRow>
              <InfoRow icon={Phone} label="Phone">
                <a
                  href={`tel:${employee.phone}`}
                  className="hover:text-primary"
                >
                  {employee.phone}
                </a>
              </InfoRow>
            </dl>
          </CardContent>
        </Card>

        <Card data-anim="info-card">
          <CardHeader>
            <CardTitle className="text-base">Job</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="divide-y divide-border">
              <InfoRow icon={Briefcase} label="Department">
                {employee.department}
              </InfoRow>
              <InfoRow icon={Tag} label="Designation">
                {employee.designation}
              </InfoRow>
              <InfoRow icon={CalendarDays} label="Joining date">
                {formatDate(employee.joiningDate)}
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  · {tenure(employee.joiningDate)} tenure
                </span>
              </InfoRow>
            </dl>
          </CardContent>
        </Card>

        <Card data-anim="info-card" className="md:col-span-2 xl:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Compensation</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="divide-y divide-border">
              <InfoRow icon={CreditCard} label="Annual salary">
                <span className="stat-number text-foreground">
                  {formatINR(employee.salary)}
                </span>
              </InfoRow>
            </dl>
          </CardContent>
        </Card>
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="relative space-y-4 border-l border-border pl-5">
            <li className="relative">
              <span
                aria-hidden="true"
                className="absolute -left-[26px] top-1 size-3 rounded-full border-2 border-surface bg-primary"
              />
              <p className="caption text-muted-foreground">Created</p>
              <p className="text-sm font-medium text-foreground">
                {formatDate(employee.createdAt)}
              </p>
            </li>
            <li className="relative">
              <span
                aria-hidden="true"
                className="absolute -left-[26px] top-1 size-3 rounded-full border-2 border-surface bg-accent"
              />
              <p className="caption text-muted-foreground">Last updated</p>
              <p className="text-sm font-medium text-foreground">
                {formatDate(employee.updatedAt)}
              </p>
            </li>
          </ol>
        </CardContent>
      </Card>

      <Link
        href="/employees"
        className={cn(
          "inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
        )}
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to employees
      </Link>
    </div>
  );
}
