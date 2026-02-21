"use client";

import { Sparkle } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { LoadingStage } from "@/components/search-form";

const SEARCH_MESSAGES = [
  "Fetching business listings...",
  "Searching places in your area...",
  "Loading results...",
];

const ENRICH_MESSAGES = [
  "Searching for contact info and social profiles...",
  "Looking up business details...",
  "Finding email and phone numbers...",
  "Checking social media...",
  "Enriching with AI tools...",
  "This may take a few minutes for multiple leads...",
];

interface EnrichmentLoadingProps {
  stage?: LoadingStage;
}

export function EnrichmentLoading({ stage = "search" }: EnrichmentLoadingProps) {
  const effectiveStage = stage ?? "search";
  const messages = effectiveStage === "enrich" ? ENRICH_MESSAGES : SEARCH_MESSAGES;
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setMessageIndex((i) => (i + 1) % messages.length);
    }, 2200);
    return () => clearInterval(id);
  }, [messages.length]);

  return (
    <div className="fade-in-0 slide-in-from-top-4 animate-in relative flex h-[90vh] max-h-[90vh] w-full items-center justify-center overflow-hidden duration-300">
      <div className="h-full w-[90%] rounded-md border">
        <div className="flex h-full flex-col overflow-hidden">
          {/* Skeleton header */}
          <div className="flex h-12 items-center border-b bg-muted/50 px-2.5">
            <div className="flex gap-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-4 w-24 animate-pulse rounded bg-muted-foreground/20"
                  style={{ animationDelay: `${i * 80}ms` }}
                />
              ))}
            </div>
          </div>
          {/* Skeleton rows */}
          <div className="flex-1 divide-y overflow-hidden">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map((row) => (
              <div
                key={row}
                className="flex items-center gap-4 px-2.5 py-3"
                style={{ animationDelay: `${row * 100}ms` }}
              >
                <div className="h-4 w-6 animate-pulse rounded bg-muted-foreground/15" />
                <div className="flex flex-1 gap-4">
                  {[1, 2, 3, 4].map((cell) => (
                    <div
                      key={cell}
                      className="h-4 flex-1 animate-pulse rounded bg-muted-foreground/10"
                      style={{
                        animationDelay: `${(row + cell) * 50}ms`,
                        maxWidth: cell === 2 ? "12rem" : undefined,
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Overlay card - centered on table, original size */}
      <div
        className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center"
        aria-live="polite"
        aria-atomic="true"
      >
        <Card className="h-52 w-52 overflow-hidden border-primary/20 bg-background shadow-lg">
          <div
            className="h-1 w-full"
            style={{
              background:
                "linear-gradient(90deg, transparent, oklch(0.51 0.23 277 / 0.4), transparent)",
              backgroundSize: "200% 100%",
              animation: "shimmer 1.5s ease-in-out infinite",
            }}
          />
          <CardContent className="flex h-full flex-col items-center justify-center gap-3 p-4">
            <Sparkle
              className="size-6 shrink-0 animate-pulse text-primary"
              weight="duotone"
            />
            <div className="flex min-h-10 flex-col items-center justify-center overflow-hidden">
              <p className="font-medium text-sm text-foreground">
                {effectiveStage === "enrich" ? "Enriching leads with AI" : "Fetching leads"}
              </p>
              <p
                key={messageIndex}
                className="text-muted-foreground text-center animate-in fade-in-0 slide-in-from-bottom-1 duration-300"
              >
                {messages[messageIndex]}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
