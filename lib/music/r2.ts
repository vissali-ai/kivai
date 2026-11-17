import "server-only";

import { createHmac, createHash } from "node:crypto";

const REGION = "auto";
const SERVICE = "s3";
const EXPIRES_SECONDS = 900;

function config() {
  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const bucket = process.env.R2_BUCKET_NAME?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  const publicUrl = process.env.R2_PUBLIC_URL?.replace(/\/$/, "");
  if (!accountId || !bucket || !accessKeyId || !secretAccessKey || !publicUrl) {
    throw new Error("O armazenamento R2 não está configurado completamente na Vercel.");
  }
  const publicOrigin = new URL(publicUrl);
  if (publicOrigin.protocol !== "https:") throw new Error("R2_PUBLIC_URL precisa usar HTTPS.");
  return { accountId, bucket, accessKeyId, secretAccessKey, publicUrl, publicOrigin };
}

function awsEncode(value: string) {
  return encodeURIComponent(value).replace(/[!'()*]/g, char => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
}

function hmac(key: Buffer | string, value: string) {
  return createHmac("sha256", key).update(value, "utf8").digest();
}

function signingKey(secret: string, date: string) {
  const dateKey = hmac(`AWS4${secret}`, date);
  const regionKey = hmac(dateKey, REGION);
  const serviceKey = hmac(regionKey, SERVICE);
  return hmac(serviceKey, "aws4_request");
}

function amzDate(now = new Date()) {
  return now.toISOString().replace(/[:-]|\.\d{3}/g, "");
}

function canonicalQuery(params: URLSearchParams) {
  return [...params.entries()]
    .map(([key, value]) => [awsEncode(key), awsEncode(value)] as const)
    .sort(([aKey, aValue], [bKey, bValue]) => aKey.localeCompare(bKey) || aValue.localeCompare(bValue))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
}

export function createR2UploadUrl(key: string, contentType: string) {
  const cfg = config();
  const host = `${cfg.accountId}.r2.cloudflarestorage.com`;
  const canonicalUri = `/${awsEncode(cfg.bucket)}/${key.split("/").map(awsEncode).join("/")}`;
  const now = new Date();
  const timestamp = amzDate(now);
  const date = timestamp.slice(0, 8);
  const scope = `${date}/${REGION}/${SERVICE}/aws4_request`;
  const signedHeaders = "content-type;host";
  const params = new URLSearchParams({
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": `${cfg.accessKeyId}/${scope}`,
    "X-Amz-Date": timestamp,
    "X-Amz-Expires": String(EXPIRES_SECONDS),
    "X-Amz-SignedHeaders": signedHeaders,
  });
  const canonicalHeaders = `content-type:${contentType.trim()}\nhost:${host}\n`;
  const canonicalRequest = [
    "PUT",
    canonicalUri,
    canonicalQuery(params),
    canonicalHeaders,
    signedHeaders,
    "UNSIGNED-PAYLOAD",
  ].join("\n");
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    timestamp,
    scope,
    createHash("sha256").update(canonicalRequest).digest("hex"),
  ].join("\n");
  const signature = hmac(signingKey(cfg.secretAccessKey, date), stringToSign).toString("hex");
  return `https://${host}${canonicalUri}?${canonicalQuery(params)}&X-Amz-Signature=${signature}`;
}

export function getR2PublicUrl(key: string) {
  const cfg = config();
  return `${cfg.publicUrl}/${key.split("/").map(awsEncode).join("/")}`;
}

export function r2ObjectKeyFromPublicUrl(value: string) {
  if (!value) return null;
  try {
    const cfg = config();
    const url = new URL(value);
    if (url.origin !== cfg.publicOrigin.origin || url.search || url.hash) return null;
    const prefix = cfg.publicOrigin.pathname.replace(/\/$/, "");
    if (prefix && !url.pathname.startsWith(`${prefix}/`)) return null;
    const pathname = prefix ? url.pathname.slice(prefix.length + 1) : url.pathname.slice(1);
    const key = pathname.split("/").map(decodeURIComponent).join("/");
    if (!key || key.split("/").some(part => !part || part === "." || part === ".." || part.includes("\\"))) return null;
    return key;
  } catch {
    return null;
  }
}

export async function deleteR2Object(key: string) {
  const cfg = config();
  const host = `${cfg.accountId}.r2.cloudflarestorage.com`;
  const canonicalUri = `/${awsEncode(cfg.bucket)}/${key.split("/").map(awsEncode).join("/")}`;
  const now = new Date();
  const timestamp = amzDate(now);
  const date = timestamp.slice(0, 8);
  const scope = `${date}/${REGION}/${SERVICE}/aws4_request`;
  const payloadHash = createHash("sha256").update("").digest("hex");
  const canonicalHeaders = `host:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${timestamp}\n`;
  const signedHeaders = "host;x-amz-content-sha256;x-amz-date";
  const canonicalRequest = ["DELETE", canonicalUri, "", canonicalHeaders, signedHeaders, payloadHash].join("\n");
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    timestamp,
    scope,
    createHash("sha256").update(canonicalRequest).digest("hex"),
  ].join("\n");
  const signature = hmac(signingKey(cfg.secretAccessKey, date), stringToSign).toString("hex");
  const authorization = `AWS4-HMAC-SHA256 Credential=${cfg.accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  const response = await fetch(`https://${host}${canonicalUri}`, {
    method: "DELETE",
    headers: {
      Authorization: authorization,
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": timestamp,
    },
    cache: "no-store",
  });
  if (!response.ok && response.status !== 404) {
    throw new Error(`R2 (${response.status}): ${await response.text()}`);
  }
}
