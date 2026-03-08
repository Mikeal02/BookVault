import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { book, type, userBooks } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('AI service is not configured');
    }

    let systemPrompt = '';
    let userPrompt = '';

    if (type === 'insights') {
      systemPrompt = `You are an elite literary analyst. Provide deep, insightful analysis of books. Be concise but profound. Use markdown formatting with headers, bullet points, and bold text. Structure your response with: ## Key Themes, ## Why It Matters, ## Reading Tips, ## Connection to Other Works.`;
      userPrompt = `Analyze "${book.title}" by ${book.authors?.join(', ') || 'Unknown'}. ${book.description ? `Description: ${book.description.substring(0, 500)}` : ''} ${book.categories ? `Genres: ${book.categories.join(', ')}` : ''}`;
    } else if (type === 'connections') {
      const bookTitles = userBooks?.map((b: any) => `"${b.title}" by ${b.authors?.[0] || 'Unknown'}`).join(', ') || 'none';
      systemPrompt = `You are a literary connection expert. Find meaningful thematic, stylistic, and narrative connections between books. Be specific and insightful. Use markdown.`;
      userPrompt = `The user's library contains: ${bookTitles}. Find interesting connections between "${book.title}" and their other books. If they have no other books, suggest books that would connect well with this one.`;
    } else if (type === 'reading-plan') {
      systemPrompt = `You are a reading coach. Create a personalized, motivating reading plan. Be practical and encouraging. Use markdown with checkboxes and timelines.`;
      userPrompt = `Create a reading plan for "${book.title}" by ${book.authors?.join(', ') || 'Unknown'}. It has ${book.pageCount || 'unknown number of'} pages. The user wants to finish it efficiently while retaining key insights.`;
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
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
    console.error('AI insights error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
