/**
 * Idempotency Key Module (BP0.4).
 *
 * Re-export `generateIdempotencyKey` dari [bpjsShared.ts] + helper
 * spesifik per-mutation type (Insert SEP/RK/SPRI/Update SEP/dst).
 *
 * Format key: `${noKartu}-${tglPelayanan}-${djb2Hash}`
 *
 * Same payload → same key. Server BPJS reject duplicate dengan code 202.
 */

import {
  generateIdempotencyKey,
  type IdempotencyKey,
  type IdempotencyPayload,
} from "./bpjsShared";

export { generateIdempotencyKey };
export type { IdempotencyKey, IdempotencyPayload };

/** Key untuk Insert SEP. */
export function keyForInsertSEP(input: {
  noKartu: string;
  tglPelayanan: string;
  poliKode: string;
  diagnosaAwal: string;
}): IdempotencyKey {
  return generateIdempotencyKey({
    noKartu: input.noKartu,
    tglPelayanan: input.tglPelayanan,
    context: {
      op: "insert-sep",
      poli: input.poliKode,
      diag: input.diagnosaAwal,
    },
  });
}

/** Key untuk Update SEP. */
export function keyForUpdateSEP(input: {
  noKartu: string;
  noSEP: string;
  fieldsHash: string;
}): IdempotencyKey {
  return generateIdempotencyKey({
    noKartu: input.noKartu,
    tglPelayanan: new Date().toISOString().slice(0, 10),
    context: { op: "update-sep", noSEP: input.noSEP, fields: input.fieldsHash },
  });
}

/** Key untuk Insert Rencana Kontrol / SPRI. */
export function keyForInsertRK(input: {
  noKartu: string;
  noSEPAsal: string;
  tglRencana: string;
  jenis: "Kontrol" | "SPRI";
}): IdempotencyKey {
  return generateIdempotencyKey({
    noKartu: input.noKartu,
    tglPelayanan: input.tglRencana,
    context: { op: "insert-rk", sep: input.noSEPAsal, jenis: input.jenis },
  });
}
