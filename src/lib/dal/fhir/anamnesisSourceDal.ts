// anamnesisSourceDal — sumber FHIR S4d (L04 · L05 · L10). Prisma murni, read-only. Ketiga sumber append-only
// "latest wins": SEMUA baris kunjungan dibaca (urut naik) — builder memakai baris terakhir dan mendeteksi item
// yang hilang dari baris lama (→ entered-in-error bila pernah terkirim).

import { db, type Tx } from "@/lib/db/prisma";

/** L04 — riwayat penyakit pribadi (kode katalog sejajar nama, D7). */
export function listPenyakitDahulu(kunjunganId: string, tx?: Tx) {
  return db(tx).asesmenPenyakitDahulu.findMany({
    where: { kunjunganId },
    orderBy: { createdAt: "asc" },
    select: { penyakit: true, penyakitKode: true, catatan: true, authorPegawaiId: true, createdAt: true },
  });
}

/** L05 — riwayat penyakit keluarga per anggota. */
export function listPenyakitKeluarga(kunjunganId: string, tx?: Tx) {
  return db(tx).asesmenPenyakitKeluarga.findMany({
    where: { kunjunganId },
    orderBy: { createdAt: "asc" },
    select: {
      createdAt: true,
      items: {
        orderBy: { urutan: "asc" },
        select: { anggota: true, anggotaKode: true, penyakit: true, penyakitKode: true, keterangan: true },
      },
    },
  });
}

/** L10 — pemeriksaan fisik head-to-toe (`sistem` JSONB). */
export function listPemeriksaanFisik(kunjunganId: string, tx?: Tx) {
  return db(tx).pemeriksaanFisik.findMany({
    where: { kunjunganId },
    orderBy: { createdAt: "asc" },
    select: { sistem: true, waktuPemeriksaan: true, authorPegawaiId: true },
  });
}

/**
 * SNOMED item katalog riwayat (PenyakitDahulu/PenyakitKeluarga) — dibaca saat kirim (D7: SNOMED milik katalog).
 * Termasuk Non_Aktif (data lama tetap sah); yang terhapus tidak (kode hidup unik).
 */
export function listKatalogRiwayat(tx?: Tx) {
  return db(tx).asesmenItem.findMany({
    where: { kategori: { in: ["PenyakitDahulu", "PenyakitKeluarga"] }, deletedAt: null },
    select: { kode: true, snomedCode: true, snomedDisplay: true },
  });
}
