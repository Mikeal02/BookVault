/**
 * Single AI egress point. Model calls, prompts and the API key live server-side;
 * callers pass structured system/user text only.
 *
 * Uses the platform AI gateway (LOVABLE_API_KEY) so the app has no dependency on a
 * user-supplied provider key. Streaming is consumed inside the function so long
 * generations can't be severed by the platform's buffered-response timeout.
 */
import { createOpenAICompatible } from "npm:@ai-sdk/openai-compatible";
import { streamText } from "npm:ai";
import type { Logger } from "./log.ts";

export const DEFAULT_MODEL = "google/gemini-3.6-flash";

export class AiUnavailableError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
    this.name = "AiUnavailableError";
  }
}

const provider = () => {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) throw new AiUnavailableError(500, "AI service is not configured");
  return createOpenAICompatible({
    name: "lovable",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    headers: { "Lovable-API-Key": key },
  });
};

export interface GenerateOptions {
  system: string;
  prompt: string;
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
  log?: Logger;
}

export const generateAiText = async (options: GenerateOptions): Promise<string> => {
  const gateway = provider();
  const startedAt = Date.now();

  try {
    const result = streamText({
      model: gateway(options.model ?? DEFAULT_MODEL),
      system: options.system,
      prompt: options.prompt,
      temperature: options.temperature ?? 0.7,
      maxOutputTokens: options.maxOutputTokens ?? 4096,
    });

    const text = await result.text;
    options.log?.info("ai generation complete", {
      model: options.model ?? DEFAULT_MODEL,
      ms: Date.now() - startedAt,
      chars: text.length,
    });
    return text.trim() || "No response generated.";
  } catch (error) {
    const status = Number((error as { statusCode?: number; status?: number })?.statusCode ?? (error as any)?.status ?? 0);
    options.log?.error("ai generation failed", {
      status,
      detail: error instanceof Error ? error.message : String(error),
    });
    if (status === 429) throw new AiUnavailableError(429, "Rate limit exceeded. Please try again in a moment.");
    if (status === 402) throw new AiUnavailableError(402, "AI credits exhausted. Please add credits to continue.");
    throw new AiUnavailableError(502, "The AI service is temporarily unavailable.");
  }
};

/** Maps an AI failure onto the shared error envelope shape. */
export const aiErrorBody = (error: unknown) =>
  error instanceof AiUnavailableError
    ? { status: error.status, body: { error: error.message, code: error.status === 429 ? "rate_limited" : "upstream_error" } }
    : { status: 500, body: { error: "Something went wrong. Please try again.", code: "internal_error" } };