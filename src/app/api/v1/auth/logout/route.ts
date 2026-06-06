// POST /api/v1/auth/logout — cabut refresh token device ini + hapus cookie sesi.
// (Blocklist jti access token ditunda ke fase Redis; access kedaluwarsa ≤30m.)

import { NextResponse } from "next/server";
import { authService } from "@/lib/services/authService";
import { success } from "@/lib/http/envelope";
import { handleError } from "@/lib/errors/handleError";
import { clearSessionCookies, readCookie, REFRESH_COOKIE } from "@/lib/auth/cookies";

export async function POST(req: Request): Promise<Response> {
  try {
    await authService.logout(readCookie(req, REFRESH_COOKIE));
    const res = NextResponse.json(success({ ok: true }, "Anda telah keluar"));
    clearSessionCookies(res);
    return res;
  } catch (e) {
    const { status, body } = handleError(e);
    return NextResponse.json(body, { status });
  }
}
