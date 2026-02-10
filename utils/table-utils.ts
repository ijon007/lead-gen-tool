import type { Lead, TableColumnConfig } from "@/types";

export const COL_INDEX = "col-index";
export const COL_STATUS = "col-status";
export const COL_ADD = "col-add";
export const DEFAULT_INDEX_WIDTH = 40;
export const DEFAULT_ADD_WIDTH = 28;
export const DEFAULT_STATUS_WIDTH = 128;
export const DEFAULT_COL_WIDTH = 140;
export const MIN_COL_WIDTH = 40;
export const MIN_ROW_HEIGHT = 32;
export const DEFAULT_ROW_HEIGHT = 40;

export type SortDirection = "asc" | "desc" | null;

function isNumeric(value: unknown): boolean {
  if (value === null || value === undefined || value === "") {
    return false;
  }
  const num = Number(value);
  return !isNaN(num) && isFinite(num);
}

export function sortLeads(
  leads: Lead[],
  sortKey: string | null,
  sortDirection: SortDirection
): Lead[] {
  if (!(sortKey && sortDirection)) {
    return leads;
  }

  return [...leads].sort((a, b) => {
    const aValue = a[sortKey as keyof Lead];
    const bValue = b[sortKey as keyof Lead];

    if (aValue === null || aValue === undefined) {
      return 1;
    }
    if (bValue === null || bValue === undefined) {
      return -1;
    }

    const aStr = String(aValue);
    const bStr = String(bValue);

    let comparison = 0;
    if (isNumeric(aValue) && isNumeric(bValue)) {
      comparison = Number(aValue) - Number(bValue);
    } else {
      comparison = aStr.localeCompare(bStr, undefined, {
        numeric: true,
        sensitivity: "base",
      });
    }

    return sortDirection === "asc" ? comparison : -comparison;
  });
}

export function getColumnKey(col: TableColumnConfig | "index" | "status"): string {
  if (col === "index") {
    return COL_INDEX;
  }
  if (col === "status") {
    return COL_STATUS;
  }
  return `col-${col.id}`;
}
