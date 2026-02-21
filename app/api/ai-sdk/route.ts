import { enrichLeads } from "@/lib/enrichLeads";
import type { Lead, TableColumnConfig } from "@/types";
import { google } from "@ai-sdk/google";
import { convertToModelMessages, streamText } from "ai";
import type { UIMessage } from "ai";

const DEFAULT_MODEL = "gemini-3-flash-preview";

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

    // Enrichment: leads + columns -> AI-enriched leads (leads always come from Places API; we only add contact info)
    if (body.leads != null && body.columns != null) {
      const leads = body.leads ?? [];
      const columns = body.columns ?? [];
      if (leads.length > 0) {
        console.log("[api/ai-sdk] AI enrichment starting for", leads.length, "leads (from Places API)");
        try {
          const enrichedLeads = await enrichLeads(leads, columns);
          console.log("[api/ai-sdk] Enrichment complete");
          return Response.json({ leads: enrichedLeads });
        } catch (err) {
          console.warn("[api/ai-sdk] Enrichment failed, returning Places leads un-enriched", err);
          return Response.json({ leads, enrichmentFailed: true });
        }
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
