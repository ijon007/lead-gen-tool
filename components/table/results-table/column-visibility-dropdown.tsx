"use client";

import { Plus } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TableHead } from "@/components/ui/table";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import type { TableColumnConfig } from "@/types";

interface ColumnVisibilityDropdownProps {
  visibleColumns: TableColumnConfig[];
  sheetId: string;
}

async function onColumnsChange(
  columns: TableColumnConfig[],
  sheetId: string,
  updateSheet: ReturnType<typeof useMutation<typeof api.sheets.update>>
) {
  await updateSheet({ sheetId: sheetId as Id<"sheets">, columns });
}

export function ColumnVisibilityDropdown({
  visibleColumns,
  sheetId,
}: ColumnVisibilityDropdownProps) {
  const [mounted, setMounted] = useState(false);
  const updateSheet = useMutation(api.sheets.update);
  useEffect(() => setMounted(true), []);

  return (
    <TableHead className="sticky top-0 right-0 z-30 w-8 border-border border-l bg-muted p-0">
      {mounted ? (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                aria-label="Add or remove columns"
                className="flex h-full w-full cursor-pointer items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                type="button"
              >
                <Plus className="size-3" />
              </button>
            }
          />
          <DropdownMenuContent align="end" className="w-48">
            {visibleColumns.map((column) => (
              <DropdownMenuCheckboxItem
                checked={column.visible}
                key={column.id}
                onCheckedChange={() => {
                  const updated = visibleColumns.map((col) =>
                    col.id === column.id
                      ? { ...col, visible: !col.visible }
                      : col
                  );
                  onColumnsChange(updated, sheetId, updateSheet);
                }}
              >
                {column.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <span className="flex h-full w-full items-center justify-center text-muted-foreground">
          <Plus className="size-4" />
        </span>
      )}
    </TableHead>
  );
}
