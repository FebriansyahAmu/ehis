/**
 * BPJS Credentials Store.
 *
 * Aligned dengan [contracts/CreateSignature-contracts.md]:
 * - `consId` di-assign BPJS per RS — masuk header `X-cons-id`
 * - `consSecret` HANYA disimpan di sisi consumer (RS) — TIDAK dikirim ke
 *   BPJS · dipakai untuk men-generate signature HMAC-SHA256
 * - `userKey` per RS — masuk header `user_key` (lowercase, underscore)
 *
 * Mock untuk Phase 1 (frontend). Backend Phase swap ke env vars +
 * Secret Manager (Vault/AWS Secrets Manager) — call site tidak berubah.
 *
 * Security note: nilai production WAJIB di-host di env / secret manager,
 * jangan commit ke repo. Mock value di sini bukan kredensial valid.
 *
 * Referensi: TODO-BPJS.md § BP0.1 · TODOS_BACKEND.md § B-BPJS ·
 * contracts/CreateSignature-contracts.md.
 */

export interface BPJSCredentials {
  /** Consumer ID di-assign BPJS per RS. */
  consId: string;
  /** Consumer secret untuk HMAC-SHA256 signature. */
  consSecret: string;
  /** API key per RS (header `user_key`). */
  userKey: string;
  /** Base URL V-Claim REST. */
  vClaimBaseUrl: string;
  /** Base URL Aplicares REST. */
  aplicaresBaseUrl: string;
}

/**
 * Mock credentials untuk dev/test. NOT production-safe.
 *
 * Backend Phase: load dari `process.env` via Secret Manager.
 */
export const BPJS_CREDS_MOCK: BPJSCredentials = {
  consId: "12345",
  consSecret: "abcd1234efgh5678",
  userKey: "user-key-mock",
  vClaimBaseUrl: "https://apijkn.bpjs-kesehatan.go.id/vclaim-rest",
  aplicaresBaseUrl: "https://apijkn.bpjs-kesehatan.go.id/aplicaresws-rest",
};

/**
 * Resolve credentials dari override (per-call config) atau default mock.
 * Field-level merge — override hanya field yang di-set.
 */
export function resolveCredentials(
  override?: Partial<BPJSCredentials>,
): BPJSCredentials {
  if (!override) return BPJS_CREDS_MOCK;
  return { ...BPJS_CREDS_MOCK, ...override };
}
