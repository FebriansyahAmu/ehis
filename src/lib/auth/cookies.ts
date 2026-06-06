// Cookie sesi httpOnly (BACKEND-AUTH §3). Access JWT + refresh token opaque.
// httpOnly → tak terbaca JS (anti-XSS); sameSite lax → anti-CSRF dasar; secure di production.

import type { NextResponse } from "next/server";
import { ACCESS_TTL_SEC } from "@/lib/auth/jwt";
import { REFRESH_TTL_SEC } from "@/lib/auth/tokens";

export const ACCESS_COOKIE = "ehis_at";
export const REFRESH_COOKIE = "ehis_rt";

const baseOpts = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export function setSessionCookies(
  res: NextResponse,
  tokens: { accessToken: string; refreshToken: string },
): void {
  res.cookies.set(ACCESS_COOKIE, tokens.accessToken, { ...baseOpts, maxAge: ACCESS_TTL_SEC });
  res.cookies.set(REFRESH_COOKIE, tokens.refreshToken, { ...baseOpts, maxAge: REFRESH_TTL_SEC });
}

export function clearSessionCookies(res: NextResponse): void {
  res.cookies.set(ACCESS_COOKIE, "", { ...baseOpts, maxAge: 0 });
  res.cookies.set(REFRESH_COOKIE, "", { ...baseOpts, maxAge: 0 });
}

/** Baca 1 cookie dari header Request (Web Request tak punya .cookies). */
export function readCookie(req: Request, name: string): string | null {
  const header = req.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    if (part.slice(0, idx).trim() === name) return decodeURIComponent(part.slice(idx + 1).trim());
  }
  return null;
}
