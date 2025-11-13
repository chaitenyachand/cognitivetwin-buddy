import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Deno-native Agora Token Builder using WebCrypto
class AgoraTokenBuilder {
  private appId: string;
  private appCertificate: string;

  constructor(appId: string, appCertificate: string) {
    this.appId = appId;
    this.appCertificate = appCertificate;
  }

  async buildTokenWithUid(
    channelName: string,
    uid: number,
    role: number,
    privilegeExpiredTs: number
  ): Promise<string> {
    const message = await this.packMessage(channelName, uid, privilegeExpiredTs);
    const signature = await this.hmacSign(message);
    
    // Build token with "006" prefix (AccessToken2 format)
    const content = this.uint8ArrayToBase64(new Uint8Array([...message, ...signature]));
    return `006${this.appId}${content}`;
  }

  private async packMessage(
    channelName: string,
    uid: number,
    privilegeExpiredTs: number
  ): Promise<Uint8Array> {
    const encoder = new TextEncoder();
    
    // Pack format: appId + channelName + uid + privilegeExpiredTs
    const appIdBytes = encoder.encode(this.appId);
    const channelBytes = encoder.encode(channelName);
    const uidBytes = this.uint32ToBytes(uid);
    const tsBytes = this.uint32ToBytes(privilegeExpiredTs);
    
    // Combine all parts
    const message = new Uint8Array(
      appIdBytes.length + channelBytes.length + uidBytes.length + tsBytes.length
    );
    
    let offset = 0;
    message.set(appIdBytes, offset);
    offset += appIdBytes.length;
    message.set(channelBytes, offset);
    offset += channelBytes.length;
    message.set(uidBytes, offset);
    offset += uidBytes.length;
    message.set(tsBytes, offset);
    
    return message;
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
    
    // Convert to ArrayBuffer for crypto.subtle
    const messageBuffer = new Uint8Array(message).buffer as ArrayBuffer;
    const signature = await crypto.subtle.sign('HMAC', key, messageBuffer);
    return new Uint8Array(signature);
  }

  private uint32ToBytes(num: number): Uint8Array {
    const bytes = new Uint8Array(4);
    bytes[0] = (num >> 24) & 0xff;
    bytes[1] = (num >> 16) & 0xff;
    bytes[2] = (num >> 8) & 0xff;
    bytes[3] = num & 0xff;
    return bytes;
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

    const expirationTimeInSeconds = 24 * 60 * 60; // 24h
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    const numericUid = Number.isFinite(Number(uid)) ? Number(uid) : 0;

    // Generate RTC token using native Deno implementation
    const tokenBuilder = new AgoraTokenBuilder(appId, appCertificate);
    const token = await tokenBuilder.buildTokenWithUid(
      channelName,
      numericUid,
      1, // RolePublisher
      privilegeExpiredTs
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
