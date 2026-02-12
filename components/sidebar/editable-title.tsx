"use client";

import { PencilSimple } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

interface EditableTitleProps {
  name: string;
  onSave: (name: string) => void;
}

export function EditableTitle({ name, onSave }: EditableTitleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  const handleSave = () => {
    const trimmed = localValue.trim();
    if (trimmed) {
      onSave(trimmed);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setLocalValue(name);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <input
        className="min-w-[8ch] rounded border border-input bg-background px-1.5 py-0.5 font-bold text-foreground text-lg outline-none focus:ring-2 focus:ring-ring"
        onBlur={handleSave}
        onChange={(e) => setLocalValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleSave();
          } else if (e.key === "Escape") {
            handleCancel();
          }
        }}
        ref={inputRef}
        style={{
          width: `${Math.max(8, Math.min(40, localValue.length + 1))}ch`,
        }}
        type="text"
        value={localValue}
      />
    );
  }

  return (
    <div className="flex min-w-0 items-center gap-2">
      <h1 className="truncate font-bold text-2xl text-foreground">{name}</h1>
      <Button
        onClick={() => {
          setLocalValue(name);
          setIsEditing(true);
        }}
        size="icon"
        title="Rename"
        variant="ghost"
      >
        <PencilSimple className="size-5" />
      </Button>
    </div>
  );
}
