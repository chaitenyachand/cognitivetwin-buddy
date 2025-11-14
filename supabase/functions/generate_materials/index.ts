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

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    console.log('Generating materials for topic:', topicName);

    // Generate all materials using OpenAI API
    const systemPrompt = `You are an educational content generator. Create comprehensive learning materials for the topic provided.

IMPORTANT RULES:
- Do NOT use emojis anywhere in the generated content
- Write in clear, professional language
- Be thorough and educational

Generate materials in this exact JSON format:
{
  "summary": "A comprehensive 4-6 paragraph summary covering key concepts, important details, practical applications, and learning outcomes. Make it detailed and informative.",
  "mindmap": {
    "nodes": [
      {"id": "1", "label": "Central Topic", "level": 0, "color": "primary"},
      {"id": "2", "label": "Key Concept 1", "level": 1, "color": "blue"},
      {"id": "3", "label": "Detail 1a", "level": 2, "color": "blue"},
      {"id": "4", "label": "Detail 1b", "level": 2, "color": "blue"},
      {"id": "5", "label": "Key Concept 2", "level": 1, "color": "purple"}
    ],
    "edges": [
      {"source": "1", "target": "2", "color": "blue"},
      {"source": "2", "target": "3", "color": "blue"},
      {"source": "2", "target": "4", "color": "blue"},
      {"source": "1", "target": "5", "color": "purple"}
    ]
  },
  "flashcards": [
    {"front": "Concise question or term", "back": "Clear, detailed answer or definition"},
    {"front": "Key concept", "back": "Explanation with examples"}
  ],
  "quiz": {
    "questions": [
      {
        "question": "What is...",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctIndex": 0,
        "explanation": "Detailed explanation of why this is correct"
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
  }
}

Create 8-12 mindmap nodes with multiple branches, 8-12 flashcards, 6-10 quiz questions, and 5-8 formulas/key concepts. Use colors: primary, blue, purple, pink, red, green for mindmap branches.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
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
