"use server";

import { enrichLeads } from "@/lib/enrichLeads";
import { searchPlaces } from "@/lib/placesClient";
import type { Lead, TableColumnConfig } from "@/types";

export async function searchPlacesAction(
  category: string,
  location: string,
  limit?: number
): Promise<{ leads: Lead[] } | { error: string }> {
  const cat = category?.trim() ?? "";
  const loc = location?.trim() ?? "";
  const searchLimit = limit ?? 10;

  if (!cat && !loc) {
    return { error: "Category and location cannot both be empty" };
  }

  try {
    console.log("[searchPlacesAction] Starting search", { category: cat, location: loc, limit: searchLimit });
    const leads = await searchPlaces(cat, loc, searchLimit);
    console.log("[searchPlacesAction] Search complete", leads.length, "leads");
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

const ADD_ONE_LEAD_SEARCH_LIMIT = 20;

function existingLeadKey(lead: Lead): string {
  if (lead.googleMapsUri?.trim()) return lead.googleMapsUri.trim();
  const name = (lead.businessName ?? "").trim();
  const addr = (lead.address ?? "").trim();
  return `${name}::${addr}`;
}

export async function addOneLeadAction(
  category: string,
  location: string,
  existingLeads: Lead[],
  columns: TableColumnConfig[]
): Promise<{ lead: Lead } | { error: string }> {
  const cat = category?.trim() ?? "";
  const loc = location?.trim() ?? "";
  if (!cat && !loc) {
    return { error: "Category and location cannot both be empty" };
  }

  try {
    const leads = await searchPlaces(cat, loc, ADD_ONE_LEAD_SEARCH_LIMIT);
    const existingKeys = new Set(existingLeads.map(existingLeadKey));

    const newLead = leads.find((l) => !existingKeys.has(existingLeadKey(l)));
    if (!newLead) {
      return { error: "No new places found for this search." };
    }

    const enrichResult = await enrichLeadsAction([newLead], columns);
    if ("error" in enrichResult) {
      return { error: enrichResult.error };
    }
    const enriched = enrichResult.leads[0];
    if (!enriched) {
      return { error: "Enrichment failed." };
    }
    return { lead: enriched };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred";
    console.error("[addOneLeadAction]", err);
    return { error: message };
  }
}
