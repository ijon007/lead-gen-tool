import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateObject } from "ai";
import { z } from "zod";
import type { Lead, TableColumnConfig } from "@/types";

export type EnrichmentStrategy = "batch" | "per-lead";
export const ENRICHMENT_STRATEGY: EnrichmentStrategy = "batch";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

const DEFAULT_MODEL =
  process.env.OPENROUTER_MODEL ?? "anthropic/claude-3.5-sonnet";

function getEnrichedModel() {
  return openrouter.chat(DEFAULT_MODEL, {
    plugins: [{ id: "web" as const, max_results: 5 }],
  });
}

function zodSchemaForColumn(id: string): z.ZodTypeAny {
  if (id === "rating") {
    return z.number().optional();
  }
  return z.string().optional();
}

const DEFAULT_ENRICH_COLUMNS = ["email", "phone", "website", "socialMedia"];

function buildLeadSchema(
  columns: TableColumnConfig[],
  mode: "single" | "array"
): z.ZodTypeAny {
  const visibleColumns = columns.filter((c) => c.visible);
  const columnsToUse =
    visibleColumns.length > 0
      ? visibleColumns
      : columns.filter((c) => DEFAULT_ENRICH_COLUMNS.includes(c.id));
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

  const businessList = leads
    .map(
      (l, i) =>
        `${i + 1}. ${l.businessName}${l.address ? ` - ${l.address}` : ""}${l.location ? ` (${l.location})` : ""}`
    )
    .join("\n");

  const schema = buildLeadSchema(columns, "array") as z.ZodObject<{
    leads: z.ZodArray<z.ZodObject<Record<string, z.ZodTypeAny>>>;
  }>;

  const { object } = await generateObject({
    model: getEnrichedModel(),
    schema,
    prompt: `For each of the following businesses, search the web and extract contact info (email, phone, website, social media—any platform: Instagram, Facebook, LinkedIn, Twitter/X, etc.). Return only what you find; leave fields empty if not found. Maintain the exact same order as the input list.

Businesses:
${businessList}`,
  });

  const enrichedArray = object.leads ?? [];
  console.log("[enrichLeads] AI raw response (object.leads):", JSON.stringify(enrichedArray, null, 2));
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

  for (const lead of leads) {
    const searchContext = [
      lead.businessName,
      lead.address,
      lead.location,
    ]
      .filter(Boolean)
      .join(", ");

    const { object } = await generateObject({
      model: getEnrichedModel(),
      schema: singleSchema,
      prompt: `Search the web for this business: ${searchContext}. Extract contact info: email, phone, website, and any social media profile (Instagram, Facebook, LinkedIn, Twitter, etc.). Return only what you find; leave fields empty if not found.`,
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
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }
  return ENRICHMENT_STRATEGY === "batch"
    ? enrichLeadsBatch(leads, columns)
    : enrichLeadsPerLead(leads, columns);
}
