"use client";

import { TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import type { Lead } from "@/types";
import { InfoIcon } from "@phosphor-icons/react";

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

function badgeLabel(lead: Lead): string {
  const q = lead.qualification;
  if (!q) return "–";
  const score = lead.qualificationScore;
  if (score != null) return `${q} (${score}/100)`;
  return q;
}

export function QualificationCell({ lead }: QualificationCellProps) {
  const updateLead = useMutation(api.leads.update);
  const value = lead.qualification;
  const hasDetails = lead.qualificationReasoning != null || (lead.qualificationCriteria?.length ?? 0) > 0;

  return (
    <TableCell className="w-28 p-0 align-top">
      <div className="px-2.5 py-1.5 flex items-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button className="text-left min-w-0 flex-1" type="button">
                <Badge
                  variant="outline"
                  className={cn(
                    "cursor-pointer border text-xs font-medium",
                    getQualificationClass(value)
                  )}
                >
                  {badgeLabel(lead)}
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
        {hasDetails && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger
                className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground"
                type="button"
              >
                <InfoIcon className="size-3" weight="bold"/>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-sm">
                {lead.qualificationReasoning && (
                  <p className="mb-2">{lead.qualificationReasoning}</p>
                )}
                {lead.qualificationCriteria && lead.qualificationCriteria.length > 0 && (
                  <ul className="list-inside list-disc space-y-0.5 text-left">
                    {lead.qualificationCriteria.map((c, i) => (
                      <li key={i}>
                        {c.met ? "✓" : "✗"} {c.criterion}: {c.evidence}
                      </li>
                    ))}
                  </ul>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </TableCell>
  );
}
