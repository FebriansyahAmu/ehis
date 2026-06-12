// informedConsentDal — Prisma murni medicalrecord.InformedConsent (per-item). Read filter
// deletedAt: null. Tanpa aturan bisnis. Terima `tx?`. Selaras tindakanMedisDal.
// list OMIT signatureData (PNG base64 → row bloat); findById penuh (guard/detail/print).

import { db, type Tx } from "@/lib/db/prisma";

export interface CreateInformedConsentData {
  kunjunganId: string;
  noFormulir: string;
  tindakanId?: string | null;
  tindakanNama: string;
  tindakanKategori?: string | null;
  tujuan?: string | null;
  manfaat?: string | null;
  risiko: string[];
  risikoLain?: string | null;
  alternatif?: string | null;
  konsekuensiTolak?: string | null;
  pertanyaanPasien?: string | null;
  keputusan: string;
  alasanTolak?: string | null;
  penandaHubungan: string;
  penandaNama: string;
  saksi1?: string | null;
  saksi2?: string | null;
  namaDokter: string;
  signatureMethod?: string | null;
  signatureData?: string | null;
  signedAt?: Date | null;
  waktuPersetujuan: Date;
  petugas: string;
  authorUserId?: string | null;
  authorPegawaiId?: string | null;
}

export type InformedConsentEntity = NonNullable<Awaited<ReturnType<typeof findById>>>;

export function list(kunjunganId: string, tx?: Tx) {
  return db(tx).informedConsent.findMany({
    where: { kunjunganId, deletedAt: null },
    omit: { signatureData: true }, // PNG base64 — jangan ikut SELECT daftar
    orderBy: { createdAt: "desc" },
  });
}

export function findById(id: string, tx?: Tx) {
  return db(tx).informedConsent.findUnique({ where: { id } });
}

export function create(data: CreateInformedConsentData, tx?: Tx) {
  return db(tx).informedConsent.create({ data, omit: { signatureData: true } });
}

export async function softDelete(id: string, tx?: Tx) {
  const r = await db(tx).informedConsent.updateMany({
    where: { id, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  return r.count;
}
