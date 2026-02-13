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
  criteria_evaluations: z.array(
    z.object({
      criterion: z.string(),
      met: z.boolean(),
      evidence: z.string(),
      points: z.number().int().min(0).max(1),
    })
  ),
  total_score: z.number().min(0).max(100),
  qualification: z.enum(["High", "Low", "Skip"]),
  reasoning: z.string().max(300),
});

export type QualificationResult = "High" | "Low" | "Skip";

export type QualificationDetails = {
  qualification: QualificationResult;
  score: number;
  criteria_evaluations: Array<{
    criterion: string;
    met: boolean;
    evidence: string;
    points: number;
  }>;
  reasoning: string;
};

type QualifySchemaOutput = z.infer<typeof QUALIFY_SCHEMA>;

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

export async function qualifyLeads(
  leads: Lead[],
  userInstructions: string
): Promise<QualificationDetails[]> {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not configured");
  }
  if (leads.length === 0) return [];

  const results: QualificationDetails[] = [];

  const promptSuffix = `SCORING INSTRUCTIONS:
1. Parse the user's criteria into individual, measurable requirements
2. For EACH criterion, evaluate:
   - criterion: state the specific requirement being checked
   - met: true if the lead satisfies this requirement, false if not
   - evidence: quote the specific field/data from the lead that proves this (e.g., "website: https://example.com")
   - points: 1 if met, 0 if not met

3. Calculate total_score: (sum of all points / total number of criteria) × 100

4. Classify based on score:
   - High: score ≥ 75 (strong fit, worth pursuing)
   - Low: score 40-74 (partial fit, lower priority)
   - Skip: score < 40 (poor fit, not worth pursuing)

5. Provide reasoning: 2-3 sentences explaining why this score/classification was given

CRITICAL: Be deterministic. The same lead data + same criteria must ALWAYS produce the same score.
If you need to verify website content or social profiles, use the search tool.`;

  for (const lead of leads) {
    const leadContext = leadToContext(lead);
    const prompt = `Lead data:
${leadContext}

User's qualification criteria:
${userInstructions.trim() || "General quality assessment - evaluate completeness of contact info, online presence, and professionalism."}

${promptSuffix}`;

    const { object } = await (generateObject as (opts: unknown) => Promise<{
      object: QualifySchemaOutput;
    }>)({
      model: google(QUALIFY_MODEL_ID),
      temperature: 0,
      system: SYSTEM_PROMPT,
      tools: QUALIFY_TOOLS,
      schema: QUALIFY_SCHEMA,
      prompt,
    });

    results.push({
      qualification: object.qualification,
      score: object.total_score,
      criteria_evaluations: object.criteria_evaluations,
      reasoning: object.reasoning,
    });
  }

  return results;
}
