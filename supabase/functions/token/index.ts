import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Agora token generation using native Deno crypto
async function generateAgoraToken(
  appId: string,
  appCertificate: string,
  channelName: string,
  uid: number,
  role: number,
  privilegeExpiredTs: number
): Promise<string> {
  const encoder = new TextEncoder();
  
  // Pack message
  const message = new Uint8Array([
    0x00, 0x04, // version and length
    ...encoder.encode(appId),
    ...packUint32(privilegeExpiredTs),
    ...packUint32(uid),
    ...encoder.encode(channelName),
    ...packUint32(role),
    ...packUint32(privilegeExpiredTs)
  ]);

  // Generate signature using HMAC-SHA256
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(appCertificate),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, message);
  
  // Combine signature and message
  const token = new Uint8Array([...new Uint8Array(signature), ...message]);
  
  // Base64 encode
  return btoa(String.fromCharCode(...token));
}

function packUint32(num: number): Uint8Array {
  const arr = new Uint8Array(4);
  arr[0] = (num >> 24) & 0xff;
  arr[1] = (num >> 16) & 0xff;
  arr[2] = (num >> 8) & 0xff;
  arr[3] = num & 0xff;
  return arr;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { channelName, uid } = await req.json();

    if (!channelName) {
      throw new Error('channelName is required');
    }

    const appId = Deno.env.get('AGORA_APP_ID');
    const appCertificate = Deno.env.get('AGORA_APP_CERT');

    if (!appId || !appCertificate) {
      throw new Error('Agora credentials not configured');
    }

    // Generate token valid for 24 hours
    const expirationTimeInSeconds = 86400;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    // Use uid or default to 0
    const userUid = uid || 0;

    // Role: 1 = PUBLISHER, 2 = SUBSCRIBER
    const role = 1; // PUBLISHER

    const token = await generateAgoraToken(
      appId,
      appCertificate,
      channelName,
      userUid,
      role,
      privilegeExpiredTs
    );

    console.log('Generated Agora token for channel:', channelName);

    return new Response(
      JSON.stringify({ 
        token,
        appId,
        channelName,
        uid: userUid
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error generating token:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
