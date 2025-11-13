import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Deno-native Agora AccessToken2 Builder
class AgoraAccessToken2 {
  private appId: string;
  private appCertificate: string;

  constructor(appId: string, appCertificate: string) {
    this.appId = appId;
    this.appCertificate = appCertificate;
  }

  async buildRtcToken(
    channelName: string,
    uid: number,
    privilegeExpiredTs: number
  ): Promise<string> {
    const encoder = new TextEncoder();
    
    // Build message (following Agora AccessToken2 spec)
    const salt = crypto.getRandomValues(new Uint32Array(1))[0];
    const timestamp = Math.floor(Date.now() / 1000);
    
    // Service type: 1 for RTC
    const serviceType = 1;
    
    // Pack privileges (RTC privileges)
    const privileges: any = {
      1: privilegeExpiredTs, // JOIN_CHANNEL
      2: privilegeExpiredTs, // PUBLISH_AUDIO_STREAM
      3: privilegeExpiredTs, // PUBLISH_VIDEO_STREAM
      4: privilegeExpiredTs, // PUBLISH_DATA_STREAM
    };
    
    // Create message buffer
    const message = this.packMessage(
      this.appId,
      channelName,
      uid,
      salt,
      timestamp,
      privilegeExpiredTs,
      privileges
    );
    
    // Sign message
    const signature = await this.hmacSign(message);
    
    // Build final token: version + appId + signature + message (all base64)
    const signatureBase64 = this.uint8ArrayToBase64(signature);
    const messageBase64 = this.uint8ArrayToBase64(message);
    
    return `006${this.appId}${signatureBase64}${messageBase64}`;
  }

  private packMessage(
    appId: string,
    channelName: string,
    uid: number,
    salt: number,
    timestamp: number,
    expireTs: number,
    privileges: any
  ): Uint8Array {
    // Estimate buffer size
    const encoder = new TextEncoder();
    const channelBytes = encoder.encode(channelName);
    
    // Build message parts
    const parts: number[] = [];
    
    // Add salt (4 bytes)
    parts.push(...this.uint32ToArray(salt));
    
    // Add timestamp (4 bytes)
    parts.push(...this.uint32ToArray(timestamp));
    
    // Add expire timestamp (4 bytes)
    parts.push(...this.uint32ToArray(expireTs));
    
    // Add channel name length (2 bytes) + channel name
    parts.push(...this.uint16ToArray(channelBytes.length));
    parts.push(...Array.from(channelBytes));
    
    // Add uid (4 bytes)
    parts.push(...this.uint32ToArray(uid));
    
    return new Uint8Array(parts);
  }

  private async hmacSign(message: Uint8Array): Promise<Uint8Array> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(this.appCertificate);
    
    // Import key for HMAC-SHA256
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    // Sign the message
    const messageBuffer = new Uint8Array(message).buffer as ArrayBuffer;
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, messageBuffer);
    
    // Return first 32 bytes of signature
    return new Uint8Array(signatureBuffer).slice(0, 32);
  }

  private uint32ToArray(num: number): number[] {
    return [
      (num >>> 24) & 0xff,
      (num >>> 16) & 0xff,
      (num >>> 8) & 0xff,
      num & 0xff,
    ];
  }

  private uint16ToArray(num: number): number[] {
    return [
      (num >>> 8) & 0xff,
      num & 0xff,
    ];
  }

  private uint8ArrayToBase64(bytes: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
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

    const appId = Deno.env.get('AGORA_APP_ID')?.trim();
    const appCertificate = Deno.env.get('AGORA_APP_CERT')?.trim();

    if (!appId || !appCertificate) {
      throw new Error('Agora credentials not configured');
    }

    console.log('Generating token for appId:', appId.substring(0, 8) + '...');

    const expirationTimeInSeconds = 24 * 60 * 60; // 24h
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    const numericUid = Number.isFinite(Number(uid)) ? Number(uid) : 0;

    // Generate RTC token
    const tokenBuilder = new AgoraAccessToken2(appId, appCertificate);
    const token = await tokenBuilder.buildRtcToken(
      channelName,
      numericUid,
      privilegeExpiredTs
    );

    console.log('Generated token (006...)', token.substring(0, 50) + '...');

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
