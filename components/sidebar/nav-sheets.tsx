"use client";

import { Copy, DotsThreeOutlineIcon, PencilSimple, Plus, Spinner, Table, Trash } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { DEFAULT_TABLE_COLUMNS } from "@/constants";
import { useLeadsContext } from "@/components/providers/leads-context";

interface SheetItem {
  id: string;
  name: string;
}

export function NavSheets() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isMobile } = useSidebar();
  const { generatingSheetId } = useLeadsContext();

  const sheets = useQuery(api.sheets.list);
  const allLeads = useQuery(api.leads.listByUser);
  const createSheet = useMutation(api.sheets.create);
  const deleteSheet = useMutation(api.sheets.remove);
  const updateSheet = useMutation(api.sheets.update);
  const createBatchLeads = useMutation(api.leads.createBatch);

  const [editingId, setEditingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const urlSheetId = searchParams.get("sheet");
  const activeSheetId = sheets
    ? urlSheetId && sheets.some((s) => s._id === urlSheetId)
      ? urlSheetId
      : sheets[0]?._id ?? null
    : null;

  const sheetsList: SheetItem[] = sheets?.map((s) => ({ id: s._id, name: s.name })) ?? [];

  async function onAddSheet() {
    if (!sheets) return;
    const sheetId = await createSheet({
      name: `Generation ${sheets.length + 1}`,
      searchParams: null,
      columns: DEFAULT_TABLE_COLUMNS,
    });
    router.replace(`${pathname}?sheet=${sheetId}`);
  }

  async function onDuplicateSheet(id: string) {
    const source = sheets?.find((s) => s._id === id);
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
    if (!sheets || sheets.length <= 1) return;
    await deleteSheet({ sheetId: id as Id<"sheets"> });
    const remaining = sheets.filter((s) => s._id !== id);
    if (activeSheetId === id && remaining[0]) {
      router.replace(`${pathname}?sheet=${remaining[0]._id}`);
    }
  }

  function handleRenameSubmit(id: string) {
    const value = inputRef.current?.value?.trim();
    if (value) {
      updateSheet({ sheetId: id as Id<"sheets">, name: value });
    }
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

  if (!sheets) {
    return (
      <SidebarGroup>
        <SidebarGroupLabel>Sheets</SidebarGroupLabel>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="h-8 animate-pulse rounded-md bg-muted" />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    );
  }

  return (
    <SidebarGroup>
      <SidebarMenu className="flex group-data-[collapsible=icon]:items-center">
        <SidebarMenuItem>
          <SidebarMenuButton
            className="flex items-center text-sidebar-foreground/70 cursor-pointer"
            onClick={onAddSheet}
            tooltip="New sheet"
            size="sm"
          >
            <Plus className="size-3" weight="bold"/>
            <span>New sheet</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
      <SidebarGroupLabel className="mt-1">Sheets</SidebarGroupLabel>
      <SidebarMenu className="flex group-data-[collapsible=icon]:items-center gap-1">
        {sheetsList.map((sheet) => {
          const isActive = sheet.id === activeSheetId;
          const isEditing = editingId === sheet.id;
          const isGenerating = sheet.id === generatingSheetId;

          return (
            <SidebarMenuItem key={sheet.id}>
              {isEditing ? (
                <div className="flex items-center gap-1 px-2 h-6">
                  <input
                    className="box-border w-full min-w-0 rounded border border-primary/60 bg-background px-1.5 py-0.5 text-xs outline-none"
                    defaultValue={sheet.name}
                    onBlur={() => handleRenameSubmit(sheet.id)}
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
                </div>
              ) : (
                <>
                  <SidebarMenuButton
                    isActive={isActive}
                    onClick={() => router.push(`${pathname}?sheet=${sheet.id}`)}
                    onDoubleClick={(e) => {
                      e.preventDefault();
                      setEditingId(sheet.id);
                    }}
                    tooltip={sheet.name}
                    className="cursor-pointer"
                    size="sm"
                  >
                    {isGenerating ? (
                      <Spinner className="size-3.5 shrink-0 animate-spin" weight="bold" />
                    ) : (
                      <Table className="size-3.5 shrink-0 text-primary" weight="fill" />
                    )}
                    <span className="truncate">{sheet.name}</span>
                  </SidebarMenuButton>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className="cursor-pointer"
                      render={
                        <SidebarMenuAction
                          showOnHover
                          className="aria-expanded:bg-muted"
                        />
                      }
                    >
                      <DotsThreeOutlineIcon />
                      <span className="sr-only">More</span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      className="rounded-lg"
                      side={isMobile ? "bottom" : "right"}
                      align={isMobile ? "end" : "start"}
                    >
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={(e) => {
                          e.preventDefault();
                          setEditingId(sheet.id);
                        }}
                      >
                        <PencilSimple className="size-3.5" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={(e) => {
                          e.preventDefault();
                          onDuplicateSheet(sheet.id);
                        }}
                      >
                        <Copy className="size-3.5" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={sheetsList.length <= 1}
                        className="cursor-pointer"
                        onClick={(e) => {
                          e.preventDefault();
                          onDeleteSheet(sheet.id);
                        }}
                        variant="destructive"
                      >
                        <Trash className="size-3.5" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
