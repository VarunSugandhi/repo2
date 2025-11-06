import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Parse payload ONCE so we don't re-read the stream in catch
  const payload = await req.json().catch(() => ({ topic: '', summary: '' } as any));
  const { topic, summary } = payload as { topic?: string; summary?: string };

  try {
    if (!topic && !summary) {
      throw new Error('Topic or summary is required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const CEREBRAS_API_KEY = Deno.env.get('CEREBRAS_API_KEY');
    const CEREBRAS_BASE_URL = Deno.env.get('CEREBRAS_BASE_URL') || 'https://api.cerebras.ai/v1';
    if (!LOVABLE_API_KEY && !CEREBRAS_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'AI provider not configured. Set LOVABLE_API_KEY or CEREBRAS_API_KEY.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use AI to generate relevant search queries and suggest credible sources
    const useLovable = Boolean(LOVABLE_API_KEY);
    const endpoint = useLovable ? 'https://ai.gateway.lovable.dev/v1/chat/completions' : `${CEREBRAS_BASE_URL}/chat/completions`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${useLovable ? LOVABLE_API_KEY : CEREBRAS_API_KEY}`,
    };
    const body = {
      model: useLovable ? 'google/gemini-2.5-flash' : 'llama3.1-8b',
      messages: [
          { 
            role: 'system', 
            content: 'You are a research assistant. Extract main headings and 1-2 subheadings from the provided topic/summary, then recommend YouTube learning lecture videos for each subheading. Prefer university lectures, course playlists, or reputable educator channels. Output links to specific videos or high-quality playlists.'
          },
          { 
            role: 'user', 
            content: `Content to analyze:\n\nTopic: ${topic || ''}\n\nSummary: ${summary || ''}\n\nTask:\n1) Identify up to 5 concise MAIN HEADINGS.\n2) For each MAIN HEADING, include up to 2 SUBHEADINGS (short phrases).\n3) For each SUBHEADING, include 1-2 YouTube learning lecture video links (full https URLs).\n4) Prefer reputable channels (MIT, Stanford, freeCodeCamp, Khan Academy, GATE lectures, etc.).\n5) Keep titles short and clear.`
          }
        ]
      },
    };
    const response = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(body) });

    if (!response.ok) {
      throw new Error('Failed to generate research links');
    }

    const data = await response.json();
    // Expect pure JSON or markdown fenced JSON; fallback to LLM text parse
    const raw = data.choices?.[0]?.message?.content || data.choices?.[0]?.message || data.choices?.[0]?.text || '';
    let links: any[] = [];
    try {
      const match = typeof raw === 'string' ? raw.match(/\{[\s\S]*\}$/) : null;
      const jsonText = match ? match[0] : raw;
      const parsed = typeof jsonText === 'string' ? JSON.parse(jsonText) : jsonText;
      // Accept either {sections:[{heading, subheadings:[...], videos:[{title,url,channel}]}]} or {links:[...]}
      if (parsed?.sections) {
        parsed.sections.forEach((sec: any) => {
          (sec.subheadings || [null]).forEach((sub: any) => {
            (sec.videos || []).forEach((v: any) => {
              links.push({
                title: v?.title || `${sec.heading} - ${sub || ''}`.trim(),
                description: `Lecture: ${sec.heading}${sub ? ' • ' + sub : ''}${v?.channel ? ' • ' + v.channel : ''}`,
                url: v?.url || '',
                source: 'YouTube',
                heading: sec.heading,
                subheading: sub || undefined,
              });
            });
          });
        });
      } else if (parsed?.links) {
        links = parsed.links;
      }
    } catch (_) {
      links = [];
    }

    return new Response(
      JSON.stringify({ links }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in fetch-research-links:', error);
    // Fallback: build YouTube search links from topic/summary so UI still works
    try {
      const baseText = String(summary || topic || '').split('\n').map((l: string) => l.trim()).filter((l: string) => l).slice(0, 6);
      const normalized = baseText.map((t: string) => t.replace(/^#\s+/, '').replace(/^[-*]\s+/, '').replace(/^\d+\.\s+/, ''));
      const fallbackLinks = normalized.map((t: string) => ({
        title: `Lecture: ${t}`,
        description: `YouTube search for ${t}`,
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${t} lecture`)}`,
        source: 'YouTube',
        heading: t,
      }));
      return new Response(
        JSON.stringify({ links: fallbackLinks }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }
});
