"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { TableColumnConfig } from "@/types"
import { Columns } from "@phosphor-icons/react"

interface ColumnCustomizerProps {
  columns: TableColumnConfig[]
  onChange: (columns: TableColumnConfig[]) => void
}

export function ColumnCustomizer({ columns, onChange }: ColumnCustomizerProps) {
  const handleToggle = (columnId: string) => {
    const updatedColumns = columns.map((col) =>
      col.id === columnId ? { ...col, visible: !col.visible } : col
    )
    onChange(updatedColumns)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline">
            <Columns className="size-4" />
            Columns
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-48">
        {columns.map((column) => (
          <DropdownMenuCheckboxItem
            key={column.id}
            checked={column.visible}
            onCheckedChange={() => handleToggle(column.id)}
          >
            {column.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
