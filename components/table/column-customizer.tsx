"use client";

import { Columns } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { TableColumnConfig } from "@/types";

interface ColumnCustomizerProps {
  columns: TableColumnConfig[];
  onChange: (columns: TableColumnConfig[]) => void;
}

export function ColumnCustomizer({ columns, onChange }: ColumnCustomizerProps) {
  const handleToggle = (columnId: string) => {
    const updatedColumns = columns.map((col) =>
      col.id === columnId ? { ...col, visible: !col.visible } : col
    );
    onChange(updatedColumns);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline">
            <Columns className="size-4" />
            Columns
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-48">
        {columns.map((column) => (
          <DropdownMenuCheckboxItem
            checked={column.visible}
            key={column.id}
            onCheckedChange={() => handleToggle(column.id)}
          >
            {column.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
