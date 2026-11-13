"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";

import type { EmployeeQuery } from "@/shared/schemas/employee.schema";
import { DEFAULT_PAGE_SIZE } from "@/shared/constants";

export interface EmployeeUrlState {
  query: Partial<EmployeeQuery>;
  search: string;
  department: string;
  status: string;
  sortBy: EmployeeQuery["sortBy"];
  order: EmployeeQuery["order"];
  page: number;
  limit: number;
  /** True when any filter/search is active. */
  hasFilters: boolean;
  setSearch: (value: string) => void;
  setDepartment: (value: string) => void;
  setStatus: (value: string) => void;
  setSortBy: (value: EmployeeQuery["sortBy"]) => void;
  setOrder: (value: EmployeeQuery["order"]) => void;
  toggleOrder: (field: EmployeeQuery["sortBy"]) => void;
  setPage: (value: number) => void;
  setLimit: (value: number) => void;
  clearFilters: () => void;
}

const SORT_FIELDS = new Set([
  "name",
  "email",
  "department",
  "salary",
  "joiningDate",
  "createdAt",
]);

/**
 * The list state lives in the URL so refresh, back/forward and shared links
 * all work. Changing any filter resets the page to 1.
 */
export function useEmployeeUrlState(): EmployeeUrlState {
  const searchParams = useSearchParams();

  const search = searchParams.get("search") ?? "";
  const department = searchParams.get("department") ?? "";
  const status = searchParams.get("status") ?? "";

  const sortByParam = searchParams.get("sortBy");
  const sortBy = (
    sortByParam && SORT_FIELDS.has(sortByParam) ? sortByParam : "createdAt"
  ) as EmployeeQuery["sortBy"];

  const order = searchParams.get("order") === "asc" ? "asc" : "desc";

  const pageParam = Number(searchParams.get("page"));
  const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;

  const limitParam = Number(searchParams.get("limit"));
  const limit =
    Number.isInteger(limitParam) && limitParam > 0 && limitParam <= 100
      ? limitParam
      : DEFAULT_PAGE_SIZE;

  const router = useRouter();

  const update = React.useCallback(
    (patch: Record<string, string | number | undefined>, resetPage = true) => {
      const next = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(patch)) {
        if (value === undefined || value === "" || value === null) {
          next.delete(key);
        } else {
          next.set(key, String(value));
        }
      }

      if (resetPage && !("page" in patch)) next.delete("page");

      const qs = next.toString();
      router.replace(qs ? `?${qs}` : window.location.pathname, {
        scroll: false,
      });
    },
    [router, searchParams],
  );

  const setSearch = React.useCallback(
    (value: string) => update({ search: value }),
    [update],
  );
  const setDepartment = React.useCallback(
    (value: string) => update({ department: value }),
    [update],
  );
  const setStatus = React.useCallback(
    (value: string) => update({ status: value }),
    [update],
  );
  const setSortBy = React.useCallback(
    (value: EmployeeQuery["sortBy"]) => update({ sortBy: value }, false),
    [update],
  );
  const setOrder = React.useCallback(
    (value: EmployeeQuery["order"]) => update({ order: value }, false),
    [update],
  );
  const toggleOrder = React.useCallback(
    (field: EmployeeQuery["sortBy"]) => {
      if (field === sortBy) {
        update({ order: order === "asc" ? "desc" : "asc" }, false);
      } else {
        update({ sortBy: field, order: "asc" }, false);
      }
    },
    [order, sortBy, update],
  );
  const setPage = React.useCallback(
    (value: number) => update({ page: value }, false),
    [update],
  );
  const setLimit = React.useCallback(
    (value: number) => update({ limit: value }),
    [update],
  );

  const clearFilters = React.useCallback(() => {
    const next = new URLSearchParams(searchParams.toString());
    for (const key of ["search", "department", "status"]) next.delete(key);
    next.delete("page");
    const qs = next.toString();
    router.replace(qs ? `?${qs}` : window.location.pathname, { scroll: false });
  }, [router, searchParams]);

  const hasFilters = Boolean(search || department || status);

  const query = React.useMemo<Partial<EmployeeQuery>>(
    () => ({
      search: search || undefined,
      department: (department || undefined) as EmployeeQuery["department"],
      status: (status || undefined) as EmployeeQuery["status"],
      sortBy,
      order,
      page,
      limit,
    }),
    [search, department, status, sortBy, order, page, limit],
  );

  return {
    query,
    search,
    department,
    status,
    sortBy,
    order,
    page,
    limit,
    hasFilters,
    setSearch,
    setDepartment,
    setStatus,
    setSortBy,
    setOrder,
    toggleOrder,
    setPage,
    setLimit,
    clearFilters,
  };
}
