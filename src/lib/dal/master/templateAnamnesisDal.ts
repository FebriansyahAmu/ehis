// templateAnamnesisDal — akses Prisma MURNI master.TemplateAnamnesis. Tanpa aturan
// bisnis. Terima `tx?`. Read filter deletedAt: null. Katalog leaf → tanpa
// optimistic-version, tanpa kode/counter. contextTags = text[] (subset {IGD,RI,RJ}).

import { db, type Tx } from "@/lib/db/prisma";

export interface TemplateAnamnesisData {
  label: string;
  kategori: string;
  contextTags: string[];
  keluhanUtama: string;
  rps: string;
  onsetDurasi: string;
  mekanismeCedera?: string | null;
  faktorPemberat: string;
  faktorPemerut: string;
  statusGeneralis: string;
  catatanPerawat?: string | null;
  status: string;
}

/** Patch parsial — hanya field yang di-set yang ikut. */
export type TemplateAnamnesisPatch = Partial<TemplateAnamnesisData>;

export type TemplateAnamnesisEntity = NonNullable<Awaited<ReturnType<typeof findById>>>;

const ALIVE = { deletedAt: null } as const;

export function create(data: TemplateAnamnesisData, tx?: Tx) {
  return db(tx).templateAnamnesis.create({ data });
}

export function findById(id: string, tx?: Tx) {
  return db(tx).templateAnamnesis.findFirst({ where: { id, ...ALIVE } });
}

export function update(id: string, data: TemplateAnamnesisPatch, tx?: Tx) {
  return db(tx).templateAnamnesis.update({ where: { id }, data });
}

/** Soft-delete (deletedAt + status NonAktif). Idempoten via where deletedAt: null. */
export async function softDelete(id: string, tx?: Tx) {
  const r = await db(tx).templateAnamnesis.updateMany({
    where: { id, ...ALIVE },
    data: { deletedAt: new Date(), status: "NonAktif" },
  });
  return r.count;
}

export interface ListParams {
  q?: string;
  kategori?: string;
  modul?: string; // filter context tag (template berlaku utk modul ini)
  status?: string;
  cursorId?: string;
  limit: number;
}

export function list(p: ListParams, tx?: Tx) {
  const where: Record<string, unknown> = { ...ALIVE };
  if (p.kategori) where.kategori = p.kategori;
  if (p.status) where.status = p.status;
  if (p.modul) where.contextTags = { has: p.modul };
  if (p.q) {
    where.OR = [
      { label: { contains: p.q, mode: "insensitive" } },
      { keluhanUtama: { contains: p.q, mode: "insensitive" } },
    ];
  }
  return db(tx).templateAnamnesis.findMany({
    where,
    orderBy: [{ label: "asc" }, { id: "asc" }],
    take: p.limit,
    ...(p.cursorId ? { cursor: { id: p.cursorId }, skip: 1 } : {}),
  });
}
