// vendorDal — akses Prisma MURNI inventory.Vendor. Kode auto `VND-<NNN>` (counter global via
// InvCounter kind=VND periode=GLOBAL). Soft-delete. Pola identik bmhpDal.

import { db, type Tx } from "@/lib/db/prisma";

export type VendorJenisDal = "PBF" | "Distributor" | "Manufaktur";
export type VendorStatusDal = "Aktif" | "Non_Aktif";

export interface VendorData {
  kode: string;
  nama: string;
  jenis: VendorJenisDal;
  izinPbf?: string | null;
  kontakNama: string;
  telp: string;
  email?: string | null;
  alamat: string;
  leadTimeHari: number;
  status: VendorStatusDal;
}
export type VendorPatch = Partial<VendorData>;
export type VendorEntity = NonNullable<Awaited<ReturnType<typeof findById>>>;

const ALIVE = { deletedAt: null } as const;

/** Sequence kode vendor (global, atomik). InvCounter kind=VND periode=GLOBAL. */
export async function nextVendorSeq(tx?: Tx): Promise<number> {
  const row = await db(tx).invCounter.upsert({
    where: { kind_periode: { kind: "VND", periode: "GLOBAL" } },
    create: { kind: "VND", periode: "GLOBAL", lastSeq: 1 },
    update: { lastSeq: { increment: 1 } },
    select: { lastSeq: true },
  });
  return row.lastSeq;
}

export function create(data: VendorData, tx?: Tx) {
  return db(tx).vendor.create({ data });
}
export function findById(id: string, tx?: Tx) {
  return db(tx).vendor.findFirst({ where: { id, ...ALIVE } });
}
export function update(id: string, data: VendorPatch, tx?: Tx) {
  return db(tx).vendor.update({ where: { id }, data });
}
export async function softDelete(id: string, tx?: Tx) {
  const r = await db(tx).vendor.updateMany({
    where: { id, ...ALIVE },
    data: { deletedAt: new Date(), status: "Non_Aktif" },
  });
  return r.count;
}

export interface ListParams {
  q?: string;
  jenis?: string;
  status?: string;
  cursorId?: string;
  limit: number;
}
export function list(p: ListParams, tx?: Tx) {
  const where: Record<string, unknown> = { ...ALIVE };
  if (p.jenis) where.jenis = p.jenis;
  if (p.status) where.status = p.status;
  if (p.q) {
    where.OR = [
      { nama: { contains: p.q, mode: "insensitive" } },
      { kode: { contains: p.q, mode: "insensitive" } },
      { kontakNama: { contains: p.q, mode: "insensitive" } },
    ];
  }
  return db(tx).vendor.findMany({
    where,
    orderBy: [{ nama: "asc" }, { id: "asc" }],
    take: p.limit,
    ...(p.cursorId ? { cursor: { id: p.cursorId }, skip: 1 } : {}),
  });
}
