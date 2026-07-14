/**
 * Outstanding Tagihan search helpers (Kasir Quick Bayar).
 *
 * Murni fungsi filter/sort atas baris NYATA (`TagihanRow[]` hasil proyeksi billing —
 * `mapProjectionRow` dari `GET /billing/kunjungan`). Tidak ada mock data: caller wajib
 * menyediakan `source`. `sisaTagihan = total − dibayar` (dibayar sudah nyata dari DB).
 */

import type { TagihanRow } from "@/lib/billing/tagihanBoardMock";

export interface OutstandingResult extends TagihanRow {
  sisaTagihan: number;
}

const withSisa = (row: TagihanRow): OutstandingResult => ({
  ...row,
  sisaTagihan: row.total - row.dibayar,
});

/**
 * Cari outstanding (sisa > 0) berdasarkan query string atas `source` nyata.
 * Cocokkan ke noTagihan / noRM / nama pasien / noKunjungan (case-insensitive).
 * Sort: prioritas sisa terbesar (kasir biasanya kerjakan yang besar dulu).
 */
export function searchOutstanding(
  query: string,
  source: TagihanRow[],
  limit = 12,
): OutstandingResult[] {
  const q = query.trim().toLowerCase();
  return source
    .map(withSisa)
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
 * Top N dengan sisa terbesar.
 */
export function topOutstandingSuggestions(
  source: TagihanRow[],
  limit = 5,
): OutstandingResult[] {
  return source
    .map(withSisa)
    .filter((row) => row.sisaTagihan > 0 && row.status !== "Void")
    .sort((a, b) => b.sisaTagihan - a.sisaTagihan)
    .slice(0, limit);
}
