import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { books, readingSessions } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build reading profile summary
    const totalBooks = books?.length || 0;
    const finished = books?.filter((b: any) => b.readingStatus === 'finished') || [];
    const reading = books?.filter((b: any) => b.readingStatus === 'reading') || [];
    const genres = books?.flatMap((b: any) => b.categories || []) || [];
    const genreCounts: Record<string, number> = {};
    genres.forEach((g: string) => { genreCounts[g] = (genreCounts[g] || 0) + 1; });
    const topGenres = Object.entries(genreCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([g]) => g);
    
    const totalPages = books?.reduce((s: number, b: any) => s + (b.pageCount || 0), 0) || 0;
    const avgRating = finished.length > 0
      ? (finished.reduce((s: number, b: any) => s + (b.personalRating || 0), 0) / finished.length).toFixed(1)
      : 'N/A';

    const recentSessions = (readingSessions || []).slice(0, 20);
    const sessionSummary = recentSessions.length > 0
      ? `Recent reading sessions: ${recentSessions.map((s: any) => `${s.duration_minutes}min on ${s.session_date}`).join(', ')}`
      : 'No recent reading sessions tracked.';

    const currentlyReading = reading.map((b: any) => 
      `"${b.title}" by ${b.authors?.join(', ')} (${b.readingProgress || 0}% done, page ${b.currentPage || 0}/${b.pageCount || '?'})`
    ).join('; ');

    const systemPrompt = `You are an expert AI Reading Coach for a personal book tracking app called BookVault. 
Analyze the user's reading data and provide personalized, actionable coaching insights.

Be warm, encouraging, and specific. Reference actual book titles and data. Use emoji sparingly for warmth.
Structure your response with clear sections using markdown headers.

Always include:
1. **Reading Pulse** — A quick snapshot of their current reading health (momentum, consistency, variety)
2. **Smart Insights** — 2-3 data-driven observations about their habits (e.g., reading speed trends, genre patterns, time-of-day preferences)
3. **This Week's Challenge** — One specific, achievable micro-goal based on their data
4. **Next Read Suggestion** — Based on their history, suggest what type of book to pick up next (not a specific title, but a genre/style/length recommendation)
5. **Motivation Boost** — An encouraging note about their progress

Keep the total response concise (under 400 words). Be specific, not generic.`;

    const userPrompt = `Here's my reading profile:
- Total books: ${totalBooks} (${finished.length} finished, ${reading.length} currently reading)
- Total pages read: ${totalPages}
- Average rating given: ${avgRating}
- Top genres: ${topGenres.join(', ') || 'None yet'}
- Currently reading: ${currentlyReading || 'Nothing right now'}
- ${sessionSummary}

Please give me my personalized reading coach insights.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("reading-coach error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
