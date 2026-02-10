"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Lead, TableColumnConfig } from "@/types";
import { EmptyState } from "./ResultsTable/EmptyState";
import { IndexColumnHeader } from "./ResultsTable/IndexColumnHeader";
import { ColumnHeader } from "./ResultsTable/ColumnHeader";
import { StatusColumnHeader } from "./ResultsTable/StatusColumnHeader";
import { ColumnVisibilityDropdown } from "./ResultsTable/ColumnVisibilityDropdown";
import { IndexCell } from "./ResultsTable/IndexCell";
import { DataCell } from "./ResultsTable/DataCell";
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

interface ResultsTableProps {
  leads: Lead[];
  visibleColumns: TableColumnConfig[];
  sheetId: string;
}

export function ResultsTable({
  leads,
  visibleColumns,
  sheetId,
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

  if (leads.length === 0) {
    return <EmptyState />;
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
                  />
                  {visibleCols.map((column) => {
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
        </TableBody>
      </Table>
    </div>
  );
}
