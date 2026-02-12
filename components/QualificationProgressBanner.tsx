"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircleIcon, Spinner, X } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const ROTATING_MESSAGES = [
  "Checking fit…",
  "Reading their profile…",
  "Searching for details…",
  "Evaluating criteria…",
  "Almost there…",
];

const MESSAGE_INTERVAL_MS = 2200;

export interface QualificationProgressBannerProps {
  total: number;
  done: number;
  isComplete: boolean;
  onDismiss: () => void;
}

export function QualificationProgressBanner({
  total,
  done,
  isComplete,
  onDismiss,
}: QualificationProgressBannerProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isComplete) return;
    const id = setInterval(() => {
      setMessageIndex((i) => (i + 1) % ROTATING_MESSAGES.length);
    }, MESSAGE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [isComplete]);

  const progressPercent = total > 0 ? Math.min(100, (done / total) * 100) : 0;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed bottom-4 left-1/2 z-50 -translate-x-1/2",
        "flex items-center gap-2 rounded-full border border-border bg-background/95 px-3 py-1.5 shadow-md backdrop-blur-sm",
        "transition-all duration-300 ease-out",
        mounted
          ? "translate-y-0 opacity-100"
          : "translate-y-3 opacity-0"
      )}
    >
      {isComplete ? (
        <>
          <CheckCircleIcon
            className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400"
            weight="fill"
          />
          <span className="text-xs font-medium text-foreground">
            Done. {total} lead{total === 1 ? "" : "s"} qualified.
          </span>
        </>
      ) : (
        <>
          <Spinner
            className="size-4 shrink-0 animate-spin text-primary"
            weight="bold"
          />
          <div className="flex min-w-0 flex-col gap-px">
            <span className="text-xs font-medium leading-tight text-foreground">
              Qualifying… {done}/{total} leads
            </span>
            <span
              key={messageIndex}
              className="animate-in fade-in-50 slide-in-from-bottom-1 text-[10px] leading-tight text-muted-foreground duration-300"
            >
              {ROTATING_MESSAGES[messageIndex]}
            </span>
          </div>
          <div className="h-1.5 w-14 shrink-0 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary/80 transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </>
      )}
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="h-6 w-6 shrink-0 rounded-full p-0"
        onClick={onDismiss}
        aria-label="Dismiss"
      >
        <X className="size-3.5" weight="bold" />
      </Button>
    </div>
  );
}
