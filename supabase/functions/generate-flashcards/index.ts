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
    const { summary, keyPoints } = await req.json();

    if (!summary && !keyPoints) {
      throw new Error('Summary or key points are required');
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

    const keyPointsText = Array.isArray(keyPoints) ? keyPoints.join('\n') : (keyPoints || '');
    
    // Remove markdown headings and extract main content
    let mainContent = summary || '';
    // Remove lines that are headings (starting with #, ##, ###, etc.)
    mainContent = mainContent.split('\n')
      .filter(line => {
        const trimmed = line.trim();
        // Skip markdown headings
        if (/^#{1,6}\s+/.test(trimmed)) return false;
        // Skip lines that are just headings (very short lines with no content)
        if (trimmed.length < 10 && /^[A-Z\s]+$/.test(trimmed)) return false;
        return true;
      })
      .join('\n')
      .trim();
    
    const flashcardPrompt = `Based on the MAIN CONTENT (not headings or titles) from the following summary and key points, generate 10-15 flashcards with questions and answers. 

IMPORTANT: 
- Do NOT use section headings, titles, or chapter names as questions
- Extract questions from the actual content and explanations
- Focus on concepts, facts, definitions, and explanations from the body text
- Each flashcard should have:
  1. Front: A clear question about a concept, fact, or explanation from the content
  2. Back: A detailed answer or explanation based on the content
  3. Topic: The subject/topic category
  4. Difficulty: easy, medium, or hard

Main Content (headings removed):
${mainContent || 'N/A'}

Key Points:
${keyPointsText || 'N/A'}

Return ONLY a valid JSON array in this exact format (no markdown, no code blocks, just the JSON array):
[
  {
    "front": "Question about the content",
    "back": "Answer or explanation",
    "topic": "Topic name",
    "difficulty": "easy"
  }
]`;

    const body = {
      model: useLovable ? 'google/gemini-2.5-flash' : 'llama3.1-8b',
      messages: [
        {
          role: 'system',
          content: 'You are an educational AI that creates flashcards. Always return ONLY valid JSON arrays, no markdown, no code blocks, no additional text. The response must be a valid JSON array that can be parsed directly.'
        },
        {
          role: 'user',
          content: flashcardPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    };

    const response = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(body) });

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
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('Failed to generate flashcards');
    }

    const data = await response.json();
    const flashcardText = data.choices?.[0]?.message?.content || data.choices?.[0]?.message || data.choices?.[0]?.text || '';

    if (!flashcardText) {
      throw new Error('No flashcard content generated');
    }

    // Extract JSON from response
    let flashcards: any[] = [];
    try {
      // Remove markdown code blocks if present
      let cleanedText = flashcardText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      // Try to find JSON array
      const jsonMatch = cleanedText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        flashcards = JSON.parse(jsonMatch[0]);
      } else {
        // Try parsing the whole text
        flashcards = JSON.parse(cleanedText);
      }
      
      if (!Array.isArray(flashcards)) {
        throw new Error('Response is not an array');
      }
    } catch (parseError) {
      console.error('Error parsing flashcards:', parseError);
      console.error('Response text:', flashcardText);
      throw new Error('Failed to parse flashcards from AI response');
    }

    // Validate and format flashcards
    const formattedFlashcards = flashcards.slice(0, 15).map((fc: any, idx: number) => ({
      front: fc.front || fc.question || fc.concept || `Question ${idx + 1}`,
      back: fc.back || fc.answer || fc.explanation || 'Answer',
      topic: fc.topic || fc.subject || 'General',
      difficulty: ['easy', 'medium', 'hard'].includes(fc.difficulty) ? fc.difficulty : 'medium',
    }));

    return new Response(
      JSON.stringify({ flashcards: formattedFlashcards }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-flashcards:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        flashcards: []
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

