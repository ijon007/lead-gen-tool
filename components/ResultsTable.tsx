"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Lead, TableColumnConfig } from "@/types"

interface ResultsTableProps {
  leads: Lead[]
  visibleColumns: TableColumnConfig[]
}

export function ResultsTable({ leads, visibleColumns }: ResultsTableProps) {
  const visibleCols = visibleColumns.filter((col) => col.visible)

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
            {visibleCols.map((column) => (
              <TableHead key={column.id}>{column.label}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow key={lead.id}>
              {visibleCols.map((column) => {
                const value = lead[column.id as keyof Lead] || ""
                return (
                  <TableCell key={column.id} className="text-xs">
                    {String(value)}
                  </TableCell>
                )
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
