"use client";

import { CaretDownIcon, CaretUpIcon, Copy, Plus, Trash } from "@phosphor-icons/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { MarkdownCell } from "@/components/MarkdownCell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { LEAD_STATUSES } from "@/constants";
import type { Lead, TableColumnConfig } from "@/types";
import {
  getStatusBadgeColor,
  getStatusColor,
  getStatusLabel,
  getStatusVariant,
} from "@/utils/status";

const COL_INDEX = "col-index";
const COL_STATUS = "col-status";
const COL_ADD = "col-add";
const DEFAULT_INDEX_WIDTH = 40;
const DEFAULT_ADD_WIDTH = 28;
const DEFAULT_STATUS_WIDTH = 128;
const DEFAULT_COL_WIDTH = 140;
const MIN_COL_WIDTH = 40;
const MIN_ROW_HEIGHT = 32;
const DEFAULT_ROW_HEIGHT = 40;

interface ResultsTableProps {
  leads: Lead[];
  visibleColumns: TableColumnConfig[];
  sheetId: string;
}

type SortDirection = "asc" | "desc" | null;

function isNumeric(value: unknown): boolean {
  if (value === null || value === undefined || value === "") {
    return false;
  }
  const num = Number(value);
  return !isNaN(num) && isFinite(num);
}

