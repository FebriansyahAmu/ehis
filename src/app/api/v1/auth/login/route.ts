// POST /api/v1/auth/login — verifikasi kredensial → set cookie sesi httpOnly (access+refresh).
// Tidak pakai route() karena perlu kontrol cookie pada Response. Tetap tipis: Zod→service→envelope→error.

import { NextResponse } from "next/server";
import { LoginInput } from "@/lib/schemas/auth";
import { authService } from "@/lib/services/authService";
import { success } from "@/lib/http/envelope";
import { handleError } from "@/lib/errors/handleError";
import { Errors } from "@/lib/errors/appError";
import { setSessionCookies } from "@/lib/auth/cookies";

export async function POST(req: Request): Promise<Response> {
  try {
    let raw: unknown;
    try {
      raw = await req.json();
    } catch {
      throw Errors.validation("Body bukan JSON yang valid");
    }
    const input = LoginInput.parse(raw);
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    const userAgent = req.headers.get("user-agent");

    const result = await authService.login(input, { ip, userAgent });

    const res = NextResponse.json(success(result.session, `Selamat datang, ${result.session.namaTampil}`));
    setSessionCookies(res, result);
    return res;
  } catch (e) {
    const { status, body } = handleError(e);
    return NextResponse.json(body, { status });
  }
}
