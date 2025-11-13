import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// Import pako for zlib compression
import pako from "https://esm.sh/pako@2.1.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Packing utilities (little-endian)
function packUint16(n: number): Uint8Array {
  const buf = new Uint8Array(2);
  buf[0] = n & 0xff;
  buf[1] = (n >> 8) & 0xff;
  return buf;
}

function packUint32(n: number): Uint8Array {
  const buf = new Uint8Array(4);
  buf[0] = n & 0xff;
  buf[1] = (n >> 8) & 0xff;
  buf[2] = (n >> 16) & 0xff;
  buf[3] = (n >> 24) & 0xff;
  return buf;
}

function packString(data: Uint8Array): Uint8Array {
  const len = packUint16(data.length);
  return concatBuffers(len, data);
}

function packStringText(str: string): Uint8Array {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  return packString(bytes);
}

function packMapUint32(map: Record<number, number>): Uint8Array {
  const entries = Object.entries(map).map(([k, v]) => [parseInt(k), v]);
  const len = packUint16(entries.length);
  
  const parts = [len];
  for (const [k, v] of entries) {
    parts.push(packUint16(k));
    parts.push(packUint32(v));
  }
  
  return concatBuffers(...parts);
}

function concatBuffers(...buffers: Uint8Array[]): Uint8Array {
  const totalLength = buffers.reduce((sum, buf) => sum + buf.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const buf of buffers) {
    result.set(buf, offset);
    offset += buf.length;
  }
  return result;
}

async function hmacSign(key: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  // Convert to ArrayBuffer
  const keyBuffer = new Uint8Array(key).buffer as ArrayBuffer;
  const dataBuffer = new Uint8Array(data).buffer as ArrayBuffer;
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, dataBuffer);
  return new Uint8Array(signature);
}

class ServiceRtc {
  static kServiceType = 1;
  static kPrivilegeJoinChannel = 1;
  static kPrivilegePublishAudioStream = 2;
  static kPrivilegePublishVideoStream = 3;
  static kPrivilegePublishDataStream = 4;

  private channelName: string;
  private uid: string;
  private privileges: Record<number, number> = {};

  constructor(channelName: string, uid: number | string) {
    this.channelName = channelName;
    this.uid = uid === 0 ? '' : String(uid);
  }

  addPrivilege(privilege: number, expire: number) {
    this.privileges[privilege] = expire;
  }

  pack(): Uint8Array {
    const type = packUint16(ServiceRtc.kServiceType);
    const privs = packMapUint32(this.privileges);
    const channel = packStringText(this.channelName);
    const uidPacked = packStringText(this.uid);
    
    return concatBuffers(type, privs, channel, uidPacked);
  }
}

class AccessToken {
  private appId: string;
  private appCert: string;
  private issueTs: number;
  private expire: number;
  private salt: number;
  private services: Map<number, ServiceRtc> = new Map();

  constructor(appId: string, appCert: string, expire: number) {
    this.appId = appId;
    this.appCert = appCert;
    this.issueTs = Math.floor(Date.now() / 1000);
    this.expire = expire;
    this.salt = crypto.getRandomValues(new Uint32Array(1))[0] % 99999999 + 1;
  }

  addService(service: ServiceRtc) {
    this.services.set(ServiceRtc.kServiceType, service);
  }

  async build(): Promise<string> {
    const encoder = new TextEncoder();
    const appCertBytes = encoder.encode(this.appCert);
    
    // Build signing key
    let signing = await hmacSign(packUint32(this.issueTs), appCertBytes);
    signing = await hmacSign(packUint32(this.salt), signing);

    // Build signing info
    const signingInfo = concatBuffers(
      packStringText(this.appId),
      packUint32(this.issueTs),
      packUint32(this.expire),
      packUint32(this.salt),
      packUint16(this.services.size)
    );

    const servicePacks: Uint8Array[] = [];
    for (const service of this.services.values()) {
      servicePacks.push(service.pack());
    }

    const fullSigningInfo = concatBuffers(signingInfo, ...servicePacks);
    
    // Sign
    const signature = await hmacSign(signing, fullSigningInfo);
    
    // Combine signature + signing info
    const content = concatBuffers(packString(signature), fullSigningInfo);
    
    // Compress with zlib
    const compressed = pako.deflate(content);
    
    // Base64 encode
    const base64 = btoa(String.fromCharCode(...compressed));
    
    return '007' + base64;
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
    const privilegeSeconds = expirationTimeInSeconds; // AccessToken2 expects durations, not absolute timestamps

    const numericUid = Number.isFinite(Number(uid)) ? Number(uid) : 0;

    // Build token
    const token = new AccessToken(appId, appCertificate, expirationTimeInSeconds);
    const serviceRtc = new ServiceRtc(channelName, numericUid);
    
    serviceRtc.addPrivilege(ServiceRtc.kPrivilegeJoinChannel, privilegeSeconds);
    serviceRtc.addPrivilege(ServiceRtc.kPrivilegePublishAudioStream, privilegeSeconds);
    serviceRtc.addPrivilege(ServiceRtc.kPrivilegePublishVideoStream, privilegeSeconds);
    serviceRtc.addPrivilege(ServiceRtc.kPrivilegePublishDataStream, privilegeSeconds);
    
    token.addService(serviceRtc);
    
    const generatedToken = await token.build();

    console.log('Generated token (007...)', generatedToken.substring(0, 50) + '...');

    return new Response(
      JSON.stringify({ token: generatedToken, appId, channelName, uid: numericUid }),
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
