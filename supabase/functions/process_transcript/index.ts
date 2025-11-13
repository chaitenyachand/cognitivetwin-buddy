import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transcript, sessionId, persona } = await req.json();

    if (!transcript) {
      throw new Error('transcript is required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Get conversation history from session
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: history } = await supabase
      .from('partial_transcripts')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(20);

    // Build conversation context
    const conversationHistory = history?.map(h => 
      `${h.speaker}: ${h.text}`
    ).join('\n') || '';

    // Persona-specific system prompts
    const personaPrompts = {
      empathetic: "You are a warm, understanding tutor who validates feelings and builds confidence. Use encouraging language and acknowledge struggles.",
      encouraging: "You are an upbeat, motivating tutor who celebrates progress and inspires action. Use positive reinforcement and energizing language.",
      neutral: "You are a direct, professional tutor focused on clarity and efficiency. Keep explanations concise and factual.",
      authoritative: "You are an expert, confident tutor who provides definitive guidance. Use assertive language and demonstrate mastery."
    };

    const systemPrompt = `${personaPrompts[persona as keyof typeof personaPrompts] || personaPrompts.empathetic}

Your role is to adaptively teach based on the student's understanding:
- If student struggles: re-explain concepts, focus on weak areas, provide examples
- If student shows mastery: introduce harder concepts, challenge with deeper questions
- Always respond conversationally, as if speaking aloud
- Keep responses under 3 sentences for voice delivery
- Analyze understanding level and recommend next steps

Previous conversation:
${conversationHistory}

Student just said: "${transcript}"

Respond with JSON format:
{
  "ai_reply": "your spoken response",
  "type": "explanation|question|assessment|encouragement",
  "understanding_level": "struggling|developing|proficient|advanced",
  "next_objective": "what to focus on next",
  "weak_areas": ["topic1", "topic2"] (if applicable)
}`;

    console.log('Processing transcript with persona:', persona);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: transcript }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('AI gateway error:', error);
      throw new Error('AI processing failed');
    }

    const aiData = await response.json();
    
    // Strip markdown code blocks if present
    let content = aiData.choices[0].message.content;
    if (content.includes('```')) {
      content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    }
    
    const result = JSON.parse(content);

    console.log('AI response:', result);

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error processing transcript:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
