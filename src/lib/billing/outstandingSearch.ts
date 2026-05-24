/**
 * Outstanding Tagihan search helpers (BL3.2 Quick Bayar).
 *
 * Tugas: search tagihan dengan sisa > 0 berdasarkan no tagihan / no RM / nama
 * pasien. Re-use `TAGIHAN_BOARD_MOCK` sebagai source — saat backend ready,
 * swap query → `prisma.invoice.findMany({ where: { sisa: { gt: 0 } } })`.
 */

import {
  TAGIHAN_BOARD_MOCK, sisa, type TagihanRow,
} from "@/lib/billing/tagihanBoardMock";

export interface OutstandingResult extends TagihanRow {
  sisaTagihan: number;
}

/**
 * Cari outstanding (sisa > 0) berdasarkan query string.
 * Cocokkan ke noTagihan / noRM / nama pasien / noKunjungan (case-insensitive).
 * Sort: prioritas sisa terbesar (kasir biasanya kerja yang besar dulu).
 */
export function searchOutstanding(
  query: string,
  source: TagihanRow[] = TAGIHAN_BOARD_MOCK,
  limit = 12,
): OutstandingResult[] {
  const q = query.trim().toLowerCase();
  return source
    .map((row) => ({ ...row, sisaTagihan: sisa(row) }))
    .filter((row) => row.sisaTagihan > 0 && row.status !== "Void")
    .filter((row) => {
      if (!q) return true;
      const hay = `${row.noTagihan} ${row.pasien.nama} ${row.pasien.noRM} ${row.noKunjungan}`.toLowerCase();
      return hay.includes(q);
    })
    .sort((a, b) => b.sisaTagihan - a.sisaTagihan)
    .slice(0, limit);
}

/**
 * Suggest "Pasien Top Outstanding" untuk quick-pick saat field search kosong.
 * Top 5 dengan sisa terbesar.
 */
export function topOutstandingSuggestions(
  source: TagihanRow[] = TAGIHAN_BOARD_MOCK,
  limit = 5,
): OutstandingResult[] {
  return source
    .map((row) => ({ ...row, sisaTagihan: sisa(row) }))
    .filter((row) => row.sisaTagihan > 0 && row.status !== "Void")
    .sort((a, b) => b.sisaTagihan - a.sisaTagihan)
    .slice(0, limit);
}
