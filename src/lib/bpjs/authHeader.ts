/**
 * BPJS Auth Header Generator.
 *
 * Aligned 1:1 dengan [contracts/CreateSignature-contracts.md].
 *
 * 4-header set wajib semua endpoint V-Claim/Aplicares:
 * | Header        | Nilai contoh                                   | Keterangan                |
 * |---------------|------------------------------------------------|---------------------------|
 * | `X-cons-id`   | `743627386`                                    | Consumer ID per RS        |
 * | `X-timestamp` | `234234234`                                    | UTC Unix epoch seconds    |
 * | `X-signature` | `DogC5UiQurNcigrBdQ3QN5oYvXeUF5E82I/LHUcI9v0=` | HMAC-SHA256 → base64      |
 * | `user_key`    | `d795b04f4a72d74fae727be9da0xxxxx`             | API key per RS (lowercase!) |
 *
 * **Signature formula:**
 * ```
 * message   = `${consId}&${timestamp}`
 * signature = HMAC-SHA256(message, consumerSecret) → base64
 * ```
 *
 * **Timestamp formula** (UTC Unix epoch seconds):
 * ```
 * timestamp = (local time in UTC timezone in seconds) - (1970-01-01 in seconds)
 *           = Math.floor(Date.now() / 1000)
 * ```
 *
 * Phase 1 (mock): `generateBpjsHeaders` returns sync placeholder signature
 * yang deterministic factor-in cons-secret (different secret → different sig)
 * tapi BUKAN HMAC valid — cukup untuk shape testing.
 *
 * Phase backend: pakai `generateBpjsHeadersAsync` dengan Web Crypto
 * (browser/Node 18+) ATAU Node `crypto.createHmac`. Spec example:
 * - `message = "aaa"` · `key = "bbb"` → `20BKS3PWnD3XU4JbSSZvVlGi2WWnDa8Sv9uHJ+wsELA=`
 *
 * Referensi: TODO-BPJS.md § BP0.1 · contracts/CreateSignature-contracts.md.
 */

import { BPJS_CREDS_MOCK, type BPJSCredentials } from "./credentialsStore";

export interface BPJSAuthHeaders {
  "X-cons-id": string;
  "X-timestamp": string;
  "X-signature": string;
  /** Note: lowercase + underscore per spec (BUKAN "User-Key" header-case). */
  user_key: string;
}

/**
 * Build signature message per spec: `${consId}&${timestamp}`.
 * Pure helper — testable + reusable.
 */
export function buildSignatureMessage(consId: string, timestamp: string): string {
  return `${consId}&${timestamp}`;
}

/**
 * Generate current UTC Unix epoch seconds (timestamp pattern per spec).
 * Spec formula: `(local time in UTC timezone in seconds) - (1970-01-01 in seconds)`.
 */
export function nowUnixSeconds(): string {
  return Math.floor(Date.now() / 1000).toString();
}

/**
 * Generate 4-header set untuk request BPJS — **synchronous mock**.
 *
 * `timestampOverride` (Unix epoch second string) untuk test deterministic.
 * Tanpa override, pakai waktu sekarang.
 *
 * ⚠️ Signature di-generate dengan stub (NOT cryptographically valid).
 * Untuk production swap pakai `generateBpjsHeadersAsync` atau Node `crypto.createHmac`.
 */
export function generateBpjsHeaders(
  creds: BPJSCredentials = BPJS_CREDS_MOCK,
  timestampOverride?: string,
): BPJSAuthHeaders {
  const ts = timestampOverride ?? nowUnixSeconds();
  const message = buildSignatureMessage(creds.consId, ts);
  const signature = mockHmacSha256Base64(message, creds.consSecret);

  return {
    "X-cons-id": creds.consId,
    "X-timestamp": ts,
    "X-signature": signature,
    user_key: creds.userKey,
  };
}

/**
 * Generate 4-header set — **production-ready async** dengan Web Crypto.
 *
 * Browser: native `crypto.subtle.sign` · Node 18+: `globalThis.crypto.subtle`.
 * Backward swap dengan `generateBpjsHeaders` (sync mock) untuk Phase 1.
 *
 * Example per spec (CreateSignature-contracts.md):
 * - `consId="1234"` · `timestamp="433223232"` · `consSecret="pwd"`
 * - `message = "1234&433223232"` → HMAC-SHA256 with key "pwd" → base64
 */
export async function generateBpjsHeadersAsync(
  creds: BPJSCredentials = BPJS_CREDS_MOCK,
  timestampOverride?: string,
): Promise<BPJSAuthHeaders> {
  const ts = timestampOverride ?? nowUnixSeconds();
  const message = buildSignatureMessage(creds.consId, ts);
  const signature = await hmacSha256Base64(message, creds.consSecret);

  return {
    "X-cons-id": creds.consId,
    "X-timestamp": ts,
    "X-signature": signature,
    user_key: creds.userKey,
  };
}

/**
 * Real HMAC-SHA256 via Web Crypto — works in browser + Node 18+.
 *
 * Returns base64 string per spec output format (44 chars dengan padding).
 */
async function hmacSha256Base64(message: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return arrayBufferToBase64(sig);
}

/** ArrayBuffer → base64 — works in browser + Node. */
function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  if (typeof btoa !== "undefined") return btoa(bin);
  return Buffer.from(bin, "binary").toString("base64");
}

/**
 * Mock HMAC-SHA256 → base64. NOT cryptographically valid.
 *
 * Deterministic stub yang **factor in secret** — same (message, secret)
 * → same signature · different secret → different signature. Cukup
 * untuk shape testing + audit log fidelity.
 *
 * Backend swap → ganti call site ke `generateBpjsHeadersAsync` (Web Crypto)
 * atau Node `crypto.createHmac` sync.
 */
function mockHmacSha256Base64(message: string, secret: string): string {
  // djb2-mixed: factor message + secret → 32-bit hash → repeat to 32 bytes → base64
  const mixed = `${secret}|${message}|${secret}`;
  let h1 = 5381;
  let h2 = 0;
  for (let i = 0; i < mixed.length; i++) {
    h1 = ((h1 * 33) ^ mixed.charCodeAt(i)) >>> 0;
    h2 = ((h2 * 17) + mixed.charCodeAt(i) * 31) >>> 0;
  }
  // Build 32 bytes deterministic dari kedua hash
  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    const tag = i % 2 === 0 ? h1 : h2;
    bytes[i] = (tag >> ((i % 4) * 8)) & 0xff;
    h1 = ((h1 * 33) ^ bytes[i]) >>> 0;
    h2 = ((h2 * 17) + bytes[i] * 31) >>> 0;
  }
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  if (typeof btoa !== "undefined") return btoa(bin);
  return Buffer.from(bin, "binary").toString("base64");
}
