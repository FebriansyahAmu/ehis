/**
 * BPJS Auth Header Generator.
 *
 * Generate 4-header set wajib semua endpoint V-Claim/Aplicares:
 * - `X-cons-id`   consumer ID
 * - `X-timestamp` Unix epoch second
 * - `X-signature` HMAC-SHA256(`cons-id&timestamp`, consumer-secret) → base64
 * - `user_key`    API key per RS
 *
 * Phase 1 (mock): signature deterministic stub — bukan HMAC valid.
 * Phase backend: real HMAC via Node `crypto` atau Web Crypto `crypto.subtle`.
 *
 * Referensi: TODO-BPJS.md § BP0.1.
 */

import { BPJS_CREDS_MOCK, type BPJSCredentials } from "./credentialsStore";

export interface BPJSAuthHeaders {
  "X-cons-id": string;
  "X-timestamp": string;
  "X-signature": string;
  user_key: string;
}

/**
 * Generate 4-header set untuk request BPJS.
 *
 * `timestampOverride` (Unix epoch second string) untuk test deterministic.
 * Tanpa override, pakai waktu sekarang.
 */
export function generateBpjsHeaders(
  creds: BPJSCredentials = BPJS_CREDS_MOCK,
  timestampOverride?: string,
): BPJSAuthHeaders {
  const ts = timestampOverride ?? Math.floor(Date.now() / 1000).toString();
  const signature = mockHmacSha256Base64(`${creds.consId}&${ts}`, creds.consSecret);

  return {
    "X-cons-id": creds.consId,
    "X-timestamp": ts,
    "X-signature": signature,
    user_key: creds.userKey,
  };
}

/**
 * Mock HMAC-SHA256 → base64. NOT cryptographically valid — placeholder
 * deterministic agar header shape benar untuk test snapshot.
 *
 * Backend swap (Node):
 * ```ts
 * import { createHmac } from "node:crypto";
 * return createHmac("sha256", secret).update(payload).digest("base64");
 * ```
 *
 * Backend swap (Web Crypto):
 * ```ts
 * const key = await crypto.subtle.importKey(
 *   "raw", new TextEncoder().encode(secret),
 *   { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
 * );
 * const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
 * return btoa(String.fromCharCode(...new Uint8Array(sig)));
 * ```
 */
function mockHmacSha256Base64(payload: string, _secret: string): string {
  if (typeof btoa !== "undefined") {
    return btoa(payload).slice(0, 44);
  }
  // Node fallback (SSR)
  return Buffer.from(payload).toString("base64").slice(0, 44);
}
