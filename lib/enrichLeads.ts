import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import type { Lead, TableColumnConfig } from "@/types";
import { ENRICH_SYSTEM_PROMPT } from "./system-prompt";

export type EnrichmentStrategy = "batch" | "per-lead";
export const ENRICHMENT_STRATEGY: EnrichmentStrategy = "per-lead";

const ENRICH_MODEL_ID =
  process.env.GOOGLE_GENERATIVE_AI_MODEL ?? "gemini-3-flash-preview";

const ENRICH_TOOLS = {
  google_search: google.tools.googleSearch({}),
} as const;

function zodSchemaForColumn(id: string): z.ZodTypeAny {
  if (id === "rating") {
    return z.number().optional();
  }
  return z.string().optional();
}

function buildLeadSchema(
  columns: TableColumnConfig[],
  mode: "single" | "array"
): z.ZodTypeAny {
  const visibleColumns = columns.filter((c) => c.visible);
  const columnsToUse = visibleColumns.length > 0 ? visibleColumns : columns;
  const singleSchema = z.object(
    Object.fromEntries(
      columnsToUse.map((c) => [c.id, zodSchemaForColumn(c.id)])
    ) as Record<string, z.ZodTypeAny>
  );

  if (mode === "single") {
    return singleSchema;
  }
  return z.object({ leads: z.array(singleSchema) });
}

function mergeEnrichedWithLead(
  placesLead: Lead,
  enrichedData: Record<string, unknown>
): Lead {
  const result = { ...placesLead };
  for (const [key, value] of Object.entries(enrichedData)) {
    if (value !== undefined && value !== null && value !== "") {
      if (key in result) {
        (result as Record<string, unknown>)[key] = value;
      }
    }
  }
  return result;
}

async function enrichLeadsBatch(
  leads: Lead[],
  columns: TableColumnConfig[]
): Promise<Lead[]> {
  if (leads.length === 0) return leads;
  console.log("[enrichLeads] Batch enrichment starting", leads.length, "leads, AI tool calling (google_search)");

  const businessList = leads.map(
      (l, i) => `${i + 1}. ${l.businessName}${l.address ? ` - ${l.address}` : ""}${l.location ? ` (${l.location})` : ""}`
    )
    .join("\n");

  const schema = buildLeadSchema(columns, "array") as z.ZodObject<{
    leads: z.ZodArray<z.ZodObject<Record<string, z.ZodTypeAny>>>;
  }>;

  const { object } = await (generateObject as any)({
    model: google(ENRICH_MODEL_ID),
    system: ENRICH_SYSTEM_PROMPT,
    tools: ENRICH_TOOLS,
    schema,
    prompt: 
      `For each of the following businesses, search the web and extract contact info (email, phone, website, Instagram, Facebook, LinkedIn, X—each in its own field). Prefer the best phone number if you find a more direct one. Return only what you find; leave fields empty if not found. Maintain the exact same order as the input list.

      Businesses:
      ${businessList}`,
  });

  const enrichedArray = object.leads ?? [];
  console.log("[enrichLeads] AI batch complete, raw response:", enrichedArray.length, "enriched entries");
  return leads.map((lead, index) => {
    const enriched = enrichedArray[index] ?? {};
    return mergeEnrichedWithLead(lead, enriched);
  });
}

async function enrichLeadsPerLead(
  leads: Lead[],
  columns: TableColumnConfig[]
): Promise<Lead[]> {
  const results: Lead[] = [];
  const singleSchema = buildLeadSchema(columns, "single") as z.ZodObject<
    Record<string, z.ZodTypeAny>
  >;

  console.log("[enrichLeads] Per-lead enrichment starting", leads.length, "leads, AI tool calling (google_search)");
  for (const lead of leads) {
    const searchContext = [
      lead.businessName,
      lead.address,
      lead.location,
    ]
      .filter(Boolean)
      .join(", ");

    const { object } = await (generateObject as any)({
      model: google(ENRICH_MODEL_ID),
      system: ENRICH_SYSTEM_PROMPT,
      tools: ENRICH_TOOLS,
      schema: singleSchema,
      prompt: 
        `Search the web for this business: ${searchContext}. Extract: email, phone (prefer the best/direct number if you find a better one), website, Instagram, Facebook, LinkedIn, and X profiles (each in its own field). Add 1–2 sentence outreach notes if you find something notable. Return only what you find; leave fields empty if not found.`,
    });

    console.log("[enrichLeads] AI raw response for", lead.businessName, ":", JSON.stringify(object, null, 2));
    results.push(mergeEnrichedWithLead(lead, object as Record<string, unknown>));
  }

  return results;
}

export async function enrichLeads(
  leads: Lead[],
  columns: TableColumnConfig[]
): Promise<Lead[]> {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not configured");
  }
  return ENRICHMENT_STRATEGY === "batch"
    ? enrichLeadsBatch(leads, columns)
    : enrichLeadsPerLead(leads, columns);
}