function sortLeads(
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

function getColumnKey(col: TableColumnConfig | "index" | "status"): string {
  if (col === "index") {
    return COL_INDEX;
  }
  if (col === "status") {
    return COL_STATUS;
  }
  return `col-${col.id}`;
}

export function ResultsTable({
  leads,
  visibleColumns,
  sheetId,
}: ResultsTableProps) {
  const updateLead = useMutation(api.leads.update);
  const updateSheet = useMutation(api.sheets.update);
  const createLead = useMutation(api.leads.create);
  const removeLead = useMutation(api.leads.remove);

  async function onUpdateLead(id: string, field: keyof Lead, value: string) {
    const updates: Record<string, string | number | undefined> = {};
    updates[field] = value;
    await updateLead({ leadId: id as Id<"leads">, ...updates });
  }

  async function onUpdateStatus(id: string, status: string) {
    await updateLead({ leadId: id as Id<"leads">, status });
  }

  async function onColumnsChange(columns: TableColumnConfig[]) {
    await updateSheet({ sheetId: sheetId as Id<"sheets">, columns });
  }

  async function handleDuplicate(lead: Lead) {
    await createLead({
      sheetId: sheetId as Id<"sheets">,
      businessName: lead.businessName,
      category: lead.category,
      location: lead.location,
      email: lead.email,
      phone: lead.phone,
      website: lead.website,
      address: lead.address,
      description: lead.description,
      status: lead.status,
      rating: lead.rating,
      googleMapsUri: lead.googleMapsUri,
      instagram: lead.instagram,
      facebook: lead.facebook,
      linkedIn: lead.linkedIn,
      x: lead.x,
      notes: lead.notes,
    });
  }

  async function handleDelete(leadId: string) {
    await removeLead({ leadId: leadId as Id<"leads"> });
  }

  const visibleCols = visibleColumns.filter((col) => col.visible);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const initialColumnWidths = useMemo(() => {
    const w: Record<string, number> = {
      [COL_INDEX]: DEFAULT_INDEX_WIDTH,
      [COL_STATUS]: DEFAULT_STATUS_WIDTH,
    };
    visibleCols.forEach((c) => {
      w[getColumnKey(c)] = DEFAULT_COL_WIDTH;
    });
    return w;
  }, [visibleCols]);

  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const effectiveColumnWidths = useMemo(
    () => ({ ...initialColumnWidths, ...columnWidths }),
    [initialColumnWidths, columnWidths]
  );
  const [rowHeights, setRowHeights] = useState<Record<string, number>>({});
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const [resizingRow, setResizingRow] = useState<string | null>(null);
  const resizeStart = useRef({ x: 0, y: 0, width: 0, height: 0 });

  useEffect(() => {
    if (!resizingColumn) return;
    const onMove = (e: MouseEvent) => {
      const w = Math.max(
        MIN_COL_WIDTH,
        resizeStart.current.width + (e.clientX - resizeStart.current.x)
      );
      setColumnWidths((prev) => ({ ...prev, [resizingColumn]: w }));
    };
    const onUp = () => setResizingColumn(null);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [resizingColumn]);

  useEffect(() => {
    if (!resizingRow) {
      return;
    }
    const onMove = (e: MouseEvent) => {
      const h = Math.max(
        MIN_ROW_HEIGHT,
        resizeStart.current.height + (e.clientY - resizeStart.current.y)
      );
      setRowHeights((prev) => ({ ...prev, [resizingRow]: h }));
    };
    const onUp = () => setResizingRow(null);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [resizingRow]);

  const sortedLeads = useMemo(
    () => sortLeads(leads, sortKey, sortDirection),
    [leads, sortKey, sortDirection]
  );

  const handleHeaderClick = (columnId: string) => {
    if (sortKey === columnId) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortKey(null);
        setSortDirection(null);
      }
    } else {
      setSortKey(columnId);
      setSortDirection("asc");
    }
  };

  const startColumnResize =
    (key: string, currentWidth: number) => (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setResizingColumn(key);
      resizeStart.current = {
        x: e.clientX,
        y: 0,
        width: currentWidth,
        height: 0,
      };
    };

  const startRowResize =
    (rowId: string, currentHeight: number) => (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setResizingRow(rowId);
      resizeStart.current = {
        x: 0,
        y: e.clientY,
        width: 0,
        height: currentHeight,
      };
    };

  if (leads.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <p className="text-center text-muted-foreground text-sm">
            No leads found. Try adjusting your search criteria.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="rounded-md border">
      <Table
        className="border-separate border-spacing-0"
        style={{ tableLayout: "fixed", width: "100%" }}
        wrapperClassName="overflow-auto max-h-[calc(100vh-12rem)] scrollbar-thin"
      >
        <colgroup className="border-b">
          <col style={{ width: effectiveColumnWidths[COL_INDEX] }} />
          {visibleCols.map((col) => (
            <col
              key={col.id}
              style={{ width: effectiveColumnWidths[getColumnKey(col)] }}
            />
          ))}
          <col style={{ width: effectiveColumnWidths[COL_STATUS] }} />
          <col style={{ width: DEFAULT_ADD_WIDTH }} />
        </colgroup>
        <TableHeader className="sticky-table-header z-20 bg-muted [&>tr]:bg-muted">
          <TableRow className="border-b [&_th]:border-b">
            <TableHead className="sticky top-0 left-0 z-30 w-10 max-w-12 border-border border-r bg-muted text-center">
              <span className="whitespace-nowrap text-xs">#</span>
              <div
                aria-orientation="vertical"
                className="group absolute top-0 right-0 bottom-0 flex w-1.5 cursor-col-resize touch-none items-center justify-center border-transparent border-r hover:border-primary/40 hover:bg-primary/10 active:bg-primary/20"
                onMouseDown={startColumnResize(
                  COL_INDEX,
                  effectiveColumnWidths[COL_INDEX]
                )}
                role="separator"
              >
                <span className="h-4 w-0.5 rounded-full bg-muted-foreground/40 transition-colors group-hover:bg-primary/70" />
              </div>
            </TableHead>
            {visibleCols.map((column) => {
              const isActive = sortKey === column.id;
              const key = getColumnKey(column);
              return (
                <TableHead
                  className="sticky top-0 z-20 cursor-pointer select-none border-border border-r bg-muted px-2.5 py-1.5 transition-colors hover:bg-muted/80"
                  key={column.id}
                  onClick={() => handleHeaderClick(column.id)}
                >
                  <div className="flex items-center gap-1 pr-2">
                    <span className="whitespace-nowrap text-xs">
                      {column.label}
                    </span>
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
                    onMouseDown={startColumnResize(key, effectiveColumnWidths[key])}
                    role="separator"
                  >
                    <span className="h-4 w-0.5 rounded-full bg-muted-foreground/40 transition-colors group-hover:bg-primary/70" />
                  </div>
                </TableHead>
              );
            })}
            <TableHead className="sticky top-0 z-20 w-32 border-border border-r bg-muted text-xs">
              Status
              <div
                aria-orientation="vertical"
                className="group absolute top-0 right-0 bottom-0 flex w-1.5 cursor-col-resize touch-none items-center justify-center border-transparent border-r hover:border-primary/40 hover:bg-primary/10 active:bg-primary/20"
                onMouseDown={startColumnResize(
                  COL_STATUS,
                  effectiveColumnWidths[COL_STATUS]
                )}
                role="separator"
              >
                <span className="h-4 w-0.5 rounded-full bg-muted-foreground/40 transition-colors group-hover:bg-primary/70" />
              </div>
            </TableHead>
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
                          onColumnsChange(updated);
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
          </TableRow>
        </TableHeader>
        <TableBody className="[&_td]:border-border [&_td]:border-b">
          {sortedLeads.map((lead, index) => {
            const h = rowHeights[lead.id] ?? DEFAULT_ROW_HEIGHT;
            return (
              <ContextMenu key={lead.id}>
                <ContextMenuTrigger
                  render={
                    <TableRow
                      className="group/row"
                      style={{ height: h }}
                    >
                <TableCell className="sticky left-0 z-20 border-border border-r bg-background p-0 text-center align-top text-muted-foreground text-xs">
                  <div className="px-2.5 py-1.5">{index + 1}</div>
                  <div
                    aria-orientation="horizontal"
                    className="absolute right-0 bottom-0 left-0 z-10 flex h-1.5 cursor-row-resize touch-none items-center justify-center opacity-0 transition-opacity hover:bg-primary/20 active:bg-primary/30 group-hover/row:opacity-100"
                    onMouseDown={startRowResize(lead.id, h)}
                    role="separator"
                  >
                    <span className="h-0.5 w-8 rounded-full bg-muted-foreground/40" />
                  </div>
                </TableCell>
                {visibleCols.map((column) => {
                  const raw = lead[column.id as keyof Lead];
                  const value = raw !== undefined && raw !== null ? String(raw) : "";

                  return (
                    <TableCell
                      className="relative p-0 align-top text-xs"
                      key={column.id}
                      style={{
                        minWidth: 0,
                        wordBreak: "break-word",
                        overflowWrap: "break-word",
                      }}
                    >
                      <MarkdownCell
                        className="min-w-0"
                        onSave={(newValue) =>
                          onUpdateLead(
                            lead.id,
                            column.id as keyof Lead,
                            newValue
                          )
                        }
                        value={value}
                      />
                    </TableCell>
                  );
                })}
                <TableCell className="w-32 p-0 align-top">
                  <div className="px-2.5 py-1.5">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <button className="w-full text-left">
                            <Badge
                              className={`cursor-pointer ${getStatusBadgeColor(lead.status)}`}
                              variant={getStatusVariant(lead.status)}
                            >
                              {getStatusLabel(lead.status)}
                            </Badge>
                          </button>
                        }
                      />
                      <DropdownMenuContent align="end" className="max-h-none">
                        {LEAD_STATUSES.map((status) => (
                          <DropdownMenuItem
                            className={getStatusColor(status.value)}
                            key={status.value}
                            onClick={() => {
                              onUpdateStatus(lead.id, status.value);
                            }}
                          >
                            {status.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
                <TableCell className="sticky right-0 z-20 w-8 border-border border-l bg-background p-0 align-top" />
                    </TableRow>
                  }
                />
                <ContextMenuContent>
                  <ContextMenuItem
                    onClick={(e) => {
                      e.preventDefault();
                      handleDuplicate(lead);
                    }}
                  >
                    <Copy className="size-3.5" />
                    Duplicate
                  </ContextMenuItem>
                  <ContextMenuItem
                    onClick={(e) => {
                      e.preventDefault();
                      handleDelete(lead.id);
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
        </TableBody>
      </Table>
    </div>
  );
}
