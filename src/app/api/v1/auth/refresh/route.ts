// POST /api/v1/auth/refresh — rotasi refresh token (reuse detection di service) → cookie baru.
// Refresh dibaca dari cookie httpOnly; access JWT baru di-set ulang.

import { NextResponse } from "next/server";
import { authService } from "@/lib/services/authService";
import { success } from "@/lib/http/envelope";
import { handleError } from "@/lib/errors/handleError";
import { Errors } from "@/lib/errors/appError";
import { setSessionCookies, clearSessionCookies, readCookie, REFRESH_COOKIE } from "@/lib/auth/cookies";

export async function POST(req: Request): Promise<Response> {
  try {
    const token = readCookie(req, REFRESH_COOKIE);
    if (!token) throw Errors.unauthenticated("Tidak ada sesi");

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    const userAgent = req.headers.get("user-agent");

    const result = await authService.refresh(token, { ip, userAgent });

    const res = NextResponse.json(success(result.session));
    setSessionCookies(res, result);
    return res;
  } catch (e) {
    const { status, body } = handleError(e);
    const res = NextResponse.json(body, { status });
    if (status === 401) clearSessionCookies(res); // sesi tak valid → bersihkan cookie basi
    return res;
  }
}
