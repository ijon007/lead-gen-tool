"use client";

import { TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import type { Lead } from "@/types";

const QUALIFICATIONS = [
  { value: "High" as const, label: "High", className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30" },
  { value: "Low" as const, label: "Low", className: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30" },
  { value: "Skip" as const, label: "Skip", className: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30" },
] as const;

export type Qualification = "High" | "Low" | "Skip";

/** Tailwind bg class for row accent bar (Low/Skip); empty for High or undefined */
export function getQualificationRowAccentClass(q: Qualification | undefined): string {
  if (q === "Low") return "bg-amber-500";
  if (q === "Skip") return "bg-red-500";
  return "";
}

interface QualificationCellProps {
  lead: Lead;
}

function getQualificationClass(q: Qualification | undefined): string {
  if (!q) return "bg-muted/50 text-muted-foreground border-border";
  const found = QUALIFICATIONS.find((x) => x.value === q);
  return found?.className ?? "bg-muted text-muted-foreground border-border";
}

async function onUpdateQualification(
  id: string,
  qualification: Qualification,
  updateLead: ReturnType<typeof useMutation<typeof api.leads.update>>
) {
  await updateLead({ leadId: id as Id<"leads">, qualification });
}

export function QualificationCell({ lead }: QualificationCellProps) {
  const updateLead = useMutation(api.leads.update);
  const value = lead.qualification;

  return (
    <TableCell className="w-28 p-0 align-top">
      <div className="px-2.5 py-1.5">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button className="w-full text-left" type="button">
                <Badge
                  variant="outline"
                  className={cn(
                    "cursor-pointer border text-xs font-medium",
                    getQualificationClass(value)
                  )}
                >
                  {value ?? "–"}
                </Badge>
              </button>
            }
          />
          <DropdownMenuContent align="end" className="max-h-none">
            {QUALIFICATIONS.map((q) => (
              <DropdownMenuItem
                key={q.value}
                onClick={() => {
                  onUpdateQualification(lead.id, q.value, updateLead);
                }}
              >
                {q.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </TableCell>
  );
}
