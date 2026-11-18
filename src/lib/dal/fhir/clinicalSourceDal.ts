// clinicalSourceDal — baca rekam medis kunjungan untuk FHIR klinis inti (FH4). Prisma murni,
// read-only. TERMASUK baris soft-deleted (deletedAt) — Service mengirim `entered-in-error` untuk
// yang sudah pernah terkirim, dan mengabaikan yang belum.

import { db, type Tx } from "@/lib/db/prisma";

export function listDiagnosa(kunjunganId: string, tx?: Tx) {
  return db(tx).diagnosa.findMany({
    where: { kunjunganId },
    orderBy: { createdAt: "asc" },
    select: { id: true, kodeIcd10: true, namaDiagnosis: true, tipe: true, status: true, createdAt: true, deletedAt: true },
  });
}

/**
 * L13 — display resmi ICD-10 (master.icd_code, teks tampilan SatuSehat) untuk semua kode diagnosa kunjungan
 * + diagnosa masuk (`kunjungan.kode_icd_masuk`, Encounter.diagnosis AD). Kode dinormalisasi huruf besar.
 */
export async function listIcd10Kunjungan(kunjunganId: string, tx?: Tx) {
  const [dx, k] = await Promise.all([
    db(tx).diagnosa.findMany({ where: { kunjunganId }, select: { kodeIcd10: true } }),
    db(tx).kunjungan.findFirst({ where: { id: kunjunganId }, select: { kodeIcdMasuk: true } }),
  ]);
  const kodeIcdMasuk = k?.kodeIcdMasuk?.trim() || null;
  const kodes = [...new Set([...dx.map((d) => d.kodeIcd10), kodeIcdMasuk ?? ""].map((s) => s.trim().toUpperCase()).filter(Boolean))];
  const icd = kodes.length
    ? await db(tx).icdCode.findMany({
        where: { jenis: "ICD_10", kode: { in: kodes }, deletedAt: null },
        select: { kode: true, display: true },
      })
    : [];
  return { kodeIcdMasuk, icd };
}

export function listProsedur(kunjunganId: string, tx?: Tx) {
  return db(tx).diagnosaProsedur.findMany({
    where: { kunjunganId },
    orderBy: { createdAt: "asc" },
    select: { id: true, kode: true, nama: true, catatan: true, authorPegawaiId: true, createdAt: true, deletedAt: true },
  });
}

/**
 * SEMUA tindakan (termasuk tanpa kode ICD-9-CM) — yang tanpa kode menjadi Issue L14 di konsol, bukan
 * hilang diam-diam (FG-37). `kategori` = snapshot kategori katalog → `Procedure.category`.
 */
export function listTindakan(kunjunganId: string, tx?: Tx) {
  return db(tx).tindakanMedis.findMany({
    where: { kunjunganId },
    orderBy: { dilakukanPada: "asc" },
    select: { id: true, kode: true, nama: true, kategori: true, authorPegawaiId: true, dilakukanPada: true, deletedAt: true },
  });
}

/** TTV (append-only, tanpa soft-delete). */
export function listTtv(kunjunganId: string, tx?: Tx) {
  return db(tx).observation.findMany({
    where: { kunjunganId },
    orderBy: { waktuObservasi: "asc" },
    select: {
      id: true, tdSistolik: true, tdDiastolik: true, nadi: true, respirasi: true, suhu: true, spo2: true,
      gcsEye: true, gcsVerbal: true, gcsMotor: true, skalaNyeri: true, beratBadan: true, tinggiBadan: true,
      statusKesadaran: true, waktuObservasi: true, authorPegawaiId: true,
    },
  });
}

/** Triase IGD (append-only) — L09 kesadaran AVPU per momen triase. */
export function listTriaseAvpu(kunjunganId: string, tx?: Tx) {
  return db(tx).triase.findMany({
    where: { kunjunganId },
    orderBy: { waktuTriase: "asc" },
    select: { id: true, avpu: true, waktuTriase: true, authorPegawaiId: true },
  });
}

/**
 * Penilaian skala (append-only) + pemetaan SatuSehat instrumennya SAAT INI (L11/L12). `skalaKode` = snapshot
 * kode master; instrumen terhapus/tak ditemukan → `fhirPemetaan` null (Issue "belum dipetakan").
 */
export async function listPenilaianSkala(kunjunganId: string, tx?: Tx) {
  const rows = await db(tx).penilaianSkala.findMany({
    where: { kunjunganId },
    orderBy: { createdAt: "asc" },
    select: { id: true, skalaKode: true, skalaNama: true, totalSkor: true, authorPegawaiId: true, createdAt: true },
  });
  const kodes = [...new Set(rows.map((r) => r.skalaKode))];
  const master = kodes.length
    ? await db(tx).skalaInstrument.findMany({
        where: { kode: { in: kodes }, deletedAt: null },
        select: { kode: true, fhirPemetaan: true },
      })
    : [];
  const pemetaanOf = new Map(master.map((m) => [m.kode, m.fhirPemetaan]));
  return rows.map((r) => ({ ...r, fhirPemetaan: pemetaanOf.get(r.skalaKode) ?? null }));
}

/** Nama tampil pegawai (performer/recorder display). */
export function listPegawaiNama(ids: string[], tx?: Tx) {
  if (!ids.length) return Promise.resolve([]);
  return db(tx).pegawai.findMany({
    where: { id: { in: ids } },
    select: { id: true, namaLengkap: true, gelarDepan: true, gelarBelakang: true },
  });
}

export function listAlergi(kunjunganId: string, tx?: Tx) {
  return db(tx).asesmenAlergi.findMany({
    where: { kunjunganId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true, category: true, allergen: true, reactions: true, severity: true, status: true, keterangan: true,
      snomedCode: true, bzaKode: true, authorPegawaiId: true, createdAt: true, deletedAt: true,
    },
  });
}
