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
    const { class: classNum, exam, year, title, isMockTest } = await req.json();

    if (!classNum || !exam) {
      throw new Error('Class and exam are required');
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

    // Use AI to search and fetch question paper content
    const useLovable = Boolean(LOVABLE_API_KEY);
    const endpoint = useLovable ? 'https://ai.gateway.lovable.dev/v1/chat/completions' : `${CEREBRAS_BASE_URL}/chat/completions`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${useLovable ? LOVABLE_API_KEY : CEREBRAS_API_KEY}`,
    };

    const searchQuery = isMockTest 
      ? `Class ${classNum} ${exam} mock test practice paper`
      : `Class ${classNum} ${exam} ${year ? year : ''} question paper`;
    
    const systemPrompt = isMockTest
      ? 'You are an educational content assistant. Generate a comprehensive MOCK TEST based on the provided class and exam type. Create practice questions that match the exam pattern and difficulty level. Include multiple choice questions, short answer questions, and long answer questions relevant to the curriculum. Format it clearly with sections and proper numbering.'
      : 'You are an educational content assistant. Generate a comprehensive question paper based on the provided class, exam type, and year. Include multiple choice questions, short answer questions, and long answer questions relevant to the curriculum. Format it clearly with sections and proper numbering.';
    
    const userPrompt = isMockTest
      ? `Generate a complete MOCK TEST for:
- Class: ${classNum}
- Exam: ${exam}
- Title: ${title || `${exam} Mock Test - Class ${classNum}`}

Please create a realistic MOCK TEST with:
1. Multiple Choice Questions (MCQs) with 4 options each - covering all major topics
2. Short Answer Questions (2-3 marks each) - testing understanding
3. Long Answer Questions (4-5 marks each) - testing application and analysis

The mock test should:
- Match the ${exam} exam pattern and difficulty level
- Cover all major subjects/topics for Class ${classNum}
- Include questions that test conceptual understanding, problem-solving, and application
- Be comprehensive enough to serve as a practice test

Format it clearly with sections, question numbers, and options. Make it comprehensive and educational.`
      : `Generate a complete question paper for:
- Class: ${classNum}
- Exam: ${exam}
${year ? `- Year: ${year}` : ''}
- Title: ${title || `${exam} Class ${classNum} Question Paper`}

Please create a realistic question paper with:
1. Multiple Choice Questions (MCQs) with 4 options each
2. Short Answer Questions (2-3 marks each)
3. Long Answer Questions (4-5 marks each)

Include questions covering major topics for this class and exam type. Format it clearly with sections, question numbers, and options. Make it comprehensive and educational.`;
    
    const body = {
      model: useLovable ? 'google/gemini-2.5-flash' : 'llama3.1-8b',
      messages: [
        { 
          role: 'system', 
          content: systemPrompt
        },
        { 
          role: 'user', 
          content: userPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 4000,
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
      throw new Error('Failed to fetch question paper');
    }

    const data = await response.json();
    const questionPaper = data.choices?.[0]?.message?.content || data.choices?.[0]?.message || data.choices?.[0]?.text || '';

    if (!questionPaper) {
      throw new Error('No question paper content generated');
    }

    return new Response(
      JSON.stringify({ content: questionPaper }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in fetch-question-paper:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        content: null 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

