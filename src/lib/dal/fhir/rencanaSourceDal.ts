// rencanaSourceDal — baca sumber fase B6 (rencana & pulang) 1 kunjungan untuk FHIR: L15 edukasi · L22 rencana asuhan ·
// L23 rencana pemulangan · L25 tindak lanjut. Prisma murni, read-only. TERMASUK baris soft-deleted (deletedAt) —
// Service mengirim `entered-in-error`/`revoked` untuk yang pernah terkirim.

import { db, type Tx } from "@/lib/db/prisma";

/** L22 — masalah rencana asuhan + goal-nya (semua, termasuk terhapus). */
export function listCarePlan(kunjunganId: string, tx?: Tx) {
  return db(tx).carePlanMasalah.findMany({
    where: { kunjunganId },
    orderBy: { tanggalInput: "asc" },
    select: {
      id: true, masalah: true, sumber: true, refKode: true, status: true, verified: true, tanggalInput: true,
      authorPegawaiId: true, deletedAt: true,
      goals: {
        orderBy: { waktu: "asc" },
        select: {
          id: true, ppa: true, target: true, indikator: true, targetWaktu: true, intervensi: true, status: true,
          evaluasi: true, waktu: true, authorPegawaiId: true, deletedAt: true,
        },
      },
    },
  });
}

/** L23 — asesmen discharge terakhir (append-only "latest wins"). */
export function getLatestDischargeAsesmen(kunjunganId: string, tx?: Tx) {
  return db(tx).dischargeAsesmen.findFirst({
    where: { kunjunganId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, tanggalRencanaKrs: true, kondisiPulang: true, caregiverNama: true, caregiverHubungan: true,
      kebutuhanHomecare: true, jenisHomecare: true, kebutuhanAlatBantu: true, alatBantu: true, catatan: true,
      authorPegawaiId: true, createdAt: true,
    },
  });
}

/** L15 — log edukasi pemulangan per topik. */
export function listDischargeEdukasi(kunjunganId: string, tx?: Tx) {
  return db(tx).dischargeEdukasi.findMany({
    where: { kunjunganId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true, topikId: true, topik: true, tanggal: true, profesi: true, metode: true, penerima: true, pemahaman: true,
      catatan: true, authorPegawaiId: true, createdAt: true, deletedAt: true,
    },
  });
}

/** L25 — jadwal kontrol + pegawai dokter tujuan (performer). */
export async function listJadwalKontrol(kunjunganId: string, tx?: Tx) {
  const rows = await db(tx).jadwalKontrol.findMany({
    where: { kunjunganId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true, nomor: true, tanggal: true, poliNama: true, dokterNama: true, dokterId: true, catatan: true,
      authorPegawaiId: true, createdAt: true, deletedAt: true,
    },
  });
  const dokterIds = [...new Set(rows.map((r) => r.dokterId).filter((x): x is string => !!x))];
  const dokter = dokterIds.length
    ? await db(tx).dokter.findMany({ where: { id: { in: dokterIds } }, select: { id: true, pegawaiId: true } })
    : [];
  const pegawaiOf = new Map(dokter.map((d) => [d.id, d.pegawaiId]));
  return rows.map((r) => ({ ...r, dokterPegawaiId: r.dokterId ? (pegawaiOf.get(r.dokterId) ?? null) : null }));
}

/** L25 — konsultasi yang DIMINTA dari kunjungan ini. */
export function listKonsultasi(kunjunganId: string, tx?: Tx) {
  return db(tx).konsultasi.findMany({
    where: { kunjunganId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true, urgency: true, status: true, smfNama: true, authorPegawaiId: true, konsultanPegawaiId: true,
      createdAt: true, deletedAt: true,
    },
  });
}

/** L25 — rujukan eksternal (snapshot detail JSONB). */
export function listRujukanEksternal(kunjunganId: string, tx?: Tx) {
  return db(tx).rujukanEksternal.findMany({
    where: { kunjunganId },
    orderBy: { createdAt: "asc" },
    select: { id: true, nomor: true, detail: true, authorPegawaiId: true, createdAt: true, deletedAt: true },
  });
}

/** L25 — SPRI terbit dari kunjungan ini (ditahan D8; hanya untuk Issue). */
export function listSpri(kunjunganId: string, tx?: Tx) {
  return db(tx).spri.findMany({
    where: { kunjunganId, deletedAt: null, status: { not: "Batal" } },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
}

/** Nama & telepon RS — `patientInstruction` "dalam keadaan darurat dapat menghubungi …" (L25). */
export function getRsKontak(tx?: Tx) {
  return db(tx).rsProfil.findFirst({ select: { nama: true, telp: true } });
}
