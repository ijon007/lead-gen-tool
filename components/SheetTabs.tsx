"use client";

import { Copy, PencilSimple, Plus, Spinner, Trash } from "@phosphor-icons/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { DEFAULT_TABLE_COLUMNS } from "@/constants";
import { cn } from "@/lib/utils";
import type { Doc } from "@/convex/_generated/dataModel";

interface SheetTabItem {
  id: string;
  name: string;
}

interface SheetTabsProps {
  sheets: Doc<"sheets">[];
  activeSheetId: string;
  generatingSheetId?: string | null;
  onRenameSheet: (id: string, name: string) => void;
}

const TAB_MIN_W = 100;
const TAB_MAX_W = 160;

export function SheetTabs({
  sheets,
  activeSheetId,
  generatingSheetId = null,
  onRenameSheet,
}: SheetTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const allLeads = useQuery(api.leads.listByUser);
  const createSheet = useMutation(api.sheets.create);
  const deleteSheet = useMutation(api.sheets.remove);
  const createBatchLeads = useMutation(api.leads.createBatch);

  const [editingId, setEditingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const sheetsRecord = useMemo(() => {
    const record: Record<string, SheetTabItem> = {};
    for (const sheet of sheets) {
      record[sheet._id] = { id: sheet._id, name: sheet.name };
    }
    return record;
  }, [sheets]);

  const sheetOrder = useMemo(() => sheets.map((s) => s._id), [sheets]);

  function onSelectSheet(id: string) {
    router.replace(`${pathname}?sheet=${id}`);
  }

  async function onAddSheet() {
    const sheetId = await createSheet({
      name: `Generation ${sheets.length + 1}`,
      searchParams: null,
      columns: DEFAULT_TABLE_COLUMNS,
    });
    router.replace(`${pathname}?sheet=${sheetId}`);
  }

  async function onDuplicateSheet(id: string) {
    const source = sheets.find((s) => s._id === id);
    if (!source || !allLeads) return;
    const sourceLeads = allLeads.filter((l) => l.sheetId === id);
    const newSheetId = await createSheet({
      name: `${source.name} (copy)`,
      searchParams: source.searchParams,
      columns: source.columns,
    });
    if (sourceLeads.length > 0) {
      const leadsToInsert = sourceLeads.map((lead) => {
        const { _id, _creationTime, sheetId, userId, ...rest } = lead;
        return rest;
      });
      await createBatchLeads({ sheetId: newSheetId, leads: leadsToInsert });
    }
    router.replace(`${pathname}?sheet=${newSheetId}`);
  }

  async function onDeleteSheet(id: string) {
    if (sheets.length <= 1) return;
    await deleteSheet({ sheetId: id as Id<"sheets"> });
    const remaining = sheets.filter((s) => s._id !== id);
    if (activeSheetId === id && remaining[0]) {
      router.replace(`${pathname}?sheet=${remaining[0]._id}`);
    }
  }

  function startEditing(sheet: SheetTabItem) {
    setEditingId(sheet.id);
  }

  function handleDoubleClick(sheet: SheetTabItem) {
    setEditingId(sheet.id);
  }

  function handleRenameSubmit(id: string) {
    const value = inputRef.current?.value?.trim();
    if (value) onRenameSheet(id, value);
    setEditingId(null);
  }

  function handleRenameCancel() {
    setEditingId(null);
  }

  useEffect(() => {
    if (editingId) {
      const t = requestAnimationFrame(() => {
        requestAnimationFrame(() => inputRef.current?.focus());
      });
      return () => cancelAnimationFrame(t);
    }
  }, [editingId]);

  const orderedSheets = sheetOrder.map((id) => sheetsRecord[id]).filter(Boolean);

  return (
    <div className="flex items-end gap-0 border-border border-b">
      <div className="scrollbar-thin flex items-end overflow-x-auto">
        {orderedSheets.map((sheet) => {
          const isActive = sheet.id === activeSheetId;
          const isEditing = editingId === sheet.id;
          const isGenerating = sheet.id === generatingSheetId;

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
                      "flex min-w-0 items-center gap-1.5 font-medium text-xs",
                      isActive ? "text-foreground" : "text-muted-foreground"
                    )}
                    title={sheet.name}
                  >
                    {isGenerating && (
                      <Spinner className="size-3.5 shrink-0 animate-spin" weight="bold" />
                    )}
                    <span className="truncate">{sheet.name}</span>
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
                  onClick={(e) => {
                    e.preventDefault();
                    onDuplicateSheet(sheet.id);
                  }}
                >
                  <Copy className="size-3.5" />
                  Duplicate
                </ContextMenuItem>
                <ContextMenuItem
                  disabled={orderedSheets.length <= 1}
                  onClick={(e) => {
                    e.preventDefault();
                    onDeleteSheet(sheet.id);
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
