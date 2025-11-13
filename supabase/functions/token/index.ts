import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
// Import official Agora token builder via ESM for Deno
import { RtcTokenBuilder, RtcRole } from "https://esm.sh/agora-access-token@2.0.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
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

    const userUid = typeof uid === 'number' ? uid : parseInt(uid || '0', 10) || 0;

    // Token expiry: 24 hours
    const expirationTimeInSeconds = 60 * 60 * 24;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpireTs = currentTimestamp + expirationTimeInSeconds;

    // Build a standard RTC token (version 007 compatible implementation internally)
    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      userUid,
      RtcRole.PUBLISHER,
      privilegeExpireTs,
    );

    console.log('Generated Agora token (official builder) for channel:', channelName);

    return new Response(
      JSON.stringify({ token, appId, channelName, uid: userUid }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating token:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
