// PII at-rest (FLOWS §8 · UU PDP 27/2022). Dua operasi terpisah untuk NIK/noKK/noKartu:
//   • encrypt/decrypt  — AES-256-GCM, reversible (tampil saat berwenang).
//   • hash             — HMAC-SHA256, deterministik & non-reversible → kolom *Hash
//                        untuk lookup/dedup (ciphertext acak tak bisa di-WHERE).
//
// Kunci dari env (WAJIB di prod). Dev: fallback kunci tetap + warning sekali — supaya
// hash STABIL antar-restart (kalau acak, dedup NIK rusak). Jangan pakai dev key di prod.

import { createCipheriv, createDecipheriv, createHmac, randomBytes, scryptSync } from "node:crypto";

const ALGO = "aes-256-gcm";
const DEV_SEED = "ehis-dev-only-pii-key-CHANGE-ME"; // hanya dev; prod WAJIB env.

let warned = false;
function devWarn(which: string): void {
  if (warned || process.env.NODE_ENV === "production") return;
  warned = true;
  console.warn(`[pii] ${which} tidak di-set — pakai DEV key (tidak aman untuk produksi).`);
}

/** Kunci 32-byte dari env (hex/base64/utf8) atau derivasi dev deterministik. */
function key32(envName: string): Buffer {
  const raw = process.env[envName];
  if (!raw) {
    devWarn(envName);
    return scryptSync(DEV_SEED + envName, "ehis-salt", 32);
  }
  // Terima hex (64 char) / base64 / fallback derivasi agar panjang selalu 32.
  if (/^[0-9a-f]{64}$/i.test(raw)) return Buffer.from(raw, "hex");
  const b64 = Buffer.from(raw, "base64");
  if (b64.length === 32) return b64;
  return scryptSync(raw, "ehis-salt", 32);
}

const encKey = (): Buffer => key32("PII_ENC_KEY");
const hmacKey = (): Buffer => key32("PII_HMAC_KEY");

/** Enkripsi reversible → string "iv.tag.ciphertext" (base64url). */
export function encryptPii(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, encKey(), iv);
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, ct].map((b) => b.toString("base64url")).join(".");
}

/** Dekripsi string hasil `encryptPii`. Lempar bila tampering (auth tag gagal). */
export function decryptPii(payload: string): string {
  const [ivB, tagB, ctB] = payload.split(".");
  if (!ivB || !tagB || !ctB) throw new Error("payload PII tidak valid");
  const decipher = createDecipheriv(ALGO, encKey(), Buffer.from(ivB, "base64url"));
  decipher.setAuthTag(Buffer.from(tagB, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(ctB, "base64url")), decipher.final()]).toString("utf8");
}

/** HMAC-SHA256 deterministik (hex) → kolom *Hash (lookup/dedup/uniqueness). */
export function hashPii(value: string): string {
  return createHmac("sha256", hmacKey()).update(value.trim()).digest("hex");
}

/** Masking untuk DTO (mis. NIK "3201••••••••1234"). */
export function maskPii(value: string, head = 4, tail = 4): string {
  if (value.length <= head + tail) return "•".repeat(value.length);
  return value.slice(0, head) + "•".repeat(value.length - head - tail) + value.slice(-tail);
}
