"use client";

import React from "react";
import { Copy, Trash } from "@phosphor-icons/react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import type { Lead } from "@/types";

interface RowContextMenuProps {
  lead: Lead;
  children: React.ReactElement;
  sheetId: string;
}

async function handleDuplicate(
  lead: Lead,
  sheetId: string,
  createLead: ReturnType<typeof useMutation<typeof api.leads.create>>
) {
  await createLead({
    sheetId: sheetId as Id<"sheets">,
    businessName: lead.businessName,
    category: lead.category,
    location: lead.location,
    email: lead.email,
    phone: lead.phone,
    website: lead.website,
    address: lead.address,
    description: lead.description,
    status: lead.status,
    rating: lead.rating,
    googleMapsUri: lead.googleMapsUri,
    instagram: lead.instagram,
    facebook: lead.facebook,
    linkedIn: lead.linkedIn,
    x: lead.x,
    notes: lead.notes,
  });
}

async function handleDelete(
  leadId: string,
  removeLead: ReturnType<typeof useMutation<typeof api.leads.remove>>
) {
  await removeLead({ leadId: leadId as Id<"leads"> });
}

export function RowContextMenu({
  lead,
  children,
  sheetId,
}: RowContextMenuProps) {
  const createLead = useMutation(api.leads.create);
  const removeLead = useMutation(api.leads.remove);

  return (
    <ContextMenu>
      <ContextMenuTrigger
        render={(props) => React.cloneElement(children, props)}
      />
      <ContextMenuContent>
        <ContextMenuItem
          onClick={(e) => {
            e.preventDefault();
            handleDuplicate(lead, sheetId, createLead);
          }}
        >
          <Copy className="size-3.5" />
          Duplicate
        </ContextMenuItem>
        <ContextMenuItem
          onClick={(e) => {
            e.preventDefault();
            handleDelete(lead.id, removeLead);
          }}
          variant="destructive"
        >
          <Trash className="size-3.5" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
