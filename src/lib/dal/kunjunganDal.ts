// kunjunganDal — akses Prisma MURNI domain encounter (FLOWS §2 · BACKEND-ENCOUNTER §4.1).
// Tak ada aturan bisnis. Terima `tx?` (transaksi dimiliki Service/use-case). Soft-delete
// difilter default. Enum di-ketik sebagai string-union lokal (DAL tetap "loose", tak
// bergantung tipe Prisma generated — selaras patientDal).

import { db, type Tx } from "@/lib/db/prisma";

type KunjunganUnit = "IGD" | "RawatJalan" | "RawatInap";
type KunjunganStatus =
  | "Registered" | "Queued" | "InService" | "Completed" | "Closed" | "Billed" | "Claimed" | "Cancelled";
type CallState = "Idle" | "Dipanggil";
type KelasRawat = "VIP" | "Kelas_1" | "Kelas_2" | "Kelas_3" | "ICU" | "HCU" | "Isolasi";
type TipePenjamin = "Umum" | "BPJS_Non_PBI" | "BPJS_PBI" | "Asuransi" | "Jamkesda";

// ── Bentuk data create (nilai sudah dinormalisasi Service) ──
export interface CreateKunjunganData {
  patientId: string;
  unit: KunjunganUnit;
  status: KunjunganStatus;
  noKunjungan: string;
  noPendaftaran?: string;
  waktuKunjungan: Date;
  antreanKodebooking?: string;
  dpjpId?: string;
  poli?: string;
  kelas?: KelasRawat;
  bedId?: string;
  triaseLevel?: number;
  caraDatang?: string;
  asalMasuk?: string;
  caraMasuk?: string;
  keluhan?: string;
  diagnosaMasuk?: string;
  kodeIcdMasuk?: string;
  penjaminTipe: TipePenjamin;
  penjaminId?: string;
}

export interface UpdateStatusPatch {
  status: KunjunganStatus;
  lockedAt?: Date;
  selesaiAt?: Date;
  callState?: CallState;
  recallCount?: number;
  invoiceId?: string;
}

// Read DETAIL: pasien ringkas + artefak BPJS penuh (1:1) — utk halaman detail/cetak SEP.
const detailInclude = {
  pasien: { select: { id: true, noRm: true, nama: true } },
  rujukan: true,
  sep: true,
} as const;

// Read LIST/worklist: pasien ringkas + ringkasan SEP saja (noSep/status utk badge).
// Hindari over-fetch seluruh kolom SEP + rujukan per baris board.
const listInclude = {
  pasien: { select: { id: true, noRm: true, nama: true } },
  sep: { select: { id: true, noSep: true, status: true } },
} as const;

export type KunjunganEntity = Awaited<ReturnType<typeof findById>>;
export type KunjunganListEntity = Awaited<ReturnType<typeof listByUnitStatus>>["items"][number];

// ── noKunjungan sequence (atomik, anti-race) ─────────────────────────────────--
export async function nextNoKunjunganSeq(tx?: Tx): Promise<number> {
  const rows = await db(tx).$queryRaw<{ nextval: bigint }[]>`SELECT nextval('"encounter"."no_kunjungan_seq"')`;
  return Number(rows[0].nextval);
}

// ── Create ───────────────────────────────────────────────────────────────────
export function create(data: CreateKunjunganData, tx?: Tx) {
  return db(tx).kunjungan.create({ data, include: detailInclude });
}

// ── Reads (soft-delete difilter) ──────────────────────────────────────────────
export function findById(id: string, tx?: Tx) {
  return db(tx).kunjungan.findFirst({ where: { id, deletedAt: null }, include: detailInclude });
}

export function findByKodebooking(kodebooking: string, tx?: Tx) {
  return db(tx).kunjungan.findFirst({ where: { antreanKodebooking: kodebooking, deletedAt: null }, include: detailInclude });
}

/** Worklist lintas unit — cursor by (createdAt,id) desc. */
export async function listByUnitStatus(
  params: { unit?: KunjunganUnit; status?: KunjunganStatus[]; cursor?: string; limit: number },
  tx?: Tx,
) {
  const { unit, status, cursor, limit } = params;
  const rows = await db(tx).kunjungan.findMany({
    where: {
      deletedAt: null,
      ...(unit ? { unit } : {}),
      ...(status && status.length ? { status: { in: status } } : {}),
    },
    include: listInclude,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1, // +1 → deteksi halaman berikutnya
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  return { items, nextCursor: hasMore ? items[items.length - 1].id : null };
}

// ── Update status (version guard — optimistic concurrency, FLOWS §7) ──────────
/** Update bila version cocok; bump version. Mengembalikan count (0 = stale). */
export async function updateStatus(
  id: string,
  expectedVersion: number,
  patch: UpdateStatusPatch,
  tx?: Tx,
): Promise<number> {
  const res = await db(tx).kunjungan.updateMany({
    where: { id, version: expectedVersion, deletedAt: null },
    data: { ...patch, version: { increment: 1 } },
  });
  return res.count;
}

// ── Soft-delete ────────────────────────────────────────────────────────────---
export function softDelete(id: string, when: Date, tx?: Tx) {
  return db(tx).kunjungan.updateMany({ where: { id, deletedAt: null }, data: { deletedAt: when } });
}
