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

/**
 * L07 — riwayat pengobatan (semua simpanan, urut naik) + blok KFA master untuk obat yang ditautkan. Master yang
 * sudah dihapus TETAP dibaca: kodenya tetap sah untuk riwayat & untuk menarik (entered-in-error) yang pernah terkirim.
 */
export async function listRiwayatObat(kunjunganId: string, tx?: Tx) {
  const rows = await db(tx).asesmenObat.findMany({
    where: { kunjunganId },
    orderBy: { createdAt: "asc" },
    select: {
      createdAt: true,
      items: {
        orderBy: { urutan: "asc" },
        select: { nama: true, obatId: true, status: true, dosis: true, frekuensi: true, rute: true, sejak: true, indikasi: true },
      },
    },
  });
  const ids = [...new Set(rows.flatMap((r) => r.items.map((i) => i.obatId)).filter((x): x is string => !!x))];
  const obat = ids.length ? await db(tx).obat.findMany({ where: { id: { in: ids } }, select: { id: true, kfa: true } }) : [];
  return { rows, kfa: obat };
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
