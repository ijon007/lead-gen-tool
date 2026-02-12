"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Lead, TableColumnConfig } from "@/types";
import type { LoadingStage } from "./SearchForm";
import { Plus, Spinner } from "@phosphor-icons/react";
import { EmptyState } from "./ResultsTable/EmptyState";
import { IndexColumnHeader } from "./ResultsTable/IndexColumnHeader";
import { ColumnHeader } from "./ResultsTable/ColumnHeader";
import { StatusColumnHeader } from "./ResultsTable/StatusColumnHeader";
import { ColumnVisibilityDropdown } from "./ResultsTable/ColumnVisibilityDropdown";
import { IndexCell } from "./ResultsTable/IndexCell";
import { DataCell } from "./ResultsTable/DataCell";
import { QualificationCell, getQualificationRowAccentClass } from "./ResultsTable/QualificationCell";
import { StatusCell } from "./ResultsTable/StatusCell";
import { RowContextMenu } from "./ResultsTable/RowContextMenu";
import {
  COL_INDEX,
  COL_STATUS,
  DEFAULT_ADD_WIDTH,
  DEFAULT_COL_WIDTH,
  DEFAULT_INDEX_WIDTH,
  DEFAULT_STATUS_WIDTH,
  MIN_COL_WIDTH,
  MIN_ROW_HEIGHT,
  DEFAULT_ROW_HEIGHT,
  sortLeads,
  getColumnKey,
  type SortDirection,
} from "@/utils/table-utils";

const ADD_ONE_MESSAGES = [
  "Adding one lead...",
  "Fetching next result...",
  "Enriching with AI...",
];

export interface ResultsTableProps {
  leads: Lead[];
  visibleColumns: TableColumnConfig[];
  sheetId: string;
  onAddOneLead?: () => void;
  isAddingOneLead?: boolean;
  canAddOneLead?: boolean;
  isLoadingMore?: boolean;
  loadingMoreCount?: number;
  loadingStage?: LoadingStage;
}

export function ResultsTable({
  leads,
  visibleColumns,
  sheetId,
  onAddOneLead,
  isAddingOneLead = false,
  canAddOneLead = false,
  isLoadingMore = false,
  loadingMoreCount,
  loadingStage,
}: ResultsTableProps) {

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

  const handleSortChange = (
    columnId: string,
    newSortKey: string | null,
    newSortDirection: SortDirection
  ) => {
    setSortKey(newSortKey);
    setSortDirection(newSortDirection);
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

  const [addOneMessageIndex, setAddOneMessageIndex] = useState(0);
  useEffect(() => {
    if (!isAddingOneLead) return;
    const id = setInterval(() => {
      setAddOneMessageIndex((i) => (i + 1) % ADD_ONE_MESSAGES.length);
    }, 2200);
    return () => clearInterval(id);
  }, [isAddingOneLead]);

  if (leads.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="min-w-0 rounded-md border">
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
            <IndexColumnHeader
              columnWidth={effectiveColumnWidths[COL_INDEX]}
              onResizeStart={startColumnResize(
                COL_INDEX,
                effectiveColumnWidths[COL_INDEX]
              )}
            />
            {visibleCols.map((column) => {
              const key = getColumnKey(column);
              return (
                <ColumnHeader
                  key={column.id}
                  column={column}
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  columnWidth={effectiveColumnWidths[key]}
                  onSortChange={handleSortChange}
                  onResizeStart={startColumnResize(key, effectiveColumnWidths[key])}
                />
              );
            })}
            <StatusColumnHeader
              columnWidth={effectiveColumnWidths[COL_STATUS]}
              onResizeStart={startColumnResize(
                COL_STATUS,
                effectiveColumnWidths[COL_STATUS]
              )}
            />
            <ColumnVisibilityDropdown
              visibleColumns={visibleColumns}
              sheetId={sheetId}
            />
          </TableRow>
        </TableHeader>
        <TableBody className="[&_td]:border-border [&_td]:border-b">
          {sortedLeads.map((lead, index) => {
            const h = rowHeights[lead.id] ?? DEFAULT_ROW_HEIGHT;
            return (
              <RowContextMenu
                key={lead.id}
                lead={lead}
                sheetId={sheetId}
              >
                <TableRow className="group/row" style={{ height: h }}>
                  <IndexCell
                    index={index}
                    rowId={lead.id}
                    rowHeight={h}
                    onResizeStart={startRowResize(lead.id, h)}
                    rowAccentClass={getQualificationRowAccentClass(lead.qualification)}
                  />
                  {visibleCols.map((column) => {
                    if (column.id === "qualification") {
                      return (
                        <QualificationCell
                          key="qualification"
                          lead={lead}
                        />
                      );
                    }
                    const raw = lead[column.id as keyof Lead];
                    const value =
                      raw !== undefined && raw !== null ? String(raw) : "";

                    return (
                      <DataCell
                        key={column.id}
                        lead={lead}
                        field={column.id as keyof Lead}
                        value={value}
                      />
                    );
                  })}
                  <StatusCell lead={lead} />
                  <TableCell className="sticky right-0 z-20 w-8 border-border border-l bg-background p-0 align-top" />
                </TableRow>
              </RowContextMenu>
            );
          })}
          {isLoadingMore && loadingMoreCount && loadingMoreCount > 0 && (
            <>
              {Array.from({ length: loadingMoreCount }).map((_, idx) => {
                const skeletonRowId = `skeleton-${idx}`;
                const h = DEFAULT_ROW_HEIGHT;
                return (
                  <TableRow key={skeletonRowId} className="group/row" style={{ height: h }}>
                    <TableCell className="px-2.5 py-3 align-top">
                      <div className="h-4 w-6 animate-pulse rounded bg-muted-foreground/15" />
                    </TableCell>
                    {visibleCols.map((column) => (
                      <TableCell key={column.id} className="px-2.5 py-3 align-top">
                        <div
                          className="h-4 flex-1 animate-pulse rounded bg-muted-foreground/10"
                          style={{
                            animationDelay: `${(idx + 1) * 50}ms`,
                            maxWidth: column.id === "address" ? "12rem" : undefined,
                          }}
                        />
                      </TableCell>
                    ))}
                    <TableCell className="px-2.5 py-3 align-top">
                      <div className="h-4 w-16 animate-pulse rounded bg-muted-foreground/15" />
                    </TableCell>
                    <TableCell className="sticky right-0 z-20 w-8 border-border border-l bg-background p-0 align-top" />
                  </TableRow>
                );
              })}
            </>
          )}
        </TableBody>
      </Table>
      <div className="flex items-center justify-center gap-2 border-t border-border bg-muted/30 ">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-1.5"
          disabled={!canAddOneLead || isAddingOneLead || !onAddOneLead}
          onClick={onAddOneLead}
        >
          {isAddingOneLead ? (
            <>
              <Spinner className="size-4 animate-spin duration-1000" weight="bold" />
              <span className="text-muted-foreground text-xs">
                {ADD_ONE_MESSAGES[addOneMessageIndex]}
              </span>
            </>
          ) : (
            <>
              <Plus className="size-3" weight="bold" />
              <span className="text-muted-foreground text-xs">
                Add new lead
              </span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
