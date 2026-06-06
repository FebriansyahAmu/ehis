// Proxy (Next.js 16 — dulu "middleware"). Acuan: docs/BACKEND-AUTH.md §4.1.
// PERAN TERBATAS = redirect OPTIMISTIC ke /login untuk PAGE route bila tak ada cookie sesi.
// BUKAN penjaga authoritative: tak verifikasi tanda tangan/expiry JWT, tak cek RBAC/Redis.
// Penjaga sebenarnya = getActor/assertCan di route() + getServerActor di SSR (tak bisa di-bypass).
// (Next merekomendasikan proxy sebagai "last resort" & SELALU verifikasi ulang di server.)
//
// Sakelar tunggal AUTH_ENFORCE menyatukan proxy + enforcement server:
//   • false (default, transisi/dev) → NO-OP (app terbuka, getActor fallback DEV actor).
//   • true → redirect page tanpa cookie sesi + getActor menolak request tanpa sesi.
// Jadi tak ada lockout sebelum ada akun: aktifkan true HANYA setelah admin di-bootstrap.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Nama cookie sengaja di-inline (proxy independen, tak menarik modul berat spt jose). Selaras
// lib/auth/cookies.ts. ehis_rt (refresh, 3 jam) = sinyal "ada sesi" paling tahan lama.
const REFRESH_COOKIE = "ehis_rt";
const ACCESS_COOKIE = "ehis_at";
const LOGIN_PATH = "/";

export function proxy(req: NextRequest): NextResponse {
  if (process.env.AUTH_ENFORCE !== "true") return NextResponse.next();

  const { pathname } = req.nextUrl;
  if (pathname === LOGIN_PATH) return NextResponse.next(); // jangan redirect login → login (loop)

  const hasSession = req.cookies.has(REFRESH_COOKIE) || req.cookies.has(ACCESS_COOKIE);
  if (hasSession) return NextResponse.next();

  // Tak ada sesi → lempar ke login + simpan tujuan agar bisa kembali pasca-login.
  const url = req.nextUrl.clone();
  url.pathname = LOGIN_PATH;
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

// Matcher: semua page route KECUALI /api, aset _next, file ber-ekstensi, favicon.
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
