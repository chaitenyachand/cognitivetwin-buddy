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
    const formData = await req.formData();

    // Prefer client-side converted images (data URLs) to support OCR for handwritten notes
    const images = formData.getAll('images') as (string | File)[];

    if (images && images.length > 0) {
      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
      if (!LOVABLE_API_KEY) {
        throw new Error('LOVABLE_API_KEY not configured');
      }

      console.log(`Processing ${images.length} image(s) for OCR`);

      // Normalize to data URLs (string). If a File was provided, convert to data URL
      const imageParts: { type: 'image_url'; image_url: string }[] = [];
      for (const it of images) {
        if (typeof it === 'string') {
          // Expecting a data URL like data:image/jpeg;base64,.... If it's just base64, prefix it.
          const val = it.trim();
          const isDataUrl = val.startsWith('data:image/');
          imageParts.push({ type: 'image_url', image_url: isDataUrl ? val : `data:image/jpeg;base64,${val}` });
        } else {
          const arr = new Uint8Array(await it.arrayBuffer());
          // Default to jpeg
          const base64 = btoa(String.fromCharCode(...arr));
          imageParts.push({ type: 'image_url', image_url: `data:image/jpeg;base64,${base64}` });
        }
      }

      // Call Lovable AI Gateway (OpenAI-compatible) to perform OCR + structured text extraction
      const aiResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'system',
              content:
                'You are an expert OCR and document parser. Extract all readable text (including handwritten notes) from the provided pages. Preserve headings, lists, formulas, and overall structure as markdown where possible.'
            },
            {
              role: 'user',
              content: [
                { type: 'text', text: 'Extract all text from these pages. Keep structure, headings, bullet points, code, and formulas.' },
                ...imageParts,
              ],
            },
          ],
          max_tokens: 4000,
        }),
      });

      if (!aiResp.ok) {
        if (aiResp.status === 429) {
          return new Response(JSON.stringify({ error: 'Rate limits exceeded, please try again later.' }), {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        if (aiResp.status === 402) {
          return new Response(
            JSON.stringify({ error: 'Payment required, please add funds to your Lovable AI workspace.' }),
            { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        const txt = await aiResp.text();
        console.error('AI gateway OCR error:', aiResp.status, txt);
        throw new Error('Failed to process images for OCR');
      }

      const aiData = await aiResp.json();
      const extractedText = aiData.choices?.[0]?.message?.content ?? '';

      return new Response(JSON.stringify({ extractedText }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Legacy PDF path: receiving a raw PDF file is no longer supported by image-only models.
    // Frontend should convert PDF pages to images and send them in `images[]`.
    const file = formData.get('file') as File | null;
    if (file) {
      console.error('Received a PDF file. Convert to images client-side and resend as images[].');
      return new Response(
        JSON.stringify({
          error:
            'PDF upload received but not supported directly. Please update the app to convert PDF pages to images and send as images[].',
        }),
        { status: 415, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ error: 'No images provided' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error processing PDF/images:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
