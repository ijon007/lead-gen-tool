"use client"

import { useState, useRef, useEffect } from "react"
import { PencilSimple } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"

interface EditableTitleProps {
  name: string
  onSave: (name: string) => void
}

export function EditableTitle({ name, onSave }: EditableTitleProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [localValue, setLocalValue] = useState(name)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing) {
      setLocalValue(name)
      inputRef.current?.focus()
    }
  }, [isEditing, name])

  const handleSave = () => {
    const trimmed = localValue.trim()
    if (trimmed) onSave(trimmed)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setLocalValue(name)
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSave()
          else if (e.key === "Escape") handleCancel()
        }}
        className="text-lg font-bold text-foreground bg-background border border-input rounded px-1.5 py-0.5 min-w-[8ch] outline-none focus:ring-2 focus:ring-ring"
        style={{ width: `${Math.max(8, Math.min(40, localValue.length + 1))}ch` }}
      />
    )
  }

  return (
    <div className="flex items-center gap-2 min-w-0">
      <h1 className="text-2xl font-bold text-foreground truncate">{name}</h1>
      <Button
        onClick={() => setIsEditing(true)}
        variant="ghost"
        size="icon"
        title="Rename"
      >
        <PencilSimple className="size-5" />
      </Button>
    </div>
  )
}
