// Zod schema + DTO — Asesmen·Riwayat·Gaya Hidup (sub "Lainnya": merokok/paparan/kebiasaan).
// Mirror LainnyaPane. Append-only "latest wins". Semua field opsional (form tanpa wajib).

import { z } from "zod";

const optStr = z.string().trim().optional().transform((v) => (v ? v : undefined));
const optBool = z.boolean().nullish(); // boolean | null | undefined (YesNoRadio bisa null)

export const AsesmenGayaHidupInput = z.object({
  merokokStatus: optStr, // ya/tidak/mantan
  rokokPerHari: optStr,
  merokokSejak: optStr,
  berhentiSejak: optStr,
  paparanAsap: optBool,
  paparanDetail: optStr,
  catatan: optStr,
});
export type AsesmenGayaHidupInput = z.infer<typeof AsesmenGayaHidupInput>;

export interface AsesmenGayaHidupDTO {
  id: string;
  kunjunganId: string;
  merokokStatus: string | null;
  rokokPerHari: string | null;
  merokokSejak: string | null;
  berhentiSejak: string | null;
  paparanAsap: boolean | null;
  paparanDetail: string | null;
  catatan: string | null;
  pemeriksa: string;
  authorUserId: string | null;
  createdAt: string;
}
