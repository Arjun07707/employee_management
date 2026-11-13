"use client";

import * as React from "react";
import { useForm, useWatch, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { AlertCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import {
  createEmployeeSchema,
  type CreateEmployeeInput,
  type UpdateEmployeeInput,
} from "@/shared/schemas/employee.schema";
import { DEPARTMENTS, EMPLOYEE_STATUSES } from "@/shared/constants";
import type { Department, EmployeeStatus } from "@/shared/constants";
import { STATUS_LABELS, toDateInputValue, formatINR } from "@/lib/format";
import { ApiError } from "@/lib/api-client";
import { useCreateEmployee } from "@/features/employees/hooks/use-create-employee";
import { useUpdateEmployee } from "@/features/employees/hooks/use-update-employee";
import { useMotion } from "@/animations/use-motion";
import { shake } from "@/animations/presets";
import { FormSection } from "@/features/employees/components/FormSection";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import type { Employee } from "@/shared/types/employee";

/**
 * The shape the form actually holds. `joiningDate` is a yyyy-MM-dd string from
 * the date input; the shared schema transforms it to a Date before the API call.
 */
interface EmployeeFormValues {
  name: string;
  email: string;
  phone: string;
  department: Department;
  designation: string;
  salary: number;
  joiningDate: string;
  status: EmployeeStatus;
}

export interface EmployeeFormProps {
  mode: "create" | "edit";
  /** Prefilled values; required in edit mode. */
  employee?: Employee;
  onSaved?: (employee: Employee) => void;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="caption mt-1.5 flex items-center gap-1.5 text-danger animate-slide-down">
      <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
      {message}
    </p>
  );
}

export function EmployeeForm({ mode, employee, onSaved }: EmployeeFormProps) {
  const router = useRouter();
  const createMutation = useCreateEmployee();
  const updateMutation = useUpdateEmployee(employee?.id ?? "");
  const mutation = mode === "create" ? createMutation : updateMutation;

  const [leaveDialogOpen, setLeaveDialogOpen] = React.useState(false);
  const pendingNavigation = React.useRef<(() => void) | null>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    setError,
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(
      createEmployeeSchema,
    ) as unknown as Resolver<EmployeeFormValues>,
    mode: "onTouched",
    defaultValues: employee
      ? {
          name: employee.name,
          email: employee.email,
          phone: employee.phone,
          department: employee.department,
          designation: employee.designation,
          salary: employee.salary,
          joiningDate: toDateInputValue(employee.joiningDate),
          status: employee.status,
        }
      : {
          name: "",
          email: "",
          phone: "",
          department: "Engineering",
          designation: "",
          salary: 0,
          joiningDate: "",
          status: "active",
        },
  });

  // Live salary preview. `useWatch` instead of `watch()` so the React
  // Compiler can track the subscription (watch() is a compiler blind spot).
  const salary = useWatch({ control, name: "salary" });

  const formRef = React.useRef<HTMLFormElement>(null);
  // Bumped when a submit fails client validation; shakes the errored fields.
  const [invalidSignal, setInvalidSignal] = React.useState(0);

  useMotion(
    () => {
      if (invalidSignal === 0 || !formRef.current) return;
      const invalid = Array.from(
        formRef.current.querySelectorAll<HTMLElement>("[aria-invalid='true']"),
      )
        .map((el) => el.closest<HTMLElement>("div") ?? el)
        .filter((el, index, list) => list.indexOf(el) === index);
      if (invalid.length > 0) shake(invalid, 4);
    },
    { scope: formRef, dependencies: [invalidSignal] },
  );

  // Unsaved-changes guard for browser navigation / reload.
  React.useEffect(() => {
    if (!isDirty) return;

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  const onSubmit = handleSubmit(
    async (values) => {
      const input = {
        ...values,
        joiningDate: values.joiningDate,
      } as unknown as CreateEmployeeInput;

      try {
        const result =
          mode === "create"
            ? await createMutation.mutateAsync(input)
            : await updateMutation.mutateAsync(input as UpdateEmployeeInput);

        toast.success(
          mode === "create"
            ? `${result.name} added to the directory`
            : `${result.name} updated`,
        );
        onSaved?.(result);
        router.push(`/employees/${result.id}`);
        router.refresh();
      } catch (error) {
        if (error instanceof ApiError) {
          const fields = error.fieldErrors();
          for (const [field, message] of Object.entries(fields)) {
            setError(field as keyof CreateEmployeeInput, { message });
          }
          if (!Object.keys(fields).length) {
            toast.error(error.message);
          }
        } else {
          toast.error("Something went wrong. Please try again.");
        }
      }
    },
    // Client validation failed: shake the errored fields (4px, subtle).
    () => setInvalidSignal((count) => count + 1),
  );

  const dirty = mode === "edit" ? isDirty : true;

  return (
    <>
      <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-5">
        {/* 1. Personal */}
        <FormSection title="Personal" description="Basic contact details">
          <div data-field>
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              placeholder="Priya Sharma"
              className="mt-1.5"
              aria-invalid={errors.name ? "true" : "false"}
              {...register("name")}
            />
            <FieldError message={errors.name?.message} />
          </div>

          <div data-field>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="priya@example.com"
              className="mt-1.5"
              aria-invalid={errors.email ? "true" : "false"}
              {...register("email")}
            />
            <FieldError message={errors.email?.message} />
          </div>

          <div data-field>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              placeholder="+91 98765 43210"
              className="mt-1.5"
              aria-invalid={errors.phone ? "true" : "false"}
              {...register("phone")}
            />
            <FieldError message={errors.phone?.message} />
          </div>
        </FormSection>

        {/* 2. Job */}
        <FormSection title="Job" description="Role and joining details">
          <div data-field>
            <Label>Department</Label>
            <Controller
              control={control}
              name="department"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  invalid={Boolean(errors.department)}
                >
                  <SelectTrigger className="mt-1.5" aria-label="Department">
                    <SelectValue placeholder="Select a department" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError message={errors.department?.message} />
          </div>

          <div data-field>
            <Label htmlFor="designation">Designation</Label>
            <Input
              id="designation"
              placeholder="Senior Software Engineer"
              className="mt-1.5"
              aria-invalid={errors.designation ? "true" : "false"}
              {...register("designation")}
            />
            <FieldError message={errors.designation?.message} />
          </div>

          <div data-field>
            <Label htmlFor="joiningDate">Joining date</Label>
            <Input
              id="joiningDate"
              type="date"
              className="mt-1.5"
              aria-invalid={errors.joiningDate ? "true" : "false"}
              {...register("joiningDate")}
            />
            <FieldError message={errors.joiningDate?.message} />
          </div>

          <div data-field>
            <Label>Status</Label>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  invalid={Boolean(errors.status)}
                >
                  <SelectTrigger className="mt-1.5" aria-label="Status">
                    <SelectValue placeholder="Select a status" />
                  </SelectTrigger>
                  <SelectContent>
                    {EMPLOYEE_STATUSES.map((item) => (
                      <SelectItem key={item} value={item}>
                        {STATUS_LABELS[item]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError message={errors.status?.message} />
          </div>
        </FormSection>

        {/* 3. Compensation */}
        <FormSection title="Compensation" description="Salary in INR per annum">
          <div data-field className="sm:col-span-2">
            <Label htmlFor="salary">Salary</Label>
            <div className="relative mt-1.5">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                ₹
              </span>
              <Input
                id="salary"
                type="number"
                min={0}
                step={1000}
                placeholder="1250000"
                className="pl-7"
                aria-invalid={errors.salary ? "true" : "false"}
                {...register("salary", { valueAsNumber: true })}
              />
            </div>
            {Number.isFinite(salary) && salary > 0 ? (
              <p className="caption mt-1.5 text-muted-foreground">
                {formatINR(salary)}
              </p>
            ) : null}
            <FieldError message={errors.salary?.message} />
          </div>
        </FormSection>

        {mutation.isError && !Object.keys(errors).length ? (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-input border border-danger/30 bg-danger/8 px-3.5 py-3 text-sm text-danger"
          >
            <AlertTriangle
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />
            <span>
              {mutation.error instanceof ApiError
                ? mutation.error.message
                : "Something went wrong. Please try again."}
            </span>
          </div>
        ) : null}

        {/* Sticky action bar */}
        <div className="sticky bottom-4 z-10 flex flex-col-reverse gap-2 rounded-card border border-border bg-surface/90 p-3 backdrop-blur-md shadow-card-md sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              if (isDirty) {
                pendingNavigation.current = () => router.back();
                setLeaveDialogOpen(true);
              } else {
                router.back();
              }
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={isSubmitting}
            disabled={!dirty}
            loadingText={mode === "create" ? "Adding" : "Saving"}
          >
            {mode === "create" ? "Add Employee" : "Save Changes"}
          </Button>
        </div>
      </form>

      <ConfirmDialog
        open={leaveDialogOpen}
        onOpenChange={setLeaveDialogOpen}
        title="Discard changes?"
        description="You have unsaved changes. Leaving this page will discard them."
        confirmLabel="Discard"
        destructive
        onConfirm={() => {
          setLeaveDialogOpen(false);
          pendingNavigation.current?.();
        }}
      />
    </>
  );
}
