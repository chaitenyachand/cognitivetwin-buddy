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
    const { topicName, userId, materialType } = await req.json();

    if (!topicName || !userId) {
      throw new Error('topicName and userId are required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Generating materials for topic:', topicName);

    // Generate all materials using Lovable AI
    const systemPrompt = `You are an educational content generator. Create comprehensive learning materials for the topic provided.

Generate materials in this exact JSON format:
{
  "summary": "A clear 2-3 paragraph summary of the topic",
  "mindmap": {
    "nodes": [
      {"id": "1", "label": "Central Topic", "level": 0},
      {"id": "2", "label": "Key Concept 1", "level": 1},
      {"id": "3", "label": "Detail 1", "level": 2}
    ],
    "edges": [
      {"source": "1", "target": "2"},
      {"source": "2", "target": "3"}
    ]
  },
  "flashcards": [
    {"front": "Question 1", "back": "Answer 1"},
    {"front": "Question 2", "back": "Answer 2"}
  ],
  "quiz": {
    "questions": [
      {
        "question": "What is...",
        "options": ["A", "B", "C", "D"],
        "correct": 0,
        "explanation": "Because..."
      }
    ]
  },
  "formula_sheet": {
    "formulas": [
      {
        "name": "Formula Name",
        "formula": "mathematical formula or key concept",
        "description": "when and how to use it",
        "example": "example application"
      }
    ]
  },
  "explanation": "A brief spoken explanation of what was generated (2-3 sentences)"
}

Create 5-7 mindmap nodes, 5-8 flashcards, 4-6 quiz questions, and 5-7 key formulas or concepts.`;

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
          { role: "user", content: `Generate comprehensive learning materials for: ${topicName}` }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('AI gateway error:', error);
      throw new Error('Material generation failed');
    }

    const aiData = await response.json();
    
    // Strip markdown code blocks if present
    let content = aiData.choices[0].message.content;
    if (content.includes('```')) {
      content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    }
    
    const materials = JSON.parse(content);

    // Save to database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Create topic
    const { data: topic, error: topicError } = await supabase
      .from('topics')
      .insert({
        user_id: userId,
        name: topicName,
        summary: materials.summary
      })
      .select()
      .single();

    if (topicError) throw topicError;

    // Create mindmap
    const { error: mindmapError } = await supabase
      .from('mindmaps')
      .insert({
        topic_id: topic.id,
        nodes_json: materials.mindmap.nodes,
        edges_json: materials.mindmap.edges
      });

    if (mindmapError) throw mindmapError;

    // Create flashcards
    const { error: flashcardsError } = await supabase
      .from('flashcards')
      .insert({
        topic_id: topic.id,
        flashcard_json: materials.flashcards
      });

    if (flashcardsError) throw flashcardsError;

    console.log('Materials generated successfully for topic:', topicName);

    return new Response(
      JSON.stringify({
        topicId: topic.id,
        ...materials
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error generating materials:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
