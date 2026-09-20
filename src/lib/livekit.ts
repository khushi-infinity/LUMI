import crypto from "node:crypto";

/**
 * Minimal LiveKit access-token signer (HS256 JWT with a video grant).
 * Avoids the server SDK dependency; shape per LiveKit auth spec.
 */
export interface VideoGrant {
  room: string;
  roomJoin: boolean;
  roomCreate: boolean;
  roomList: boolean;
  canPublish: boolean;
  canSubscribe: boolean;
  canPublishData: boolean;
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function signLivekitToken(opts: {
  apiKey: string;
  apiSecret: string;
  identity: string;
  name?: string;
  ttlSeconds: number;
  grant: VideoGrant;
}): string {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = b64url(
    JSON.stringify({
      iss: opts.apiKey,
      sub: opts.identity,
      name: opts.name ?? opts.identity,
      iat: now,
      nbf: now - 5,
      exp: now + opts.ttlSeconds,
      video: opts.grant,
    }),
  );
  const sig = b64url(
    crypto.createHmac("sha256", opts.apiSecret).update(`${header}.${payload}`).digest(),
  );
  return `${header}.${payload}.${sig}`;
}
