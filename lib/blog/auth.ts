import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { blogConfig } from "@/lib/blog/config";

export const ADMIN_COOKIE = "kivai_admin_session";
const SESSION_SECONDS = 60 * 60 * 12;

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function signature(payload: string) {
  return createHmac("sha256", blogConfig.authSecret).update(payload).digest("base64url");
}

export function credentialsAreConfigured() {
  return Boolean(blogConfig.adminEmail && blogConfig.adminPassword && blogConfig.authSecret.length >= 32);
}

export function validateCredentials(email: string, password: string) {
  if (!credentialsAreConfigured()) return false;
  return safeEqual(email.trim().toLowerCase(), blogConfig.adminEmail.trim().toLowerCase()) &&
    safeEqual(password, blogConfig.adminPassword);
}

export function createSessionToken() {
  const payload = Buffer.from(JSON.stringify({
    email: blogConfig.adminEmail,
    exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS,
  })).toString("base64url");
  return `${payload}.${signature(payload)}`;
}

export function verifySessionToken(token?: string) {
  if (!token || !credentialsAreConfigured()) return false;
  const [payload, suppliedSignature] = token.split(".");
  if (!payload || !suppliedSignature || !safeEqual(signature(payload), suppliedSignature)) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as { exp: number; email: string };
    return data.exp > Math.floor(Date.now() / 1000) && safeEqual(data.email, blogConfig.adminEmail);
  } catch {
    return false;
  }
}

export async function isAdminAuthenticated() {
  return verifySessionToken((await cookies()).get(ADMIN_COOKIE)?.value);
}

export async function requireAdmin() {
  if (!(await isAdminAuthenticated())) redirect("/login?next=/admin/blog");
}

export async function assertAdminApi() {
  if (!(await isAdminAuthenticated())) throw new Error("Não autorizado.");
}

export const adminSessionMaxAge = SESSION_SECONDS;
