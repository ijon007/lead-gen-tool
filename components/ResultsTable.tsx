"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import { Lead, TableColumnConfig } from "@/types"
import { LEAD_STATUSES } from "@/constants"
import { CaretDownIcon, CaretUpIcon, Plus } from "@phosphor-icons/react"
import { getStatusLabel, getStatusVariant, getStatusColor, getStatusBadgeColor } from "@/utils/status"
import { MarkdownCell } from "@/components/MarkdownCell"

const COL_INDEX = "col-index"
const COL_STATUS = "col-status"
const COL_ADD = "col-add"
const DEFAULT_INDEX_WIDTH = 40
const DEFAULT_ADD_WIDTH = 28
const DEFAULT_STATUS_WIDTH = 128
const DEFAULT_COL_WIDTH = 140
const MIN_COL_WIDTH = 40
const MIN_ROW_HEIGHT = 32
const DEFAULT_ROW_HEIGHT = 40

interface ResultsTableProps {
  leads: Lead[]
  visibleColumns: TableColumnConfig[]
  onUpdateLead: (id: string, field: keyof Lead, value: string) => void
  onUpdateStatus: (id: string, status: string) => void
  onColumnsChange?: (columns: TableColumnConfig[]) => void
}

type SortDirection = "asc" | "desc" | null

function isNumeric(value: unknown): boolean {
  if (value === null || value === undefined || value === "") return false
  const num = Number(value)
  return !isNaN(num) && isFinite(num)
}

function sortLeads(leads: Lead[], sortKey: string | null, sortDirection: SortDirection): Lead[] {
  if (!sortKey || !sortDirection) return leads

  return [...leads].sort((a, b) => {
    const aValue = a[sortKey as keyof Lead]
    const bValue = b[sortKey as keyof Lead]

    if (aValue === null || aValue === undefined) return 1
    if (bValue === null || bValue === undefined) return -1

    const aStr = String(aValue)
    const bStr = String(bValue)

    let comparison = 0
    if (isNumeric(aValue) && isNumeric(bValue)) {
      comparison = Number(aValue) - Number(bValue)
    } else {
      comparison = aStr.localeCompare(bStr, undefined, { numeric: true, sensitivity: "base" })
    }

    return sortDirection === "asc" ? comparison : -comparison
  })
}

function getColumnKey(col: TableColumnConfig | "index" | "status"): string {
  if (col === "index") return COL_INDEX
  if (col === "status") return COL_STATUS
  return `col-${col.id}`
}

