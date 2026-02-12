import { CaretDownIcon, CaretUpIcon } from "@phosphor-icons/react";
import { TableHead } from "@/components/ui/table";
import type { TableColumnConfig } from "@/types";
import { getColumnKey } from "@/utils/table-utils";
import type { SortDirection } from "@/utils/table-utils";

interface ColumnHeaderProps {
  column: TableColumnConfig;
  sortKey: string | null;
  sortDirection: SortDirection;
  columnWidth: number;
  onSortChange: (columnId: string, newSortKey: string | null, newSortDirection: SortDirection) => void;
  onResizeStart: (e: React.MouseEvent) => void;
}

function handleHeaderClick(
  columnId: string,
  currentSortKey: string | null,
  currentSortDirection: SortDirection,
  onSortChange: (columnId: string, newSortKey: string | null, newSortDirection: SortDirection) => void
) {
  if (currentSortKey === columnId) {
    if (currentSortDirection === "asc") {
      onSortChange(columnId, columnId, "desc");
    } else if (currentSortDirection === "desc") {
      onSortChange(columnId, null, null);
    }
  } else {
    onSortChange(columnId, columnId, "asc");
  }
}

export function ColumnHeader({
  column,
  sortKey,
  sortDirection,
  columnWidth,
  onSortChange,
  onResizeStart,
}: ColumnHeaderProps) {
  const isActive = sortKey === column.id;
  const key = getColumnKey(column);

  return (
    <TableHead
      className="sticky top-0 z-20 cursor-pointer select-none border-border border-r bg-muted px-2.5 py-1.5 transition-colors hover:bg-muted/80"
      onClick={() => handleHeaderClick(column.id, sortKey, sortDirection, onSortChange)}
    >
      <div className="flex items-center gap-1 pr-2">
        <span className="whitespace-nowrap text-xs">{column.label}</span>
        {isActive &&
          (sortDirection === "asc" ? (
            <CaretUpIcon className="size-3" />
          ) : (
            <CaretDownIcon className="size-3" />
          ))}
      </div>
      <div
        aria-orientation="vertical"
        className="group absolute top-0 right-0 bottom-0 flex w-1.5 cursor-col-resize touch-none items-center justify-center border-transparent border-r hover:border-primary/40 hover:bg-primary/10 active:bg-primary/20"
        onMouseDown={onResizeStart}
        role="separator"
      >
        <span className="h-4 w-0.5 rounded-full bg-muted-foreground/40 transition-colors group-hover:bg-primary/70" />
      </div>
    </TableHead>
  );
}
