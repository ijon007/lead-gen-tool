"use server";

import { enrichLeads } from "@/lib/enrichLeads";
import { qualifyLeads, type QualificationDetails } from "@/lib/qualifyLeads";
import { searchPlaces } from "@/lib/placesClient";
import type { Lead, TableColumnConfig } from "@/types";

export async function searchPlacesAction(
  category: string,
  location: string,
  limit?: number,
  existingLeads?: Lead[],
  nextPageToken?: string | null
): Promise<{ leads: Lead[]; nextPageToken?: string | null } | { error: string }> {
  const cat = category?.trim() ?? "";
  const loc = location?.trim() ?? "";
  const searchLimit = limit ?? 10;

  if (!cat && !loc) {
    return { error: "Category and location cannot both be empty" };
  }

  try {
    const isGetMore = existingLeads && existingLeads.length > 0;

    if (isGetMore && nextPageToken) {
      console.log("[searchPlacesAction] Get more: using nextPageToken, calling Places API");
      const result = await searchPlaces(cat, loc, searchLimit, nextPageToken);
      const newLeads = result.leads.slice(0, searchLimit);
      console.log("[searchPlacesAction] Get more complete", newLeads.length, "new leads");
      return { leads: newLeads, nextPageToken: result.nextPageToken ?? null };
    }

    if (isGetMore) {
      console.log("[searchPlacesAction] Get more: no token, fetch first page and filter, calling Places API");
      const result = await searchPlaces(cat, loc, 20);
      const existingKeys = new Set(existingLeads!.map(existingLeadKey));
      const newLeads = result.leads
        .filter((l) => !existingKeys.has(existingLeadKey(l)))
        .slice(0, searchLimit);
      console.log("[searchPlacesAction] Get more complete", newLeads.length, "new leads");
      return { leads: newLeads, nextPageToken: result.nextPageToken ?? null };
    }

    console.log("[searchPlacesAction] Starting search, calling Places API", { category: cat, location: loc, limit: searchLimit });
    const result = await searchPlaces(cat, loc, searchLimit);
    console.log("[searchPlacesAction] Search complete", result.leads.length, "leads");
    return { leads: result.leads, nextPageToken: result.nextPageToken ?? null };
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

export async function qualifyLeadsAction(
  leads: Lead[],
  userInstructions: string
): Promise<
  | { qualifications: QualificationDetails[] }
  | { error: string }
> {
  if (leads.length === 0) {
    return { qualifications: [] };
  }

  try {
    const qualifications = await qualifyLeads(leads, userInstructions);
    return { qualifications };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred";
    console.error("[qualifyLeadsAction]", err);
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

/** Pass only dedupe keys from the client to avoid huge payloads (e.g. after "get more"). */
export async function addOneLeadAction(
  category: string,
  location: string,
  existingLeadKeys: string[],
  columns: TableColumnConfig[]
): Promise<{ lead: Lead } | { error: string }> {
  const cat = category?.trim() ?? "";
  const loc = location?.trim() ?? "";
  if (!cat && !loc) {
    return { error: "Category and location cannot both be empty" };
  }

  try {
    const { leads } = await searchPlaces(cat, loc, ADD_ONE_LEAD_SEARCH_LIMIT);
    const existingKeys = new Set(existingLeadKeys);

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
