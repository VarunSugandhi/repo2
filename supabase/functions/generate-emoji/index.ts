// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FALLBACKS: Record<string, string[]> = {
  science: ['🧪','🔬','🧬'],
  math: ['➗','📐','📊'],
  ai: ['🤖','🧠','✨'],
  history: ['🏰','📜','🗺️'],
  language: ['🗣️','📘','📝'],
  art: ['🎨','🖌️','🖼️'],
  code: ['💻','🧩','⚙️'],
  business: ['📈','💼','🏦'],
  health: ['🩺','💊','❤️'],
};

function simpleEmoji(title: string): string {
  const t = title.toLowerCase();
  for (const [k, arr] of Object.entries(FALLBACKS)) {
    if (t.includes(k)) return arr[0];
  }
  const pool = ['📘','📗','📕','📙','📔','📝','⭐','🌟','🌱','🧠','🔎','🎯','🧭','🧩'];
  return pool[Math.floor(((Array.from(t).reduce((a,c)=>a+c.charCodeAt(0),0)) % pool.length))];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title } = await req.json();
    if (!title) {
      return new Response(JSON.stringify({ error: 'title is required' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const CEREBRAS_API_KEY = Deno.env.get('CEREBRAS_API_KEY');
    const CEREBRAS_BASE_URL = Deno.env.get('CEREBRAS_BASE_URL') || 'https://api.cerebras.ai/v1';

    if (!LOVABLE_API_KEY && !CEREBRAS_API_KEY) {
      return new Response(JSON.stringify({ emoji: simpleEmoji(title) }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const useLovable = Boolean(LOVABLE_API_KEY);
    const endpoint = useLovable ? 'https://ai.gateway.lovable.dev/v1/chat/completions' : `${CEREBRAS_BASE_URL}/chat/completions`;
    const headers: Record<string,string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${useLovable ? LOVABLE_API_KEY : CEREBRAS_API_KEY}`,
    };
    const body = {
      model: useLovable ? 'google/gemini-2.5-flash' : 'llama3.1-8b',
      messages: [
        { role: 'system', content: 'Return a single most appropriate emoji for the given notebook title. Only return the emoji character, nothing else.' },
        { role: 'user', content: title }
      ]
    };

    const resp = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(body) });
    if (!resp.ok) {
      return new Response(JSON.stringify({ emoji: simpleEmoji(title) }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const data = await resp.json();
    const out = (data.choices?.[0]?.message?.content || data.choices?.[0]?.message || data.choices?.[0]?.text || '').trim();
    const emoji = out.length > 2 ? simpleEmoji(title) : out; // guard
    return new Response(JSON.stringify({ emoji }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ emoji: simpleEmoji('fallback') }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});