export function ResultsTable({
  leads,
  visibleColumns,
  onUpdateLead,
  onUpdateStatus,
  onColumnsChange,
}: ResultsTableProps) {
  const visibleCols = visibleColumns.filter((col) => col.visible)
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)

  const initialColumnWidths = useMemo(() => {
    const w: Record<string, number> = {
      [COL_INDEX]: DEFAULT_INDEX_WIDTH,
      [COL_STATUS]: DEFAULT_STATUS_WIDTH,
    }
    visibleCols.forEach((c) => {
      w[getColumnKey(c)] = DEFAULT_COL_WIDTH
    })
    return w
  }, [visibleCols])

  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(initialColumnWidths)
  const [rowHeights, setRowHeights] = useState<Record<string, number>>({})
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const [resizingColumn, setResizingColumn] = useState<string | null>(null)
  const [resizingRow, setResizingRow] = useState<string | null>(null)
  const resizeStart = useRef({ x: 0, y: 0, width: 0, height: 0 })

  const visibleColumnIds = useMemo(
    () => visibleColumns.filter((c) => c.visible).map((c) => c.id).sort().join(","),
    [visibleColumns]
  )

  useEffect(() => {
    setColumnWidths((prev) => {
      const next = { ...prev }
      next[COL_INDEX] = prev[COL_INDEX] ?? DEFAULT_INDEX_WIDTH
      next[COL_STATUS] = prev[COL_STATUS] ?? DEFAULT_STATUS_WIDTH
      visibleCols.forEach((c) => {
        const k = getColumnKey(c)
        if (next[k] == null) next[k] = DEFAULT_COL_WIDTH
      })
      return next
    })
  }, [visibleColumnIds])

  useEffect(() => {
    if (!resizingColumn) return
    const onMove = (e: MouseEvent) => {
      const w = Math.max(
        MIN_COL_WIDTH,
        resizeStart.current.width + (e.clientX - resizeStart.current.x)
      )
      setColumnWidths((prev) => ({ ...prev, [resizingColumn]: w }))
    }
    const onUp = () => setResizingColumn(null)
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
    return () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
    }
  }, [resizingColumn])

  useEffect(() => {
    if (!resizingRow) return
    const onMove = (e: MouseEvent) => {
      const h = Math.max(
        MIN_ROW_HEIGHT,
        resizeStart.current.height + (e.clientY - resizeStart.current.y)
      )
      setRowHeights((prev) => ({ ...prev, [resizingRow]: h }))
    }
    const onUp = () => setResizingRow(null)
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
    return () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
    }
  }, [resizingRow])

  const sortedLeads = useMemo(
    () => sortLeads(leads, sortKey, sortDirection),
    [leads, sortKey, sortDirection]
  )

  const handleHeaderClick = (columnId: string) => {
    if (sortKey === columnId) {
      if (sortDirection === "asc") {
        setSortDirection("desc")
      } else if (sortDirection === "desc") {
        setSortKey(null)
        setSortDirection(null)
      }
    } else {
      setSortKey(columnId)
      setSortDirection("asc")
    }
  }

  const startColumnResize = (key: string, currentWidth: number) => (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setResizingColumn(key)
    resizeStart.current = { x: e.clientX, y: 0, width: currentWidth, height: 0 }
  }

  const startRowResize = (rowId: string, currentHeight: number) => (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setResizingRow(rowId)
    resizeStart.current = { x: 0, y: e.clientY, width: 0, height: currentHeight }
  }

  if (leads.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <p className="text-center text-sm text-muted-foreground">
            No leads found. Try adjusting your search criteria.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="border rounded-md">
      <Table
        className="border-separate border-spacing-0"
        style={{ tableLayout: "fixed", width: "100%" }}
        wrapperClassName="overflow-auto max-h-[calc(100vh-12rem)] scrollbar-thin"
      >
        <colgroup className="border-b">
          <col style={{ width: columnWidths[COL_INDEX] }} />
          {visibleCols.map((col) => (
            <col key={col.id} style={{ width: columnWidths[getColumnKey(col)] }} />
          ))}
          <col style={{ width: columnWidths[COL_STATUS] }} />
          <col style={{ width: DEFAULT_ADD_WIDTH }} />
        </colgroup>
        <TableHeader className="sticky-table-header z-20 bg-muted [&>tr]:bg-muted">
          <TableRow className="border-b [&_th]:border-b">
            <TableHead className="sticky left-0 top-0 z-30 w-10 max-w-12 text-center bg-muted border-r border-border">
              <span className="whitespace-nowrap text-xs">#</span>
              <div
                role="separator"
                aria-orientation="vertical"
                className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize touch-none flex items-center justify-center group border-r border-transparent hover:border-primary/40 hover:bg-primary/10 active:bg-primary/20"
                onMouseDown={startColumnResize(COL_INDEX, columnWidths[COL_INDEX])}
              >
                <span className="w-0.5 h-4 rounded-full bg-muted-foreground/40 group-hover:bg-primary/70 transition-colors" />
              </div>
            </TableHead>
            {visibleCols.map((column) => {
              const isActive = sortKey === column.id
              const key = getColumnKey(column)
              return (
                <TableHead
                  key={column.id}
                  className="sticky top-0 z-20 cursor-pointer select-none hover:bg-muted/80 transition-colors bg-muted px-2.5 py-1.5 border-r border-border"
                  onClick={() => handleHeaderClick(column.id)}
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
                    role="separator"
                    aria-orientation="vertical"
                    className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize touch-none flex items-center justify-center group border-r border-transparent hover:border-primary/40 hover:bg-primary/10 active:bg-primary/20"
                    onMouseDown={startColumnResize(key, columnWidths[key])}
                  >
                    <span className="w-0.5 h-4 rounded-full bg-muted-foreground/40 group-hover:bg-primary/70 transition-colors" />
                  </div>
                </TableHead>
              )
            })}
            <TableHead className="sticky top-0 z-20 w-32 text-xs bg-muted border-r border-border">
              Status
              <div
                role="separator"
                aria-orientation="vertical"
                className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize touch-none flex items-center justify-center group border-r border-transparent hover:border-primary/40 hover:bg-primary/10 active:bg-primary/20"
                onMouseDown={startColumnResize(COL_STATUS, columnWidths[COL_STATUS])}
              >
                <span className="w-0.5 h-4 rounded-full bg-muted-foreground/40 group-hover:bg-primary/70 transition-colors" />
              </div>
            </TableHead>
            <TableHead className="sticky right-0 top-0 z-30 bg-muted border-l border-border p-0 w-8">
              {onColumnsChange && mounted ? (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <button
                        type="button"
                        className="flex h-full w-full items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                        aria-label="Add or remove columns"
                      >
                        <Plus className="size-3" />
                      </button>
                    }
                  />
                  <DropdownMenuContent align="end" className="w-48">
                    {visibleColumns.map((column) => (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        checked={column.visible}
                        onCheckedChange={() => {
                          const updated = visibleColumns.map((col) =>
                            col.id === column.id ? { ...col, visible: !col.visible } : col
                          )
                          onColumnsChange(updated)
                        }}
                      >
                        {column.label}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : onColumnsChange ? (
                <span className="flex h-full w-full items-center justify-center text-muted-foreground">
                  <Plus className="size-4" />
                </span>
              ) : null}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="[&_td]:border-b [&_td]:border-border">
          {sortedLeads.map((lead, index) => {
            const h = rowHeights[lead.id] ?? DEFAULT_ROW_HEIGHT
            return (
              <TableRow key={lead.id} style={{ height: h }} className="group/row">
                <TableCell className="sticky left-0 z-20 bg-background text-center text-xs text-muted-foreground p-0 align-top border-r border-border">
                  <div className="py-1.5 px-2.5">{index + 1}</div>
                  <div
                    role="separator"
                    aria-orientation="horizontal"
                    className="absolute left-0 right-0 bottom-0 h-1.5 cursor-row-resize touch-none hover:bg-primary/20 active:bg-primary/30 opacity-0 group-hover/row:opacity-100 transition-opacity flex items-center justify-center z-10"
                    onMouseDown={startRowResize(lead.id, h)}
                  >
                    <span className="h-0.5 w-8 rounded-full bg-muted-foreground/40" />
                  </div>
                </TableCell>
                {visibleCols.map((column) => {
                  const value = lead[column.id as keyof Lead] || ""

                  return (
                    <TableCell
                      key={column.id}
                      className="text-xs relative p-0 align-top"
                      style={{ minWidth: 0, wordBreak: "break-word", overflowWrap: "break-word" }}
                    >
                      <MarkdownCell
                        value={String(value)}
                        onSave={(newValue) =>
                          onUpdateLead(lead.id, column.id as keyof Lead, newValue)
                        }
                        className="min-w-0"
                      />
                    </TableCell>
                  )
                })}
                <TableCell className="w-32 p-0 align-top">
                  <div className="py-1.5 px-2.5">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <button className="w-full text-left">
                            <Badge
                              variant={getStatusVariant(lead.status)}
                              className={`cursor-pointer ${getStatusBadgeColor(lead.status)}`}
                            >
                              {getStatusLabel(lead.status)}
                            </Badge>
                          </button>
                        }
                      />
                      <DropdownMenuContent align="end" className="max-h-none">
                        {LEAD_STATUSES.map((status) => (
                          <DropdownMenuItem
                            key={status.value}
                            onClick={() => {
                              onUpdateStatus(lead.id, status.value)
                            }}
                            className={getStatusColor(status.value)}
                          >
                            {status.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
                <TableCell className="sticky right-0 z-20 w-8 p-0 align-top bg-background border-l border-border" />
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
