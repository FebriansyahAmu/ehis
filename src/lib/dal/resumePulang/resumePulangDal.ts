// resumePulangDal — Prisma murni medicalrecord.ResumePulang (append-only "latest wins"
// per kunjungan). TTE = stamp guarded (tteSignedAt IS NULL). Tanpa aturan bisnis. Terima
// `tx?`. Selaras resumeMedikDal.

import { db, type Tx } from "@/lib/db/prisma";

export interface CreateResumePulangData {
  kunjunganId: string;
  ringkasanAnamnesis: string;
  hasilPemeriksaan: string;
  terapiDiberikan: string;
  kondisiSaatPulang: string;
  instruksiPulang: string;
  pembatasanAktivitas: string;
  dietPulang: string;
  tandaTanganPasien: boolean;
  pencatat: string;
  authorUserId?: string | null;
  authorPegawaiId?: string | null;
}

export type ResumePulangEntity = NonNullable<Awaited<ReturnType<typeof latest>>>;

/** Revisi terkini (latest-wins) per kunjungan. */
export function latest(kunjunganId: string, tx?: Tx) {
  return db(tx).resumePulang.findFirst({
    where: { kunjunganId },
    orderBy: { createdAt: "desc" },
  });
}

export function findById(id: string, tx?: Tx) {
  return db(tx).resumePulang.findUnique({ where: { id } });
}

export function create(data: CreateResumePulangData, tx?: Tx) {
  return db(tx).resumePulang.create({ data });
}

/** Stamp TTE sekali — guard `tteSignedAt IS NULL`. Return count (0 = sudah/berebut). */
export async function signOnce(
  id: string,
  data: { tteToken: string; tteSignedBy: string; tteSignedAt: Date },
  tx?: Tx,
): Promise<number> {
  const res = await db(tx).resumePulang.updateMany({
    where: { id, tteSignedAt: null },
    data,
  });
  return res.count;
}
