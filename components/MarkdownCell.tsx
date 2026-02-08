"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { cn } from "@/lib/utils"

interface MarkdownCellProps {
  value: string
  isEditing: boolean
  editValue: string
  onEditChange: (value: string) => void
  onBlur: () => void
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  inputRef: React.RefObject<HTMLTextAreaElement | null>
  onClick: () => void
  className?: string
}

export function MarkdownCell({
  value,
  isEditing,
  editValue,
  onEditChange,
  onBlur,
  onKeyDown,
  inputRef,
  onClick,
  className,
}: MarkdownCellProps) {
  if (isEditing) {
    return (
      <textarea
        ref={inputRef}
        value={editValue}
        onChange={(e) => onEditChange(e.target.value)}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
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
        onClick={onClick}
      >
        <span className="text-muted-foreground/60">Click to edit...</span>
      </div>
    )
  }

  return (
    <div
      className={cn("px-2.5 py-1.5 min-h-8 markdown-cell", className)}
      onClick={onClick}
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
