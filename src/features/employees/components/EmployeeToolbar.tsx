"use client";

import * as React from "react";

import { SearchBar } from "@/features/employees/components/SearchBar";
import { FilterBar } from "@/features/employees/components/FilterBar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PAGE_SIZES } from "@/shared/constants";
import type { EmployeeUrlState } from "@/features/employees/hooks/use-employee-url-state";

export interface EmployeeToolbarProps {
  state: EmployeeUrlState;
}

/**
 * Toolbar card: search (debounced), department / status filters, clear
 * filters and rows-per-page. Export / Add live in the page header (plan §1.7).
 */
export function EmployeeToolbar({ state }: EmployeeToolbarProps) {
  return (
    <div className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4 shadow-card lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-1 flex-wrap items-center gap-2">
        <SearchBar value={state.search} onChange={state.setSearch} />

        <FilterBar
          department={state.department}
          status={state.status}
          onDepartmentChange={state.setDepartment}
          onStatusChange={state.setStatus}
          hasFilters={state.hasFilters}
          onClear={state.clearFilters}
        />
      </div>

      <div className="flex items-center gap-1.5">
        <span className="caption hidden text-muted-foreground sm:inline">
          Rows
        </span>
        <Select
          value={String(state.limit)}
          onValueChange={(value) => state.setLimit(Number(value))}
        >
          <SelectTrigger aria-label="Rows per page" className="w-[80px]">
            <SelectValue placeholder="10" />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZES.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
