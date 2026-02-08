"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { SheetState } from "@/types"
import { Plus } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

interface SheetTabsProps {
  sheets: Record<string, SheetState>
  sheetOrder: string[]
  activeSheetId: string
  onSelectSheet: (id: string) => void
  onAddSheet: () => void
  onRenameSheet?: (id: string, name: string) => void
}

export function SheetTabs({
  sheets,
  sheetOrder,
  activeSheetId,
  onSelectSheet,
  onAddSheet,
  onRenameSheet,
}: SheetTabsProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState<string>("")

  const handleDoubleClick = (sheet: SheetState) => {
    if (onRenameSheet) {
      setEditingId(sheet.id)
      setEditValue(sheet.name)
    }
  }

  const handleRenameSubmit = (id: string) => {
    if (onRenameSheet && editValue.trim()) {
      onRenameSheet(id, editValue.trim())
    }
    setEditingId(null)
    setEditValue("")
  }

  const handleRenameCancel = () => {
    setEditingId(null)
    setEditValue("")
  }

  const orderedSheets = sheetOrder.map((id) => sheets[id]).filter(Boolean)

  return (
    <div className="flex items-end gap-0 border-b border-border mb-4">
      <div className="flex items-end overflow-x-auto scrollbar-thin">
        {orderedSheets.map((sheet) => {
          const isActive = sheet.id === activeSheetId
          const isEditing = editingId === sheet.id

          return (
            <div
              key={sheet.id}
              className={cn(
                "relative min-w-[120px] max-w-[200px] px-3 py-2 border-b-2 transition-colors cursor-pointer group",
                isActive
                  ? "border-primary bg-muted/50"
                  : "border-transparent hover:bg-muted/30 hover:border-border"
              )}
              onClick={() => !isEditing && onSelectSheet(sheet.id)}
              onDoubleClick={() => handleDoubleClick(sheet)}
            >
              {isEditing ? (
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => handleRenameSubmit(sheet.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleRenameSubmit(sheet.id)
                    } else if (e.key === "Escape") {
                      handleRenameCancel()
                    }
                  }}
                  className="w-full bg-background border border-primary rounded px-1 py-0.5 text-xs outline-none"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span
                  className={cn(
                    "block truncate text-xs font-medium",
                    isActive ? "text-foreground" : "text-muted-foreground"
                  )}
                  title={sheet.name}
                >
                  {sheet.name}
                </span>
              )}
            </div>
          )
        })}
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={onAddSheet}
        className="border-b-2"
        title="Add new sheet"
      >
        <Plus className="size-3" />
      </Button>
    </div>
  )
}
