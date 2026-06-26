// BWS0.5 — Idempotency write BPJS (R8). Cegah submit ganda saat retry (mis. Insert SEP).
//
// 2 lapis pertahanan:
//   1) Kirim idempotencyKey SAMA ke BPJS (BPJS dedupe sisi-nya) — key dari generateIdempotencyKey.
//   2) Cek lokal best-effort: bila sudah ada audit SUKSES dgn key ini (window), jangan kirim ulang.
// Hard-stop durable = unique constraint DB domain (mis. bpjs.SEP.kunjunganId / noSep).

import {
  generateIdempotencyKey,
  type IdempotencyKey,
  type IdempotencyPayload,
} from "@/lib/bpjs/bpjsShared";
import { findRecentSuccessByIdempotencyKey } from "@/lib/dal/bpjs/auditDal";

export { generateIdempotencyKey };
export type { IdempotencyKey, IdempotencyPayload };

/**
 * True bila write dengan key ini SUDAH pernah sukses dalam window (default 24 jam)
 * → jangan kirim ulang ke BPJS. False → aman kirim (termasuk retry pasca-gagal).
 */
export async function hasRecentSuccess(key: string, withinMs?: number): Promise<boolean> {
  const row = await findRecentSuccessByIdempotencyKey(key, withinMs);
  return row != null;
}
