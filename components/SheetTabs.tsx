"use client";

import { Copy, PencilSimple, Plus, Trash } from "@phosphor-icons/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { cn } from "@/lib/utils";
import type { SheetState } from "@/types";

interface SheetTabsProps {
  sheets: Record<string, SheetState>;
  sheetOrder: string[];
  activeSheetId: string;
  onSelectSheet: (id: string) => void;
  onAddSheet: () => void;
  onRenameSheet?: (id: string, name: string) => void;
  onDuplicateSheet?: (id: string) => void;
  onDeleteSheet?: (id: string) => void;
}

const TAB_MIN_W = 100;
const TAB_MAX_W = 160;

export function SheetTabs({
  sheets,
  sheetOrder,
  activeSheetId,
  onSelectSheet,
  onAddSheet,
  onRenameSheet,
  onDuplicateSheet,
  onDeleteSheet,
}: SheetTabsProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const startEditing = useCallback(
    (sheet: SheetState) => {
      if (!onRenameSheet) {
        return;
      }
      setEditingId(sheet.id);
    },
    [onRenameSheet]
  );

  useEffect(() => {
    if (editingId) {
      const t = requestAnimationFrame(() => {
        requestAnimationFrame(() => inputRef.current?.focus());
      });
      return () => cancelAnimationFrame(t);
    }
  }, [editingId]);

  const handleDoubleClick = useCallback(
    (sheet: SheetState) => {
      if (onRenameSheet) {
        setEditingId(sheet.id);
      }
    },
    [onRenameSheet]
  );

  const handleRenameSubmit = useCallback(
    (id: string) => {
      const value = inputRef.current?.value?.trim();
      if (onRenameSheet && value) {
        onRenameSheet(id, value);
      }
      setEditingId(null);
    },
    [onRenameSheet]
  );

  const handleRenameCancel = useCallback(() => {
    setEditingId(null);
  }, []);

  const orderedSheets = sheetOrder.map((id) => sheets[id]).filter(Boolean);

  return (
    <div className="mb-4 flex items-end gap-0 border-border border-b">
      <div className="scrollbar-thin flex items-end overflow-x-auto">
        {orderedSheets.map((sheet) => {
          const isActive = sheet.id === activeSheetId;
          const isEditing = editingId === sheet.id;

          return (
            <ContextMenu key={sheet.id}>
              <ContextMenuTrigger
                className={cn(
                  "relative flex shrink-0 cursor-pointer items-center border-b-2 transition-colors",
                  "min-h-7 py-1.5",
                  isEditing
                    ? "w-[120px] px-1.5"
                    : "min-w-[100px] max-w-[160px] px-2",
                  isActive
                    ? "border-primary bg-muted/50"
                    : "border-transparent hover:border-border hover:bg-muted/30"
                )}
                onClick={() => !isEditing && onSelectSheet(sheet.id)}
                onDoubleClick={() => handleDoubleClick(sheet)}
                style={
                  isEditing
                    ? { width: 120 }
                    : { minWidth: TAB_MIN_W, maxWidth: TAB_MAX_W }
                }
              >
                {isEditing ? (
                  <input
                    className="box-border w-full min-w-0 rounded border border-primary/60 bg-background px-1.5 py-0.5 text-xs outline-none"
                    defaultValue={sheet.name}
                    key={sheet.id}
                    onBlur={() => handleRenameSubmit(sheet.id)}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.currentTarget.blur();
                      } else if (e.key === "Escape") {
                        handleRenameCancel();
                      }
                    }}
                    ref={inputRef}
                    type="text"
                  />
                ) : (
                  <span
                    className={cn(
                      "block truncate font-medium text-xs",
                      isActive ? "text-foreground" : "text-muted-foreground"
                    )}
                    title={sheet.name}
                  >
                    {sheet.name}
                  </span>
                )}
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    startEditing(sheet);
                  }}
                >
                  <PencilSimple className="size-3.5" />
                  Edit
                </ContextMenuItem>
                <ContextMenuItem
                  disabled={!onDuplicateSheet}
                  onClick={(e) => {
                    e.preventDefault();
                    onDuplicateSheet?.(sheet.id);
                  }}
                >
                  <Copy className="size-3.5" />
                  Duplicate
                </ContextMenuItem>
                <ContextMenuItem
                  disabled={!onDeleteSheet || orderedSheets.length <= 1}
                  onClick={(e) => {
                    e.preventDefault();
                    onDeleteSheet?.(sheet.id);
                  }}
                  variant="destructive"
                >
                  <Trash className="size-3.5" />
                  Delete
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          );
        })}
      </div>
      <Button
        className="border-b-2"
        onClick={onAddSheet}
        size="icon"
        title="Add new sheet"
        variant="ghost"
      >
        <Plus className="size-3" />
      </Button>
    </div>
  );
}
