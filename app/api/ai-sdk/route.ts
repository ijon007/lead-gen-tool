import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { convertToModelMessages, streamText } from "ai";
import type { UIMessage } from "ai";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

const DEFAULT_MODEL = "anthropic/claude-3.5-sonnet";

export async function POST(req: Request) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "OPENROUTER_API_KEY is not configured" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const { messages } = (await req.json()) as { messages?: UIMessage[] };
    const modelId = process.env.OPENROUTER_MODEL ?? DEFAULT_MODEL;

    const result = streamText({
      model: openrouter.chat(modelId),
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
