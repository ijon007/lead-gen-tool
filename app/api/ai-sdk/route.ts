import { enrichLeads } from "@/lib/enrichLeads";
import type { Lead, TableColumnConfig } from "@/types";
import { google } from "@ai-sdk/google";
import { convertToModelMessages, streamText } from "ai";
import type { UIMessage } from "ai";

const DEFAULT_MODEL = "gemini-3-flash";

export async function POST(req: Request) {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "GOOGLE_GENERATIVE_AI_API_KEY is not configured" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const body = (await req.json()) as {
      messages?: UIMessage[];
      leads?: Lead[];
      columns?: TableColumnConfig[];
    };

    // Enrichment: leads + columns -> AI-enriched leads
    if (body.leads != null && body.columns != null) {
      const leads = body.leads ?? [];
      const columns = body.columns ?? [];
      if (leads.length > 0) {
        console.log("[api/ai-sdk] Enriching", leads.length, "leads with AI");
        const enrichedLeads = await enrichLeads(leads, columns);
        console.log("[api/ai-sdk] Enrichment complete. AI response (enriched leads):", JSON.stringify(enrichedLeads, null, 2));
        return Response.json({ leads: enrichedLeads });
      }
      return Response.json({ leads: [] });
    }

    // Chat: messages -> streaming response
    const { messages } = body;
    const modelId = process.env.GOOGLE_GENERATIVE_AI_MODEL ?? DEFAULT_MODEL;

    const result = streamText({
      model: google(modelId),
      messages: await convertToModelMessages(messages ?? []),
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("[api/ai-sdk]", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
