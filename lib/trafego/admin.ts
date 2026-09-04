import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

export const TRAFEGO_ADMIN_COOKIE = "kivai_trafego_admin";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function secret() {
  return process.env.TRAFEGO_ADMIN_SESSION_SECRET ?? "";
}

export function createAdminSession() {
  const value = `${Date.now() + MAX_AGE_SECONDS * 1000}`;
  const signature = createHmac("sha256", secret()).update(value).digest("hex");
  return `${value}.${signature}`;
}

export function isValidAdminSession(value: string | undefined) {
  if (!value || !secret()) return false;
  const [expiresAt, signature] = value.split(".");
  if (!expiresAt || !signature || Number(expiresAt) < Date.now()) return false;
  const expected = createHmac("sha256", secret()).update(expiresAt).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

export function adminCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  };
}
