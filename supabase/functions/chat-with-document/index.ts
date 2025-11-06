import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, notebookId, conversationHistory } = await req.json();

    if (!message || !notebookId) {
      throw new Error('Message and notebookId are required');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all sources from the notebook for context
    const { data: sources, error: sourcesError } = await supabase
      .from('sources')
      .select('content, title')
      .eq('notebook_id', notebookId);

    if (sourcesError) throw sourcesError;

    // Fetch recent summaries for context
    const { data: summaries, error: summariesError } = await supabase
      .from('summaries')
      .select('content')
      .eq('notebook_id', notebookId)
      .order('created_at', { ascending: false })
      .limit(3);

    if (summariesError) throw summariesError;

    // Build context from sources and summaries
    const context = [
      ...sources.map(s => `Source: ${s.title}\n${s.content}`),
      ...summaries.map(s => s.content)
    ].join('\n\n---\n\n');

    // Guard: no context available
    if (!context || context.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "No sources or summaries found for this notebook. Add a PDF or text source to start chatting." }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const CEREBRAS_API_KEY = Deno.env.get('CEREBRAS_API_KEY');
    const CEREBRAS_BASE_URL = Deno.env.get('CEREBRAS_BASE_URL') || 'https://api.cerebras.ai/v1';

    // If Lovable key missing, try Cerebras fallback
    if (!LOVABLE_API_KEY && !CEREBRAS_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI provider not configured. Set LOVABLE_API_KEY or CEREBRAS_API_KEY." }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build conversation messages
    const messages = [
      { 
        role: 'system', 
        content: `You are an AI tutor helping students learn from their uploaded materials. Answer questions based on the provided context. Be helpful, clear, and educational.\n\nContext:\n${context}`
      },
      ...(conversationHistory || []),
      { role: 'user', content: message }
    ];

    const useLovable = Boolean(LOVABLE_API_KEY);
    const endpoint = useLovable
      ? 'https://ai.gateway.lovable.dev/v1/chat/completions'
      : `${CEREBRAS_BASE_URL}/chat/completions`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${useLovable ? LOVABLE_API_KEY : CEREBRAS_API_KEY}`,
    };
    const body = useLovable
      ? { model: 'google/gemini-2.5-flash', messages }
      : { model: 'llama3.1-8b', messages };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error('Failed to generate response');
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || data.choices?.[0]?.message || data.choices?.[0]?.text || '';

    return new Response(
      JSON.stringify({ reply }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in chat-with-document:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
