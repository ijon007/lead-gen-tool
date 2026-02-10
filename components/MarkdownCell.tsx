"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface MarkdownCellProps {
  value: string;
  onSave: (value: string) => void;
  className?: string;
}

export function MarkdownCell({ value, onSave, className }: MarkdownCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing) {
      setLocalValue(value);
      textareaRef.current?.focus();
    }
  }, [isEditing, value]);

  const handleSave = () => {
    const trimmed = localValue.trim();
    if (trimmed !== value) {
      onSave(trimmed);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setLocalValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape") {
      handleCancel();
    } else if (e.key === "Enter" && e.ctrlKey) {
      e.preventDefault();
      handleSave();
    }
  };

  if (isEditing) {
    return (
      <textarea
        className={cn(
          "absolute inset-0 min-h-8 w-full resize-none rounded-none border-2 border-primary bg-background p-2 text-xs outline-none focus:ring-2 focus:ring-primary/20",
          className
        )}
        onBlur={handleSave}
        onChange={(e) => setLocalValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder=""
        ref={textareaRef}
        value={localValue}
      />
    );
  }

  const displayValue = String(value || "").trim();
  if (!displayValue) {
    return (
      <div
        className={cn(
          "flex min-h-8 items-center px-2.5 py-1.5 text-muted-foreground",
          className
        )}
        onClick={() => setIsEditing(true)}
      >
        <span className="text-muted-foreground/60">Click to edit...</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "markdown-cell min-h-8 cursor-text px-2.5 py-1.5",
        className
      )}
      onClick={() => setIsEditing(true)}
    >
      <ReactMarkdown
        components={{
          a: ({ href, children, ...props }) => (
            <a
              className="markdown-cell-link"
              href={href}
              rel="noopener noreferrer"
              target="_blank"
              {...props}
            >
              {children}
            </a>
          ),
          p: ({ children }) => <span className="block">{children}</span>,
        }}
        remarkPlugins={[remarkGfm]}
      >
        {displayValue}
      </ReactMarkdown>
    </div>
  );
}
