import { TableHead } from "@/components/ui/table";

interface StatusColumnHeaderProps {
  columnWidth: number;
  onResizeStart: (e: React.MouseEvent) => void;
}

export function StatusColumnHeader({
  onResizeStart,
}: StatusColumnHeaderProps) {
  return (
    <TableHead className="sticky top-0 z-20 w-32 border-border border-r bg-muted text-xs">
      Status
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
