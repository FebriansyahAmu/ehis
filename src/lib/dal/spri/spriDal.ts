// spriDal — Prisma murni encounter.Spri (Surat Perintah Rawat Inap). Read filter deletedAt: null.
// Tanpa aturan bisnis. Terima `tx?`. create dipanggil kunjunganService di transaksi "complete".
// Update (revisi ref / konsumsi) version-guarded (atomik via where) — return count.

import { db, type Tx } from "@/lib/db/prisma";

export interface CreateSpriData {
  kunjunganId: string;
  noKartu: string;
  dpjpNama: string;
  dpjpPegawaiId?: string | null;
  smfSpesialistik?: string | null;
  poliKode?: string | null;
  poliNama?: string | null;
  tglRencanaRawat: Date;
  jenisPerawatan: string;
  indikasi: string;
  keterangan?: string | null;
  noReferensi?: string | null;
  status: string;
  user: string;
  createdByUserId?: string | null;
}

// Join kunjungan/pasien untuk kartu worklist.
const withKunjungan = {
  kunjungan: {
    select: { noKunjungan: true, pasien: { select: { noRm: true, nama: true } } },
  },
};

export type SpriEntity = NonNullable<Awaited<ReturnType<typeof findByIdWithKunjungan>>>;

export function create(data: CreateSpriData, tx?: Tx) {
  return db(tx).spri.create({ data });
}

export function findById(id: string, tx?: Tx) {
  return db(tx).spri.findFirst({ where: { id, deletedAt: null } });
}

export function findByIdWithKunjungan(id: string, tx?: Tx) {
  return db(tx).spri.findFirst({ where: { id, deletedAt: null }, include: withKunjungan });
}

/** Cari SPRI by No. Referensi (BPJS) — dipakai resolve DPJP saat build SEP RI. Terbaru dulu. */
export function findByNoReferensi(noReferensi: string, tx?: Tx) {
  return db(tx).spri.findFirst({
    where: { noReferensi, deletedAt: null },
    orderBy: { createdAt: "desc" },
  });
}

/** Worklist admisi. Tanpa status → belum dikonsumsi (MenungguRef + Terbit). Status eksplisit → tepat. */
export function listWorklist(filter: { status?: string }, tx?: Tx) {
  return db(tx).spri.findMany({
    where: {
      deletedAt: null,
      ...(filter.status ? { status: filter.status } : { status: { in: ["MenungguRef", "Terbit"] } }),
    },
    include: withKunjungan,
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

/** Revisi: isi No. Referensi + status (atomik by version). Return count (1 ok, 0 race/stale). */
export async function updateRevisi(
  id: string,
  expectedVersion: number,
  data: { noReferensi: string | null; status: string },
  tx?: Tx,
) {
  const r = await db(tx).spri.updateMany({
    where: { id, version: expectedVersion, deletedAt: null },
    data: { ...data, version: { increment: 1 } },
  });
  return r.count;
}

/** Konsumsi: tautkan kunjungan RI + status Dikonsumsi (atomik). Guard status != Dikonsumsi/Batal. */
export async function consume(id: string, riKunjunganId: string, tx?: Tx) {
  const r = await db(tx).spri.updateMany({
    where: { id, deletedAt: null, status: { in: ["MenungguRef", "Terbit"] } },
    data: { riKunjunganId, status: "Dikonsumsi", version: { increment: 1 } },
  });
  return r.count;
}

export interface UpdateSpriFields {
  dpjpNama: string;
  dpjpPegawaiId?: string | null;
  smfSpesialistik?: string | null;
  poliKode?: string | null;
  poliNama?: string | null;
  tglRencanaRawat: Date;
  jenisPerawatan: string;
  indikasi: string;
  keterangan?: string | null;
}

/** Revisi konten SPRI (DPJP/poli/tgl/jenis/indikasi/ket) — version-guarded, hanya saat aktif.
 *  No. Referensi TIDAK diubah (tetap milik BPJS). Return count (0 = race/stale/non-aktif). */
export async function updateFields(id: string, expectedVersion: number, data: UpdateSpriFields, tx?: Tx) {
  const r = await db(tx).spri.updateMany({
    where: { id, version: expectedVersion, deletedAt: null, status: { in: ["MenungguRef", "Terbit"] } },
    data: { ...data, version: { increment: 1 } },
  });
  return r.count;
}

/** Batalkan SPRI → status Batal (hanya saat aktif MenungguRef/Terbit). Return count. */
export async function cancel(id: string, tx?: Tx) {
  const r = await db(tx).spri.updateMany({
    where: { id, deletedAt: null, status: { in: ["MenungguRef", "Terbit"] } },
    data: { status: "Batal", version: { increment: 1 } },
  });
  return r.count;
}

/** Tutup SPRI SAUDARA (pasien sama, via kunjungan asal) saat satu SPRI dikonsumsi → Tergantikan.
 *  Hanya yang masih aktif (MenungguRef/Terbit) & bukan SPRI yang baru dikonsumsi. Return count. */
export async function supersedeSiblings(excludeId: string, patientId: string, tx?: Tx) {
  const r = await db(tx).spri.updateMany({
    where: {
      id: { not: excludeId },
      deletedAt: null,
      status: { in: ["MenungguRef", "Terbit"] },
      kunjungan: { patientId }, // SPRI lain milik pasien yang sama (via kunjungan IGD asal)
    },
    data: { status: "Tergantikan", version: { increment: 1 } },
  });
  return r.count;
}

/** SPRI yang DIKONSUMSI oleh kunjungan RI tertentu (untuk pulih saat admisi dibatalkan). */
export function findConsumedByRiKunjungan(riKunjunganId: string, tx?: Tx) {
  return db(tx).spri.findFirst({
    where: { riKunjunganId, status: "Dikonsumsi", deletedAt: null },
  });
}

/** Pulihkan SPRI (admisi dibatalkan): kembalikan ke status terbit/menunggu + lepas riKunjunganId.
 *  Order tetap valid → muncul lagi di worklist admisi & dashboard pasien (re-admisi). */
export async function revertConsumed(id: string, status: string, tx?: Tx) {
  const r = await db(tx).spri.updateMany({
    where: { id, status: "Dikonsumsi", deletedAt: null },
    data: { status, riKunjunganId: null, version: { increment: 1 } },
  });
  return r.count;
}
