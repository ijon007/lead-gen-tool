"use client"

import { Button } from "@/components/ui/button"
import { exportToCsv } from "@/utils/csv"
import { Lead, TableColumnConfig } from "@/types"
import { Download } from "@phosphor-icons/react"

interface ExportButtonProps {
  leads: Lead[]
  columns: TableColumnConfig[]
  disabled?: boolean
}

export function ExportButton({ leads, columns, disabled }: ExportButtonProps) {
  const handleExport = () => {
    exportToCsv(leads, columns)
  }

  return (
    <Button
      variant="outline"
      onClick={handleExport}
      disabled={disabled || leads.length === 0}
    >
      <Download className="size-4" />
      Export CSV
    </Button>
  )
}
