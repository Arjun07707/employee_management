"use client";

import * as React from "react";
import { X } from "lucide-react";

import { DEPARTMENTS, EMPLOYEE_STATUSES } from "@/shared/constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { STATUS_LABELS } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface FilterBarProps {
  department: string;
  status: string;
  onDepartmentChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  hasFilters: boolean;
  onClear: () => void;
  className?: string;
}

export function FilterBar({
  department,
  status,
  onDepartmentChange,
  onStatusChange,
  hasFilters,
  onClear,
  className,
}: FilterBarProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <Select value={department} onValueChange={onDepartmentChange}>
        <SelectTrigger aria-label="Filter by department" className="w-[168px]">
          <SelectValue placeholder="All departments" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All departments</SelectItem>
          {DEPARTMENTS.map((item) => (
            <SelectItem key={item} value={item}>
              {item}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={status} onValueChange={onStatusChange}>
        <SelectTrigger aria-label="Filter by status" className="w-[144px]">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All statuses</SelectItem>
          {EMPLOYEE_STATUSES.map((item) => (
            <SelectItem key={item} value={item}>
              {STATUS_LABELS[item]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters ? (
        <Button
          type="button"
          variant="ghost"
          onClick={onClear}
          className="h-10 text-muted-foreground"
        >
          <X className="size-4" aria-hidden="true" />
          Clear filters
        </Button>
      ) : null}
    </div>
  );
}
