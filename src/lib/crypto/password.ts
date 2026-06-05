// Hash password akun (provisioning). scrypt (node:crypto) — memory-hard, tanpa dependency
// native. Format self-describing "scrypt$N$r$p$salt$dk" (base64url) → parameter ikut tersimpan,
// aman saat tuning berubah. SWAP ke argon2id saat modul auth runtime dibangun (BACKEND-AUTH §3);
// verifyPassword tetap bisa baca hash lama selama format dikenali → migrasi mulus.
//
// CATATAN: verifyPassword BELUM dipakai (login belum dibangun) — disertakan + diuji agar
// kontrak hash terverifikasi dua arah sejak awal.

import { scryptSync, randomBytes, timingSafeEqual } from "node:crypto";

// Parameter scrypt (OWASP: N=2^14, r=8, p=1, ≥64MiB). Tersimpan dalam string hash.
const N = 16384;
const R = 8;
const P = 1;
const KEYLEN = 64;
const SALT_BYTES = 16;

/** Hash password → string "scrypt$N$r$p$salt$dk" (base64url). Salt acak per-hash. */
export function hashPassword(plain: string): string {
  const salt = randomBytes(SALT_BYTES);
  const dk = scryptSync(plain, salt, KEYLEN, { N, r: R, p: P });
  return ["scrypt", N, R, P, salt.toString("base64url"), dk.toString("base64url")].join("$");
}

/** Verifikasi password terhadap hash. Konstan-waktu (timingSafeEqual). false bila format asing. */
export function verifyPassword(plain: string, stored: string): boolean {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [, n, r, p, saltB64, dkB64] = parts;
  const salt = Buffer.from(saltB64, "base64url");
  const expected = Buffer.from(dkB64, "base64url");
  const actual = scryptSync(plain, salt, expected.length, { N: Number(n), r: Number(r), p: Number(p) });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
