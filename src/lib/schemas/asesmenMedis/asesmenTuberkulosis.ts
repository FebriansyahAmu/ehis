// Zod schema + DTO — Asesmen·Riwayat·Tuberkulosis (riwayat TBC · OAT · TCM · sputum BTA).
// Mirror TuberkulosisPane. Append-only "latest wins". Semua field opsional.

import { z } from "zod";

const optStr = z.string().trim().optional().transform((v) => (v ? v : undefined));
const optBool = z.boolean().nullish();

export const AsesmenTuberkulosisInput = z.object({
  riwayatTbc: optBool,
  tahunPengobatan: optStr,
  statusOat: optStr, // selesai/tidak-selesai/sedang-berjalan
  kontakTbc: optBool,
  penunjang: optStr,
  tcmDilakukan: optBool,
  tcmHasil: optStr, // pos-sensitif/pos-resisten/negatif/invalid
  sputumDilakukan: optBool,
  sputumHasil: optStr, // positif/negatif
  sputumGrade: optStr,
  catatan: optStr,
});
export type AsesmenTuberkulosisInput = z.infer<typeof AsesmenTuberkulosisInput>;

export interface AsesmenTuberkulosisDTO {
  id: string;
  kunjunganId: string;
  riwayatTbc: boolean | null;
  tahunPengobatan: string | null;
  statusOat: string | null;
  kontakTbc: boolean | null;
  penunjang: string | null;
  tcmDilakukan: boolean | null;
  tcmHasil: string | null;
  sputumDilakukan: boolean | null;
  sputumHasil: string | null;
  sputumGrade: string | null;
  catatan: string | null;
  pemeriksa: string;
  authorUserId: string | null;
  createdAt: string;
}
