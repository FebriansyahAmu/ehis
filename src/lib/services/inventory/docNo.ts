// docNo — nomor dokumen inventory `<KIND>-<YYMM><NNN>` (periode WIB, reset per bulan).
// Dipakai GRN (penerimaan), TRF (transfer), DST (distribusi), OPN (opname).

import { type Tx } from "@/lib/db/prisma";
import { nextDocSeq } from "@/lib/dal/inventory/counterDal";

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

/** Periode "YYMM" zona WIB. */
export function docPeriode(now: Date = new Date()): string {
  const w = new Date(now.getTime() + WIB_OFFSET_MS);
  return `${String(w.getUTCFullYear() % 100).padStart(2, "0")}${String(w.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Nomor dokumen berikutnya untuk `kind` (mis. "GRN") dalam transaksi. */
export async function nextDocNo(kind: string, tx: Tx, now: Date = new Date()): Promise<string> {
  const periode = docPeriode(now);
  const seq = await nextDocSeq(kind, periode, tx);
  return `${kind}-${periode}${String(seq).padStart(3, "0")}`;
}
