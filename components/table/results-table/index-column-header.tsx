import { TableHead } from "@/components/ui/table";

interface IndexColumnHeaderProps {
  columnWidth: number;
  onResizeStart: (e: React.MouseEvent) => void;
}

export function IndexColumnHeader({
  columnWidth,
  onResizeStart,
}: IndexColumnHeaderProps) {
  return (
    <TableHead className="sticky top-0 left-0 z-30 w-10 max-w-12 border-border border-r bg-muted text-center">
      <span className="whitespace-nowrap text-xs">#</span>
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
