import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { annotations, mode = 'synthesize', bookContext } = await req.json();

    if (!Array.isArray(annotations) || annotations.length === 0) {
      return new Response(JSON.stringify({ error: 'No annotations provided' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('AI service is not configured');

    const compact = annotations.slice(0, 80).map((a: any, i: number) => {
      const meta = [a.book_title, a.chapter ? `Ch ${a.chapter}` : null, a.page_number ? `p.${a.page_number}` : null]
        .filter(Boolean).join(' • ');
      return `[${i + 1}] (${a.annotation_type}${meta ? ' — ' + meta : ''}) ${String(a.content || '').slice(0, 600)}`;
    }).join('\n');

    let systemPrompt = '';
    let userPrompt = '';

    if (mode === 'synthesize') {
      systemPrompt = `You are an elite literary synthesist. Given a reader's raw annotations, you produce a structured synthesis: dominant themes, recurring motifs, contradictions/tensions, key insights, and 3 thought-provoking questions. Use rich markdown with headers (## Themes, ## Motifs, ## Tensions, ## Insights, ## Open Questions). Quote source annotations using [#n] citations. Be precise, never invent content.`;
      userPrompt = `Synthesize the following ${annotations.length} annotations${bookContext ? ` from "${bookContext}"` : ''}:\n\n${compact}`;
    } else if (mode === 'cluster') {
      systemPrompt = `You are a knowledge organizer. Cluster the annotations into 3-6 thematic groups. For each group provide: a short title, a one-line description, and the [#n] indices that belong to it. Use markdown.`;
      userPrompt = `Cluster these ${annotations.length} annotations:\n\n${compact}`;
    } else if (mode === 'flashcards') {
      systemPrompt = `You are a study coach. Convert annotations into Anki-style flashcards (Q → A). Output only a markdown table with columns: Front | Back | Tag. Aim for 5-15 high-quality cards.`;
      userPrompt = `Generate flashcards from:\n\n${compact}`;
    } else if (mode === 'essay') {
      systemPrompt = `You are an essayist. Weave the annotations into a cohesive 350-500 word reflective essay using citations [#n]. Use markdown.`;
      userPrompt = `Write an essay drawing from:\n\n${compact}`;
    } else {
      return new Response(JSON.stringify({ error: 'Unknown mode' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again shortly.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });
  } catch (error) {
    console.error('annotation synthesis error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error'
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});