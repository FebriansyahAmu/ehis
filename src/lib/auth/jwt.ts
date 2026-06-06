// Access JWT — terbit & verifikasi (jose, HS256). Acuan: docs/BACKEND-AUTH.md §3.
// STATELESS: token tak disimpan; verify = signature + exp (in-memory). Umur pendek (30m)
// membatasi window pasca-revoke selama Redis blocklist ditunda (lihat actor.ts/§5 degradasi).
// Clock injectable (FLOWS §14) → deterministik saat diuji.

import { SignJWT, jwtVerify } from "jose";
import { randomUUID } from "node:crypto";
import { Errors } from "@/lib/errors/appError";
import type { AccessClaims } from "@/lib/schemas/auth";

export const ACCESS_TTL_SEC = 30 * 60; // 30 menit (Keputusan §10 #2)
const ALG = "HS256";

let cachedSecret: Uint8Array | null = null;
function secret(): Uint8Array {
  if (cachedSecret) return cachedSecret;
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) {
    throw new Error(
      "AUTH_SECRET belum di-set / terlalu pendek (.env, minimal 32 char).",
    );
  }
  cachedSecret = new TextEncoder().encode(s);
  return cachedSecret;
}

/** Payload identitas+otorisasi untuk access token (jti dibuat di sini). */
export type AccessPayload = Omit<AccessClaims, "jti">;

/** Terbitkan access JWT. Mengembalikan token + jti + waktu kedaluwarsa. */
export async function issueAccessToken(
  payload: AccessPayload,
  now: Date = new Date(),
): Promise<{ token: string; jti: string; expiresAt: Date }> {
  const jti = randomUUID();
  const iat = Math.floor(now.getTime() / 1000);
  const exp = iat + ACCESS_TTL_SEC;
  const token = await new SignJWT({
    pegawaiId: payload.pegawaiId,
    roles: payload.roles,
    isGlobal: payload.isGlobal,
    unitIds: payload.unitIds,
    tokenVersion: payload.tokenVersion,
  })
    .setProtectedHeader({ alg: ALG })
    .setSubject(payload.sub)
    .setJti(jti)
    .setIssuedAt(iat)
    .setExpirationTime(exp)
    .sign(secret());
  return { token, jti, expiresAt: new Date(exp * 1000) };
}

/** Verifikasi access JWT → AccessClaims. Invalid/kedaluwarsa → UNAUTHENTICATED. */
export async function verifyAccessToken(
  token: string,
  now: Date = new Date(),
): Promise<AccessClaims> {
  try {
    const { payload } = await jwtVerify(token, secret(), {
      algorithms: [ALG],
      currentDate: now,
      clockTolerance: 5, // toleransi skew kecil (§7)
    });
    if (
      typeof payload.sub !== "string" ||
      typeof payload.pegawaiId !== "string" ||
      !Array.isArray(payload.roles) ||
      typeof payload.tokenVersion !== "number" ||
      typeof payload.jti !== "string"
    ) {
      throw Errors.unauthenticated("Token tidak lengkap");
    }
    return {
      sub: payload.sub,
      pegawaiId: payload.pegawaiId as string,
      roles: (payload.roles as string[]).map(String),
      isGlobal: payload.isGlobal === true,
      unitIds: Array.isArray(payload.unitIds)
        ? (payload.unitIds as string[]).map(String)
        : [],
      tokenVersion: payload.tokenVersion as number,
      jti: payload.jti as string,
    };
  } catch (e) {
    if (
      e &&
      typeof e === "object" &&
      "code" in e &&
      (e as { code: string }).code === "UNAUTHENTICATED"
    ) {
      throw e;
    }
    throw Errors.unauthenticated("Sesi tidak valid atau kedaluwarsa");
  }
}
