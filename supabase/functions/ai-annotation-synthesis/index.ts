import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { withGuard } from "../_shared/guard.ts";
import { corsHeaders } from "../_shared/http.ts";
import * as v from "../_shared/validate.ts";

const BodySchema = v.object({
  mode: v.withDefault(v.literalUnion('synthesize', 'cluster', 'flashcards', 'essay'), 'synthesize'),
  bookContext: v.optional(v.text(200)),
  annotations: v.array(
    v.object({
      content: v.text(600),
      annotation_type: v.withDefault(v.text(40), 'note'),
      book_title: v.optional(v.text(200)),
      chapter: v.optional(v.text(80)),
      page_number: v.optional(v.number({ min: 0, max: 100_000, int: true })),
    }),
    { max: 80, min: 1 },
  ),
});

serve(withGuard(
  {
    fn: 'ai-annotation-synthesis',
    schema: BodySchema,
    maxBodyBytes: 512 * 1024,
    rate: { name: 'ai-annotation-synthesis', max: 15, windowMs: 60_000, maxConcurrent: 2 },
    cost: (body) => 1 + Math.floor(body.annotations.length / 20),
  },
  async ({ body, log }) => {
  const { annotations, mode, bookContext } = body;

  try {
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const compact = annotations
      .slice(0, 80)
      .map((a, i: number) => {
        const meta = [
          a.book_title,
          a.chapter ? `Ch ${a.chapter}` : null,
          a.page_number ? `p.${a.page_number}` : null,
        ]
          .filter(Boolean)
          .join(' • ');

        return `[${i + 1}] (${a.annotation_type}${
          meta ? ' — ' + meta : ''
        }) ${String(a.content || '').slice(0, 600)}`;
      })
      .join('\n');

    let systemPrompt = '';
    let userPrompt = '';

    if (mode === 'synthesize') {
      systemPrompt =
        `You are an elite literary synthesist. Given a reader's raw annotations, you produce a structured synthesis: dominant themes, recurring motifs, contradictions/tensions, key insights, and 3 thought-provoking questions. Use rich markdown with headers (## Themes, ## Motifs, ## Tensions, ## Insights, ## Open Questions). Quote source annotations using [#n] citations. Be precise, never invent content.`;

      userPrompt =
        `Synthesize the following ${annotations.length} annotations${
          bookContext ? ` from "${bookContext}"` : ''
        }:\n\n${compact}`;
    } else if (mode === 'cluster') {
      systemPrompt =
        `You are a knowledge organizer. Cluster the annotations into 3-6 thematic groups. For each group provide: a short title, a one-line description, and the [#n] indices that belong to it. Use markdown.`;

      userPrompt = `Cluster these ${annotations.length} annotations:\n\n${compact}`;
    } else if (mode === 'flashcards') {
      systemPrompt =
        `You are a study coach. Convert annotations into Anki-style flashcards (Q → A). Output only a markdown table with columns: Front | Back | Tag. Aim for 5-15 high-quality cards.`;

      userPrompt = `Generate flashcards from:\n\n${compact}`;
    } else if (mode === 'essay') {
      systemPrompt =
        `You are an essayist. Weave the annotations into a cohesive 350-500 word reflective essay using citations [#n]. Use markdown.`;

      userPrompt = `Write an essay drawing from:\n\n${compact}`;
    }

    const prompt = `
System Instructions:
${systemPrompt}

User Request:
${userPrompt}
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4096,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();

      log.error('upstream AI error', { status: response.status, detail: errorText });

      if (response.status === 429) {
        return new Response(
          JSON.stringify({
            error: 'Rate limit exceeded. Please try again shortly.',
          }),
          {
            status: 429,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }

      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();

    const result =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      'No response generated';

    return new Response(
      JSON.stringify({
        response: result,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    log.error('annotation synthesis failure', { detail: error instanceof Error ? error.message : String(error) });

    return new Response(
      JSON.stringify({ error: 'Synthesis failed. Please try again.', code: 'internal_error' }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
}));
