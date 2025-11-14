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
    const systemPrompt = `You are an educational content generator. Create comprehensive learning materials suitable for students learning from scratch.

CRITICAL RULES:
- Do NOT use emojis anywhere in the generated content
- Write in clear, professional, educational language
- Be thorough and provide detailed explanations
- Use proper formatting and structure

Generate materials in this exact JSON format:
{
  "summary": "A detailed, well-structured summary with 4-6 comprehensive paragraphs. Cover key concepts, important details, practical applications, and learning outcomes. Make it informative and suitable for students learning from scratch. Use clear paragraph breaks.",
  "mindmap": {
    "nodes": [
      {"id": "1", "label": "Central Topic", "level": 0, "color": "primary"},
      {"id": "2", "label": "Key Concept 1", "level": 1, "color": "blue"},
      {"id": "3", "label": "Detail 1a", "level": 2, "color": "blue"},
      {"id": "4", "label": "Detail 1b", "level": 2, "color": "blue"},
      {"id": "5", "label": "Key Concept 2", "level": 1, "color": "purple"},
      {"id": "6", "label": "Detail 2a", "level": 2, "color": "purple"}
    ],
    "edges": [
      {"source": "1", "target": "2", "color": "blue"},
      {"source": "2", "target": "3", "color": "blue"},
      {"source": "2", "target": "4", "color": "blue"},
      {"source": "1", "target": "5", "color": "purple"},
      {"source": "5", "target": "6", "color": "purple"}
    ]
  },
  "flashcards": [
    {"front": "Key term or concept question", "back": "Clear, detailed definition or answer with explanation"},
    {"front": "Important concept", "back": "Comprehensive explanation with examples and context"}
  ],
  "quiz": {
    "questions": [
      {
        "question": "What is the main purpose of...?",
        "topic": "Core Concepts",
        "options": ["A. First option", "B. Second option", "C. Third option", "D. Fourth option"],
        "correctIndex": 0,
        "explanation": "Detailed explanation of why this answer is correct and why others are incorrect"
      }
    ]
  },
  "formula_sheet": {
    "formulas": [
      {
        "name": "Formula or Principle Name",
        "formula": "Mathematical formula or key concept statement",
        "description": "Clear explanation of when and how to use it, with context",
        "example": "Concrete example application with numbers or real-world scenario"
      }
    ]
  }
}

MINDMAP REQUIREMENTS:
- Create 10-15 hierarchical nodes with clear relationships
- Level 0: 1 central topic node (color: "primary")
- Level 1: 3-5 main concept nodes (colors: "blue", "purple", "pink", "green")
- Level 2: 6-10 detail nodes matching parent colors
- Ensure each branch has at least 2 child nodes
- Keep labels concise (2-5 words max)
- Use diverse colors for different main branches

FLASHCARD REQUIREMENTS:
- Generate 10-15 flashcards
- Front: Clear, concise question or key term (keep brief)
- Back: Detailed definition with explanation and context
- Cover the most important concepts from the topic
- Mix conceptual and factual cards

QUIZ REQUIREMENTS:
- Generate 8-12 questions with good variety
- Include "topic" field: 2-4 word category for each question
- Options must start with "A. ", "B. ", "C. ", "D. "
- Make distractors plausible but clearly incorrect
- Provide thorough explanations that teach the concept
- Test understanding, not just memorization

FORMULA SHEET REQUIREMENTS:
- Generate 6-10 key formulas, equations, or important principles
- If no mathematical formulas exist, include key concepts and definitions
- Each entry must have all four fields: name, formula, description, example
- Make examples concrete and practical`;

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
