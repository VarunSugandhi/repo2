// @ts-nocheck
/* eslint-disable */
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
    const { summary, notebookId } = await req.json();

    if (!summary && !notebookId) {
      throw new Error('Summary or notebookId is required');
    }

    // If notebookId is provided, fetch rich context from DB to improve mind map content
    let contextFromDb = '';
    if (notebookId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data: sources, error: sourcesError } = await supabase
        .from('sources')
        .select('title, content')
        .eq('notebook_id', notebookId)
        .order('created_at', { ascending: false })
        .limit(20);
      if (sourcesError) console.error('fetch sources error:', sourcesError);

      const { data: summaries, error: summariesError } = await supabase
        .from('summaries')
        .select('content')
        .eq('notebook_id', notebookId)
        .order('created_at', { ascending: false })
        .limit(5);
      if (summariesError) console.error('fetch summaries error:', summariesError);

      const sourceTexts = (sources || [])
        .map((s) => `Source: ${s.title}\n${s.content || ''}`)
        .join('\n\n---\n\n');
      const summaryTexts = (summaries || []).map((s) => s.content).join('\n\n');

      // Concatenate and cap length to avoid overlong prompts
      const combined = [summary || '', summaryTexts, sourceTexts]
        .filter(Boolean)
        .join('\n\n');
      contextFromDb = combined.slice(0, 16000); // ~16k chars safeguard
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

    const useLovable = Boolean(LOVABLE_API_KEY);
    const endpoint = useLovable ? 'https://ai.gateway.lovable.dev/v1/chat/completions' : `${CEREBRAS_BASE_URL}/chat/completions`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${useLovable ? LOVABLE_API_KEY : CEREBRAS_API_KEY}`,
    };
    const userContent = [
      'Create a mind map from the content with the following rules:',
      '1) JSON ONLY. No prose. No trailing text.',
      '2) Schema EXACTLY these keys:',
      '   - name: string',
      '   - children: array of nodes (each node follows the same schema)',
      '3) Constraints:',
      '  - Max depth: 4 levels total (root + 3 levels)',
      '  - Max children per node: 6 (root), 5 (level 1), 4 (level 2+)',
      '  - Label rules (Single-Line Labels): 2–5 words, <= 60 chars, concise noun-phrases, no line breaks, no punctuation clutter',
      '  - Avoid duplicates and empty nodes',
      '  - Ensure 4–6 primary branches under root for coverage',
      '4) Visual clarity requirements (implied layout):',
      '   - Hierarchical Spacing: primary branches more spaced than secondary',
      '   - Readable Connections: avoid labels so long they can obscure edges',
      '   - Balanced Distribution: distribute siblings evenly; prevent dense clusters',
      '   - Compactness: concise labels and sensible grouping, minimal whitespace without crowding',
      '   - Single-Line Labels: prefer 2–5 words per label',
      '5) Group related items under meaningful subtopics (e.g., Concepts, Process, Applications, Pitfalls, Examples, Key Terms)',
      '6) Do not include numbers or bullets in labels; use clean titles only.',
      '',
      'Return JSON that matches the schema precisely.',
      '',
      'Content:',
      (contextFromDb || summary || '').slice(0, 16000)
    ].join('\n');

    const body = {
      model: useLovable ? 'google/gemini-2.5-flash' : 'llama3.1-8b',
      messages: [
          { 
            role: 'system', 
            content: 'You are an expert at creating concise, study-friendly mind maps. Convert content into a hierarchical JSON that implies a neat visual layout with zero text overlap between labels and connecting lines.'
          },
          { 
            role: 'user', 
            content: userContent
          }
        ]
      },
    };
    const response = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(body) });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('Failed to generate mind map');
    }

    const data = await response.json();
    let mindMapData: any = null;
    const raw = data.choices?.[0]?.message?.content ?? data.choices?.[0]?.message ?? data.choices?.[0]?.text ?? '';
    if (raw && typeof raw === 'string') {
      // Extract JSON block if model wrapped it with prose accidentally
      const match = raw.match(/\{[\s\S]*\}$/);
      const jsonText = match ? match[0] : raw;
      try {
        mindMapData = JSON.parse(jsonText);
      } catch (_) {
        // attempt to sanitize trailing commas
        const sanitized = jsonText.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
        mindMapData = JSON.parse(sanitized);
      }
    }

    if (!mindMapData) {
      throw new Error('Failed to parse mind map data');
    }

    // Post-process: sanitize for UI constraints
    function cleanLabel(input: string): string {
      let s = String(input ?? "");
      s = s.replace(/[\n\r]+/g, ' '); // single-line
      s = s.replace(/^[\-•*\d]+[\.)\s]+/, ''); // strip leading bullets/numbers
      s = s.replace(/[,:;()\[\]{}<>]/g, ' '); // reduce punctuation clutter
      s = s.replace(/\s+/g, ' ').trim();
      // cap long tokens to reduce overflow
      const words = s.split(' ').filter(Boolean);
      const maxWords = 5;
      const trimmedWords = words.slice(0, maxWords).map((w) => (w.length > 18 ? w.slice(0, 15) + '…' : w));
      s = trimmedWords.join(' ');
      if (s.length > 60) s = s.slice(0, 57) + '...';
      return s;
    }

    function balanceByLabelLength(items: any[]): any[] {
      // sort by length desc, then interleave to spread long/short
      const sorted = [...items].sort((a, b) => (b.name?.length || 0) - (a.name?.length || 0));
      const left: any[] = [];
      const right: any[] = [];
      sorted.forEach((item, idx) => (idx % 2 === 0 ? left : right).push(item));
      const balanced: any[] = [];
      const max = Math.max(left.length, right.length);
      for (let i = 0; i < max; i++) {
        if (left[i]) balanced.push(left[i]);
        if (right[i]) balanced.push(right[i]);
      }
      return balanced;
    }

    function sanitize(node: any, depth: number = 0): any | null {
      if (!node || typeof node !== 'object') return null;
      let name = cleanLabel(node.name);
      if (!name) return null;
      const maxDepth = 3; // root (0) + 3 = 4 levels total
      let children = Array.isArray(node.children) ? node.children : [];
      // Deduplicate by name, sanitize recursively
      const seen = new Set<string>();
      const sanitizedChildren: any[] = [];
      if (depth < maxDepth) {
        // dynamic max children by depth: 6, 5, 4
        const maxChildren = depth === 0 ? 6 : depth === 1 ? 5 : 4;
        for (const child of children) {
          const clean = sanitize(child, depth + 1);
          if (!clean) continue;
          if (seen.has(clean.name)) continue;
          seen.add(clean.name);
          sanitizedChildren.push(clean);
          if (sanitizedChildren.length >= maxChildren) break;
        }
        // Balance siblings by label length to reduce overlap
        const balanced = balanceByLabelLength(sanitizedChildren);
        return balanced.length > 0 ? { name, children: balanced } : { name };
      }
      return { name };
    }

    const sanitized = sanitize(mindMapData);

    return new Response(
      JSON.stringify({ mindMapData: sanitized }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-mind-map:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
