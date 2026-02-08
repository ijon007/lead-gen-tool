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
} from "@/components/ui/dropdown-menu"
import { Lead, TableColumnConfig } from "@/types"
import { LEAD_STATUSES } from "@/constants"
import { CaretDownIcon, CaretUpIcon } from "@phosphor-icons/react"
import { getStatusLabel, getStatusVariant, getStatusColor, getStatusBadgeColor } from "@/utils/status"
import { MarkdownCell } from "@/components/MarkdownCell"

interface ResultsTableProps {
  leads: Lead[]
  visibleColumns: TableColumnConfig[]
  onUpdateLead: (id: string, field: keyof Lead, value: string) => void
  onUpdateStatus: (id: string, status: string) => void
}

type SortDirection = "asc" | "desc" | null

function isNumeric(value: any): boolean {
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

export function ResultsTable({
  leads,
  visibleColumns,
  onUpdateLead,
  onUpdateStatus,
}: ResultsTableProps) {
  const visibleCols = visibleColumns.filter((col) => col.visible)
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const [editingCell, setEditingCell] = useState<{ rowId: string; columnId: string } | null>(
    null
  )
  const [editValue, setEditValue] = useState<string>("")
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const sortedLeads = useMemo(
    () => sortLeads(leads, sortKey, sortDirection),
    [leads, sortKey, sortDirection]
  )

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editingCell])

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

  const handleCellClick = (rowId: string, columnId: string, currentValue: string) => {
    setEditingCell({ rowId, columnId })
    setEditValue(String(currentValue || ""))
  }

  const handleCellBlur = () => {
    if (editingCell) {
      onUpdateLead(editingCell.rowId, editingCell.columnId as keyof Lead, editValue)
      setEditingCell(null)
      setEditValue("")
    }
  }

  const handleCellKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape") {
      setEditingCell(null)
      setEditValue("")
    } else if (e.key === "Tab" || (e.key === "Enter" && e.ctrlKey)) {
      e.preventDefault()
      e.currentTarget.blur()
    }
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
    <div className="overflow-x-auto border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10 max-w-12 text-center">#</TableHead>
            {visibleCols.map((column) => {
              const isActive = sortKey === column.id
              return (
                <TableHead
                  key={column.id}
                  className="cursor-pointer select-none hover:bg-muted/50 transition-colors"
                  onClick={() => handleHeaderClick(column.id)}
                >
                  <div className="flex items-center gap-1">
                    <span className="whitespace-nowrap text-xs">{column.label}</span>
                    {isActive && (
                      sortDirection === "asc" ? (
                        <CaretUpIcon className="size-3" />
                      ) : (
                        <CaretDownIcon className="size-3" />
                      )
                    )}
                  </div>
                </TableHead>
              )
            })}
            <TableHead className="w-32 text-xs">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedLeads.map((lead, index) => (
            <TableRow key={lead.id}>
              <TableCell className="text-center text-xs text-muted-foreground w-10 max-w-12 p-0">
                {index + 1}
              </TableCell>
              {visibleCols.map((column) => {
                const value = lead[column.id as keyof Lead] || ""
                const isEditing =
                  editingCell?.rowId === lead.id && editingCell?.columnId === column.id

                return (
                  <TableCell
                    key={column.id}
                    className={`text-xs relative p-0 ${!isEditing ? "cursor-text" : ""}`}
                    onClick={() => !isEditing && handleCellClick(lead.id, column.id, String(value))}
                  >
                    <MarkdownCell
                      value={String(value)}
                      isEditing={isEditing}
                      editValue={editValue}
                      onEditChange={setEditValue}
                      onBlur={handleCellBlur}
                      onKeyDown={handleCellKeyDown}
                      inputRef={inputRef}
                      onClick={() => handleCellClick(lead.id, column.id, String(value))}
                    />
                  </TableCell>
                )
              })}
              <TableCell className="w-32">
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <button className="w-full text-left">
                        <Badge variant={getStatusVariant(lead.status)} className={`cursor-pointer ${getStatusBadgeColor(lead.status)}`}>
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
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
