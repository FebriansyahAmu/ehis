/**
 * Helper murni L13 (diagnosaToCondition) — dipakai Encounter final (L01) dan alasan order/resep/tindakan.
 * Input = baris `medicalrecord.Diagnosa` dari snapshot (urut createdAt asc, termasuk soft-deleted).
 */

interface DiagnosaRow {
  tipe: string;
  status: string;
  deletedAt: Date | null;
}

/**
 * Diagnosa final kandidat `Encounter.diagnosis`: aktif · status Pasti · tipe Utama/Sekunder ·
 * Utama lebih dulu, lalu urut input (setara query lama `listDiagnosaFinal`).
 */
export function diagnosaFinalOf<T extends DiagnosaRow>(diagnosa: readonly T[]): T[] {
  return diagnosa
    .filter((d) => !d.deletedAt && d.status === "Pasti" && (d.tipe === "Utama" || d.tipe === "Sekunder"))
    .map((d, i) => ({ d, i }))
    .sort((a, b) => (a.d.tipe === b.d.tipe ? a.i - b.i : a.d.tipe === "Utama" ? -1 : 1))
    .map((x) => x.d);
}

/** Diagnosa Utama aktif ber-kode — dipakai sebagai alasan (reason) order/resep/tindakan. */
export function diagnosaUtamaOf<T extends DiagnosaRow & { kodeIcd10: string; namaDiagnosis: string }>(
  diagnosa: readonly T[],
): { kode: string; nama: string } | undefined {
  const u = diagnosa.find((d) => !d.deletedAt && d.tipe === "Utama" && d.kodeIcd10.trim());
  return u ? { kode: u.kodeIcd10.trim().toUpperCase(), nama: u.namaDiagnosis } : undefined;
}
