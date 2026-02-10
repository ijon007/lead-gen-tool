"use client";

import { Sparkle } from "@phosphor-icons/react";
import { Card, CardContent } from "@/components/ui/card";

export function EnrichmentLoading() {
  return (
    <div className="fade-in-0 slide-in-from-top-4 animate-in space-y-4 duration-300">
      <div className="rounded-md border">
        <div className="overflow-hidden">
          {/* Skeleton header */}
          <div className="border-b bg-muted/50 px-2.5 py-1.5">
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
          <div className="divide-y">
            {[1, 2, 3, 4, 5, 6, 7].map((row) => (
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
      <Card className="overflow-hidden border-primary/20 bg-primary/5">
        <div
          className="h-1 w-full"
          style={{
            background:
              "linear-gradient(90deg, transparent, oklch(0.51 0.23 277 / 0.4), transparent)",
            backgroundSize: "200% 100%",
            animation: "shimmer 1.5s ease-in-out infinite",
          }}
        />
        <CardContent className="flex items-center justify-center gap-3 py-8">
          <Sparkle
            className="size-6 animate-pulse text-primary"
            weight="duotone"
          />
          <div className="flex flex-col items-center gap-1">
            <p className="font-medium text-foreground">
              Enriching leads with AI
            </p>
            <p className="text-muted-foreground text-sm">
              Searching for contact info and social profiles...
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
