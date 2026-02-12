import { TableCell } from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface IndexCellProps {
  index: number;
  rowId: string;
  rowHeight: number;
  onResizeStart: (e: React.MouseEvent) => void;
  rowAccentClass?: string;
}

export function IndexCell({
  index,
  rowId,
  rowHeight,
  onResizeStart,
  rowAccentClass,
}: IndexCellProps) {
  return (
    <TableCell className="sticky left-0 z-20 border-border border-r bg-background p-0 text-center align-top text-muted-foreground text-xs">
      {rowAccentClass ? (
        <div className={cn("absolute left-0 top-0 bottom-0 w-1/12 shrink-0", rowAccentClass)} aria-hidden />
      ) : null}
      <div className="px-2.5 py-1.5">{index + 1}</div>
      <div
        aria-orientation="horizontal"
        className="absolute right-0 bottom-0 left-0 z-10 flex h-1.5 cursor-row-resize touch-none items-center justify-center opacity-0 transition-opacity hover:bg-primary/20 active:bg-primary/30 group-hover/row:opacity-100"
        onMouseDown={onResizeStart}
        role="separator"
      >
        <span className="h-0.5 w-8 rounded-full bg-muted-foreground/40" />
      </div>
    </TableCell>
  );
}
