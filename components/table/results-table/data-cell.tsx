"use client";

import { TableCell } from "@/components/ui/table";
import { MarkdownCell } from "@/components/table/markdown-cell";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import type { Lead } from "@/types";

interface DataCellProps {
  lead: Lead;
  field: keyof Lead;
  value: string;
}

async function onUpdateLead(
  id: string,
  field: keyof Lead,
  value: string,
  updateLead: ReturnType<typeof useMutation<typeof api.leads.update>>
) {
  const updates: Record<string, string | number | undefined> = {};
  updates[field] = value;
  await updateLead({ leadId: id as Id<"leads">, ...updates });
}

export function DataCell({ lead, field, value }: DataCellProps) {
  const updateLead = useMutation(api.leads.update);

  return (
    <TableCell
      className="relative p-0 align-top text-xs"
      style={{
        minWidth: 0,
        wordBreak: "break-word",
        overflowWrap: "break-word",
      }}
    >
      <MarkdownCell
        className="min-w-0"
        onSave={(newValue) => onUpdateLead(lead.id, field, newValue, updateLead)}
        value={value}
      />
    </TableCell>
  );
}
