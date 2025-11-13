import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, chatHistory, question } = await req.json();
    console.log('Explaining visual with question:', question);

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Build messages array with chat history
    const messages: any[] = [
      {
        role: 'system',
        content: 'You are an expert educational tutor. Explain diagrams and visuals clearly and engagingly. Keep explanations concise (2-3 sentences) and suitable for voice delivery. Answer questions about the visual specifically.'
      }
    ];

    // Add chat history if provided
    if (chatHistory && chatHistory.length > 0) {
      chatHistory.forEach((msg: any) => {
        messages.push({
          role: msg.role,
          content: msg.content
        });
      });
    }

    // Add current question with image
    const userMessage: any = {
      role: 'user',
      content: [
        {
          type: 'image_url',
          image_url: {
            url: imageUrl
          }
        }
      ]
    };

    if (question) {
      userMessage.content.push({
        type: 'text',
        text: question
      });
    } else {
      userMessage.content.push({
        type: 'text',
        text: 'Please provide a brief introductory explanation of this diagram. What are the main components and what does this show?'
      });
    }

    messages.push(userMessage);

    // Call GPT-4 Vision
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: messages,
        max_tokens: 300,
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`Failed to explain visual: ${errorText}`);
    }

    const data = await response.json();
    const explanation = data.choices[0].message.content;

    console.log('Explanation generated successfully');

    return new Response(
      JSON.stringify({ explanation }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in explain_visual:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
