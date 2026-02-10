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
import { LEAD_STATUSES } from "@/constants";
import {
  getStatusBadgeColor,
  getStatusColor,
  getStatusLabel,
  getStatusVariant,
} from "@/utils/status";
import type { Lead } from "@/types";

interface StatusCellProps {
  lead: Lead;
}

async function onUpdateStatus(
  id: string,
  status: string,
  updateLead: ReturnType<typeof useMutation<typeof api.leads.update>>
) {
  await updateLead({ leadId: id as Id<"leads">, status });
}

export function StatusCell({ lead }: StatusCellProps) {
  const updateLead = useMutation(api.leads.update);

  return (
    <TableCell className="w-32 p-0 align-top">
      <div className="px-2.5 py-1.5">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button className="w-full text-left">
                <Badge
                  className={`cursor-pointer ${getStatusBadgeColor(lead.status)}`}
                  variant={getStatusVariant(lead.status)}
                >
                  {getStatusLabel(lead.status)}
                </Badge>
              </button>
            }
          />
          <DropdownMenuContent align="end" className="max-h-none">
            {LEAD_STATUSES.map((status) => (
              <DropdownMenuItem
                className={getStatusColor(status.value)}
                key={status.value}
                onClick={() => {
                  onUpdateStatus(lead.id, status.value, updateLead);
                }}
              >
                {status.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </TableCell>
  );
}
