import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Agora RTC Token Builder (Version 006) - Deno-compatible implementation
class AgoraTokenBuilder {
  private appId: string;
  private appCertificate: string;
  private channelName: string;
  private uid: string;

  constructor(appId: string, appCertificate: string, channelName: string, uid: string) {
    this.appId = appId;
    this.appCertificate = appCertificate;
    this.channelName = channelName;
    this.uid = uid;
  }

  private packUint16(num: number): Uint8Array {
    const buffer = new Uint8Array(2);
    buffer[0] = num & 0xff;
    buffer[1] = (num >> 8) & 0xff;
    return buffer;
  }

  private packUint32(num: number): Uint8Array {
    const buffer = new Uint8Array(4);
    buffer[0] = num & 0xff;
    buffer[1] = (num >> 8) & 0xff;
    buffer[2] = (num >> 16) & 0xff;
    buffer[3] = (num >> 24) & 0xff;
    return buffer;
  }

  private packString(str: string): Uint8Array {
    const encoder = new TextEncoder();
    const strBytes = encoder.encode(str);
    const length = this.packUint16(strBytes.length);
    return this.concatArrays([length, strBytes]);
  }

  private concatArrays(arrays: Uint8Array[]): Uint8Array {
    const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
    const result = new ArrayBuffer(totalLength);
    const view = new Uint8Array(result);
    let offset = 0;
    for (const arr of arrays) {
      view.set(arr, offset);
      offset += arr.length;
    }
    return view;
  }

  async build(privilegeExpiredTs: number): Promise<string> {
    // Generate random salt
    const salt = Math.floor(Math.random() * 0xFFFFFFFF);
    
    // Build message content: salt + ts + channelName + uid
    const messageBytes = this.concatArrays([
      this.packUint32(salt),
      this.packUint32(privilegeExpiredTs),
      this.packString(this.channelName),
      this.packString(this.uid),
    ]);

    // Generate HMAC-SHA256 signature using Web Crypto API
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(this.appCertificate),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    // @ts-ignore: Deno's Uint8Array is compatible with BufferSource
    const signature = await crypto.subtle.sign('HMAC', key, messageBytes);
    const signatureBytes = new Uint8Array(signature);

    // Pack final token: version (006) + appId + signature + message
    const version = new Uint8Array([0, 0, 0, 6]);
    const appIdBytes = encoder.encode(this.appId);
    
    const content = this.concatArrays([
      appIdBytes,
      signatureBytes,
      messageBytes
    ]);

    const contentLength = this.packUint16(content.length);
    const packedContent = this.concatArrays([version, contentLength, content]);

    // Base64 encode
    return this.uint8ArrayToBase64(packedContent);
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

    const appIdRaw = Deno.env.get('AGORA_APP_ID');
    const appCertRaw = Deno.env.get('AGORA_APP_CERT');

    const clean = (s: string) => s.trim().replace(/^['"]+|['"]+$/g, '');
    const appId = appIdRaw ? clean(appIdRaw) : undefined;
    const appCertificate = appCertRaw ? clean(appCertRaw) : undefined;

    if (!appId || !appCertificate) {
      throw new Error('Agora credentials not configured');
    }

    console.log('Generating token for:', { appId: appId.slice(0,8) + '...', channelName, uid });

    // Token valid for 24 hours
    const expirationTimeInSeconds = 86400;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    // Use uid or default to "0"
    const userUid = uid?.toString() || "0";

    const tokenBuilder = new AgoraTokenBuilder(appId, appCertificate, channelName, userUid);
    const token = await tokenBuilder.build(privilegeExpiredTs);

    console.log('Generated Agora token for channel:', channelName);

    return new Response(
      JSON.stringify({ 
        token,
        appId,
        channelName,
        uid: parseInt(userUid)
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
