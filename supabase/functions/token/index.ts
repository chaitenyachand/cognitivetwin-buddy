import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { RtcTokenBuilder, RtcRole } from "https://esm.sh/agora-access-token@2.0.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { channelName, uid } = await req.json();

    if (!channelName) {
      throw new Error('channelName is required');
    }

    // Read and normalize credentials from environment
    const clean = (s: string) => s.trim().replace(/^['"]+|['"]+$/g, '');
    const appIdRaw = Deno.env.get('AGORA_APP_ID');
    const appCertRaw = Deno.env.get('AGORA_APP_CERT');

    const appId = appIdRaw ? clean(appIdRaw) : undefined;
    const appCertificate = appCertRaw ? clean(appCertRaw) : undefined;

    if (!appId || !appCertificate) {
      throw new Error('Agora credentials not configured');
    }

    const expirationTimeInSeconds = 24 * 60 * 60; // 24h
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    const numericUid = Number.isFinite(Number(uid)) ? Number(uid) : 0;

    // Generate an RTC token using the official builder (prefix "006")
    const role = RtcRole.PUBLISHER;
    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      numericUid,
      role,
      privilegeExpiredTs,
    );

    console.log('Generated Agora RTC token (006...) for channel:', channelName);

    return new Response(
      JSON.stringify({ token, appId, channelName, uid: numericUid }),
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
