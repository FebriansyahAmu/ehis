// tindakanDal — akses Prisma MURNI master.Tindakan (katalog tindakan). Tanpa aturan
// bisnis. Terima `tx?`. Read filter deletedAt: null. Enum di-ketik string-union lokal
// (DAL "loose", selaras icdDal/ruanganDal). Katalog leaf → tanpa optimistic-version.

import { db, type Tx } from "@/lib/db/prisma";

type TindakanKategoriDb =
  | "Konsultasi" | "Tindakan_Medis" | "Diagnostik" | "Bedah_Minor" | "Bedah_Mayor"
  | "Bedah_Khusus" | "Obstetri" | "Pediatrik" | "Resusitasi" | "Anestesi" | "Spesialistik"
  | "Non_Kategori" | "Prosedur_Bedah" | "Prosedur_Non_Bedah" | "Keperawatan" | "Tindakan_Invasif";
type KompleksitasDb = "Sederhana" | "Sedang" | "Khusus" | "Canggih";

export interface CreateTindakanData {
  kode: string;
  nama: string;
  kategori: TindakanKategoriDb;
  kptlAktif?: boolean;
  nomorKptl?: string | null;
  kompleksitas?: KompleksitasDb | null;
  spesialisDefault?: string[];
  unitDefault?: string[];
  deskripsi?: string | null;
  active?: boolean;
}
export type UpdateTindakanData = Partial<CreateTindakanData>;

export type TindakanEntity = NonNullable<Awaited<ReturnType<typeof findById>>>;

const ALIVE = { deletedAt: null } as const;

// ── Single ────────────────────────────────────────────────────────────────────
export function create(data: CreateTindakanData, tx?: Tx) {
  return db(tx).tindakan.create({ data });
}

export function findById(id: string, tx?: Tx) {
  return db(tx).tindakan.findFirst({ where: { id, ...ALIVE } });
}

/** Patch parsial (tanpa optimistic-version: katalog leaf). Mengembalikan count. */
export async function update(id: string, data: UpdateTindakanData, tx?: Tx) {
  const r = await db(tx).tindakan.updateMany({ where: { id, ...ALIVE }, data });
  return r.count;
}

/** Soft-delete (deletedAt + active:false). Idempoten via where deletedAt: null. */
export async function softDelete(id: string, tx?: Tx) {
  const r = await db(tx).tindakan.updateMany({
    where: { id, ...ALIVE },
    data: { deletedAt: new Date(), active: false },
  });
  return r.count;
}

// ── List (filter + keyset cursor) ───────────────────────────────────────────────
export interface ListParams {
  q?: string;                  // cari kode/nama (case-insensitive)
  kategori?: TindakanKategoriDb;
  kompleksitas?: KompleksitasDb;
  active?: boolean;            // undefined = semua status
  cursorId?: string;          // id baris terakhir halaman sebelumnya
  limit: number;              // Service kirim limit+1 utk deteksi hasMore
}

export function list(p: ListParams, tx?: Tx) {
  const where: Record<string, unknown> = { ...ALIVE };
  if (p.kategori) where.kategori = p.kategori;
  if (p.kompleksitas) where.kompleksitas = p.kompleksitas;
  if (p.active !== undefined) where.active = p.active;
  if (p.q) {
    where.OR = [
      { kode: { contains: p.q, mode: "insensitive" } },
      { nama: { contains: p.q, mode: "insensitive" } },
    ];
  }
  return db(tx).tindakan.findMany({
    where,
    orderBy: [{ nama: "asc" }, { id: "asc" }],
    take: p.limit,
    ...(p.cursorId ? { cursor: { id: p.cursorId }, skip: 1 } : {}),
  });
}
