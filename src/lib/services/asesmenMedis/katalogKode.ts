// katalogKode — D7 (docs/fhir-mapping README): record riwayat menyimpan KODE item katalog master.AsesmenItem,
// bukan hanya nama. Form mengirim nama (label dropdown katalog); kode DITURUNKAN server saat simpan dengan
// mencocokkan nama di kategori yang sama — klien tidak bisa menyisipkan kode sembarang. Nama yang tidak ada di
// katalog (teks lama / opsi fallback) → kode "" → ditahan sebagai Issue saat kirim FHIR (L04/L05).
// Murni (tanpa I/O) — Service memuat item lewat asesmenKatalogDal.listKodeNama.

export type KategoriRiwayat = "PenyakitDahulu" | "PenyakitKeluarga" | "AnggotaKeluarga";

const norm = (s: string) => s.trim().toLowerCase();

/** Indeks nama → kode (item tertua menang bila nama kembar; input urut createdAt naik). */
export function indeksKode(items: { kode: string; nama: string }[]): Map<string, string> {
  const m = new Map<string, string>();
  for (const it of items) if (!m.has(norm(it.nama))) m.set(norm(it.nama), it.kode);
  return m;
}

/** Kode sejajar indeks dengan `names`; "" bila nama tidak ada di katalog. */
export const kodeSejajar = (names: string[], idx: Map<string, string>): string[] => names.map((n) => idx.get(norm(n)) ?? "");
