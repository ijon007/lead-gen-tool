import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import type { Lead, TableColumnConfig } from "@/types";
import { SYSTEM_PROMPT } from "./system-prompt";

export type EnrichmentStrategy = "batch" | "per-lead";
export const ENRICHMENT_STRATEGY: EnrichmentStrategy = "per-lead";

const ENRICH_MODEL_ID =
  process.env.GOOGLE_GENERATIVE_AI_MODEL ?? "gemini-3-flash-preview";

const ENRICH_TOOLS = {
  google_search: google.tools.googleSearch({}),
} as const;

const MAX_URL_LENGTH = 400;
const URL_COLUMN_IDS = new Set(["website", "instagram", "facebook", "linkedIn", "x"]);

function zodSchemaForColumn(id: string): z.ZodTypeAny {
  if (id === "rating") {
    return z.number().optional();
  }
  if (URL_COLUMN_IDS.has(id)) {
    return z.string().max(MAX_URL_LENGTH).optional();
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

/** Only add enriched values for fields that are missing in Places data. Never overwrite existing Places API data. */
function mergeEnrichedWithLead(
  placesLead: Lead,
  enrichedData: Record<string, unknown>
): Lead {
  const result = { ...placesLead };
  for (const [key, value] of Object.entries(enrichedData)) {
    if (value === undefined || value === null || value === "") continue;
    if (!(key in result)) continue;
    const existing = (result as Record<string, unknown>)[key];
    const existingEmpty =
      existing === undefined || existing === null || (typeof existing === "string" && existing.trim() === "");
    if (existingEmpty) {
      (result as Record<string, unknown>)[key] = value;
    }
  }
  return result;
}

/** Extract plain value from markdown link e.g. [text](mailto:email) -> email */
function stripMarkdownLink(value: string | null | undefined): string {
  if (!value || typeof value !== "string") return "";
  const s = value.trim();
  const m = s.match(/^\[[^\]]*\]\((mailto:|tel:)([^)]+)\)$/);
  if (m) return m[2].trim();
  const mUrl = s.match(/^\[[^\]]*\]\((https?:\/\/[^)]+)\)$/);
  if (mUrl) return mUrl[1];
  return s;
}

async function validateUrl(url: string | null | undefined): Promise<string | null> {
  if (!url || typeof url !== "string") return null;
  const plain = stripMarkdownLink(url) || url;
  const toUse = plain.length > MAX_URL_LENGTH ? plain.slice(0, MAX_URL_LENGTH) : plain;
  try {
    new URL(toUse);
    return toUse;
  } catch {
    try {
      new URL(plain);
      return plain.length > MAX_URL_LENGTH ? plain.slice(0, MAX_URL_LENGTH) : plain;
    } catch {
      console.warn(`[validateUrl] Invalid or too long URL, dropping: ${plain.slice(0, 80)}...`);
      return null;
    }
  }
}

async function validateEnrichedData(data: Record<string, unknown>): Promise<Record<string, unknown>> {
  const validated = { ...data };
  const urlFields = ["website", "instagram", "facebook", "linkedIn", "x"];
  for (const field of urlFields) {
    if (field in validated) {
      validated[field] = await validateUrl(validated[field] as string);
    }
  }
  if (validated.email && typeof validated.email === "string") {
    const raw = validated.email as string;
    const email = stripMarkdownLink(raw) || raw;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(email)) {
      validated.email = email;
    } else {
      console.warn(`[validateEnrichedData] Invalid email format: ${raw}`);
      validated.email = null;
    }
  }
  if (validated.phone && typeof validated.phone === "string") {
    const raw = validated.phone as string;
    validated.phone = stripMarkdownLink(raw) || raw;
  }
  return validated;
}

async function enrichLeadsBatch(
  leads: Lead[],
  columns: TableColumnConfig[]
): Promise<Lead[]> {
  if (leads.length === 0) return leads;
  console.log("[enrichLeads] AI working: batch enrichment starting", leads.length, "leads (google_search tool)");

  const businessList = leads.map(
      (l, i) => `${i + 1}. ${l.businessName}${l.address ? ` - ${l.address}` : ""}${l.location ? ` (${l.location})` : ""}`
    )
    .join("\n");

  const schema = buildLeadSchema(columns, "array") as z.ZodObject<{
    leads: z.ZodArray<z.ZodObject<Record<string, z.ZodTypeAny>>>;
  }>;

  let enrichedArray: Record<string, unknown>[];
  try {
    const { object } = await (generateObject as any)({
      model: google(ENRICH_MODEL_ID),
      temperature: 0,
      system: SYSTEM_PROMPT,
      tools: ENRICH_TOOLS,
      schema,
      prompt:
        `For each business use one search: "[Business Name] [location]". From the first page of results extract only what you actually see: email, phone, website, Instagram, Facebook, LinkedIn, X. Return only URLs that appeared in results (link or snippet); never construct URLs from the business name. Leave fields empty if not found. Maintain the exact same order as the input list.

      Businesses:
      ${businessList}`,
    });
    enrichedArray = object.leads ?? [];
  } catch (err) {
    console.warn("[enrichLeads] Batch enrichment failed, returning original leads", err);
    return leads;
  }

  console.log("[enrichLeads] AI batch complete, raw response:", enrichedArray.length, "enriched entries");
  const validatedResults = await Promise.all(
    leads.map(async (lead, index) => {
      const enriched = enrichedArray[index] ?? {};
      const validated = await validateEnrichedData(enriched);
      return mergeEnrichedWithLead(lead, validated);
    })
  );
  return validatedResults;
}

async function enrichLeadsPerLead(
  leads: Lead[],
  columns: TableColumnConfig[]
): Promise<Lead[]> {
  const results: Lead[] = [];
  const singleSchema = buildLeadSchema(columns, "single") as z.ZodObject<
    Record<string, z.ZodTypeAny>
  >;

  console.log("[enrichLeads] AI working: per-lead enrichment starting", leads.length, "leads (google_search tool)");
  for (const lead of leads) {
    try {
      const searchContext = [
        lead.businessName,
        lead.address,
        lead.location,
      ]
        .filter(Boolean)
        .join(", ");

      const { object } = await (generateObject as any)({
        model: google(ENRICH_MODEL_ID),
        temperature: 0,
        system: SYSTEM_PROMPT,
        tools: ENRICH_TOOLS,
        schema: singleSchema,
        prompt:
          `One search: "${searchContext}". From the first page of results, extract only what you actually see: email, phone, website, Instagram, Facebook, LinkedIn, X (each in its own field). Return only URLs that appeared in the results (link or snippet); never construct a URL from the business name. Leave any field empty if not clearly found.`,
      });

      console.log("[enrichLeads] AI raw response for", lead.businessName, ":", JSON.stringify(object, null, 2));
      const validated = await validateEnrichedData(object as Record<string, unknown>);
      results.push(mergeEnrichedWithLead(lead, validated));
    } catch (err) {
      console.warn("[enrichLeads] Enrichment failed for", lead.businessName, err);
      results.push(lead);
    }
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
