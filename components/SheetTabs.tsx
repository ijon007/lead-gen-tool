"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { SheetState } from "@/types"
import { Plus, PencilSimple, Copy, Trash } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"

interface SheetTabsProps {
  sheets: Record<string, SheetState>
  sheetOrder: string[]
  activeSheetId: string
  onSelectSheet: (id: string) => void
  onAddSheet: () => void
  onRenameSheet?: (id: string, name: string) => void
  onDuplicateSheet?: (id: string) => void
  onDeleteSheet?: (id: string) => void
}

const TAB_MIN_W = 100
const TAB_MAX_W = 160

export function SheetTabs({
  sheets,
  sheetOrder,
  activeSheetId,
  onSelectSheet,
  onAddSheet,
  onRenameSheet,
  onDuplicateSheet,
  onDeleteSheet,
}: SheetTabsProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const startEditing = useCallback(
    (sheet: SheetState) => {
      if (!onRenameSheet) return
      setEditingId(sheet.id)
    },
    [onRenameSheet]
  )

  useEffect(() => {
    if (editingId) {
      const t = requestAnimationFrame(() => {
        requestAnimationFrame(() => inputRef.current?.focus())
      })
      return () => cancelAnimationFrame(t)
    }
  }, [editingId])

  const handleDoubleClick = useCallback(
    (sheet: SheetState) => {
      if (onRenameSheet) setEditingId(sheet.id)
    },
    [onRenameSheet]
  )

  const handleRenameSubmit = useCallback(
    (id: string) => {
      const value = inputRef.current?.value?.trim()
      if (onRenameSheet && value) {
        onRenameSheet(id, value)
      }
      setEditingId(null)
    },
    [onRenameSheet]
  )

  const handleRenameCancel = useCallback(() => {
    setEditingId(null)
  }, [])

  const orderedSheets = sheetOrder.map((id) => sheets[id]).filter(Boolean)

  return (
    <div className="flex items-end gap-0 border-b border-border mb-4">
      <div className="flex items-end overflow-x-auto scrollbar-thin">
        {orderedSheets.map((sheet) => {
          const isActive = sheet.id === activeSheetId
          const isEditing = editingId === sheet.id

          return (
            <ContextMenu key={sheet.id}>
              <ContextMenuTrigger
                className={cn(
                  "relative flex items-center border-b-2 transition-colors cursor-pointer shrink-0",
                  "min-h-7 py-1.5",
                  isEditing ? "w-[120px] px-1.5" : "min-w-[100px] max-w-[160px] px-2",
                  isActive
                    ? "border-primary bg-muted/50"
                    : "border-transparent hover:bg-muted/30 hover:border-border"
                )}
                style={
                  !isEditing
                    ? { minWidth: TAB_MIN_W, maxWidth: TAB_MAX_W }
                    : { width: 120 }
                }
                onClick={() => !isEditing && onSelectSheet(sheet.id)}
                onDoubleClick={() => handleDoubleClick(sheet)}
              >
                {isEditing ? (
                  <input
                    key={sheet.id}
                    ref={inputRef}
                    type="text"
                    defaultValue={sheet.name}
                    onBlur={() => handleRenameSubmit(sheet.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.currentTarget.blur()
                      } else if (e.key === "Escape") {
                        handleRenameCancel()
                      }
                    }}
                    className="min-w-0 w-full bg-background border border-primary/60 rounded px-1.5 py-0.5 text-xs outline-none box-border"
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
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem
                  onClick={(e) => {
                    e.preventDefault()
                    startEditing(sheet)
                  }}
                >
                  <PencilSimple className="size-3.5" />
                  Edit
                </ContextMenuItem>
                <ContextMenuItem
                  onClick={(e) => {
                    e.preventDefault()
                    onDuplicateSheet?.(sheet.id)
                  }}
                  disabled={!onDuplicateSheet}
                >
                  <Copy className="size-3.5" />
                  Duplicate
                </ContextMenuItem>
                <ContextMenuItem
                  variant="destructive"
                  onClick={(e) => {
                    e.preventDefault()
                    onDeleteSheet?.(sheet.id)
                  }}
                  disabled={!onDeleteSheet || orderedSheets.length <= 1}
                >
                  <Trash className="size-3.5" />
                  Delete
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
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
