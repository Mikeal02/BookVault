import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { withGuard } from "../_shared/guard.ts";
import { corsHeaders } from "../_shared/http.ts";
import { aiErrorBody, generateAiText } from "../_shared/ai.ts";
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

    const result = await generateAiText({ system: systemPrompt, prompt: userPrompt, log });

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

    const mapped = aiErrorBody(error);
    return new Response(
      JSON.stringify(mapped.body),
      {
        status: mapped.status,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
}));
