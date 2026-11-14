"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Phone, Pencil, Trash2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/common/Avatar";
import { CopyButton } from "@/components/common/CopyButton";
import { DeleteConfirmDialog } from "@/features/employees/components/DeleteConfirmDialog";
import { StatusBadge } from "@/features/employees/components/StatusBadge";
import { formatDate, formatINR, tenure } from "@/lib/format";
import type { Employee } from "@/shared/types/employee";

export interface EmployeeDetailsDialogProps {
  employee: Employee | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canEdit: boolean;
}

/** Quick-look dialog used from the employees list (desktop + mobile). */
export function EmployeeDetailsDialog({
  employee,
  open,
  onOpenChange,
  canEdit,
}: EmployeeDetailsDialogProps) {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  if (!employee) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent aria-describedby="employee-dialog-description">
          <DialogHeader>
            <div className="flex items-center gap-4">
              <Avatar name={employee.name} size="lg" />
              <div className="min-w-0">
                <DialogTitle className="truncate">{employee.name}</DialogTitle>
                <DialogDescription
                  id="employee-dialog-description"
                  className="mt-0.5"
                >
                  {employee.designation} · {employee.department}
                </DialogDescription>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <StatusBadge status={employee.status} />
                  <span className="inline-flex items-center gap-1">
                    <code className="rounded-input border border-border bg-transparent px-1.5 py-0.5 font-mono text-[11px] text-foreground">
                      {employee.employeeId}
                    </code>
                    <CopyButton
                      value={employee.employeeId}
                      label="Copy employee ID"
                    />
                  </span>
                </div>
              </div>
            </div>
          </DialogHeader>

          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="caption text-muted-foreground">Email</dt>
              <dd className="mt-0.5 flex items-center gap-1.5">
                <Mail
                  className="size-3.5 text-muted-foreground"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
                <a
                  href={`mailto:${employee.email}`}
                  className="break-all text-primary underline-offset-4 hover:underline"
                >
                  {employee.email}
                </a>
              </dd>
            </div>

            <div>
              <dt className="caption text-muted-foreground">Phone</dt>
              <dd className="mt-0.5 flex items-center gap-1.5">
                <Phone
                  className="size-3.5 text-muted-foreground"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
                <a
                  href={`tel:${employee.phone}`}
                  className="hover:text-primary"
                >
                  {employee.phone}
                </a>
              </dd>
            </div>

            <div>
              <dt className="caption text-muted-foreground">Department</dt>
              <dd className="mt-0.5 font-medium text-foreground">
                {employee.department}
              </dd>
            </div>

            <div>
              <dt className="caption text-muted-foreground">Salary</dt>
              <dd className="mt-0.5 font-medium tabular-nums">
                {formatINR(employee.salary)}
              </dd>
            </div>

            <div>
              <dt className="caption text-muted-foreground">Joined</dt>
              <dd className="mt-0.5 font-medium">
                {formatDate(employee.joiningDate)}
                <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                  · {tenure(employee.joiningDate)}
                </span>
              </dd>
            </div>

            <div>
              <dt className="caption text-muted-foreground">Last updated</dt>
              <dd className="mt-0.5 font-medium">
                {formatDate(employee.updatedAt)}
              </dd>
            </div>
          </dl>

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button asChild variant="secondary">
              <Link href={`/employees/${employee.id}`}>Full details</Link>
            </Button>
            {canEdit ? (
              <>
                <Button
                  variant="secondary"
                  onClick={() => {
                    onOpenChange(false);
                    router.push(`/employees/${employee.id}/edit`);
                  }}
                >
                  <Pencil
                    className="size-4"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    onOpenChange(false);
                    setConfirmDelete(true);
                  }}
                >
                  <Trash2
                    className="size-4"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                  Delete
                </Button>
              </>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        employee={employee}
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
      />
    </>
  );
}
