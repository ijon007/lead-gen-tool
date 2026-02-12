import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import type { Lead } from "@/types";
import { SYSTEM_PROMPT } from "./system-prompt";

const QUALIFY_MODEL_ID =
  process.env.GOOGLE_GENERATIVE_AI_MODEL ?? "gemini-3-flash-preview";

const QUALIFY_TOOLS = {
  google_search: google.tools.googleSearch({}),
} as const;

const QUALIFY_SCHEMA = z.object({
  qualification: z.enum(["High", "Low", "Skip"]),
});

function leadToContext(lead: Lead): string {
  const parts: string[] = [];
  if (lead.businessName) parts.push(`Name: ${lead.businessName}`);
  if (lead.category) parts.push(`Category: ${lead.category}`);
  if (lead.location) parts.push(`Location: ${lead.location}`);
  if (lead.address) parts.push(`Address: ${lead.address}`);
  if (lead.website) parts.push(`Website: ${lead.website}`);
  if (lead.email) parts.push(`Email: ${lead.email}`);
  if (lead.phone) parts.push(`Phone: ${lead.phone}`);
  if (lead.instagram) parts.push(`Instagram: ${lead.instagram}`);
  if (lead.facebook) parts.push(`Facebook: ${lead.facebook}`);
  if (lead.linkedIn) parts.push(`LinkedIn: ${lead.linkedIn}`);
  if (lead.x) parts.push(`X: ${lead.x}`);
  if (lead.notes) parts.push(`Notes: ${lead.notes}`);
  if (lead.description) parts.push(`Description: ${lead.description}`);
  return parts.join("\n");
}

export type QualificationResult = "High" | "Low" | "Skip";

export async function qualifyLeads(
  leads: Lead[],
  userInstructions: string
): Promise<QualificationResult[]> {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not configured");
  }
  if (leads.length === 0) return [];

  const results: QualificationResult[] = [];

  for (const lead of leads) {
    const leadContext = leadToContext(lead);
    const prompt = `Lead data:
${leadContext}

User's criteria for a quality lead:
${userInstructions.trim() || "No specific criteria given; use your judgment based on the lead data."}

If you need to verify something (e.g. check their website or socials), use the search tool. Then classify this lead as High, Low, or Skip.`;

    const { object } = await (generateObject as (opts: unknown) => Promise<{
      object: { qualification: QualificationResult };
    }>)({
      model: google(QUALIFY_MODEL_ID),
      system: SYSTEM_PROMPT,
      tools: QUALIFY_TOOLS,
      schema: QUALIFY_SCHEMA,
      prompt,
    });

    results.push(object.qualification);
  }

  return results;
}
