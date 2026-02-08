"use client"

import { useState, useRef, useEffect } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { cn } from "@/lib/utils"

interface MarkdownCellProps {
  value: string
  onSave: (value: string) => void
  className?: string
}

export function MarkdownCell({
  value,
  onSave,
  className,
}: MarkdownCellProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [localValue, setLocalValue] = useState(value)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isEditing) {
      setLocalValue(value)
      textareaRef.current?.focus()
    }
  }, [isEditing, value])

  const handleSave = () => {
    const trimmed = localValue.trim()
    if (trimmed !== value) onSave(trimmed)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setLocalValue(value)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape") {
      handleCancel()
    } else if (e.key === "Enter" && e.ctrlKey) {
      e.preventDefault()
      handleSave()
    }
  }

  if (isEditing) {
    return (
      <textarea
        ref={textareaRef}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className={cn(
          "absolute inset-0 w-full min-h-8 border-2 border-primary rounded-none bg-background text-xs outline-none focus:ring-2 focus:ring-primary/20 p-2 resize-none",
          className
        )}
        placeholder="Markdown: **bold**, *italic*, [links](url), # headings, - lists, > quote, \`code\`, ~~strike~~, tables..."
      />
    )
  }

  const displayValue = String(value || "").trim()
  if (!displayValue) {
    return (
      <div
        className={cn("px-2.5 py-1.5 min-h-8 flex items-center text-muted-foreground", className)}
        onClick={() => setIsEditing(true)}
      >
        <span className="text-muted-foreground/60">Click to edit...</span>
      </div>
    )
  }

  return (
    <div
      className={cn("px-2.5 py-1.5 min-h-8 markdown-cell cursor-text", className)}
      onClick={() => setIsEditing(true)}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children, ...props }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="markdown-cell-link"
              {...props}
            >
              {children}
            </a>
          ),
          p: ({ children }) => <span className="block">{children}</span>,
        }}
      >
        {displayValue}
      </ReactMarkdown>
    </div>
  )
}
