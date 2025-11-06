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

  try {
    const { summary, researchLinks, topic } = await req.json();

    if (!summary && !topic) {
      throw new Error('Summary or topic is required');
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

    // Prepare references from research links
    const references = researchLinks?.map((link: any, index: number) => 
      `[${index + 1}] ${link.title} - ${link.url}`
    ).join('\n') || '';

    const useLovable = Boolean(LOVABLE_API_KEY);
    const endpoint = useLovable ? 'https://ai.gateway.lovable.dev/v1/chat/completions' : `${CEREBRAS_BASE_URL}/chat/completions`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${useLovable ? LOVABLE_API_KEY : CEREBRAS_API_KEY}`,
    };
    const body = {
      model: useLovable ? 'google/gemini-2.5-flash' : 'llama3.1-8b',
      messages: [
        { role: 'system', content: `You are Synapse Report Generator.
Generate a structured academic-style report including:

1. **Title** - Clear and descriptive
2. **Abstract** (3-4 lines) - Brief overview
3. **Problem Statement** - What challenge or question is being addressed
4. **Key Findings or Concepts** - Main insights (use bullet points)
5. **Conclusion** - Summary and implications
6. **References** - Cite provided research links

Use clean, formal, research-friendly tone. Format with proper markdown for readability.`
        },
        { role: 'user', content: `Generate a report based on:\n\nContent: ${summary || topic}\n\nAvailable References:\n${references}` },
      ],
    };
    const reportResponse = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(body) });

    if (!reportResponse.ok) {
      if (reportResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (reportResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error('Failed to generate report');
    }

    const reportData = await reportResponse.json();
    const report = reportData.choices?.[0]?.message?.content ?? reportData.choices?.[0]?.message ?? reportData.choices?.[0]?.text ?? '';

    return new Response(
      JSON.stringify({ report }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-report:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
