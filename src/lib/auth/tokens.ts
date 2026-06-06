// Refresh token — generate plaintext (dikirim ke klien via cookie httpOnly) + hash SHA-256
// untuk disimpan di DB (auth.RefreshToken.tokenHash). Acuan: docs/BACKEND-AUTH.md §2.4/§3.
// JANGAN simpan plaintext. Rotasi & reuse-detection ditangani authService/authDal.

import { randomBytes, createHash } from "node:crypto";

export const REFRESH_TTL_SEC = 3 * 60 * 60; // 3 jam idle (Keputusan §10 #2)

/** Token acak 256-bit (base64url) — opaque, bukan JWT. */
export function generateRefreshToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Hash deterministik untuk lookup/penyimpanan (bukan password → SHA-256 cukup). */
export function hashRefreshToken(plain: string): string {
  return createHash("sha256").update(plain).digest("base64url");
}

/** Waktu kedaluwarsa refresh dari titik waktu tertentu. */
export function refreshExpiry(now: Date = new Date()): Date {
  return new Date(now.getTime() + REFRESH_TTL_SEC * 1000);
}
