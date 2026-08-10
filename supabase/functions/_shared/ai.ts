/**
 * Single AI egress point. Model calls, prompts and the API key live server-side;
 * callers pass structured system/user text only.
 *
 * Uses the platform AI gateway (LOVABLE_API_KEY) so the app has no dependency on a
 * user-supplied provider key. Streaming is consumed inside the function so long
 * generations can't be severed by the platform's buffered-response timeout.
 */
import type { Logger } from "./log.ts";

export const DEFAULT_MODEL = "google/gemini-3.6-flash";

export class AiUnavailableError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
    this.name = "AiUnavailableError";
  }
}

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

export interface GenerateOptions {
  system: string;
  prompt: string;
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
  log?: Logger;
}

export const generateAiText = async (options: GenerateOptions): Promise<string> => {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) throw new AiUnavailableError(500, "AI service is not configured");

  const model = options.model ?? DEFAULT_MODEL;
  const startedAt = Date.now();

  const response = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
    body: JSON.stringify({
      model,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxOutputTokens ?? 4096,
      messages: [
        { role: "system", content: options.system },
        { role: "user", content: options.prompt },
      ],
    }),
  });

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 500);
    options.log?.error("ai generation failed", { status: response.status, detail });
    if (response.status === 429) throw new AiUnavailableError(429, "Rate limit exceeded. Please try again in a moment.");
    if (response.status === 402) throw new AiUnavailableError(402, "AI credits exhausted. Please add credits to continue.");
    throw new AiUnavailableError(502, "The AI service is temporarily unavailable.");
  }

  const data = await response.json().catch(() => null);
  const text: string = data?.choices?.[0]?.message?.content ?? "";
  options.log?.info("ai generation complete", { model, ms: Date.now() - startedAt, chars: text.length });
  return text.trim() || "No response generated.";
};

/** Maps an AI failure onto the shared error envelope shape. */
export const aiErrorBody = (error: unknown) =>
  error instanceof AiUnavailableError
    ? { status: error.status, body: { error: error.message, code: error.status === 429 ? "rate_limited" : "upstream_error" } }
    : { status: 500, body: { error: "Something went wrong. Please try again.", code: "internal_error" } };