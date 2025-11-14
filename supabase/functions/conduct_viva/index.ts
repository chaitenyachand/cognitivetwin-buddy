import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { 
      action, // 'start', 'answer', 'end'
      topicId,
      topicName,
      materials, // summary, flashcards, quiz content
      conversationHistory,
      userResponse,
      sessionId,
      userId
    } = await req.json();

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (action === 'start') {
      // Start viva test
      const hasMaterials = materials && typeof materials === 'object';
      const systemPrompt = `You are conducting a viva voce (oral examination) for a student on the topic: "${topicName}".

MATERIALS PROVIDED:
${hasMaterials && materials.summary ? `Summary:\n${materials.summary}\n\n` : 'No summary available. Base questions on the topic name.\n\n'}
${hasMaterials && materials.flashcards && Array.isArray(materials.flashcards) ? `Key Concepts:\n${materials.flashcards.map((fc: any) => `- ${fc.front}`).join('\n')}\n\n` : ''}

VIVA STYLE:
- Ask ONE thoughtful question at a time
- Start with fundamental concepts, gradually increase difficulty
- Ask follow-up questions based on their answers
- Be conversational and encouraging, like a friendly professor
- Keep questions concise and suitable for voice delivery (2-3 sentences max)
- Track their understanding level throughout
- After 5-7 questions, conclude the viva

Begin by asking your first question. Keep it conversational and engaging.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: 'Please start the viva examination.' }
          ],
          max_tokens: 200,
          temperature: 0.8
        }),
      });

      const data = await response.json();
      const question = data.choices[0].message.content;

      return new Response(
        JSON.stringify({ 
          question,
          vivaStarted: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'answer') {
      // Process student answer and ask next question
      const hasMaterials = materials && typeof materials === 'object';
      const systemPrompt = `You are conducting a viva voce examination on "${topicName}".

MATERIALS:
${hasMaterials && materials.summary ? `Summary:\n${materials.summary}\n\n` : 'No detailed materials available. Base assessment on topic knowledge.\n\n'}

CONVERSATION SO FAR:
${conversationHistory.map((msg: any) => `${msg.role === 'assistant' ? 'Examiner' : 'Student'}: ${msg.content}`).join('\n')}

Evaluate their latest response. Then either:
1. Ask a follow-up or next question (keep conversational, 2-3 sentences)
2. If you've asked 5-7 questions, conclude with: "VIVA_COMPLETE"

Be encouraging but assess their understanding. Track weak areas mentally.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userResponse }
          ],
          max_tokens: 250,
          temperature: 0.8
        }),
      });

      const data = await response.json();
      const nextQuestion = data.choices[0].message.content;

      const isComplete = nextQuestion.includes('VIVA_COMPLETE');

      return new Response(
        JSON.stringify({ 
          question: isComplete ? nextQuestion.replace('VIVA_COMPLETE', '').trim() : nextQuestion,
          vivaComplete: isComplete
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'end') {
      // Generate final assessment
      const hasMaterials = materials && typeof materials === 'object';
      const assessmentPrompt = `You conducted a viva examination on "${topicName}".

FULL CONVERSATION:
${conversationHistory.map((msg: any) => `${msg.role === 'assistant' ? 'Examiner' : 'Student'}: ${msg.content}`).join('\n\n')}

MATERIALS COVERED:
${hasMaterials && materials.summary ? `Summary:\n${materials.summary}\n\n` : 'Assessment based on general topic knowledge.\n\n'}

Provide a comprehensive assessment in JSON format:
{
  "score": <0-100>,
  "strengths": ["strength1", "strength2"],
  "weakAreas": ["weak_topic1", "weak_topic2", "weak_topic3"],
  "feedback": "Brief encouraging feedback suitable for voice delivery (3-4 sentences)",
  "detailedAnalysis": "Detailed written analysis of their performance"
}

Identify 2-4 specific weak areas (subtopics they struggled with).`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: 'You are an educational assessment expert. Respond with valid JSON only.' },
            { role: 'user', content: assessmentPrompt }
          ],
          max_tokens: 800,
          temperature: 0.7,
          response_format: { type: "json_object" }
        }),
      });

      const data = await response.json();
      let assessment = JSON.parse(data.choices[0].message.content);

      // Store weak topics in database
      if (assessment.weakAreas && assessment.weakAreas.length > 0 && userId && topicId) {
        for (const weakArea of assessment.weakAreas) {
          await supabase.from('weak_topics').insert({
            user_id: userId,
            topic_id: topicId,
            topic_name: topicName,
            weak_area: weakArea,
            identified_from: 'viva_test',
            score: assessment.score,
            notes: assessment.detailedAnalysis,
            addressed: false
          });
        }
      }

      return new Response(
        JSON.stringify({ assessment }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action');

  } catch (error) {
    console.error('Error in conduct_viva:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
