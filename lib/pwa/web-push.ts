import "server-only";
import { Buffer } from "node:buffer";
import { createCipheriv, createECDH, createHmac, createPrivateKey, randomBytes, sign } from "node:crypto";

export type PushSubscriptionRecord = {
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth_key: string;
};

function base64url(buffer: Buffer) { return buffer.toString("base64url"); }

export function getVapidPublicKey() { return process.env.VAPID_PUBLIC_KEY ?? ""; }
export function isPushConfigured() {
  return Boolean(getVapidPublicKey() && process.env.VAPID_PRIVATE_KEY);
}

export function validPushEndpoint(endpoint: string) {
  if (!endpoint || endpoint.length > 2048) return false;
  try {
    const url = new URL(endpoint);
    if (url.protocol !== "https:" || url.username || url.password || url.port) return false;
    const host = url.hostname.toLowerCase();
    return host === "fcm.googleapis.com"
      || host === "updates.push.services.mozilla.com"
      || host === "web.push.apple.com"
      || /^wns\d*\.notify\.windows\.com$/.test(host);
  } catch { return false; }
}

function hkdfExtract(salt: Buffer, ikm: Buffer) {
  return createHmac("sha256", salt).update(ikm).digest();
}
function hkdfExpand(prk: Buffer, info: Buffer, length: number) {
  return createHmac("sha256", prk).update(info).update(Buffer.from([1])).digest().subarray(0, length);
}

export function encryptWebPush(subscription: PushSubscriptionRecord, payload: object) {
  const receiver = Buffer.from(subscription.p256dh, "base64url");
  const auth = Buffer.from(subscription.auth_key, "base64url");
  if (receiver.length !== 65 || receiver[0] !== 4 || auth.length !== 16) {
    throw new Error("INVALID_PUSH_KEYS");
  }
  const server = createECDH("prime256v1");
  server.generateKeys();
  const sender = server.getPublicKey();
  const shared = server.computeSecret(receiver);
  const secret = hkdfExpand(
    hkdfExtract(auth, shared),
    Buffer.concat([Buffer.from("WebPush: info\0"), receiver, sender]),
    32,
  );
  const salt = randomBytes(16);
  const key = hkdfExpand(hkdfExtract(salt, secret), Buffer.from("Content-Encoding: aes128gcm\0"), 16);
  const nonce = hkdfExpand(hkdfExtract(salt, secret), Buffer.from("Content-Encoding: nonce\0"), 12);
  const cipher = createCipheriv("aes-128-gcm", key, nonce);
  const plaintext = Buffer.concat([Buffer.from(JSON.stringify(payload)), Buffer.from([2])]);
  if (plaintext.length > 3000) throw new Error("PUSH_PAYLOAD_TOO_LONG");
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final(), cipher.getAuthTag()]);
  const header = Buffer.alloc(21);
  salt.copy(header, 0);
  header.writeUInt32BE(4096, 16);
  header.writeUInt8(sender.length, 20);
  return Buffer.concat([header, sender, encrypted]);
}

function vapidToken(endpoint: string) {
  const pub = Buffer.from(getVapidPublicKey(), "base64url");
  const priv = process.env.VAPID_PRIVATE_KEY ?? "";
  if (pub.length !== 65 || pub[0] !== 4 || Buffer.from(priv, "base64url").length !== 32) throw new Error("VAPID_NOT_CONFIGURED");
  const privateKey = createPrivateKey({ key: {
    kty: "EC", crv: "P-256", x: base64url(pub.subarray(1, 33)),
    y: base64url(pub.subarray(33)), d: priv,
  }, format: "jwk" });
  const aud = new URL(endpoint).origin;
  const header = base64url(Buffer.from(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const claims = base64url(Buffer.from(JSON.stringify({
    aud, exp: Math.floor(Date.now() / 1000) + 6 * 3600,
    sub: "https://www.kivai.com.br",
  })));
  const input = `${header}.${claims}`;
  const signature = sign("sha256", Buffer.from(input), { key: privateKey, dsaEncoding: "ieee-p1363" });
  return `${input}.${base64url(signature)}`;
}

export async function sendRoutinePush(subscription: PushSubscriptionRecord, notification: {
  title: string; body: string; url: string;
}) {
  if (!isPushConfigured() || !validPushEndpoint(subscription.endpoint)) throw new Error("PUSH_NOT_CONFIGURED_OR_INVALID_ENDPOINT");
  const body = encryptWebPush(subscription, notification);
  const response = await fetch(subscription.endpoint, {
    method: "POST",
    headers: {
      Authorization: `vapid t=${vapidToken(subscription.endpoint)}, k=${getVapidPublicKey()}`,
      "Content-Encoding": "aes128gcm",
      "Content-Type": "application/octet-stream",
      TTL: "3600",
      Urgency: "normal",
    },
    body: new Uint8Array(body),
    signal: AbortSignal.timeout(9000),
  });
  return response.status;
}
