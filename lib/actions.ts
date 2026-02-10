"use server";

import { enrichLeads } from "@/lib/enrichLeads";
import { searchPlaces } from "@/lib/placesClient";
import type { Lead, TableColumnConfig } from "@/types";

export async function searchPlacesAction(
  category: string,
  location: string
): Promise<{ leads: Lead[] } | { error: string }> {
  const cat = category?.trim() ?? "";
  const loc = location?.trim() ?? "";

  if (!cat && !loc) {
    return { error: "Category and location cannot both be empty" };
  }

  try {
    const leads = await searchPlaces(cat, loc);
    return { leads };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred";
    console.error("[searchPlacesAction]", err);
    return { error: message };
  }
}

export async function enrichLeadsAction(
  leads: Lead[],
  columns: TableColumnConfig[]
): Promise<{ leads: Lead[] } | { error: string }> {
  if (leads.length === 0) {
    return { leads: [] };
  }

  try {
    console.log("[enrichLeadsAction] Input:", {
      leadsCount: leads.length,
      columns: columns.map((c) => ({ id: c.id, visible: c.visible })),
    });
    const enrichedLeads = await enrichLeads(leads, columns);
    console.log("[enrichLeadsAction] Output:", enrichedLeads);
    return { leads: enrichedLeads };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred";
    console.error("[enrichLeadsAction]", err);
    return { error: message };
  }
}
