import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { withGuard } from "../_shared/guard.ts";
import { corsHeaders } from "../_shared/http.ts";
import { aiErrorBody, generateAiText } from "../_shared/ai.ts";
import * as v from "../_shared/validate.ts";

const BodySchema = v.object({
  books: v.withDefault(v.array(v.record(60), { max: 500 }), []),
  readingSessions: v.withDefault(v.array(v.record(30), { max: 200 }), []),
});

serve(withGuard(
  {
    fn: 'ai-reading-coach',
    schema: BodySchema,
    maxBodyBytes: 1024 * 1024,
    rate: { name: 'ai-reading-coach', max: 12, windowMs: 60_000, maxConcurrent: 2 },
  },
  async ({ body, log }) => {
  const books = body.books as any[];
  const readingSessions = body.readingSessions as any[];

  try {

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

    const generatedText = await generateAiText({ system: systemPrompt, prompt: userPrompt, log });

    return new Response(
  JSON.stringify({
    response: generatedText,
  }),
  {
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  }
);
  } catch (e) {
    log.error("reading-coach failure", { detail: e instanceof Error ? e.message : String(e) });
    const mapped = aiErrorBody(e);
    return new Response(JSON.stringify(mapped.body), {
      status: mapped.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}));
